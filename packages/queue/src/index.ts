export const EMAIL_QUEUE_NAME = "email-send";

export interface EmailJobData {
  recipientId: string;
  campaignId: string;
  email: string;
  name: string | null;
  subject: string;
  bodyHtml: string;
}

export function getRedisConnectionOptions() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}
