// api/transfer.js → deploy on Render.com or Railway → works IDENTICALLY to Roblox
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const cookieHeader = req.headers.cookie || "";
  const robloxCookie = cookieHeader.match(/\.ROBLOSECURITY=([^;]+)/)?.[1];

  if (!robloxCookie) return res.status(401).end();

  const providedCsrf = req.headers["x-csrf-token"] || req.headers["x-csrftoken"];
  if (!providedCsrf) return res.status(403).setHeader("x-csrf-token", "required").end();

  const { groupId, newOwnerUserId } = req.body;
  if (!groupId || !newOwnerUserId) {
    return res.status(400).json({ errors: [{ code: 0, message: "groupId and newOwnerUserId required" }] });
  }

  try {
    const realRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `.ROBLOSECURITY=${robloxCookie}`,
        "X-CSRF-TOKEN": providedCsrf,
        "User-Agent": "Roblox/WinInet",
        "Origin": "https://www.roblox.com",
        "Referer": "https://www.roblox.com/groups/",
      },
      body: JSON.stringify({ newOwnerUserId: Number(newOwnerUserId) }),
    });

    // Forward all headers except set-cookie (security)
    realRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        res.setHeader(key, value);
      }
    });

    // Especially forward new x-csrf-token if present
    const newToken = realRes.headers.get("x-csrf-token");
    if (newToken) res.setHeader("x-csrf-token", newToken);

    const text = await realRes.text();
    res.status(realRes.status).send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ errors: [{ code: 0, message: "Proxy error" }] });
  }
}
