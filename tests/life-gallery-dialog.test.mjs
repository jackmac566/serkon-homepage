import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../app/life/LifeGallery.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Exercise the component's real handlers/effect lifecycle without fetching public
// photos. Native showModal() supplies the browser's modal focus/inert behavior;
// this small DOM double checks that the component actually uses that API.
function galleryHarness() {
  const slots = [], pendingEffects = [], refs = new Set();
  let index = 0, tree;
  const document = { activeElement: null, body: { style: { overflow: "auto" } } };
  class Element {
    isConnected = true;
    focus() { document.activeElement = this; }
  }
  class Dialog extends Element {
    open = false;
    modalOpens = 0;
    closes = 0;
    showModal() { this.open = true; this.modalOpens++; this.focus(); }
    close() { this.open = false; this.closes++; }
  }
  const hooks = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { value: initial };
      return [slots[slot].value, (value) => {
        slots[slot].value = typeof value === "function" ? value(slots[slot].value) : value;
      }];
    },
    useRef(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useMemo(compute) { index++; return compute(); },
    useEffect(effect, deps) {
      const slot = index++;
      const previous = slots[slot];
      if (!previous || deps.some((value, offset) => value !== previous.deps[offset])) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          slots[slot] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const context = vm.createContext({
    exports: {}, document, HTMLElement: Element,
    window: { setTimeout: () => 1, clearTimeout() {} },
    require(specifier) {
      if (specifier === "react") return hooks;
      if (specifier === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (specifier === "../archive-client") return { awardArchiveStamp() {} };
      throw new Error(`Unexpected import: ${specifier}`);
    },
  });
  vm.runInContext(compiled, context);

  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== "object") return [];
    return [node, ...nodes(node.props.children ?? null)];
  }
  function render() {
    index = 0;
    tree = context.exports.default();
    const activeRefs = new Set();
    for (const node of nodes(tree)) {
      const ref = node.props.ref;
      if (!ref) continue;
      activeRefs.add(ref);
      ref.current ||= node.type === "dialog" ? new Dialog() : new Element();
    }
    for (const ref of refs) {
      if (activeRefs.has(ref)) continue;
      ref.current.isConnected = false;
      ref.current = null;
    }
    refs.clear();
    for (const ref of activeRefs) refs.add(ref);
    while (pendingEffects.length) pendingEffects.shift()();
  }
  function find(predicate) {
    const result = nodes(tree).find(predicate);
    assert.ok(result, "Expected rendered gallery element");
    return result;
  }
  render();
  return {
    document, render, find,
    open(photoIndex = 0, focusTrigger = true) {
      const opener = new Element();
      if (focusTrigger) opener.focus();
      nodes(tree).filter((node) => node.props.className === "photo-item")[photoIndex].props.onClick({ currentTarget: opener });
      render();
      const dialog = find((node) => node.type === "dialog");
      return { opener, dialog, element: dialog.props.ref.current };
    },
    hasDialog() { return nodes(tree).some((node) => node.type === "dialog"); },
    unmount() {
      for (const ref of refs) ref.current.isConnected = false;
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}

test("gallery opens a native modal and initially focuses its close button", () => {
  const gallery = galleryHarness();
  const { dialog, element } = gallery.open();
  assert.equal(element.open, true);
  assert.equal(element.modalOpens, 1, "An open attribute alone does not make the background inert");
  assert.equal(gallery.document.body.style.overflow, "hidden");
  const close = gallery.find((node) => node.props["aria-label"] === "关闭大图");
  assert.equal(gallery.document.activeElement, close.props.ref.current);
  assert.equal(dialog.props["aria-label"], "由多张日常自拍组成的拍立得拼贴");
  assert.equal(dialog.props.style.maxWidth, "none", "Reset the dialog's constrained browser default sizing");
  gallery.render();
  assert.equal(element.modalOpens, 1, "Unrelated renders must not reopen the modal or replace the return target");
});

test("Escape cancellation closes the modal, restores scroll, and returns to its opener", () => {
  const gallery = galleryHarness();
  const { dialog, element, opener } = gallery.open(1);
  let prevented = false;
  dialog.props.onCancel({ preventDefault() { prevented = true; } });
  gallery.render();
  assert.equal(prevented, true, "Keep the native cancel event in sync with React's open state");
  assert.equal(gallery.hasDialog(), false);
  assert.equal(element.open, false);
  assert.equal(element.closes, 1);
  assert.equal(gallery.document.body.style.overflow, "auto");
  assert.equal(gallery.document.activeElement, opener);
});

test("image and caption clicks keep the modal open; only background clicks dismiss it", () => {
  const gallery = galleryHarness();
  const { dialog, element, opener } = gallery.open();
  for (const type of ["img", "p"]) {
    const child = dialog.props.children.find((node) => node.type === type);
    dialog.props.onClick({ target: child, currentTarget: element });
    gallery.render();
    assert.equal(gallery.hasDialog(), true, `${type} content must remain readable after a click`);
    assert.equal(element.modalOpens, 1);
  }
  dialog.props.onClick({ target: element, currentTarget: element });
  gallery.render();
  assert.equal(gallery.hasDialog(), false);
  assert.equal(gallery.document.activeElement, opener);
});

test("the close button can be used repeatedly and restores each thumbnail's focus", () => {
  const gallery = galleryHarness();
  for (const photoIndex of [0, 2]) {
    const { opener } = gallery.open(photoIndex);
    gallery.find((node) => node.props["aria-label"] === "关闭大图").props.onClick();
    gallery.render();
    assert.equal(gallery.hasDialog(), false);
    assert.equal(gallery.document.activeElement, opener);
    assert.equal(gallery.document.body.style.overflow, "auto");
  }
});

test("pointer activation returns focus to the thumbnail even when the browser did not focus it", () => {
  const gallery = galleryHarness();
  const { opener } = gallery.open(0, false);
  gallery.find((node) => node.props["aria-label"] === "关闭大图").props.onClick();
  gallery.render();
  assert.equal(gallery.document.activeElement, opener);
});

test("unmounting releases the modal and scroll lock without focusing a removed opener", () => {
  const gallery = galleryHarness();
  const { opener, element } = gallery.open();
  opener.isConnected = false;
  gallery.unmount();
  assert.equal(element.open, false);
  assert.equal(element.closes, 1);
  assert.equal(gallery.document.body.style.overflow, "auto");
  assert.notEqual(gallery.document.activeElement, opener);
});
