export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { groupId, newOwnerId } = req.body;
  if (!groupId || !newOwnerId) return res.status(400).json({error:"need groupId & newOwnerId"});

  const cookie = req.headers.cookie || "";
  if (!cookie.includes(".ROBLOSECURITY=")) return res.status(401).json({error:"no cookie"});

  const r = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ newOwnerId })
  });

  res.status(r.status).send(await r.text());
}

export const config = { api: { bodyParser: true }};
