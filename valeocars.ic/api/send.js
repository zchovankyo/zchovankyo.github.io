export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, ...webhookData } = req.body;
    
    // Vybere správnou URL podle poslaného typu (1, 2 nebo 3)
    let webhookUrl;
    if (type === '1') webhookUrl = process.env.DISCORD_WEBHOOK_URL_1;
    else if (type === '2') webhookUrl = process.env.DISCORD_WEBHOOK_URL_2;
    else if (type === '3') webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
    else return res.status(400).json({ error: 'Neplatný typ webhooku' });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) throw new Error('Chyba při odesílání na Discord');

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
