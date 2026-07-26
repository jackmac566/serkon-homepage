import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(fs.readFileSync(path.join(root, "data/provenance-sources.json"), "utf8"));
const assets = source.assets.map((asset) => {
  const bytes = fs.readFileSync(path.join(root, asset.path));
  return {
    ...asset,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength,
  };
});

const record = {
  schemaVersion: source.schemaVersion,
  lastUpdated: source.lastUpdated,
  credentialStatus: source.credentialStatus,
  credentialNote: source.credentialNote,
  hashAlgorithm: "SHA-256",
  assets,
};
const value = `${JSON.stringify(record, null, 2)}\n`;
fs.writeFileSync(path.join(root, "data/content-provenance.json"), value);
fs.writeFileSync(path.join(root, "public/content-provenance.json"), value);
console.log(`已生成 ${assets.length} 项内容来源与哈希档案`);
