import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props: props ?? {} });
const jsxRuntime = { jsx, jsxs: jsx };

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (node && typeof node === "object") return text(node.props?.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}

function loadComponent(relative, globals = {}, imports = {}, extraSource = "") {
  const source = fs.readFileSync(new URL(`../app/${relative}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source + extraSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = vm.createContext({
    exports: {}, URLSearchParams, ...globals,
    require(specifier) {
      if (specifier === "react/jsx-runtime") return jsxRuntime;
      if (specifier.endsWith(".css")) return {};
      if (specifier in imports) {
        const imported = imports[specifier];
        return typeof imported === "function" ? { default: imported } : imported;
      }
      throw new Error(`Unexpected import: ${specifier}`);
    },
  });
  vm.runInContext(compiled, context);
  return context.exports;
}

function stationHarness(url, { embedded = true, blockedStorage = false } = {}) {
  const slots = [], effects = [], timers = [], stamps = [];
  const saved = new Map(), listeners = new Map();
  let index = 0, tree;
  const hooks = {
    useState(initial) {
      const slot = index++;
      slots[slot] ??= { value: initial };
      return [slots[slot].value, (next) => {
        slots[slot].value = typeof next === "function" ? next(slots[slot].value) : next;
      }];
    },
    useEffect(effect, deps) {
      const slot = index++;
      const previous = slots[slot];
      if (!previous || deps.some((value, offset) => value !== previous.deps[offset])) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[slot] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const window = {
    location: new URL(url), innerHeight: 900,
    localStorage: {
      getItem(key) { if (blockedStorage) throw new Error("Storage blocked"); return saved.get(key) ?? null; },
      setItem(key, value) { if (blockedStorage) throw new Error("Storage blocked"); saved.set(key, value); },
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    setTimeout(handler) { timers.push(handler); return timers.length; },
    clearTimeout() {},
  };
  const { default: Station } = loadComponent("CreatorDock.tsx", {
    window, document: { getElementById: () => null },
  }, { react: hooks, "next/link": () => null, "./archive-client": { awardArchiveStamp: (stamp) => stamps.push(stamp) } });
  function render() {
    index = 0;
    tree = Station({ embedded });
    while (effects.length) effects.shift()();
    return tree;
  }
  render();
  while (timers.length) timers.shift()();
  render();
  return {
    render, saved, stamps,
    find(predicate) {
      const node = nodes(tree).find(predicate);
      assert.ok(node, "Expected station element");
      return node;
    },
    all() { return nodes(tree); },
  };
}

test("every notes continuation reaches the playable studio with its original title", () => {
  const { default: NotesPage } = loadComponent("notes/page.tsx", {}, { "next/link": () => null });
  const articles = nodes(NotesPage()).filter((node) => node.type === "article");
  assert.equal(articles.length, 20);
  for (const article of articles) {
    const title = text(nodes(article).find((node) => node.type === "h2"));
    const link = nodes(article).find((node) => node.type === "a");
    const target = new URL(link.props.href, "https://test.invalid");
    assert.equal(target.pathname, "/play");
    assert.equal(target.hash, "#ai-station");
    assert.equal(target.searchParams.get("ai"), title);
    assert.equal(text(link), "用同样的情绪继续写一段 →");
  }
});

test("the playable page mounts the studio as an accessible inline section", () => {
  const Station = () => null;
  const { default: PlayPage } = loadComponent("play/page.tsx", {}, {
    "next/link": () => null, "../Playground": () => null, "../CreatorDock": Station,
  });
  const section = nodes(PlayPage()).find((node) => node.props.id === "ai-station");
  assert.ok(section);
  assert.equal(section.props["aria-labelledby"], "ai-station-title");
  assert.ok(nodes(section).some((node) => node.props.id === "ai-station-title"));
  assert.equal(nodes(section).find((node) => node.type === Station).props.embedded, true);
});

for (const blockedStorage of [false, true]) {
  test(`a notes deep link prefills and generates locally with storage ${blockedStorage ? "blocked" : "available"}`, () => {
    const topic = "我们舍不得的，也许不是那个旧账号";
    const studio = stationHarness(`https://test.invalid/play?ai=${encodeURIComponent(topic)}#ai-station`, { blockedStorage });
    assert.equal(studio.find((node) => node.type === "textarea").props.value, topic);
    const panel = studio.find((node) => node.props.className?.startsWith("creator-dock"));
    assert.equal(panel.props["aria-hidden"], false);
    assert.equal(panel.props.inert, false);
    assert.equal(panel.props.style.position, "static");
    assert.equal(studio.all().some((node) => node.props.className === "dock-backdrop"), false);
    studio.find((node) => node.type === "button" && text(node) === "生成内容").props.onClick();
    studio.render();
    assert.ok(text(studio.find((node) => node.type === "pre")).includes(topic));
    assert.deepEqual(studio.stamps, ["ai"]);
    if (!blockedStorage) assert.equal(JSON.parse(studio.saved.get("serkon_progress")).generations, 1);
  });
}

test("the standalone studio accepts an ai query without relying on the homepage hash", () => {
  const studio = stationHarness("https://test.invalid/play?ai=An%20English%20topic");
  assert.equal(studio.find((node) => node.type === "textarea").props.value, "An English topic");
});

test("the default homepage dock stays closed until explicitly requested", () => {
  const studio = stationHarness("https://test.invalid/", { embedded: false });
  const panel = studio.find((node) => node.props.className?.startsWith("creator-dock"));
  assert.equal(panel.props["aria-hidden"], true);
  assert.equal(panel.props.inert, true);
  assert.equal(panel.props.style, undefined);
});

test("shared quizzes still open within the standalone studio", () => {
  const studio = stationHarness("https://test.invalid/play?match=0120120120#ai-station");
  assert.equal(studio.all().filter((node) => node.type === "fieldset").length, 10);
  assert.ok(studio.all().some((node) => node.type === "strong" && text(node) === "站长匹配测试"));
});

test("the progress book links to the homepage instead of a missing local archive", () => {
  const studio = stationHarness("https://test.invalid/play#ai-station");
  studio.find((node) => node.type === "button" && text(node).includes("成长")).props.onClick();
  studio.render();
  assert.equal(studio.find((node) => node.props.className === "archive-jump").props.href, "/");
});

test("the studio and notes labels retain the existing English translations", () => {
  const { translateValue } = loadComponent("LanguageController.tsx", {}, { react: {} }, "\nexport { translateValue };\n");
  assert.equal(translateValue("快捷创作工坊"), "Quick creation studio");
  assert.equal(translateValue("输入主题"), "TOPIC");
  assert.equal(translateValue("生成内容"), "Generate");
  assert.equal(translateValue("用同样的情绪继续写一段 →"), "Continue writing in this mood →");
});
