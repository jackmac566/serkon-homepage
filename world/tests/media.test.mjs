import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../public/_worker.js';

const file = Uint8Array.from({ length: 32 }, (_, index) => index);
function fixture() {
  const calls = [];
  return {
    calls,
    env: {
      ASSETS: {
        async fetch(request) {
          calls.push(request);
          return new Response(file, { headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(file.length),
            ETag: '"original"',
            'Last-Modified': 'Tue, 20 Oct 2026 12:00:00 GMT',
          } });
        },
      },
    },
  };
}
async function fetchMusic(options = {}) {
  const state = fixture();
  const response = await worker.fetch(new Request('https://preview.example/assets/genesis.mp3', options), state.env);
  return { response, ...state };
}

test('Safari initial two-byte probe returns the exact bytes and range metadata', async () => {
  const { response, calls } = await fetchMusic({ headers: { Range: 'bytes=0-1' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 0-1/32');
  assert.equal(response.headers.get('Content-Length'), '2');
  assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0, 1]);
  assert.equal(calls[0].headers.has('Range'), false);
});

test('open-ended, suffix and overshooting end ranges return the requested part', async () => {
  for (const [range, start, end] of [
    ['bytes=28-', 28, 31], ['bytes=-3', 29, 31], ['bytes=30-999', 30, 31], ['bytes=-100', 0, 31],
  ]) {
    const { response } = await fetchMusic({ headers: { Range: range } });
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/32`);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [...file.slice(start, end + 1)]);
  }
});

test('unsatisfiable or zero-suffix ranges identify total size without returning the file', async () => {
  for (const range of ['bytes=32-', 'bytes=20-10', 'bytes=-0', 'bytes=999999999999999999999-']) {
    const { response } = await fetchMusic({ headers: { Range: range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('Content-Range'), 'bytes */32');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
});

test('HEAD retains correct metadata and sends no body, including a range probe', async () => {
  for (const range of [null, 'bytes=0-1']) {
    const { response } = await fetchMusic({ method: 'HEAD', headers: range ? { Range: range } : {} });
    assert.equal(response.status, range ? 206 : 200);
    assert.equal(response.headers.get('Content-Length'), range ? '2' : '32');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
});

test('unsupported multiple ranges are ignored; stale If-Range returns the full current file', async () => {
  for (const headers of [
    { Range: 'bytes=0-1,4-5' },
    { Range: 'bytes=0-1', 'If-Range': '"old-version"' },
    { Range: 'bytes=0-1', 'If-Range': 'W/"original"' },
    { Range: 'bytes=0-1', 'If-Range': 'Mon, 19 Oct 2026 12:00:00 GMT' },
  ]) {
    const { response } = await fetchMusic({ headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.has('Content-Range'), false);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [...file]);
  }
  const { response } = await fetchMusic({ headers: { Range: 'bytes=0-1', 'If-Range': '"original"' } });
  assert.equal(response.status, 206);
});

test('a missing audio asset keeps its error status and HEAD never returns an error body', async () => {
  const env = { ASSETS: { fetch: async () => new Response('Missing', { status: 404 }) } };
  for (const method of ['GET', 'HEAD']) {
    const response = await worker.fetch(new Request('https://preview.example/assets/genesis.mp3', {
      method, headers: { Range: 'bytes=0-1' },
    }), env);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), method === 'HEAD' ? '' : 'Missing');
  }
});

test('non-media requests remain plain static fetches; music has no write methods', async () => {
  const state = fixture();
  const request = new Request('https://preview.example/assets/app.js');
  await worker.fetch(request, state.env);
  assert.equal(state.calls[0], request);
  const { response, calls } = await fetchMusic({ method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
  assert.equal(calls.length, 0);
});
