export const dynamic = 'force-dynamic';

export async function POST(request) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId');

  if (!groupId || isNaN(groupId)) {
    return new Response('Add ?groupId=12345', { status: 400 });
  }

  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('.ROBLOSECURITY=')) {
    return new Response('Missing .ROBLOSECURITY cookie', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Send JSON: {"newOwnerId": 123}', { status: 400 });
  }

  if (!body.newOwnerId) {
    return new Response('Missing newOwnerId', { status: 400 });
  }

  const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/change-owner`, {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newOwnerId: body.newOwnerId }),
  });

  return new Response(res.body, { status: res.status });
}
