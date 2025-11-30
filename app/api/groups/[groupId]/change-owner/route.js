export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { groupId } = params;

  if (request.headers.get('content-type') !== 'application/json') {
    return new Response('Bad Content-Type', { status: 400 });
  }

  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('.ROBLOSECURITY=')) {
    return new Response('Missing .ROBLOSECURITY', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!body.newOwnerId || body.newOwnerId < 1) {
    return new Response('Bad newOwnerId', { status: 400 });
  }

  const headers = {
    'Cookie': cookie,
    'Content-Type': 'application/json',
    'User-Agent': 'Roblox/WinInet',
  };

  const real = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ newOwnerId: body.newOwnerId }),
  });

  return new Response(real.body, {
    status: real.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
