import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("renders the public profile and commission entry", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Serkon 侯世康｜个人主页与作品档案<\/title>/i);
  assert.match(html, /接受私人定制/);
  assert.match(html, /商用约稿/);
  assert.match(html, /个人作品与创作交流站点/);
  assert.match(html, /个人档案局/);
  assert.match(html, /强鹰彩色胶·产品视觉系统/);
  assert.match(html, /Serkon 个人网站/);
  assert.doesNotMatch(html, /CHINA · BEIJING · CHAOYANG/);
  assert.match(html, /CHINA · BEIJING/);
  assert.doesNotMatch(html, /CHAOYANG/);
  assert.match(html, /打开网易云发布页/);
  assert.match(html, /music\.163\.com\/#\/song\?id=2753362002/);
  assert.match(html, /查看版本进化/);
  assert.match(html, /进入完整互动档案/);
  assert.match(html, /六项能力，收进一个清晰入口/);
  assert.match(html, /隐私与公共上传规则/);
  assert.match(html.replaceAll("<!-- -->", ""), /版本记录：第 \d+ 版/);
  assert.match(html, /公共大厅/);
  assert.match(html, /阅读辅助/);
  assert.match(html, /网站的另一层/);
  assert.match(html, /很早就去尝试/);
  assert.match(html, /打开网站系统层/);
  assert.doesNotMatch(html, /已上线 · 0 元/);
  assert.match(html, /shikanghou4@gmail\.com/i);
  assert.match(html, /身份说明：Serkon = 侯世康/);
  assert.match(html, /"alternateName":"Serkon"/);
});

test("renders the complete release archive", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("updates-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/updates", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /版本更新记录/);
  assert.match(html, /个人主页首版/);
  assert.match(html, /CURRENT EDITION/);
  assert.match(html, /源码变化自动追加/);
  assert.match(html, /不提供旧页面“时光机”/);
});

test("renders the standalone privacy and public upload rules", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("privacy-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/privacy", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /隐私与公共上传规则/);
  assert.match(html, /公共影像墙/);
  assert.match(html, /公共大厅/);
  assert.match(html, /删除与纠错/);
});

test("renders the lobby and all confirmed zero-cost public layers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("capabilities-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const cases = [
    ["/lobby", /发布即锁定/],
    ["/accessibility", /无障碍与/],
    ["/lite", /纯文字/],
    ["/provenance", /SHA-256/],
    ["/zero-cost", /0 元运营/],
  ];
  for (const [pathname, expected] of cases) {
    const response = await worker.fetch(
      new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected, pathname);
  }
});

test("renders the separated playable archive, system layer, crawler files and branded 404", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("structure-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const play = await worker.fetch(new Request("http://localhost/play", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(play.status, 200);
  assert.match(await play.text(), /互动档案/);

  const system = await worker.fetch(new Request("http://localhost/system", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(system.status, 200);
  assert.match(await system.text(), /网站系统层/);

  const identity = await worker.fetch(new Request("http://localhost/serkon", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(identity.status, 200);
  const identityHtml = await identity.text();
  assert.match(identityHtml, /Serkon 是侯世康长期使用的网络身份与创作名/);
  assert.match(identityHtml, /"@type":"ProfilePage"/);

  const robots = await worker.fetch(new Request("http://localhost/robots.txt"), env, ctx);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: http:\/\/localhost\/sitemap\.xml/);

  const sitemap = await worker.fetch(new Request("http://localhost/sitemap.xml"), env, ctx);
  assert.equal(sitemap.status, 200);
  const sitemapXml = await sitemap.text();
  assert.match(sitemapXml, /http:\/\/localhost\/play/);
  assert.match(sitemapXml, /http:\/\/localhost\/system/);
  assert.match(sitemapXml, /http:\/\/localhost\/serkon/);

  for (const pathname of ["/google0145912d521186e0.html", "/google0145912d521186e0"]) {
    const verification = await worker.fetch(new Request(`http://localhost${pathname}`), env, ctx);
    assert.equal(verification.status, 200, pathname);
    assert.match(verification.headers.get("content-type") ?? "", /^text\/plain\b/i, pathname);
    assert.equal(
      (await verification.text()).trim(),
      "google-site-verification: google0145912d521186e0.html",
      pathname,
    );
  }

  const missing = await worker.fetch(new Request("http://localhost/this-page-does-not-exist", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /这页不在档案里/);
});

test("generates machine-readable and provenance artifacts", () => {
  const profile = JSON.parse(fs.readFileSync(new URL("../public/profile.json", import.meta.url), "utf8"));
  const identity = JSON.parse(fs.readFileSync(new URL("../public/identity.json", import.meta.url), "utf8"));
  const provenance = JSON.parse(fs.readFileSync(new URL("../public/content-provenance.json", import.meta.url), "utf8"));
  const llms = fs.readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  const humans = fs.readFileSync(new URL("../public/humans.txt", import.meta.url), "utf8");
  const feed = fs.readFileSync(new URL("../public/feed.xml", import.meta.url), "utf8");
  assert.equal(profile["@type"], "Person");
  assert.equal(profile.name, "侯世康");
  assert.equal(profile.alternateName, "Serkon");
  assert.ok(identity["@graph"].some((entry) => entry["@type"] === "ProfilePage"));
  assert.equal(provenance.hashAlgorithm, "SHA-256");
  assert.equal(provenance.credentialStatus, "unsigned-local-provenance");
  assert.match(llms, /Public lobby/);
  assert.match(llms, /Serkon is the online identity and creator name used by Hou Shikang/);
  assert.match(humans, /first-party identity statement/);
  assert.match(feed, /<rss version="2\.0">/);
});

test("keeps the lobby send action explainable and shows Beijing time to the second", () => {
  const client = fs.readFileSync(new URL("../app/lobby/LobbyClient.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/lobby/route.ts", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
  const time = fs.readFileSync(new URL("../app/lobby/time.ts", import.meta.url), "utf8");
  assert.match(client, /const \[accepted, setAccepted\] = useState\(true\)/);
  assert.match(client, /disabled=\{sending\}/);
  assert.doesNotMatch(client, /disabled=\{sending \|\| !accepted/);
  assert.match(client, /还差最后一步/);
  assert.doesNotMatch(client, /slice\(-200\)/);
  assert.match(client, /实时在线/);
  assert.match(client, /30_000/);
  assert.match(route, /PRESENCE_ACTIVE_WINDOW_MS = 2 \* 60 \* 1000/);
  assert.match(route, /PRESENCE_RETENTION_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(schema, /sqliteTable\("lobby_presence"/);
  assert.match(time, /second: "2-digit"/);
  assert.match(time, /年\$\{values\.month\}月\$\{values\.day\}日/);
  assert.match(time, /Asia\/Shanghai/);
});

test("keeps future interactions optional, local and reduced-motion aware", () => {
  const interaction = fs.readFileSync(new URL("../app/FutureInteractions.tsx", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(interaction, /prefers-reduced-motion: reduce/);
  assert.match(interaction, /data-a11y-motion/);
  assert.match(interaction, /pointermove/);
  assert.doesNotMatch(interaction, /fetch\(/);
  assert.match(page, /data-fluid-text/);
  assert.match(page, /data-photo-scan/);
  assert.match(page, /data-tilt/);
  assert.match(page, /data-magnetic/);
});

test("keeps the current edition, bilingual labels and heading structure coherent", () => {
  const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const creator = fs.readFileSync(new URL("../app/CreatorDock.tsx", import.meta.url), "utf8");
  const language = fs.readFileSync(new URL("../app/LanguageController.tsx", import.meta.url), "utf8");
  const cosmos = fs.readFileSync(new URL("../app/cosmos/CosmosExperience.tsx", import.meta.url), "utf8");
  const game = fs.readFileSync(new URL("../app/games/doudizhu/DouDizhuGame.tsx", import.meta.url), "utf8");
  const profile = JSON.parse(fs.readFileSync(new URL("../data/machine-profile.json", import.meta.url), "utf8"));
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));

  assert.equal(releases.at(-1).edition, 35);
  assert.equal(profile.lastUpdated, "2026-07-29");
  assert.doesNotMatch(profile.person.currentFocus, /第 32 版/);
  assert.doesNotMatch(`${page}\n${creator}`, /CHAOYANG|北京朝阳/);
  assert.match(language, /currentEditionMatch/);
  assert.match(language, /workSummaryMatch/);
  assert.equal((cosmos.match(/<h1\b/g) ?? []).length, 1);
  assert.match(cosmos, /<h2\b/);
  assert.match(game, /<h1>Serkon 斗地主牌桌<\/h1>/);
});

test("publishes the curated archive without exposing the third-party livestream console", () => {
  const gallery = fs.readFileSync(new URL("../app/life/LifeGallery.tsx", import.meta.url), "utf8");
  const language = fs.readFileSync(new URL("../app/LanguageController.tsx", import.meta.url), "utf8");
  const assets = fs.readdirSync(new URL("../public/archive/", import.meta.url));
  assert.equal(assets.length, 6);
  assert.match(gallery, /polaroid-collage\.webp/);
  assert.match(gallery, /london-ai-workspace\.webp/);
  assert.match(gallery, /创作过程/);
  assert.doesNotMatch(gallery, /抖音直播后台操作管理页面/);
  assert.match(language, /\[aria-label\], \[title\], \[placeholder\], \[alt\]/);
  assert.match(language, /document\.title/);
});

test("keeps the version 25 landscape, bilingual and notes work while using the domestic Miaobi URL", () => {
  const language = fs.readFileSync(new URL("../app/LanguageController.tsx", import.meta.url), "utf8");
  const menu = fs.readFileSync(new URL("../app/MobileMenu.tsx", import.meta.url), "utf8");
  const notes = fs.readFileSync(new URL("../app/notes/page.tsx", import.meta.url), "utf8");
  const creator = fs.readFileSync(new URL("../app/CreatorDock.tsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));
  assert.match(language, /serkon_language_v1/);
  assert.match(language, /MutationObserver/);
  assert.match(language, />中文<\/button>/);
  assert.match(language, />English<\/button>/);
  assert.doesNotMatch(language, /fetch\(/);
  assert.match(menu, /dataset\.mobileMenu/);
  assert.match(menu, /event\.key === "Escape"/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /data-mobile-menu="open".*archive-office/s);
  assert.equal((notes.match(/date:/g) ?? []).length, 20);
  assert.match(notes, /padStart\(2, "0"\)/);
  assert.match(creator, /miaobi-appl-serkon\.pages\.dev/);
  assert.doesNotMatch(creator, /ai-copywriting-assistant\.maxc565\.chatgpt\.site/);
  assert.ok(releases.some((release) => release.edition === 25));
});

test("ships the version 26 local motion archive without a new UI runtime", () => {
  const interaction = fs.readFileSync(new URL("../app/FutureInteractions.tsx", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const provenance = fs.readFileSync(new URL("../app/provenance/page.tsx", import.meta.url), "utf8");
  const profile = JSON.parse(fs.readFileSync(new URL("../data/machine-profile.json", import.meta.url), "utf8"));
  const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));
  assert.match(interaction, /IntersectionObserver/);
  assert.match(interaction, /data-motion-reveal/);
  assert.match(interaction, /data-spotlight/);
  assert.match(interaction, /data-signal-surface/);
  assert.doesNotMatch(interaction, /fetch\(/);
  assert.match(page, /data-signal-border/);
  assert.match(page, /data-signal-action/);
  assert.match(css, /signal-border-sweep/);
  assert.match(css, /ink-motion-reveal/);
  assert.match(css, /data-future-motion="off".*data-signal-surface/s);
  assert.match(provenance, /reactbits\.dev/);
  assert.match(provenance, /ui\.aceternity\.com\/components/);
  assert.match(provenance, /uiverse\.io/);
  assert.ok(profile.interactionReferences.length >= 3);
  assert.ok(profile.interactionReferences.some((reference) => reference.name === "React Bits"));
  assert.ok(profile.interactionReferences.some((reference) => reference.name === "Aceternity UI"));
  assert.ok(profile.interactionReferences.some((reference) => reference.name === "Uiverse.io"));
  assert.equal(packageJson.dependencies["framer-motion"], undefined);
  assert.ok(releases.some((release) => release.edition === 26));
});

test("preserves the edition 28 Serkon Cosmos release record", () => {
  const profile = JSON.parse(fs.readFileSync(new URL("../data/machine-profile.json", import.meta.url), "utf8"));
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));
  assert.ok(profile.projects.some((project) => project.name.includes("Serkon Cosmos")));
  assert.ok(profile.interactionReferences.some((reference) => reference.name === "MotionSites"));
  assert.ok(releases.some((release) => release.edition === 28 && release.title === "Serkon Cosmos 宇宙沉浸档案"));
});

test("ships edition 29 as a merged motion and notes archive", () => {
  const experience = fs.readFileSync(new URL("../app/cosmos/CosmosExperience.tsx", import.meta.url), "utf8");
  const cosmosCss = fs.readFileSync(new URL("../app/cosmos/cosmos.css", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const menu = fs.readFileSync(new URL("../app/MobileMenu.tsx", import.meta.url), "utf8");
  const notes = fs.readFileSync(new URL("../app/notes/page.tsx", import.meta.url), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));
  assert.match(experience, /motion-kinetic-word/);
  assert.match(experience, /motion-clue-picker/);
  assert.match(experience, /thoughtGroups/);
  assert.match(experience, /20 NOTES/);
  assert.match(experience, /getContext\("2d"\)/);
  assert.doesNotMatch(experience, /fetch\(/);
  assert.match(cosmosCss, /orientation: landscape/);
  assert.match(cosmosCss, /prefers-reduced-motion: reduce/);
  assert.match(page, /动态思想档案/);
  assert.match(menu, /\/cosmos/);
  assert.match(notes, /id=\{`note-/);
  assert.equal(packageJson.dependencies["framer-motion"], undefined);
  assert.ok(releases.some((release) => release.edition === 29));
});

test("records editions 30–35 as a continuous, verifiable roadmap", () => {
  const releases = JSON.parse(fs.readFileSync(new URL("../data/releases.json", import.meta.url), "utf8"));
  assert.deepEqual(releases.slice(-6).map((release) => release.edition), [30, 31, 32, 33, 34, 35]);
  assert.equal(releases.at(-1).edition, 35);
  assert.equal(releases.at(-1).date, "2026-07-29");
  assert.match(releases.find((release) => release.edition === 30).title, /基础质量修复/);
  assert.ok(releases.find((release) => release.edition === 30).changes.some((change) => change.includes("安全响应头")));
  const edition31 = releases.find((release) => release.edition === 31);
  assert.match(edition31.title, /内容与结构升级/);
  assert.ok(edition31.changes.some((change) => change.includes("第三方隐私")));
  const edition32 = releases.find((release) => release.edition === 32);
  assert.match(edition32.title, /身份实体与入口纠错/);
  assert.ok(edition32.changes.some((change) => change.includes("结构化数据")));
  const edition33 = releases.find((release) => release.edition === 33);
  assert.match(edition33.title, /Google站点验证/);
  assert.ok(edition33.changes.some((change) => change.includes("Google Search Console")));
  const edition34 = releases.find((release) => release.edition === 34);
  assert.match(edition34.title, /Google验证路由修复/);
  assert.ok(edition34.changes.some((change) => change.includes("Cloudflare Pages")));
  const edition35 = releases.find((release) => release.edition === 35);
  assert.match(edition35.title, /全站细节与可维护性精修/);
  assert.ok(edition35.changes.some((change) => change.includes("关键链接")));
  assert.equal(
    fs.readFileSync(new URL("../public/google0145912d521186e0.html", import.meta.url), "utf8").trim(),
    "google-site-verification: google0145912d521186e0.html",
  );
});
