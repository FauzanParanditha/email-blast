import type { CampaignAttachment } from "@email-blast/queue";

const MAIL_API_URL = process.env.MAIL_API_URL || "https://messages-apps.pandi.id/api/v1/mail";
const APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://localhost:3000";

async function fetchAttachmentBlob(attachment: CampaignAttachment): Promise<Blob> {
  const res = await fetch(`${APP_INTERNAL_URL}${attachment.url}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch attachment "${attachment.filename}" (${res.status})`);
  }

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return new Blob([buffer], { type: contentType });
}

export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments: CampaignAttachment[];
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

  for (const attachment of params.attachments) {
    const blob = await fetchAttachmentBlob(attachment);
    formData.append("attachments", blob, attachment.filename);
  }

  const res = await fetch(MAIL_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mail API request failed (${res.status}): ${text.slice(0, 300)}`);
  }
}
