import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const homeSource = fs.readFileSync(new URL("../serkon-home.html", import.meta.url), "utf8");
const languageSource = fs.readFileSync(new URL("../app/LanguageController.tsx", import.meta.url), "utf8");

function preferencesHarness(saved, blocked = false) {
  const values = new Map(Object.entries(saved));
  const localStorage = {
    getItem(key) { if (blocked) throw new Error("Storage blocked"); return values.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error("Storage blocked"); values.set(key, value); },
  };
  const state = [], dependencies = [], effects = [], timers = [];
  let index = 0;
  const hooks = {
    useState(initial) {
      const slot = index++;
      if (!(slot in state)) state[slot] = initial;
      return [state[slot], (value) => { state[slot] = typeof value === "function" ? value(state[slot]) : value; }];
    },
    useEffect(effect, deps) {
      const slot = index++;
      if (!dependencies[slot] || deps.some((value, offset) => value !== dependencies[slot][offset])) effects.push(effect);
      dependencies[slot] = deps;
    },
  };
  const root = { lang: "zh-CN", dataset: {}, classList: { add() {}, remove() {} } };
  const document = { nodeType: 9, body: null, head: {}, documentElement: root, title: "Serkon 侯世康｜个人主页与作品档案", querySelector: () => null, querySelectorAll: () => [] };
  const context = vm.createContext({
    React: hooks, localStorage, document, Node: { DOCUMENT_NODE: 9 }, Element: class {},
    MutationObserver: class { observe() {} disconnect() {} },
    window: { localStorage, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), setTimeout: (callback) => { timers.push(callback); return timers.length; }, clearTimeout() {} },
  });
  return {
    context, values, root,
    render(component) { index = 0; const result = component(); while (effects.length) effects.shift()(); return result; },
    flushTimers() { while (timers.length) timers.shift()(); },
  };
}

function homepagePreferences(harness) {
  const start = homeSource.indexOf("function safeGet(key)");
  const end = homeSource.indexOf("function SectionHeading", start);
  assert.ok(start > 0 && end > start, "Standalone preference entry must remain discoverable");
  vm.runInContext(`${homeSource.slice(start, end)}\nglobalThis.preferences = usePreferences;`, harness.context);
  harness.render(harness.context.preferences);
  return harness.render(harness.context.preferences);
}

function childPreferences(harness) {
  const compiled = ts.transpileModule(languageSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  harness.context.exports = {};
  harness.context.require = (specifier) => {
    if (specifier === "react") return harness.context.React;
    if (specifier === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
    throw new Error(`Unexpected import: ${specifier}`);
  };
  vm.runInContext(compiled, harness.context);
  const component = harness.context.exports.default;
  harness.render(component);
  harness.flushTimers();
  harness.render(component);
}

test("an English homepage selection survives navigation into the application", () => {
  const homepage = preferencesHarness({});
  const current = homepagePreferences(homepage);
  current.changeLanguage();
  assert.equal(homepage.values.get("serkon_language_v1"), "en");
  assert.equal(homepage.root.lang, "en");

  const child = preferencesHarness(Object.fromEntries(homepage.values));
  childPreferences(child);
  assert.equal(child.root.lang, "en");
  assert.equal(child.values.get("serkon_language_v1"), "en");
});

test("the homepage restores the application's choice and document language", () => {
  const homepage = preferencesHarness({ serkon_language_v1: "en", serkon_experience_language: "zh" });
  const current = homepagePreferences(homepage);
  assert.equal(current.lang, "en");
  assert.equal(homepage.root.lang, "en");
  assert.equal(homepage.root.dataset.language, "en");
  current.changeLanguage();
  assert.equal(homepage.values.get("serkon_language_v1"), "zh");
  assert.equal(homepage.root.lang, "zh-CN");
});

test("both entry points migrate a saved legacy homepage language", () => {
  for (const initialize of [homepagePreferences, childPreferences]) {
    const harness = preferencesHarness({ serkon_experience_language: "en" });
    initialize(harness);
    assert.equal(harness.values.get("serkon_language_v1"), "en");
    assert.equal(harness.root.lang, "en");
  }
});

test("shared preferences take precedence over stale legacy values", () => {
  const harness = preferencesHarness({ serkon_language_v1: "zh", serkon_experience_language: "en" });
  childPreferences(harness);
  assert.equal(harness.root.lang, "zh-CN");
  assert.equal(harness.values.get("serkon_language_v1"), "zh");
});

test("blocked storage leaves the homepage's language control usable", () => {
  const harness = preferencesHarness({}, true);
  const current = homepagePreferences(harness);
  assert.doesNotThrow(() => current.changeLanguage());
  assert.equal(harness.root.lang, "en");
});

test("legacy mobile navigation points only to anchors retained by the standalone homepage", () => {
  const menu = fs.readFileSync(new URL("../app/MobileMenu.tsx", import.meta.url), "utf8");
  const homeAnchors = new Set([...homeSource.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]));
  const menuAnchors = [...menu.matchAll(/"\/#([^"]+)"/g)].map((match) => match[1]);
  assert.ok(menuAnchors.length >= 2, "Check the menu's actual homepage targets");
  for (const anchor of menuAnchors) assert.ok(homeAnchors.has(anchor), `Missing homepage anchor: ${anchor}`);
});
