export default async function handler(req, res) {
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

  const referer = req.headers.referer || req.headers.origin || '';
  
  console.log("Přijatý referer / origin je:", referer);

  const allowedDomain = 'zchovankyo.github.io'; 

  if (!referer.includes(allowedDomain)) {
    return res.status(403).json({ error: 'Přístup odepřen' });
  }

  try {
    // Vytáhli jsme 'token' z těla požadavku, zbytek dat zůstává ve 'webhookData'
    const { type, token, ...webhookData } = req.body;
    
    // Ověření Cloudflare Turnstile tokenu
    if (!token) {
      return res.status(400).json({ error: 'Chybí bezpečnostní ověření (Turnstile token).' });
    }

    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY, // Klíč si nastavíš ve Vercel Environment Variables
        response: token
      })
    });

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return res.status(403).json({ error: 'Ověření proti botům selhalo.' });
    }

    let webhookUrl;
    if (type === 'leasing') webhookUrl = process.env.DISCORD_WEBHOOK_URL_1;
    else if (type === 'prodej') webhookUrl = process.env.DISCORD_WEBHOOK_URL_2;
    else if (type === 'koupe') webhookUrl = process.env.DISCORD_WEBHOOK_URL_3;
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
