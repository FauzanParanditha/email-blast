const MAIL_API_URL = process.env.MAIL_API_URL || "https://messages-apps.pandi.id/api/v1/mail";

export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const token = process.env.MAIL_API_TOKEN;
  const mailer = process.env.MAIL_API_MAILER;

  if (!token || !mailer) {
    throw new Error("MAIL_API_TOKEN and MAIL_API_MAILER must be set");
  }

  const formData = new FormData();
  formData.append("token", token);
  formData.append("mailer", mailer);
  formData.append("to", params.to);
  formData.append("subject", params.subject);
  formData.append("body", Buffer.from(params.html, "utf-8").toString("base64"));

  const res = await fetch(MAIL_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mail API request failed (${res.status}): ${text.slice(0, 300)}`);
  }
}
