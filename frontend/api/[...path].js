const droppedRequestHeaders = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
]);

const droppedResponseHeaders = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

export default async function handler(req, res) {
  const backendOrigin = process.env.BACKEND_API_URL;
  if (!backendOrigin) {
    return res.status(503).json({
      success: false,
      message: 'The API proxy is not configured.',
    });
  }

  try {
    const requestUrl = new URL(req.url, 'http://vercel.local');
    const targetUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, backendOrigin);
    const headers = new Headers();

    for (const [name, value] of Object.entries(req.headers)) {
      if (value == null || droppedRequestHeaders.has(name.toLowerCase())) continue;
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      body = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    res.statusCode = upstream.status;
    for (const [name, value] of upstream.headers) {
      if (name.toLowerCase() !== 'set-cookie' && !droppedResponseHeaders.has(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    }
    if (typeof upstream.headers.getSetCookie === 'function') {
      const cookies = upstream.headers.getSetCookie();
      if (cookies.length) res.setHeader('set-cookie', cookies);
    } else {
      const cookie = upstream.headers.get('set-cookie');
      if (cookie) res.setHeader('set-cookie', cookie);
    }

    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({
      success: false,
      message: 'The API service could not be reached.',
    });
  }
}
