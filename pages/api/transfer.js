// pages/api/transfer.js  ← one file, nothing else needed

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { groupId, newOwnerId } = req.body;

  if (!groupId || !newOwnerId) {
    return res.status(400).json({ error: 'Send { "groupId": 12345, "newOwnerId": 67890 }' });
  }

  const cookie = req.headers.cookie;
  if (!cookie || !cookie.includes('.ROBLOSECURITY=')) {
    return res.status(401).json({ error: 'Missing .ROBLOSECURITY cookie' });
  }

  const robloxRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ newOwnerId }),
  });

  const data = await robloxRes.text();
  res.status(robloxRes.status).send(data || '{"success":true}');
}

// This line makes it work instantly on Vercel
export const config = { api: { bodyParser: true } };
