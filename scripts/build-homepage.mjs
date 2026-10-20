import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const repository = fileURLToPath(new URL("../", import.meta.url));
const moduleMarker = "/* __HOMEPAGE_MODULES__ */";

function replaceOnce(source, marker, value, filename) {
  if (source.split(marker).length !== 2) throw new Error(`${filename} must contain exactly one ${marker}`);
  return source.replace(marker, () => value);
}

function discoverModules(directory, relative = "") {
  const entries = fs.readdirSync(path.join(directory, relative), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const filename = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) return discoverModules(directory, filename);
    if (entry.isFile() && /\.(cjs|tsx)$/.test(entry.name)) return [filename];
    return [];
  }).sort();
}

function compileModule(filename, source) {
  if (filename.endsWith(".cjs")) return source;
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      newLine: ts.NewLineKind.LineFeed,
    },
  });
  const errors = (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new Error(`${filename}: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n")}`);
  }
  return result.outputText;
}

export function generateHomepage(sourceDirectory = path.join(repository, "homepage")) {
  const directory = path.join(sourceDirectory, "modules");
  const seen = new Set();
  const modules = discoverModules(directory).map((filename) => {
    const id = filename.replace(/\.(cjs|tsx)$/, "");
    if (!/^[a-zA-Z0-9_/-]+$/.test(id)) throw new Error(`Unsupported homepage module name: ${filename}`);
    if (seen.has(id)) throw new Error(`Duplicate homepage module: ${id}. Keep one .cjs or .tsx source.`);
    seen.add(id);
    const body = compileModule(filename, fs.readFileSync(path.join(directory, filename), "utf8"));
    if (/<\/script/i.test(body)) throw new Error(`${filename} contains a closing script tag; escape it as <\\/script.`);
    return { id, body };
  });
  if (!seen.has("components/serkon-homepage")) throw new Error("Missing homepage entry: components/serkon-homepage");
  const bundled = modules.map(({ id, body }) => `${JSON.stringify(id)}:function(module,exports,require){${body}}`).join(",\n");
  const runtime = replaceOnce(fs.readFileSync(path.join(sourceDirectory, "runtime.js"), "utf8"), moduleMarker, bundled, "homepage/runtime.js");
  const galleryStyle = path.join(sourceDirectory, "gallery.css");
  const styles = fs.readFileSync(path.join(sourceDirectory, "style.css"), "utf8")
    + (fs.existsSync(galleryStyle) ? `\n${fs.readFileSync(galleryStyle, "utf8")}` : "");
  const values = {
    "{{HOMEPAGE_STYLES}}": styles,
    "{{HOMEPAGE_REACT_VENDOR}}": fs.readFileSync(path.join(sourceDirectory, "vendor/react-19.1.1.production.js"), "utf8"),
    "{{HOMEPAGE_RUNTIME}}": runtime,
  };
  let html = fs.readFileSync(path.join(sourceDirectory, "template.html"), "utf8");
  for (const [marker, value] of Object.entries(values)) html = replaceOnce(html, marker, value, "homepage/template.html");
  return { html, modules: modules.map(({ id }) => id) };
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((value) => value !== "--check") || args.length > 1) throw new Error("Usage: node scripts/build-homepage.mjs [--check]");
  const { html, modules } = generateHomepage();
  const destination = path.join(repository, "serkon-home.html");
  const matches = fs.existsSync(destination) && fs.readFileSync(destination).equals(Buffer.from(html));
  if (args.includes("--check")) {
    if (!matches) throw new Error("serkon-home.html differs from homepage/ sources. Run npm run home:build and commit both.");
    process.stdout.write(`Homepage output is current (${modules.length} modules, ${Buffer.byteLength(html)} bytes).\n`);
    return;
  }
  if (!matches) fs.writeFileSync(destination, html);
  process.stdout.write(`Homepage built (${modules.length} modules, ${Buffer.byteLength(html)} bytes).\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { main(); } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
