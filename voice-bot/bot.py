import asyncio
import os
from contextlib import asynccontextmanager

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from loguru import logger
from pipecat_ai_small_webrtc_prebuilt.frontend import SmallWebRTCPrebuiltUI

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import EndFrame, LLMRunFrame, TTSSpeakFrame
from pipecat.turns.user_turn_strategies import UserTurnStrategies
from pipecat.turns.user_start.vad_user_turn_start_strategy import VADUserTurnStartStrategy
from pipecat.turns.user_stop.speech_timeout_user_turn_stop_strategy import SpeechTimeoutUserTurnStopStrategy
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.services.groq.llm import GroqLLMService
from pipecat.services.groq.stt import GroqSTTService
from pipecat.services.groq.tts import GroqTTSService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.workers.runner import WorkerRunner

load_dotenv(override=True)

API_URL = os.getenv("TOM_API_URL", "http://localhost:8000")
METERED_API_KEY = os.getenv("METERED_API_KEY", "")
METERED_APP_DOMAIN = os.getenv("METERED_APP_DOMAIN", "tom-interviews.metered.live")
CLOUDFLARE_TURN_KEY_ID = os.getenv("CLOUDFLARE_TURN_KEY_ID", "")
CLOUDFLARE_TURN_API_TOKEN = os.getenv("CLOUDFLARE_TURN_API_TOKEN", "")
# Generic static TURN (works with any provider: ExpressTURN, Metered static, coturn…)
# TURN_URLS = comma-separated, e.g. "turn:relay1.expressturn.com:3480,turns:relay1.expressturn.com:5349?transport=tcp"
TURN_URLS = os.getenv("TURN_URLS", "")
TURN_USERNAME = os.getenv("TURN_USERNAME", "")
TURN_CREDENTIAL = os.getenv("TURN_CREDENTIAL", "")

CLOSING_PREFIX = "CLOSING:"

# ── ICE servers ───────────────────────────────────────────────────────────────

def _static_turn_servers() -> list[IceServer]:
    """Static TURN creds from env (any provider) + Google STUN."""
    servers = [IceServer(urls="stun:stun.l.google.com:19302")]
    for u in [x.strip() for x in TURN_URLS.split(",") if x.strip()]:
        if u.startswith("stun:"):
            servers.append(IceServer(urls=u))
        else:
            servers.append(IceServer(urls=u, username=TURN_USERNAME, credential=TURN_CREDENTIAL))
    return servers


def _fallback_ice_servers() -> list[IceServer]:
    """Free public STUN + Open Relay TURN (best effort)."""
    return [
        IceServer(urls="stun:stun.l.google.com:19302"),
        IceServer(urls="turn:openrelay.metered.ca:80", username="openrelayproject", credential="openrelayproject"),
        IceServer(urls="turn:openrelay.metered.ca:443", username="openrelayproject", credential="openrelayproject"),
        IceServer(urls="turn:openrelay.metered.ca:443?transport=tcp", username="openrelayproject", credential="openrelayproject"),
    ]


async def _fetch_cloudflare_ice() -> list[IceServer]:
    """Cloudflare TURN — free + reliable. Generates short-lived credentials."""
    url = f"https://rtc.live.cloudflare.com/v1/turn/keys/{CLOUDFLARE_TURN_KEY_ID}/credentials/generate"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {CLOUDFLARE_TURN_API_TOKEN}"},
            json={"ttl": 86400},
            timeout=10.0,
        )
        resp.raise_for_status()
        ice = resp.json().get("iceServers", {})
    urls = ice.get("urls", [])
    if isinstance(urls, str):
        urls = [urls]
    username = ice.get("username")
    credential = ice.get("credential")
    servers = []
    for u in urls:
        if u.startswith("stun:"):
            servers.append(IceServer(urls=u))
        else:
            servers.append(IceServer(urls=u, username=username, credential=credential))
    if not servers:
        raise ValueError("Cloudflare returned no ICE servers")
    return servers


async def _fetch_metered_ice() -> list[IceServer]:
    url = f"https://{METERED_APP_DOMAIN}/api/v1/turn/credentials?apiKey={METERED_API_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
    if not isinstance(data, list) or not data:
        raise ValueError(f"unexpected Metered response: {data}")
    servers = []
    for s in data:
        urls = s.get("urls", "")
        username = s.get("username")
        credential = s.get("credential")
        if username and credential:
            servers.append(IceServer(urls=urls, username=username, credential=credential))
        else:
            servers.append(IceServer(urls=urls))
    return servers


async def fetch_metered_ice_servers() -> list[IceServer]:
    """Resolve TURN/ICE servers: static env → Cloudflare → Metered → free fallback."""
    if TURN_URLS and TURN_USERNAME and TURN_CREDENTIAL:
        servers = _static_turn_servers()
        logger.info(f"Using {len(servers)} static TURN/ICE servers from env")
        return servers
    if CLOUDFLARE_TURN_KEY_ID and CLOUDFLARE_TURN_API_TOKEN:
        try:
            servers = await _fetch_cloudflare_ice()
            logger.info(f"Fetched {len(servers)} ICE servers from Cloudflare TURN")
            return servers
        except Exception as e:
            logger.error(f"Cloudflare TURN fetch failed: {e}")
    if METERED_API_KEY:
        try:
            servers = await _fetch_metered_ice()
            logger.info(f"Fetched {len(servers)} ICE servers from Metered")
            return servers
        except Exception as e:
            logger.error(f"Metered ICE fetch failed: {e}")
    logger.warning("No working TURN provider — using free STUN/Open Relay fallback")
    return _fallback_ice_servers()


# ── System prompt ─────────────────────────────────────────────────────────────

def build_system_prompt(role_title: str, company_name: str, evaluation_focus: list, tone: str, jd_context: str) -> str:
    focus_str = ", ".join(evaluation_focus) if evaluation_focus else "general skills"
    jd_section = f"\n{jd_context}\n" if jd_context else ""
    return f"""You are Tom, an AI interviewer conducting a first-round interview for the role of {role_title} at {company_name}.
{jd_section}
Tone: {tone}. Evaluate the candidate on: {focus_str}.

Rules:
- FIRST message only: introduce yourself as Tom in one sentence, then immediately ask your first interview question. Keep it under 3 sentences total.
- Ask ONE question at a time. 1-2 short sentences max. Never bundle questions.
- You MUST ask a minimum of 6 questions before closing.
- After each response: probe deeper on specific mentions, ask for a concrete example if vague, move to a new area if strong.
- Include at least 1-2 behavioral questions (challenges, teamwork, conflict).
- If the candidate wants to end (stop / end / done / finish / goodbye), close immediately.
- When closing, you MUST start your response with exactly "CLOSING:" (including the colon). Example: "CLOSING: Thank you for your time. The team will review your responses and be in touch."
- Only close after 6+ questions OR if the candidate requests to end.
- Be concise. 1-2 sentences per response. Do not use bullet points or markdown — your output will be spoken aloud."""


# ── Transcript helpers ────────────────────────────────────────────────────────

def build_transcript(messages: list) -> str:
    lines = []
    for m in messages:
        if m["role"] == "system":
            continue
        label = "Tom" if m["role"] == "assistant" else "Candidate"
        lines.append(f"{label}: {m['content']}")
    return "\n".join(lines)


async def resolve_groq_key(interview_config: dict) -> str:
    """Resolve the Groq key for this interview.

    Priority: explicit key in config > per-company key from Tom API (Tom mode only) > env.
    In webhook/Charlie mode (transcript_webhook_url set) we skip the Tom lookup entirely.
    """
    explicit = (interview_config.get("groq_api_key") or "").strip()
    if explicit:
        return explicit

    env_key = os.environ.get("GROQ_API_KEY", "")

    # Webhook/host-app mode (e.g. Charlie): no Tom API to consult — use env key.
    if interview_config.get("transcript_webhook_url"):
        return env_key

    interview_id = interview_config.get("interview_id")
    if not interview_id:
        return env_key
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{API_URL}/internal/groq-key/{interview_id}", timeout=10.0)
            resp.raise_for_status()
            key = (resp.json().get("groq_api_key") or "").strip()
            if key:
                return key
    except Exception as e:
        logger.warning(f"Could not fetch company Groq key for {interview_id}: {e} — using env key")
    return env_key


def build_tts(interview_config: dict, groq_key: str):
    """Select the TTS service.

    Prefers Deepgram (far higher free quota + low latency) when a Deepgram key is
    available; otherwise falls back to Groq TTS. Provider can be forced via the
    interview config ('tts_provider') or the TTS_PROVIDER env var.
    """
    provider = (interview_config.get("tts_provider") or os.getenv("TTS_PROVIDER", "")).strip().lower()
    deepgram_key = (interview_config.get("deepgram_api_key") or os.getenv("DEEPGRAM_API_KEY", "")).strip()

    # Default: use Deepgram if we have a key, else Groq.
    if not provider:
        provider = "deepgram" if deepgram_key else "groq"

    if provider == "deepgram":
        if deepgram_key:
            voice = os.getenv("DEEPGRAM_VOICE", "aura-2-helena-en")
            logger.info(f"TTS provider: Deepgram (voice={voice})")
            return DeepgramTTSService(api_key=deepgram_key, voice=voice)
        logger.warning("tts_provider=deepgram but no Deepgram key supplied — falling back to Groq TTS")

    logger.info("TTS provider: Groq (voice=autumn)")
    return GroqTTSService(api_key=groq_key, settings=GroqTTSService.Settings(voice="autumn"))


def build_structured_transcript(messages: list) -> list:
    """Transcript as a list of {role: 'agent'|'user', content} — the shape host apps expect."""
    out = []
    for m in messages:
        if m["role"] == "system":
            continue
        role = "agent" if m["role"] == "assistant" else "user"
        out.append({"role": role, "content": m.get("content", "")})
    return out


async def post_transcript_webhook(webhook_url: str, interview_id: str | None, messages: list, secret: str = "") -> None:
    """POST the structured transcript to a host app (e.g. Charlie) so it can run its own analysis."""
    try:
        headers = {"x-bot-secret": secret} if secret else {}
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                webhook_url,
                json={"interview_id": interview_id, "transcript": build_structured_transcript(messages)},
                headers=headers,
                timeout=30.0,
            )
            if resp.status_code // 100 == 2:
                logger.info(f"Transcript posted to webhook for interview {interview_id}")
            else:
                logger.error(f"Webhook transcript POST failed: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        logger.error(f"Error posting transcript webhook for {interview_id}: {e}")


async def save_transcript(interview_id: str, transcript: str):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{API_URL}/internal/save-transcript",
                json={"interview_id": interview_id, "transcript": transcript},
                timeout=30.0,
            )
            if resp.status_code == 200:
                logger.info(f"Transcript saved for interview {interview_id}")
            else:
                logger.error(f"Failed to save transcript: {resp.status_code}")
    except Exception as e:
        logger.error(f"Error saving transcript for {interview_id}: {e}")


# ── Bot pipeline ──────────────────────────────────────────────────────────────

async def run_bot(webrtc_connection: SmallWebRTCConnection, interview_config: dict):
    interview_id = interview_config.get("interview_id")
    candidate_name = interview_config.get("candidate_name", "")
    role_title = interview_config.get("role_title", "the role")
    company_name = interview_config.get("company_name", "the company")
    evaluation_focus = interview_config.get("evaluation_focus", [])
    tone = interview_config.get("tone", "professional")
    jd_context = interview_config.get("jd_context", "")

    # Host-app integration (e.g. Charlie): if a system_prompt is supplied, use it verbatim;
    # if a transcript_webhook_url is supplied, deliver the transcript there instead of Tom's API.
    transcript_webhook_url = interview_config.get("transcript_webhook_url")
    # Secret is resolved from the bot's OWN env, not the call config — the config is
    # relayed through the candidate's browser, so a secret sent there would be public.
    webhook_secret = interview_config.get("webhook_secret") or os.getenv("BOT_WEBHOOK_SECRET", "")
    system_prompt = interview_config.get("system_prompt") or build_system_prompt(
        role_title, company_name, evaluation_focus, tone, jd_context
    )
    transcript_saved = False

    groq_key = await resolve_groq_key(interview_config)

    async def deliver_transcript():
        """Send the transcript to the host app webhook, or fall back to Tom's API."""
        if transcript_webhook_url:
            await post_transcript_webhook(transcript_webhook_url, interview_id, context.messages, webhook_secret)
        elif interview_id:
            await save_transcript(interview_id, build_transcript(context.messages))

    transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(audio_in_enabled=True, audio_out_enabled=True),
    )

    stt = GroqSTTService(api_key=groq_key)
    tts = build_tts(interview_config, groq_key)
    llm = GroqLLMService(
        api_key=groq_key,
        settings=GroqLLMService.Settings(
            # Interviewer model. Resolved from the call config (admin setting) →
            # GROQ_LLM_MODEL env → default 70b. Set "llama-3.1-8b-instant" for lower latency.
            model=(interview_config.get("llm_model") or os.getenv("GROQ_LLM_MODEL") or "llama-3.3-70b-versatile"),
            max_tokens=200,
        ),
    )

    context = LLMContext(messages=[{"role": "system", "content": system_prompt}])
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
            # Use simple timeout-based turn detection — no ML model, lighter on Render free tier
            user_turn_strategies=UserTurnStrategies(
                start=[VADUserTurnStartStrategy()],
                stop=[SpeechTimeoutUserTurnStopStrategy()],
            ),
        ),
    )

    pipeline = Pipeline([
        transport.input(),
        stt,
        user_aggregator,
        llm,
        tts,
        transport.output(),
        assistant_aggregator,
    ])

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(enable_metrics=True),
    )

    async def monitor_closing():
        nonlocal transcript_saved
        seen_closing = False
        while True:
            await asyncio.sleep(1)
            msgs = context.messages
            if not seen_closing and msgs:
                last = msgs[-1]
                if last.get("role") == "assistant" and last.get("content", "").startswith(CLOSING_PREFIX):
                    seen_closing = True
                    logger.info("CLOSING detected — saving transcript and ending in 3s")
                    await asyncio.sleep(3)
                    if not transcript_saved:
                        transcript_saved = True
                        await deliver_transcript()
                    await worker.queue_frames([EndFrame()])
                    return

    async def monitor_inactivity():
        """End the interview if the candidate never speaks / goes silent.

        Without this, a candidate with a broken mic (or who simply walks away)
        leaves the bot session pinned open forever — it only ends on a CLOSING:
        turn (which never comes) or a WebRTC disconnect (tab close). We watch the
        message count: every candidate/bot turn appends to context.messages, so a
        stalled conversation shows up as the count not changing.
        """
        nonlocal transcript_saved
        NO_ACTIVITY_LIMIT = 75  # seconds with no new turn → give up
        idle = 0
        last_count = len(context.messages)
        while True:
            await asyncio.sleep(1)
            if transcript_saved:
                return
            count = len(context.messages)
            if count != last_count:
                last_count = count
                idle = 0
                continue
            idle += 1
            if idle >= NO_ACTIVITY_LIMIT:
                logger.info(f"No activity for {NO_ACTIVITY_LIMIT}s — ending interview {interview_id}")
                if not transcript_saved:
                    transcript_saved = True
                    await deliver_transcript()
                await worker.queue_frames([EndFrame()])
                return

    @worker.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info(f"Client ready — interview_id={interview_id}")

        # Speak ONE short greeting that ends by asking for consent, then STOP and
        # wait for the candidate to reply. Their reply drives the next LLM turn
        # (proper turn-taking). We do NOT run the LLM here, so the bot doesn't talk
        # over itself or monologue past the candidate.
        hi = f"Hi {candidate_name}!" if candidate_name else "Hi there!"
        greeting = (
            f"{hi} I'm Charlie, your A.I. interviewer, and I'll guide you through a short, "
            "relaxed screening conversation. Quick note before we begin: this interview is "
            "conducted by A.I. and is being recorded. Are you okay to proceed?"
        )
        context.add_message({"role": "assistant", "content": greeting})
        await worker.queue_frames([TTSSpeakFrame(greeting)])
        asyncio.create_task(monitor_closing())
        asyncio.create_task(monitor_inactivity())

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        nonlocal transcript_saved
        logger.info(f"Client disconnected — interview_id={interview_id}")
        if not transcript_saved:
            transcript_saved = True
            await deliver_transcript()
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()


# ── FastAPI app ───────────────────────────────────────────────────────────────

_ice_servers: list[IceServer] = []
_handler: SmallWebRTCRequestHandler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _ice_servers, _handler
    _ice_servers = await fetch_metered_ice_servers()
    _handler = SmallWebRTCRequestHandler(ice_servers=_ice_servers)
    logger.info(f"Bot ready with {len(_ice_servers)} ICE servers")
    yield
    if _handler:
        for pc in list(_handler._pcs_map.values()):
            await pc.disconnect()


_session_store: dict[str, dict] = {}  # session_id → interview_config

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/client", SmallWebRTCPrebuiltUI)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/client/")


@app.get("/health")
async def health():
    """Non-secret diagnostics. Confirms the keys the bot needs are actually present
    in ITS OWN environment (they no longer arrive via the browser config), and which
    TTS provider it will pick. No secret values are returned — booleans only.
    If deepgram_key_present is false, that's the 'no voice' cause: the bot falls
    back to Groq TTS (daily cap) and goes silent. Fix = set DEEPGRAM_API_KEY on
    the charlie-voice-bot service and redeploy."""
    deepgram = bool(os.getenv("DEEPGRAM_API_KEY", "").strip())
    groq = bool(os.getenv("GROQ_API_KEY", "").strip())
    forced = os.getenv("TTS_PROVIDER", "").strip().lower()
    tts_default = forced or ("deepgram" if deepgram else "groq")
    return {
        "ok": True,
        "groq_key_present": groq,
        "deepgram_key_present": deepgram,
        "tts_default": tts_default,
        "ice_servers": len(_ice_servers),
    }


@app.post("/start")
async def start(request: Request):
    """Pipecat client calls this first — stores session data, returns session ID + TURN ICE servers."""
    import uuid
    try:
        body = await request.json()
    except Exception:
        body = {}

    session_id = str(uuid.uuid4())
    # requestData.body carries interview_config (set by frontend startBotAndConnect)
    _session_store[session_id] = body.get("body", {})
    logger.debug(f"Session {session_id} created, interview_config={_session_store[session_id]}")

    ice_config = [
        {"urls": s.urls, **({"username": s.username, "credential": s.credential} if s.username else {})}
        for s in _ice_servers
    ]
    return {"sessionId": session_id, "iceConfig": {"iceServers": ice_config}}


@app.post("/api/offer")
async def offer(request: SmallWebRTCRequest, background_tasks: BackgroundTasks):
    interview_config = request.request_data or {}

    async def callback(connection: SmallWebRTCConnection):
        background_tasks.add_task(run_bot, connection, interview_config)

    return await _handler.handle_web_request(request=request, webrtc_connection_callback=callback)


@app.patch("/api/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest):
    return await _handler.handle_patch_request(request=request)


# Session proxy routes (Pipecat client SDK: /sessions/:sessionId/api/offer)
@app.post("/sessions/{session_id}/api/offer")
async def session_offer(session_id: str, request: SmallWebRTCRequest, background_tasks: BackgroundTasks):
    interview_config = _session_store.pop(session_id, request.request_data or {})
    logger.debug(f"Session {session_id} offer — interview_config={interview_config}")

    async def callback(connection: SmallWebRTCConnection):
        background_tasks.add_task(run_bot, connection, interview_config)

    return await _handler.handle_web_request(request=request, webrtc_connection_callback=callback)


@app.patch("/sessions/{session_id}/api/offer")
async def session_ice_candidate(session_id: str, request: SmallWebRTCPatchRequest):
    return await _handler.handle_patch_request(request=request)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
