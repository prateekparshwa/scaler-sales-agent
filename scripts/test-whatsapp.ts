import twilio from "twilio";

async function main() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!;
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: tsx scripts/test-whatsapp.ts +91XXXXXXXXXX");
    process.exit(1);
  }
  const client = twilio(sid, token);
  const msg = await client.messages.create({
    from,
    to: `whatsapp:${to}`,
    body:
      "✅ Scaler Sales Agent — Twilio Sandbox connected.\n\nThis confirms creds + opt-in are working. The deployed app at https://scaler-sales-agent-fawn.vercel.app can now send real pre-call nudges and PDFs to this number.",
  });
  console.log(`SENT sid=${msg.sid} status=${msg.status}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
