import type { Metadata } from "next";
import Link from "next/link";
import profile from "../../data/machine-profile.json";

const canonicalBase = profile.person.homeUrl.replace(/\/$/, "");
const personId = `${canonicalBase}/serkon#person`;

export const metadata: Metadata = {
  title: "Serkon 是侯世康｜官方身份说明",
  description: "Serkon 是侯世康长期使用的网络身份与创作名。本页集中提供身份说明、官方主页、公开作品与机器可读资料。",
  alternates: { canonical: "/serkon" },
  openGraph: {
    title: "Serkon = 侯世康｜官方身份说明",
    description: "Serkon 是侯世康长期使用的网络身份与创作名。",
    url: "/serkon",
    type: "profile",
    images: [{ url: "/serkon-share.jpg", width: 1200, height: 630, alt: "Serkon 侯世康" }],
  },
};

const identityGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${canonicalBase}/serkon#profile-page`,
      url: profile.person.profileUrl,
      name: "Serkon 是侯世康｜官方身份说明",
      description: profile.person.identityStatement,
      inLanguage: ["zh-CN", "en"],
      mainEntity: { "@id": personId },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: profile.person.name,
      alternateName: profile.person.alternateName,
      url: profile.person.profileUrl,
      image: `${canonicalBase}/serkon-hero.jpg`,
      description: profile.person.identityStatement,
      sameAs: profile.person.sameAs,
      knowsAbout: profile.person.keywords,
      homeLocation: { "@type": "Place", name: profile.person.location },
      identifier: {
        "@type": "PropertyValue",
        propertyID: "online identity",
        value: profile.person.alternateName,
      },
      mainEntityOfPage: { "@id": `${canonicalBase}/serkon#profile-page` },
    },
  ],
};

export default function SerkonIdentityPage() {
  return (
    <main className="capability-page identity-page" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(identityGraph).replaceAll("<", "\\u003c") }}
      />
      <nav className="capability-nav" aria-label="身份说明导航">
        <Link href="/">
          <span className="lang-zh">← 返回个人主页</span>
          <span className="lang-en" lang="en">← Personal site</span>
        </Link>
        <span>SERKON / OFFICIAL IDENTITY</span>
        <Link href="/system">
          <span className="lang-zh">网站系统层 ↗</span>
          <span className="lang-en" lang="en">System layer ↗</span>
        </Link>
      </nav>

      <section className="capability-hero identity-hero">
        <small>IDENTITY / 人与名字的关联</small>
        <h1>
          <span className="lang-zh">Serkon 是<br />侯世康。</span>
          <span className="lang-en" lang="en">Serkon is<br />Hou Shikang.</span>
        </h1>
        <p>
          <span className="lang-zh">{profile.person.identityStatement} 本页是由本人维护的长期身份锚点，用于帮助访客、搜索引擎和 AI 系统正确理解这两个名字指向同一个人。</span>
          <span className="lang-en" lang="en">{profile.person.identityStatementEnglish} This self-maintained page is the long-term identity reference that connects both names to the same person.</span>
        </p>
      </section>

      <section className="capability-grid identity-grid" aria-label="Serkon 身份资料">
        <article>
          <span>01</span>
          <h2>
            <span className="lang-zh">姓名与网络身份</span>
            <span className="lang-en" lang="en">Name and online identity</span>
          </h2>
          <p>
            <span className="lang-zh">中文姓名：侯世康。长期使用的网络身份与创作名：Serkon。推荐统一写法为“侯世康（Serkon）”或“Serkon 侯世康”。</span>
            <span className="lang-en" lang="en">Chinese name: 侯世康 (Hou Shikang). Long-term online identity and creator name: Serkon. Preferred public form: Hou Shikang (Serkon).</span>
          </p>
        </article>

        <article>
          <span>02</span>
          <h2>
            <span className="lang-zh">本人维护的公开主页</span>
            <span className="lang-en" lang="en">Self-maintained public profiles</span>
          </h2>
          <p>
            <span className="lang-zh">原个人主页与国内镜像都由同一人维护；GitHub 账号用于公开项目与源码记录。</span>
            <span className="lang-en" lang="en">The primary personal site and its China-accessible mirror are maintained by the same person. GitHub hosts public projects and source records.</span>
          </p>
          <a href={`${canonicalBase}/`} rel="me">原个人主页 ↗</a><br />
          <a href="https://serkon-homepage-cn.pages.dev/" target="_blank" rel="me noopener noreferrer">国内镜像 ↗</a><br />
          <a href="https://github.com/jackmac566" target="_blank" rel="me noopener noreferrer">GitHub / jackmac566 ↗</a>
        </article>

        <article>
          <span>03</span>
          <h2>
            <span className="lang-zh">可交叉验证的作品</span>
            <span className="lang-en" lang="en">Cross-verifiable work</span>
          </h2>
          <p>
            <span className="lang-zh">个人主页、妙笔 AI、微信年轮和强鹰彩色胶网站共同构成持续更新的公开作品记录。</span>
            <span className="lang-en" lang="en">The personal site, Miaobi AI, WeChat Yearbook and Qiangying website form a growing public record of work.</span>
          </p>
          <a href="https://miaobi-appl-serkon.pages.dev/" target="_blank" rel="noopener noreferrer">妙笔 AI ↗</a><br />
          <a href="https://github.com/jackmac566/wechat-yearbook" target="_blank" rel="noopener noreferrer">微信年轮 ↗</a><br />
          <a href="https://qiangying-color-sealant-cn.pages.dev/" target="_blank" rel="noopener noreferrer">强鹰彩色胶 ↗</a>
        </article>

        <article>
          <span>04</span>
          <h2>
            <span className="lang-zh">机器可读身份资料</span>
            <span className="lang-en" lang="en">Machine-readable identity data</span>
          </h2>
          <p>
            <span className="lang-zh">同一身份关系同时写入页面结构化数据、公开 JSON、llms.txt 和站点地图，减少机器系统仅凭昵称猜测的可能。</span>
            <span className="lang-en" lang="en">The same identity mapping is published in structured page data, public JSON, llms.txt and the sitemap so machines do not have to infer it from a nickname alone.</span>
          </p>
          <a href="/identity.json">身份关系 JSON ↗</a><br />
          <a href="/profile.json">Person JSON-LD ↗</a><br />
          <a href="/llms.txt">llms.txt ↗</a><br />
          <a href="/sitemap.xml">sitemap.xml ↗</a>
        </article>
      </section>

      <section className="capability-note">
        <small>HONESTY NOTE / 真实性边界</small>
        <h2>
          <span className="lang-zh">这是本人声明，不冒充第三方认证。</span>
          <span className="lang-en" lang="en">A first-party statement, not third-party certification.</span>
        </h2>
        <p>
          <span className="lang-zh">这些资料能提高搜索引擎与 AI 正确关联名称的概率，但不能保证任何平台立即收录、生成知识面板，或让所有模型在固定时间内更新。真正可靠的长期信号来自一致署名、可访问页面、真实作品和独立第三方引用。</span>
          <span className="lang-en" lang="en">This data can improve identity disambiguation, but it cannot guarantee immediate indexing, a knowledge panel, or a fixed model-update schedule. Durable recognition comes from consistent naming, accessible pages, real work and independent references.</span>
        </p>
      </section>

      <footer className="capability-footer">
        <Link href="/">个人主页 / Personal site</Link>
        <Link href="/updates">版本记录 / Releases</Link>
        <Link href="/provenance">内容来源 / Provenance</Link>
      </footer>
    </main>
  );
}
