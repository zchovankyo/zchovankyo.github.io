export default async function handler(req, res) {
  // Nastavení CORS hlaviček, aby Vercel požadavek neblokoval
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, ...webhookData } = req.body;
    
    let webhookUrl;
    if (type === 'leasing') webhookUrl = process.env.DISCORD_WEBHOOK_URL_1;
    else if (type === 'koupe') webhookUrl = process.env.DISCORD_WEBHOOK_URL_2;
    else if (type === 'prodej') webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
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
