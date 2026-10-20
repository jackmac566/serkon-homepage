import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projects = require("../homepage/modules/data/serkon-experience.cjs");
const jsx = (type, props) => ({ type, props: props ?? {} });

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node && typeof node === "object" ? [node, ...nodes(node.props?.children)] : [];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (node && typeof node === "object") return text(node.props?.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}

function sessionStorage(values = new Map(), blocked = false) {
  return {
    values,
    getItem(key) { if (blocked) throw new Error("Session storage blocked"); return values.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error("Session storage blocked"); values.set(key, value); },
  };
}

function componentHarness(filename, globals = {}, imports = {}) {
  const slots = [], effects = [];
  let cursor = 0, tree;
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, next => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, offset) => value !== previous.deps[offset])) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; });
      }
    },
  };
  const compiled = ts.transpileModule(fs.readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = vm.createContext({
    exports: {}, URLSearchParams, ...globals,
    require(id) {
      if (id === "react") return react;
      if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (id in imports) return imports[id];
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  vm.runInContext(compiled, context);
  return {
    render(props) { cursor = 0; tree = context.exports.default(props); return tree; },
    mount() { while (effects.length) effects.shift()(); },
    find(predicate) { const node = nodes(tree).find(predicate); assert.ok(node, "Expected rendered element"); return node; },
    all() { return nodes(tree); },
  };
}

function gallery(storage) {
  const opened = [];
  const harness = componentHarness("homepage/modules/components/work-gallery.tsx", {
    window: { sessionStorage: storage },
  }, { "../data/serkon-experience": projects });
  harness.render({ lang: "zh", onOpen: index => opened.push(index) });
  return { ...harness, opened };
}

function station(storage, { pathname = "/play", currentElements = {}, mount = true } = {}) {
  const timers = [], listeners = new Map();
  const localValues = new Map();
  const harness = componentHarness("app/CreatorDock.tsx", {
    document: { getElementById: id => currentElements[id] ?? null },
    window: {
      location: new URL(`https://test.invalid${pathname}`), innerHeight: 900,
      sessionStorage: storage,
      localStorage: {
        getItem: key => localValues.get(key) ?? null,
        setItem: (key, value) => localValues.set(key, value),
      },
      addEventListener(name, callback) { listeners.set(name, callback); },
      removeEventListener(name) { listeners.delete(name); },
      setTimeout(callback) { timers.push(callback); return timers.length; }, clearTimeout() {},
    },
  }, { "next/link": { default: () => null }, "./archive-client": { awardArchiveStamp() {} } });
  const props = { embedded: true };
  harness.render(props);
  if (mount) {
    harness.mount();
    while (timers.length) timers.shift()();
    harness.render(props);
  }
  return {
    ...harness, localValues,
    visitLines() {
      harness.find(node => node.type === "button" && text(node).includes("纪念卡")).props.onClick();
      harness.render(props);
      return harness.all().filter(node => node.type === "li").map(text);
    },
  };
}

test("opening a real project carries the works visit into the same-tab studio session", () => {
  const storage = sessionStorage(), home = gallery(storage);
  assert.equal(storage.values.has("serkon_visited_works_v1"), false, "Rendering the gallery does not imply a visit");
  home.find(node => node.props.className === "sx-card").props.onClick();
  assert.deepEqual(home.opened, [0]);
  assert.equal(storage.values.get("serkon_visited_works_v1"), "true");
  const studio = station(storage);
  assert.ok(studio.visitLines().includes("✓ 看过 Serkon 的作品案例"));
  assert.equal(studio.localValues.has("serkon_visited_works_v1"), false, "No durable localStorage tracking");
});

test("filtering the gallery and a fresh studio session do not invent a works visit", () => {
  const storage = sessionStorage(), home = gallery(storage);
  home.find(node => node.type === "button" && text(node) === "产品与代码").props.onClick();
  assert.deepEqual(home.opened, []);
  assert.equal(storage.values.has("serkon_visited_works_v1"), false);
  assert.ok(station(storage).visitLines().includes("○ 还没有浏览作品案例"));
  assert.ok(station(sessionStorage(new Map([["serkon_visited_works_v1", "false"]]))).visitLines().includes("○ 还没有浏览作品案例"));
});

test("the mounted play page records the actual destination without claiming other pages", () => {
  for (const pathname of ["/play", "/play/"]) {
    assert.ok(station(sessionStorage(), { pathname }).visitLines().includes("✓ 到过互动实验室"));
  }
  assert.ok(station(sessionStorage(), { pathname: "/notes" }).visitLines().includes("○ 还没有进入互动实验室"));
  assert.ok(station(sessionStorage(), { mount: false }).visitLines().includes("○ 还没有进入互动实验室"));
});

test("blocked session storage does not prevent project opening or the visit card", () => {
  const storage = sessionStorage(new Map(), true), home = gallery(storage);
  assert.doesNotThrow(() => home.find(node => node.props.className === "sx-card").props.onClick());
  assert.deepEqual(home.opened, [0]);
  const lines = station(storage).visitLines();
  assert.ok(lines.includes("○ 还没有浏览作品案例"), "Do not claim unrecorded activity");
  assert.ok(lines.includes("✓ 到过互动实验室"));
});

test("legacy homepage DOM detection still works with unavailable session storage", () => {
  const currentElements = Object.fromEntries(["works", "play"].map(id => [id, { getBoundingClientRect: () => ({ top: 100 }) }]));
  const lines = station(sessionStorage(new Map(), true), { pathname: "/", currentElements }).visitLines();
  assert.ok(lines.includes("✓ 看过 Serkon 的作品案例"));
  assert.ok(lines.includes("✓ 到过互动实验室"));
});
