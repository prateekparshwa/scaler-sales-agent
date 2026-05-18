import twilio from "twilio";

function client() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing. Set them in .env.local or Vercel project env."
    );
  }
  return twilio(sid, token);
}

function from(): string {
  const f = process.env.TWILIO_WHATSAPP_FROM;
  if (!f) {
    throw new Error(
      "TWILIO_WHATSAPP_FROM missing. Use the sandbox number, e.g. whatsapp:+14155238886"
    );
  }
  return f.startsWith("whatsapp:") ? f : `whatsapp:${f}`;
}

function toWhatsApp(num: string): string {
  return num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
}

export async function sendText(to: string, body: string): Promise<string> {
  const msg = await client().messages.create({
    from: from(),
    to: toWhatsApp(to),
    body,
  });
  return msg.sid;
}

export async function sendMedia(
  to: string,
  body: string,
  mediaUrl: string
): Promise<string> {
  const msg = await client().messages.create({
    from: from(),
    to: toWhatsApp(to),
    body,
    mediaUrl: [mediaUrl],
  });
  return msg.sid;
}
