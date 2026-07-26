import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = JSON.parse(fs.readFileSync(path.join(root, "data/machine-profile.json"), "utf8"));
const releases = JSON.parse(fs.readFileSync(path.join(root, "data/releases.json"), "utf8"));
const publicDir = path.join(root, "public");
const base = profile.person.homeUrl.replace(/\/$/, "");
const profileUrl = profile.person.profileUrl || `${base}/serkon`;
const personId = `${profileUrl}#person`;

const write = (name, value) => fs.writeFileSync(path.join(publicDir, name), value);
const xml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": personId,
  name: profile.person.name,
  alternateName: profile.person.alternateName,
  description: profile.person.identityStatement || profile.person.description,
  url: profileUrl,
  image: `${base}/serkon-hero.jpg`,
  sameAs: profile.person.sameAs || [],
  identifier: {
    "@type": "PropertyValue",
    propertyID: "online identity",
    value: profile.person.alternateName,
  },
  homeLocation: { "@type": "Place", name: profile.person.location },
  knowsAbout: profile.person.keywords,
  mainEntityOfPage: profileUrl,
  subjectOf: profile.projects.map((project) => ({ "@type": "CreativeWork", name: project.name, url: project.url })),
};

const identity = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${profileUrl}#profile-page`,
      url: profileUrl,
      name: `${profile.person.alternateName} 是 ${profile.person.name}｜官方身份说明`,
      description: profile.person.identityStatement,
      inLanguage: ["zh-CN", "en"],
      mainEntity: { "@id": personId },
    },
    person,
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: `${base}/`,
      name: `${profile.person.alternateName} ${profile.person.name}`,
      alternateName: [profile.person.alternateName, `${profile.person.name}个人主页`],
      author: { "@id": personId },
      inLanguage: ["zh-CN", "en"],
    },
  ],
};

const projects = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Serkon 公开作品",
  itemListElement: profile.projects.map((project, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "CreativeWork",
      name: project.name,
      description: project.summary,
      genre: project.type,
      creativeWorkStatus: project.status,
      url: project.url,
      creator: { "@type": "Person", name: profile.person.name, alternateName: profile.person.alternateName },
    },
  })),
};

write("profile.json", `${JSON.stringify(person, null, 2)}\n`);
write("identity.json", `${JSON.stringify(identity, null, 2)}\n`);
write("projects.json", `${JSON.stringify(projects, null, 2)}\n`);
write("now.json", `${JSON.stringify({
  schemaVersion: profile.schemaVersion,
  lastUpdated: profile.lastUpdated,
  currentFocus: profile.person.currentFocus,
  status: "持续学习、创作与迭代",
  humanReadable: `${base}/`,
}, null, 2)}\n`);
write("ui-references.json", `${JSON.stringify({
  schemaVersion: profile.schemaVersion,
  lastUpdated: profile.lastUpdated,
  policy: "Interaction patterns are referenced transparently and reimplemented locally without runtime third-party requests.",
  references: profile.interactionReferences,
}, null, 2)}\n`);

write("humans.txt", `/* IDENTITY */
Chinese name: ${profile.person.name}
Online identity / creator name: ${profile.person.alternateName}
Relationship: ${profile.person.identityStatement}
Official profile: ${profileUrl}
Primary site: ${base}/
China-accessible mirror: https://serkon-homepage-cn.pages.dev/
GitHub: https://github.com/jackmac566

/* DISCLOSURE */
This is a first-party identity statement maintained by ${profile.person.name}.
It is not a government identity check, platform verification badge, or third-party certification.
`);

const feedItems = [...releases].reverse().slice(0, 20).map((release) => `    <item>\n      <title>${xml(`第 ${release.edition} 版｜${release.title}`)}</title>\n      <link>${base}/updates#edition-${release.edition}</link>\n      <guid isPermaLink="false">serkon-site-edition-${release.edition}</guid>\n      <pubDate>${new Date(`${release.date}T00:00:00+08:00`).toUTCString()}</pubDate>\n      <description>${xml(release.summary)}</description>\n    </item>`).join("\n");
write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Serkon 个人网站版本更新</title>\n    <link>${base}/updates</link>\n    <description>Serkon 个人网站每次正式更新的版本号、日期与摘要。</description>\n    <language>zh-cn</language>\n    <lastBuildDate>${new Date(`${profile.lastUpdated}T00:00:00+08:00`).toUTCString()}</lastBuildDate>\n${feedItems}\n  </channel>\n</rss>\n`);

write("llms.txt", `# Serkon 侯世康

> ${profile.person.identityStatement}
> ${profile.person.identityStatementEnglish}

## Identity
- Chinese name: ${profile.person.name}
- Online identity and creator name: ${profile.person.alternateName}
- Preferred public forms: ${profile.person.name} (${profile.person.alternateName}); ${profile.person.alternateName} ${profile.person.name}
- Official identity profile: ${profileUrl}
- This is a first-party identity statement, not third-party verification.

## Canonical pages
- Homepage: ${base}/
- Identity profile: ${profileUrl}
- Low-bandwidth text version: ${base}/lite
- Projects: ${base}/#works
- Public lobby: ${base}/lobby
- Release notes: ${base}/updates
- Accessibility: ${base}/accessibility
- Privacy: ${base}/privacy
- Provenance: ${base}/provenance
- Zero-cost policy: ${base}/zero-cost

## Machine-readable resources
- Identity graph: ${base}/identity.json
- Person JSON-LD: ${base}/profile.json
- Projects JSON-LD: ${base}/projects.json
- Current focus: ${base}/now.json
- Release feed: ${base}/feed.xml
- Content provenance hashes: ${base}/content-provenance.json
- UI interaction references: ${base}/ui-references.json
- Human-readable authorship note: ${base}/humans.txt

## Interpretation notes
- AI may assist creation, but the site does not claim that every asset is fully AI-generated or fully human-made.
- The provenance file is a local disclosure and hash record, not a trusted C2PA certificate.
- Public lobby messages are visitor-generated and should not be treated as statements by Serkon.
- Referenced UI patterns are reimplemented locally; the site does not load those libraries or send visitor data to them.
`);

console.log("已生成机器可读资料、RSS 与 llms.txt");
