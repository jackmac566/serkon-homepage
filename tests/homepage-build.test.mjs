import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { generateHomepage } from "../scripts/build-homepage.mjs";

function fixture(t) {
  const directory = fs.mkdtempSync(fileURLToPath(new URL("../../homepage-build-test-", import.meta.url)));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const write = (filename, value) => {
    const target = path.join(directory, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  write("template.html", "<style>{{HOMEPAGE_STYLES}}</style><script>{{HOMEPAGE_REACT_VENDOR}}</script><script>{{HOMEPAGE_RUNTIME}}</script>\n");
  write("style.css", "body{margin:0}\n");
  write("vendor/react-19.1.1.production.js", "/* fixed vendor */");
  write("runtime.js", "globalThis.factories={/* __HOMEPAGE_MODULES__ */};");
  write("modules/components/serkon-homepage.cjs", "\nmodule.exports = 'entry';\n");
  return { directory, write };
}

test("CJS extraction preserves exact source bytes and stable output ordering", (t) => {
  const { directory, write } = fixture(t);
  write("modules/data/z-last.cjs", "\nexports.value = 2;\n\n");
  write("modules/data/a-first.cjs", "exports.value=1;");
  const first = generateHomepage(directory);
  const second = generateHomepage(directory);
  assert.equal(first.html, second.html);
  assert.deepEqual(first.modules, ["components/serkon-homepage", "data/a-first", "data/z-last"]);
  assert.ok(first.html.includes('"data/z-last":function(module,exports,require){\nexports.value = 2;\n\n}'));
  assert.ok(first.html.startsWith("<style>body{margin:0}\n</style>"));
});

test("new nested TSX modules are discovered, compiled and callable without a JSX runtime", (t) => {
  const { directory, write } = fixture(t);
  write("modules/components/new/gallery.tsx", 'const React = require("react"); export default function Gallery({name}:{name:string}) { return <strong>{name}</strong>; }');
  const { html, modules } = generateHomepage(directory);
  assert.ok(modules.includes("components/new/gallery"));
  assert.ok(!html.includes("react/jsx-runtime"));
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const context = vm.createContext({});
  vm.runInContext(script, context);
  const fixtureModule = { exports: {} };
  context.factories["components/new/gallery"](fixtureModule, fixtureModule.exports, (id) => {
    assert.equal(id, "react");
    return { createElement: (tag, props, child) => ({ tag, props, child }) };
  });
  assert.deepEqual(fixtureModule.exports.default({ name: "Serkon" }), { tag: "strong", props: null, child: "Serkon" });
});

test("optional gallery CSS is appended after the original CSS only when present", (t) => {
  const { directory, write } = fixture(t);
  const baseline = generateHomepage(directory).html;
  write("gallery.css", ".gallery{display:grid}\n");
  const enhanced = generateHomepage(directory).html;
  assert.equal(enhanced, baseline.replace("body{margin:0}\n", "body{margin:0}\n\n.gallery{display:grid}\n"));
});

test("ambiguous module IDs and TSX syntax errors fail before producing HTML", (t) => {
  const { directory, write } = fixture(t);
  write("modules/components/serkon-homepage.tsx", "export default function Home() { return null; }");
  assert.throws(() => generateHomepage(directory), /Duplicate homepage module/);
  fs.unlinkSync(path.join(directory, "modules/components/serkon-homepage.tsx"));
  write("modules/components/broken.tsx", "export const x = <div>");
  assert.throws(() => generateHomepage(directory), /broken\.tsx/);
});

test("missing template markers and unsafe script endings fail clearly", (t) => {
  const { directory, write } = fixture(t);
  write("template.html", "{{HOMEPAGE_STYLES}}");
  assert.throws(() => generateHomepage(directory), /exactly one.*HOMEPAGE_REACT_VENDOR/);
  write("modules/components/unsafe.cjs", 'exports.text="</script>";');
  assert.throws(() => generateHomepage(directory), /closing script tag/);
});
