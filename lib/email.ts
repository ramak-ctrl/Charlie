import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendInterviewInvite(params: {
  fromEmail: string;
  to: string;
  candidateName: string;
  jobTitle: string;
  interviewLink: string;
  expiresAt: string;
}) {
  const { fromEmail, to, candidateName, jobTitle, interviewLink, expiresAt } = params;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const transporter = createTransport();

  await transporter.sendMail({
    from: `"Charlie Interviews" <${fromEmail}>`,
    replyTo: fromEmail,
    to,
    subject: `Interview Invitation — ${jobTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 32px 16px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #7c3aed; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Charlie</h1>
      <p style="color: #ddd6fe; margin: 8px 0 0; font-size: 14px;">AI-Powered Screening Interview</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Hi ${candidateName},</p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
        You have been invited to complete a screening interview for the <strong>${jobTitle}</strong> position.
      </p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        The interview is conducted by Charlie, an AI voice agent. It takes approximately <strong>10–15 minutes</strong> and covers your background, experience, and a few structured questions.
      </p>
      <div style="background: #f5f3ff; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px; font-weight: 500;">What to expect:</p>
        <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>A brief consent and AI disclosure</li>
          <li>Questions about your experience and expectations</li>
          <li>Behavioural questions in STAR format</li>
          <li>An opportunity to ask questions</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${interviewLink}" style="background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
          Start My Interview
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
        This link expires on ${expiryDate}. Please use a quiet space with a working microphone.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Powered by Charlie · AI Recruitment Screening</p>
    </div>
  </div>
</body>
</html>`,
  });
}
