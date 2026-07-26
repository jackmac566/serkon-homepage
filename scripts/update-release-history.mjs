import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releasesPath = path.join(projectRoot, "data", "releases.json");
const trackedRoots = ["app/", "worker/", "drizzle/", "public/", "build/", "scripts/", "data/"];
const trackedSingles = new Set([
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "eslint.config.mjs",
]);
const generatedFiles = new Set([
  "data/content-provenance.json",
  "public/content-provenance.json",
  "public/feed.xml",
  "public/llms.txt",
  "public/now.json",
  "public/profile.json",
  "public/projects.json",
  "public/ui-references.json",
]);

function git(args) {
  return execFileSync("git", args, { cwd: projectRoot, encoding: "utf8" });
}

function included(file) {
  return (
    file !== "data/releases.json" &&
    !generatedFiles.has(file) &&
    (trackedRoots.some((root) => file.startsWith(root)) || trackedSingles.has(file)) &&
    !file.startsWith("dist/") &&
    !file.startsWith(".next/") &&
    !file.startsWith("node_modules/") &&
    !file.startsWith(".sites-runtime/") &&
    !file.startsWith(".wrangler/")
  );
}

function sourceFingerprint() {
  const files = git(["ls-files", "-co", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .filter(included)
    .filter((file) => fs.existsSync(path.join(projectRoot, file)))
    .sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(projectRoot, file)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function chinaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function changedFiles() {
  const modified = git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"])
    .split("\n")
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .filter(Boolean);
  return [...new Set([...modified, ...untracked])].filter(included);
}

function inferredChanges(files) {
  const notes = [];
  if (files.some((file) => file.endsWith(".css"))) notes.push("优化视觉样式与响应式表现");
  if (files.some((file) => file.startsWith("app/api/") || file.startsWith("worker/") || file.startsWith("drizzle/"))) notes.push("完善互动数据与后端能力");
  if (files.some((file) => file.startsWith("app/") && /\.(tsx?|jsx?)$/.test(file))) notes.push("更新页面内容与交互体验");
  if (files.some((file) => file.startsWith("public/"))) notes.push("更新站内视觉素材");
  if (files.some((file) => file.startsWith("scripts/") || trackedSingles.has(file))) notes.push("完善构建与版本维护机制");
  return notes.length ? notes : ["更新网站内容与体验"];
}

function environmentChanges() {
  if (!process.env.SITE_RELEASE_CHANGES) return null;
  try {
    const value = JSON.parse(process.env.SITE_RELEASE_CHANGES);
    if (!Array.isArray(value)) return null;
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
  } catch {
    return null;
  }
}

const releases = JSON.parse(fs.readFileSync(releasesPath, "utf8"));
const fingerprint = sourceFingerprint();
const latest = releases.at(-1);

if (latest?.sourceHash === fingerprint) {
  console.log(`版本记录未变化：第 ${latest.edition} 版`);
  process.exit(0);
}

if (process.env.SITE_RELEASE_UPDATE_LAST === "1" && latest) {
  latest.sourceHash = fingerprint;
  fs.writeFileSync(releasesPath, `${JSON.stringify(releases, null, 2)}\n`);
  console.log(`已更新第 ${latest.edition} 版的最终源码指纹`);
  process.exit(0);
}

const edition = Number(latest?.edition ?? 0) + 1;
const changes = environmentChanges() ?? inferredChanges(changedFiles());
const summary = (process.env.SITE_RELEASE_SUMMARY || changes.join("；")).trim().slice(0, 180);
const title = (process.env.SITE_RELEASE_TITLE || "网站持续更新").trim().slice(0, 60);

releases.push({
  edition,
  date: chinaDate(),
  title,
  summary: summary.endsWith("。") ? summary : `${summary}。`,
  changes,
  sourceHash: fingerprint,
  automaticallyRecorded: true,
});

fs.writeFileSync(releasesPath, `${JSON.stringify(releases, null, 2)}\n`);
console.log(`已自动记录第 ${edition} 版：${chinaDate()}`);
