// api/transfer.js   → put this exact file in your /api folder on Vercel
export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // === 1. Your security token (change this!)
  const AUTH_TOKEN = process.env.SECRET_TOKEN; // set in Vercel env
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { groupId, newOwnerUserId } = req.body;
  if (!groupId || !newOwnerUserId) {
    return res.status(400).json({ error: "Missing groupId or newOwnerUserId" });
  }

  const COOKIE = process.env.ROBLOX_COOKIE; // your .ROBLOX cookie with ownership rights
  if (!COOKIE) return res.status(500).json({ error: "No cookie configured" });

  try {
    // === 2. Get fresh X-CSRF-TOKEN (this is the trick that makes it actually work)
    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { "Cookie": `.ROBLOX=${COOKIE}` },
    });
    const xcsrf = csrfRes.headers.get("x-csrf-token");
    if (!xcsrf) return res.status(500).json({ error: "Failed to get X-CSRF-TOKEN" });

    // === 3. Actual transfer request
    const transferRes = await fetch(
      `https://groups.roblox.com/v1/groups/${groupId}/change-owner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `.ROBLOX=${COOKIE}`,
          "X-CSRF-TOKEN": xcsrf,
          "User-Agent": "RobloxStudio/WinInet",
          "Origin": "https://www.roblox.com",
          "Referer": "https://www.roblox.com/",
        },
        body: JSON.stringify({ newOwnerUserId: Number(newOwnerUserId) }),
      }
    );

    const result = await transferRes.json();

    if (transferRes.ok) {
      return res.status(200).json({ success: true, message: "Ownership transferred!" });
    } else {
      return res.status(transferRes.status).json({
        success: false,
        errors: result.errors || result,
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error", details: e.message });
  }
}
