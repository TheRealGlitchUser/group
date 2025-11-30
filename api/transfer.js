// SINGLE FILE — works on Vercel with ZERO dependencies
// Path: app/api/groups/[groupId]/change-owner/route.js  (or pages router equivalent)

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { groupId } = params;

  // Method check
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  // Content-Type check (exact same as official Roblox)
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ errors: [{ message: 'Invalid Content-Type' }] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract .ROBLOSECURITY cookie exactly like Roblox does
  const cookieHeader = request.headers.get('cookie') || '';
  const roblosecurityMatch = cookieHeader.match(/\.ROBLOSECURITY=([^;]+)/);
  if (!roblosecurityMatch) {
    return new Response(JSON.stringify({ errors: [{ code: 0, message: 'Authorization has been denied for this request.' }] }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const roblosecurity = roblosecurityMatch[1];
  const cookies = cookieHeader; // forward everything

  let body;
  try {
    body = await request.json();
    if (!body.newOwnerId || !Number.isInteger(body.newOwnerId) || body.newOwnerId <= 0) {
      return new Response(JSON.stringify({ errors: [{ message: 'Invalid new owner userId' }] }), { status: 400 });
    }
  } catch {
    return new Response(JSON.stringify({ errors: [{ message: 'Invalid JSON' }] }), { status: 400 });
  }

  const authHeaders = {
    'Cookie': cookies,
    'Content-Type': 'application/json',
    'User-Agent': request.headers.get('user-agent') || 'Roblox/WinInet',
    'Referer': request.headers.get('referer') || 'https://www.roblox.com/',
    'Origin': 'https://www.roblox.com',
  };

  try {
    // 1. Get authenticated user
    const me = await fetch('https://users.roblox.com/v1/users/authenticated', { headers: authHeaders });
    if (!me.ok) return new Response(null, { status: 401 });
    const { id: currentUserId } = await me.json();

    // 2. Check if current user is owner of the group
    const roleCheck = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/users/${currentUserId}`, {
      headers: authHeaders,
    });
    if (!roleCheck.ok || (await roleCheck.json()).role.rank !== 255) {
      return new Response(JSON.stringify({ errors: [{ message: 'Insufficient permissions' }] }), { status: 403 });
    }

    // 3. Forward the exact request to real Roblox (this is what makes it work 100% like official)
    const realResponse = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ newOwnerId: body.newOwnerId }),
    });

    const realData = await realResponse.text(); // Roblox sometimes returns plain text on success

    return new Response(realData || '{"success":true}', {
      status: realResponse.status,
      headers: {
        'Content-Type': realResponse.headers.get('content-type') || 'application/json',
        ...Object.fromEntries(realResponse.headers.entries()),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ errors: [{ message: 'Internal server error' }] }), { status: 500 });
  }
}
