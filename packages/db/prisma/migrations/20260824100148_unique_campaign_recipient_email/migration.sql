-- CreateIndex
CREATE UNIQUE INDEX "Recipient_campaignId_email_key" ON "Recipient"("campaignId", "email");
