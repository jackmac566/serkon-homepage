import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/verify-deployment.sh", import.meta.url));

function verify(args, lobbyStatus) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "serkon-deployment-test-"));
  const callsPath = path.join(directory, "calls.jsonl");
  const mockCurl = `#!${process.execPath}
import fs from "node:fs";
const args = process.argv.slice(2);
const url = new URL(args.find((arg) => /^https?:/.test(arg)));
fs.appendFileSync(process.env.MOCK_CURL_CALLS, JSON.stringify({ url: url.href, args }) + "\\n");
let status = "200", type = "text/html";
const route = url.pathname;
if (route === "/serkon-home.html") status = "302";
if (route === "/server/index.js" || route === "/_worker.js") status = "404";
if (route === "/api/lobby") { status = process.env.MOCK_LOBBY_STATUS; type = "application/json"; }
if (route.endsWith(".css")) type = "text/css";
if (route.endsWith(".js")) type = "application/javascript";
if (route.endsWith(".mp3")) {
  type = "audio/mpeg";
  status = args.includes("Range: bytes=99999999-") ? "416" : "206";
}
const format = args[args.indexOf("-w") + 1];
if (args.includes("-w")) {
  process.stdout.write(format.replaceAll("%{http_code}", status).replaceAll("%{content_type}", type));
} else if (args.includes("-D")) {
  process.stdout.write("HTTP/2 206\\r\\naccept-ranges: bytes\\r\\ncontent-range: bytes 0-1/100\\r\\n\\r\\n");
} else if (route === "/") {
  process.stdout.write('<title>Serkon｜好奇，成为作品</title><audio src="/creation-fk.mp3"></audio>');
} else if (route === "/life") {
  process.stdout.write('<link href="/assets/index-audit.css"><script src="/assets/index-audit.js"></script>');
}
`;
  fs.writeFileSync(path.join(directory, "curl"), mockCurl, { mode: 0o755 });
  try {
    const result = spawnSync("bash", [script, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${directory}${path.delimiter}${process.env.PATH}`,
        MOCK_CURL_CALLS: callsPath,
        MOCK_LOBBY_STATUS: String(lobbyStatus),
      },
      timeout: 20_000,
    });
    assert.equal(result.error, undefined);
    const calls = fs.existsSync(callsPath)
      ? fs.readFileSync(callsPath, "utf8").trim().split("\n").map((line) => JSON.parse(line))
      : [];
    for (const call of calls) {
      assert.equal(call.args.includes("-X"), false, "verification must not send mutation requests");
      const url = new URL(call.url);
      if (url.pathname === "/api/lobby") {
        assert.equal(url.searchParams.get("presence"), "0", "read-only lobby checks must suppress presence writes");
      }
    }
    return { ...result, calls };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("production D1 503 fails deployment verification", () => {
  const result = verify([], 503);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\/api\/lobby → 503/);
  assert.match(result.stdout, /失败 1 项/);
  assert.doesNotMatch(result.stdout, /全部通过/);
  assert.ok(result.calls.some(({ url }) => url.endsWith("/api/lobby?presence=0")));
});

test("a preview URL alone does not opt out of D1 verification", () => {
  const result = verify(["https://preview.example.invalid"], 503);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\/api\/lobby → 503/);
});

test("explicit preview mode allows an unbound D1 503", () => {
  const result = verify(["--preview", "https://preview.example.invalid"], 503);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /未验收数据库可用性/);
  assert.match(result.stdout, /预览检查通过/);
});

test("healthy production passes read-only deployment verification", () => {
  const result = verify([], 200);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /全部通过/);
});

test("preview mode never suppresses an unexpected backend failure", () => {
  const result = verify(["https://preview.example.invalid", "--preview"], 500);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\/api\/lobby → 500/);
});

test("production cannot be marked as a preview", () => {
  const result = verify(["--preview"], 503);
  assert.equal(result.status, 64);
  assert.match(result.stderr, /正式域名不能跳过 D1 验收/);
  assert.deepEqual(result.calls, []);
});
