import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSetting } from "./settings";

/* ─────────────────────────────────────────────────────────────
   Build the invitation email HTML
   ───────────────────────────────────────────────────────────── */
function buildInviteHtml(params: {
  candidateName: string;
  jobTitle: string;
  interviewLink: string;
  expiresAt: string;
}) {
  const { candidateName, jobTitle, interviewLink, expiresAt } = params;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Interview Invitation — ${jobTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F0EDE4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background:#172F22;border-radius:16px 16px 0 0;padding:36px;text-align:center;">
      <span style="font-size:36px;font-weight:900;color:#fff;letter-spacing:-1.5px;">Charlie</span>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:36px 36px 32px;border-left:1px solid rgba(28,56,41,0.1);border-right:1px solid rgba(28,56,41,0.1);">

      <p style="color:#1C3829;font-size:16px;margin:0 0 6px;font-weight:700;">Hi ${candidateName},</p>
      <p style="color:#3D6B54;font-size:15px;margin:0 0 20px;line-height:1.75;">
        You've been invited to complete a screening interview for the
        <strong style="color:#1C3829;">${jobTitle}</strong> position.
      </p>

      <!-- What to expect box -->
      <div style="background:#F8F5EE;border:1px solid rgba(28,56,41,0.1);border-left:4px solid #B8E04A;border-radius:0 10px 10px 0;padding:18px 20px;margin:0 0 28px;">
        <p style="color:#1C3829;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.08em;">What to expect</p>
        <ul style="color:#3D6B54;font-size:14px;margin:0;padding-left:18px;line-height:2;">
          <li>Brief introduction and consent</li>
          <li>Questions about your experience and background</li>
          <li>Structured questions relevant to the role</li>
          <li>Approximately 10–15 minutes total</li>
        </ul>
      </div>

      <p style="color:#7A9E8E;font-size:14px;margin:0 0 28px;line-height:1.75;">
        The interview is conducted by <strong style="color:#1C3829;">Charlie</strong>, an AI voice agent.
        Use a quiet space with a working microphone. You can complete it on any device.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${interviewLink}"
           style="display:inline-block;background:#1C3829;color:#B8E04A;text-decoration:none;padding:15px 40px;border-radius:99px;font-size:15px;font-weight:700;letter-spacing:-0.2px;">
          Start My Interview →
        </a>
      </div>

      <!-- Link fallback -->
      <div style="background:#F8F5EE;border:1px solid rgba(28,56,41,0.1);border-radius:10px;padding:14px 16px;">
        <p style="color:#7A9E8E;font-size:12px;margin:0 0 6px;">If the button doesn't work, copy this link:</p>
        <p style="color:#3D6B54;font-size:12px;margin:0;word-break:break-all;font-family:monospace;">${interviewLink}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F0EDE4;border:1px solid rgba(28,56,41,0.1);border-radius:0 0 16px 16px;padding:18px 36px;text-align:center;">
      <p style="color:#7A9E8E;font-size:12px;margin:0 0 4px;">
        This link expires on <strong>${expiryDate}</strong>.
      </p>
      <p style="color:#7A9E8E;font-size:11px;margin:0;">
        Powered by Charlie · AI Recruitment Screening ·
        <a href="mailto:getcharlie.ai@gmail.com" style="color:#7A9E8E;">getcharlie.ai@gmail.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────
   Send via Resend (preferred — works in serverless, no SMTP firewall issues)
   Set RESEND_API_KEY in .env.local to enable.
   ───────────────────────────────────────────────────────────── */
async function sendViaResend(params: {
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}) {
  const resend = new Resend(await getSetting("RESEND_API_KEY"));
  const { error } = await resend.emails.send({
    from: `Charlie Interviews <${params.fromEmail}>`,
    to:   params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

/* ─────────────────────────────────────────────────────────────
   Send via SMTP / nodemailer (fallback when RESEND_API_KEY not set)
   ───────────────────────────────────────────────────────────── */
async function sendViaSMTP(params: {
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST!,
    port:   parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
  await transporter.sendMail({
    from:    `"Charlie Interviews" <${params.fromEmail}>`,
    replyTo: params.fromEmail,
    to:      params.to,
    subject: params.subject,
    html:    params.html,
  });
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */
export async function sendInterviewInvite(params: {
  fromEmail: string;
  to: string;
  candidateName: string;
  jobTitle: string;
  interviewLink: string;
  expiresAt: string;
}) {
  const { fromEmail, to, candidateName, jobTitle, interviewLink, expiresAt } = params;

  const subject = `Your interview invitation — ${jobTitle}`;
  const html    = buildInviteHtml({ candidateName, jobTitle, interviewLink, expiresAt });

  if (await getSetting("RESEND_API_KEY")) {
    await sendViaResend({ fromEmail, to, subject, html });
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSMTP({ fromEmail, to, subject, html });
  } else {
    throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in .env.local");
  }
}
