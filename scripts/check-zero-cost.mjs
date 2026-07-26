import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const forbiddenPackages = [
  "openai", "@anthropic-ai/sdk", "stripe", "twilio", "@sendgrid/mail",
  "algoliasearch", "@sentry/nextjs", "firebase", "@supabase/supabase-js",
];
const installed = new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})]);
const badPackages = forbiddenPackages.filter((name) => installed.has(name));

function filesUnder(directory) {
  const start = path.join(root, directory);
  if (!fs.existsSync(start)) return [];
  return fs.readdirSync(start, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(relative) : [relative];
  });
}

const sourceFiles = [...filesUnder("app"), ...filesUnder("worker")].filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file));
const externalRuntimeFetches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (/fetch\s*\(\s*["'`]https?:\/\//u.test(content)) externalRuntimeFetches.push(file);
}

if (badPackages.length || externalRuntimeFetches.length) {
  console.error("零成本闸门未通过。");
  if (badPackages.length) console.error(`发现需人工复核的外部服务 SDK：${badPackages.join(", ")}`);
  if (externalRuntimeFetches.length) console.error(`发现运行时外部请求：${externalRuntimeFetches.join(", ")}`);
  process.exit(1);
}

console.log(`零成本闸门通过：${sourceFiles.length} 个运行源码文件未发现外部付费请求，未安装常见付费服务 SDK。`);
