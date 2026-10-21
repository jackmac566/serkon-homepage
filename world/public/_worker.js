/**
 * Independent world preview. Only the music route enters this Worker.
 * It never imports the production application or accesses a database.
 * Pages ASSETS may return full files for Range, so slice single audio ranges here.
 */
const MUSIC_PATH = '/assets/genesis.mp3';
const CACHE_CONTROL = 'public, max-age=86400';

function parseRange(value, length) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  // Unsupported units, malformed ranges and multiple ranges are ignored.
  if (!match) return null;
  const [, from, to] = match;
  if (!from && !to) return null;
  let start;
  let end;
  if (!from) {
    const suffix = Number(to);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return false;
    start = Math.max(0, length - suffix);
    end = length - 1;
  } else {
    start = Number(from);
    const requestedEnd = to ? Number(to) : length - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd)) return false;
    end = Math.min(requestedEnd, length - 1);
  }
  if (start >= length || start > end || end < 0) return false;
  return { start, end };
}

function rangeStillMatches(value, headers) {
  if (!value) return true;
  // If-Range requires a strong ETag or a valid Last-Modified date.
  if (value.startsWith('"') || value.startsWith('W/')) {
    return !value.startsWith('W/') && value === headers.get('ETag');
  }
  const date = Date.parse(value);
  const modified = Date.parse(headers.get('Last-Modified') || '');
  return Number.isFinite(date) && Number.isFinite(modified) && modified <= date;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== MUSIC_PATH) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    // Do not forward Range or conditional request headers to the static service.
    const asset = await env.ASSETS.fetch(new Request(url, { method: 'GET' }));
    if (asset.status !== 200) {
      if (request.method === 'HEAD') {
        await asset.body?.cancel();
        return new Response(null, { status: asset.status, statusText: asset.statusText, headers: asset.headers });
      }
      return asset;
    }
    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', CACHE_CONTROL);
    headers.set('X-Content-Type-Options', 'nosniff');

    const range = request.headers.get('Range');
    if (!range || !rangeStillMatches(request.headers.get('If-Range'), headers)) {
      if (request.method === 'HEAD') {
        await asset.body?.cancel();
        return new Response(null, { status: 200, headers });
      }
      return new Response(asset.body, { status: 200, headers });
    }

    const bytes = await asset.arrayBuffer();
    const length = bytes.byteLength;
    const parsed = parseRange(range, length);
    if (parsed === false) {
      headers.set('Content-Range', `bytes */${length}`);
      headers.set('Content-Length', '0');
      return new Response(null, { status: 416, headers });
    }
    if (!parsed) {
      headers.set('Content-Length', String(length));
      return new Response(request.method === 'HEAD' ? null : bytes, { status: 200, headers });
    }

    const { start, end } = parsed;
    headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(request.method === 'HEAD' ? null : bytes.slice(start, end + 1), {
      status: 206,
      headers,
    });
  },
};
