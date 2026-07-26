import CreatorDock from "./CreatorDock";
import FutureInteractions from "./FutureInteractions";
import ShareButton from "./ShareButton";
import CopyContact from "./CopyContact";
import ArchiveOffice from "./ArchiveOffice";
import Image from "next/image";
import EmailAction from "./EmailAction";
import MobileMenu from "./MobileMenu";
import releases from "../data/releases.json";
import profile from "../data/machine-profile.json";

const canonicalBase = profile.person.homeUrl.replace(/\/$/, "");
const personId = `${canonicalBase}/serkon#person`;
const homepageIdentityGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${canonicalBase}/#profile-page`,
      url: `${canonicalBase}/`,
      name: "Serkon 侯世康个人主页",
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
      mainEntityOfPage: { "@id": `${canonicalBase}/#profile-page` },
      subjectOf: profile.projects.map((project) => ({
        "@type": "CreativeWork",
        name: project.name,
        url: project.url,
      })),
    },
  ],
};

const interests = [
  {
    number: "01",
    title: "玩 AI",
    subtitle: "AI EXPLORATION",
    copy: "喜欢尝试新的 AI 工具，把脑海里的点子快速变成图像、内容和真正能使用的作品。",
    accent: "blue",
    href: "#ai-station",
    cta: "打开个人 AI 创作站",
  },
  {
    number: "02",
    title: "王者荣耀",
    subtitle: "MOBILE GAMING",
    copy: "享受团队协作、临场判断和每一局不断变化的节奏，也把它当作放松的一种方式。",
    accent: "yellow",
    href: "https://pvp.qq.com/zlkdatasys/mct/d/play.shtml?browser=auto",
    external: true,
    cta: "尝试启动王者荣耀",
  },
  {
    number: "03",
    title: "扑克牌",
    subtitle: "CARD GAMES",
    copy: "喜欢牌局里的观察、概率与默契。对我来说，玩牌也是朋友之间很自然的社交时刻。",
    accent: "coral",
    href: "/games/doudizhu",
    cta: "进入斗地主牌桌",
  },
  {
    number: "04",
    title: "影像记录",
    subtitle: "PHOTO & MOMENTS",
    copy: "喜欢用照片和短视频留住有氛围的瞬间，也在慢慢找到更适合自己的表达方式。",
    accent: "mint",
    href: "/life",
    cta: "打开我的生活相册",
  },
];

const works = [
  {
    number: "01",
    type: "PRODUCT SYSTEM",
    title: "强鹰彩色胶·产品视觉系统",
    copy: "把 126 色、两类产品规格、施工场景与核心卖点组织成一套可持续扩展的网站与销售视觉。",
    tags: ["产品网站", "信息设计", "视觉系统"],
    badge: "真实商业项目",
    brief: "让访客在很短时间内理解产品是什么、颜色有多少、适合哪些场景，并为后续销售沟通提供统一素材。",
    process: ["梳理硬支与软支产品信息", "建立色彩、场景与规格层级", "把主视觉、详情与网站整合上线"],
    result: "已形成可公开访问的完整产品网站，主视觉、规格信息与六项卖点使用同一套表达逻辑",
    phase: "已上线 01",
    signature: "把复杂产品讲清楚",
    deliverables: ["产品网站", "视觉系统", "销售素材"],
    className: "work-blue",
    image: "/work-color-system.webp",
    imageAlt: "强鹰彩色胶产品色彩主视觉，展示多色胶条、产品包装与适用范围",
    href: "https://qiangying-color-sealant-cn.pages.dev/",
  },
  {
    number: "02",
    type: "AI FILM WORKFLOW",
    title: "伦敦 Vlog·AI 影像实验",
    copy: "从素材规划、镜头生成到超清导出，尝试把 AI 图像组织成一条有场景逻辑的旅行短片工作流。",
    tags: ["镜头策划", "AI 影像", "后期导出"],
    badge: "创作过程实录",
    brief: "不是只生成一张好看的图，而是验证人物、地标、食物与街景能否被组织成连续的旅行叙事。",
    process: ["规划伦敦地标与人物镜头", "生成并筛选可衔接素材", "统一画面并完成视频导出"],
    result: "保留了从 AI 素材工作区到视频导出设置的完整过程证据，形成可继续迭代的影像流程",
    phase: "实验完成 02",
    signature: "从单张图走向镜头叙事",
    deliverables: ["镜头板", "视觉素材", "视频导出"],
    className: "work-red",
    image: "/archive/london-ai-workspace.webp",
    imageAlt: "伦敦 Vlog 的 AI 影像素材工作区，展示地标、人物和食物镜头",
    href: "/life",
  },
  {
    number: "03",
    type: "ORIGINAL MUSIC",
    title: "《创世纪》·原创音乐发布",
    copy: "把关于宇宙、回声与创造的文字写成原创歌曲，并完成公开发布，让个人网站拥有自己的声音。",
    tags: ["原创音乐", "歌词表达", "公开发布"],
    badge: "真实公开成果",
    brief: "音乐不是装饰，而是个人表达的一部分；从主题、歌词到发布页面都围绕同一套创作世界观。",
    process: ["确定宇宙与创造主题", "完成歌词与声音表达", "发布并接入网站互动档案"],
    result: "《创世纪》已在网易云音乐公开发布，并作为站内可选音乐与档案线索使用",
    phase: "已发布 03",
    signature: "让网站拥有自己的声音",
    deliverables: ["原创歌曲", "发布页面", "站内播放器"],
    className: "work-yellow",
    image: "/archive/genesis-music-release.webp",
    imageAlt: "原创歌曲《创世纪》在网易云音乐的公开发布页面",
    href: "/life",
  },
  {
    number: "04",
    type: "PERSONAL PROJECT",
    title: "Serkon 个人主页",
    copy: "从第一版数字名片发展为包含作品、公共大厅、生活影像、动态叙事与机器可读资料的长期个人产品。",
    tags: ["产品设计", "网页工程", "持续迭代"],
    badge: "持续更新的个人产品",
    brief: "不把网站当一次性展示页，而是把内容、交互、数据、安全、无障碍与版本记录作为同一件长期产品来维护。",
    process: ["从个人资料建立第一版", "按真实反馈补齐功能与安全", "持续重整结构并公开版本记录"],
    result: "已形成可持续更新、可双语阅读、可互动并拥有公开更新档案的个人数字空间",
    phase: "持续上线 04",
    signature: "第一版之后继续生长",
    deliverables: ["体验设计", "前后端功能", "版本体系"],
    className: "work-mint",
    image: "/archive/serkon-first-build.webp",
    imageAlt: "Serkon 个人网站第一版在 ChatGPT Sites 中完成时的工作记录",
    href: "/",
  },
];

const nowItems = [
  { code: "01", title: "第 32 版身份实体升级", copy: "以公开身份页、结构化数据和机器资料明确说明 Serkon 与侯世康是同一人的两个公开名称。" },
  { code: "02", title: "微信年轮", copy: "继续完善面向完整聊天记录的本地分析与双系统使用体验，安全边界优先于功能数量。" },
  { code: "03", title: "强鹰彩色胶", copy: "继续整理产品视觉、规格信息与销售场景，让网站真正服务于理解和沟通。" },
];

export default function Home() {
  const latestRelease = releases.at(-1)!;
  const latestReleaseDate = latestRelease.date.replaceAll("-", ".");
  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageIdentityGraph).replaceAll("<", "\\u003c") }}
      />
      <CreatorDock />
      <FutureInteractions />
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="topbar" id="home">
        <a className="brand" href="#home" aria-label="返回首页">
          <span className="brand-en">Serkon</span>
          <span className="brand-cn">侯世康</span>
          <span className="brand-dot" aria-hidden="true" />
        </a>

        <nav className="nav" aria-label="主导航">
          <a href="#about">关于我</a>
          <a href="#interests">兴趣爱好</a>
          <a href="#works">作品案例</a>
          <a href="/play">互动档案</a>
          <a href="/cosmos">动态思想档案</a>
          <a href="/lobby">公共大厅</a>
        </nav>

        <div className="nav-actions"><ShareButton /><EmailAction variant="nav" /></div>
        <MobileMenu />
      </header>

      <ArchiveOffice />

      <main id="main-content">
        <section className="hero section-pad" aria-labelledby="hero-title" data-signal-surface>
          <div className="hero-copy">
            <div className="section-index reveal-one">
              <span>01</span>
              <i aria-hidden="true" />
              <small>PERSONAL FILE / 2026</small>
            </div>

            <p className="hello reveal-two">你好，我是</p>
            <h1 id="hero-title" className="hero-title reveal-two">
              <span data-fluid-text>Serkon</span>
              <strong data-fluid-text>侯世康</strong>
            </h1>
            <p className="hero-lead reveal-three">
              大一在读，正在探索 AI 与创作的更多可能。
              <br />
              记录成长，也把想法变成作品。
            </p>

            <div className="hero-actions reveal-three">
              <a className="button button-primary" href="#about" data-magnetic data-signal-action>
                认识我 <span aria-hidden="true">→</span>
              </a>
              <a className="button button-text" href="#works" data-magnetic>
                查看作品 <span aria-hidden="true">↘</span>
              </a>
            </div>

            <div className="mini-note reveal-three" aria-label="当前状态">
              <span className="mini-note-star" aria-hidden="true">✦</span>
              <p>
                <strong>持续成长中</strong>
                <small>CURIOUS · CREATIVE · OPEN</small>
              </p>
            </div>
          </div>

          <div className="portrait-stage reveal-photo">
            <div className="tech-frame" aria-hidden="true" />
            <span className="tape tape-top" aria-hidden="true" />
            <span className="scribble" aria-hidden="true">SERKON / 001</span>
            <figure className="photo-paper">
              <div className="photo-wrap" data-photo-scan>
                <Image
                  src="/serkon-hero.jpg"
                  alt="身穿灰色西装、面带微笑的 Serkon 侯世康"
                  width="720"
                  height="1280"
                  sizes="(max-width: 760px) 86vw, 42vw"
                  priority
                  unoptimized
                />
              </div>
              <figcaption>
                <span>PROFILE PHOTO</span>
                <small>认真生活，保持好奇。</small>
              </figcaption>
            </figure>
            <span className="sticker sticker-age" aria-label="大一在读">大一</span>
          </div>

          <div className="fact-rail">
            <article>
              <span>01</span>
              <p><small>当前年级</small><strong>大一 · FRESHMAN</strong></p>
            </article>
            <article>
              <span>02</span>
              <p><small>LOCATION</small><strong>CHINA · BEIJING · CHAOYANG</strong></p>
            </article>
            <article>
              <span>03</span>
              <p><small>兴趣关键词</small><strong>AI · 游戏 · 牌局 · 影像</strong></p>
            </article>
            <article>
              <span>04</span>
              <p><small>合作与交流</small><strong><a href="#contact">保持联系 ↗</a></strong></p>
            </article>
          </div>
        </section>

        <section className="about section-pad" id="about" aria-labelledby="about-title">
          <div className="section-heading" data-motion-reveal>
            <div className="section-index">
              <span>02</span><i aria-hidden="true" /><small>ABOUT ME</small>
            </div>
            <h2 id="about-title">关于我</h2>
          </div>

          <div className="about-grid" data-motion-reveal>
            <p className="about-quote">
              “我想很早就去尝试<span data-fluid-text>新的技术</span>，更在意前所未见的想法；先做出第一版，再一路把它变得更好。”
            </p>
            <div className="about-copy">
              <p>
                我是 Serkon 侯世康，目前是一名大一学生。现在的我正处在不断认识世界、也不断认识自己的阶段。
              </p>
              <p>
                我会用 AI 做图、做内容和个人网页，把模糊的想法慢慢打磨成看得见、能分享的作品。闲下来时，我喜欢打王者荣耀、和朋友玩扑克牌，也喜欢用照片和短视频记录有氛围的瞬间。
              </p>
              <p>
                对我来说，AI 是一种放大想象力的方式。我喜欢研究不同模型和表达方法，也愿意不断试错。我的做事方式是先让想法拥有第一版，再边学边改；我希望多年以后，别人能从这些作品里看到一个很早就敢于尝试新技术的人。
              </p>
            </div>
            <aside className="about-card">
              <span className="about-card-mark" aria-hidden="true">✦</span>
              <small>MY CURRENT MODE</small>
              <strong>保持好奇，<br />继续创造。</strong>
              <span className="about-card-line" aria-hidden="true" />
              <div className="about-card-commission" id="commissions">
                <small>OPEN FOR COMMISSIONS</small>
                <p>
                  <b>接受私人定制<br />和商用约稿</b>
                  <span>把你的天马行空告诉我，<br />我用 AI 帮你实现。按需求单独报价，先确认档期再开始。</span>
                </p>
                <a href="#contact">聊聊你的想法 <span aria-hidden="true">↗</span></a>
              </div>
            </aside>
          </div>
        </section>

        <section className="now-board section-pad" aria-labelledby="now-title" data-signal-surface>
          <div className="now-board-heading" data-motion-reveal>
            <div>
              <small>NOW / {latestReleaseDate}</small>
              <h2 id="now-title">此刻正在推进</h2>
            </div>
            <p>不是模糊的“持续更新”，而是现在真正投入时间的三件事。</p>
          </div>
          <div className="now-board-grid">
            {nowItems.map((item) => (
              <article key={item.code} data-motion-reveal>
                <span>{item.code}</span>
                <div><strong>{item.title}</strong><p>{item.copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="interests section-pad" id="interests" aria-labelledby="interests-title" data-signal-surface>
          <div className="section-heading heading-split" data-motion-reveal>
            <div>
              <div className="section-index light-index">
                <span>03</span><i aria-hidden="true" /><small>WHAT I LIKE</small>
              </div>
              <h2 id="interests-title">兴趣爱好</h2>
            </div>
            <p>兴趣不只是消遣，它们也在悄悄塑造我的观察方式。</p>
          </div>

          <div className="interest-grid">
            {interests.map((item) => {
              const cardContent = (
                <>
                <div className="interest-top">
                  <span>{item.number}</span>
                  <small>{item.subtitle}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <small className="interest-cta">{item.cta}</small>
                <span className="interest-arrow" aria-hidden="true">↗</span>
                </>
              );

              return item.href ? (
                <a className={`interest-card ${item.accent}`} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined} key={item.number} data-spotlight data-signal-border data-motion-reveal>
                  {cardContent}
                </a>
              ) : (
                <article className={`interest-card ${item.accent}`} key={item.number} data-spotlight data-signal-border data-motion-reveal>
                  {cardContent}
                </article>
              );
            })}
          </div>
        </section>

        <section className="works section-pad" id="works" aria-labelledby="works-title">
          <div className="section-heading heading-split" data-motion-reveal>
            <div>
              <div className="section-index">
                <span>04</span><i aria-hidden="true" /><small>SELECTED WORK</small>
              </div>
              <h2 id="works-title">作品案例</h2>
            </div>
            <p>不再重复陈列同一个项目：这里选择四条不同方向，并同时公开问题、我的角色、过程与当前结果。</p>
          </div>

          <div className="work-grid">
            {works.map((work) => (
              <details className={`work-card ${work.className}`} key={work.number} data-tilt data-spotlight data-signal-border data-motion-reveal>
                <summary aria-label={`展开查看${work.title}项目详情`}>
                  <span className="work-summary">
                    <span className="work-visual">
                      <Image src={work.image} alt={work.imageAlt} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" unoptimized />
                      <span className="work-number">{work.number}</span>
                      <strong>{work.type}</strong>
                      <em>{work.signature}</em>
                    </span>
                    <span className="work-body">
                      <small className="project-label">{work.badge}</small>
                      <span className="work-title">{work.title}</span>
                      <span className="work-copy">{work.copy}</span>
                      <span className="work-meta"><i>{work.phase}</i><i>{work.deliverables.length} 项输出</i></span>
                      <span className="tags">
                        {work.tags.map((tag) => <span key={tag}>{tag}</span>)}
                      </span>
                      <span className="work-cta">查看项目详情 <b aria-hidden="true">＋</b></span>
                    </span>
                  </span>
                </summary>
                <div className="work-detail">
                  <div>
                    <small>PROJECT BRIEF</small>
                    <p>{work.brief}</p>
                  </div>
                  <div>
                    <small>CREATIVE PROCESS</small>
                    <ol>
                      {work.process.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </div>
                  <div className="work-result">
                    <small>CURRENT RESULT</small>
                    <strong>{work.result}</strong>
                  </div>
                  <div className="work-deliverables"><small>DELIVERABLES</small><p>{work.deliverables.map((item) => <span key={item}>{item}</span>)}</p></div>
                  <a className="work-live-link" href={work.href} target={work.href.startsWith("http") ? "_blank" : undefined} rel={work.href.startsWith("http") ? "noopener noreferrer" : undefined}>查看真实成果 <span aria-hidden="true">↗</span></a>
                </div>
              </details>
            ))}
          </div>
          <div className="product-proof-row" data-motion-reveal>
            <div><small>MORE LIVE PRODUCTS</small><strong>另外两项可直接使用的产品</strong><p>它们不冒充视觉案例，但同样是已经做出来、可以打开验证的真实成果。</p></div>
            <a href="https://miaobi-appl-serkon.pages.dev/" target="_blank" rel="noopener noreferrer"><small>AI WRITING</small><strong>妙笔 AI 全能文案助手</strong><span>打开产品 ↗</span></a>
            <a href="https://github.com/jackmac566/wechat-yearbook" target="_blank" rel="noopener noreferrer"><small>LOCAL DATA TOOL</small><strong>微信年轮</strong><span>查看开源项目 ↗</span></a>
          </div>
        </section>

        <section className="play-invite section-pad" id="play" aria-labelledby="play-invite-title" data-signal-surface>
          <div data-motion-reveal>
            <div className="section-index light-index"><span>05</span><i aria-hidden="true" /><small>PLAYABLE ARCHIVE</small></div>
            <h2 id="play-invite-title">把兴趣变成，<br /><span>可以亲自试的线索。</span></h2>
          </div>
          <div className="play-invite-copy" data-motion-reveal>
            <p>主题切换、100 张灵感卡、记忆翻牌、灵感球和五种个人线索玩法已移入独立互动档案。首页只保留说明，想玩时再进入，不打断作品阅读。</p>
            <div className="play-invite-steps" aria-label="互动档案玩法说明">
              <span><b>1</b>任选一个玩法</span><span><b>2</b>按照当前提示操作</span><span><b>3</b>完成后收下档案线索</span>
            </div>
            <a href="/play" data-magnetic data-signal-action>进入完整互动档案 <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="cosmos-invite section-pad" id="cosmos-entry" aria-labelledby="cosmos-invite-title" data-signal-surface>
          <div>
            <div className="section-index">
              <span>06</span><i aria-hidden="true" /><small>SERKON MOTION LAB</small>
            </div>
            <p>一段不需要通关的动态思想叙事。</p>
            <h2 id="cosmos-invite-title">把想法变成，<br /><span>会运动的画面。</span></h2>
          </div>
          <div className="cosmos-invite-copy">
            <p>五幕滚动镜头连接 20 条站长随笔、个人影像与真实作品。没有任务、积分或排行榜；页面会回应滚动、指针、键盘与触碰。</p>
            <a href="/cosmos">进入动态思想档案 <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="lobby-invite section-pad" id="lobby-entry" aria-labelledby="lobby-invite-title" data-signal-surface>
          <div className="lobby-invite-copy" data-motion-reveal>
            <div className="section-index lobby-invite-index">
              <span>07</span><i aria-hidden="true" /><small>WORLD CHANNEL</small>
            </div>
            <p>有人路过，这里就会多一个真实的声音。</p>
            <h2 id="lobby-invite-title">进入全站共享的<br /><span>公共大厅</span></h2>
            <p className="lobby-invite-lead">不用实名，不制造虚假的在线人数。所有访客看到同一条频道；留言一旦公开，访客本人不能随手撤回，站长只为隐私、安全与公共规则进行必要处理。</p>
            <a href="/lobby" data-magnetic data-signal-action>进入世界频道 <span aria-hidden="true">↗</span></a>
          </div>
          <aside className="lobby-invite-screen" aria-label="公共大厅规则预览" data-spotlight data-signal-border data-motion-reveal>
            <header><span aria-hidden="true" />WORLD / 001 <b>共享频道</b></header>
            <div><small>系统公告</small><p>欢迎来到 Serkon 公共大厅。这里也许安静，但不是一间空房。</p></div>
            <div><small>访客-CN0001</small><p>你好，第一次路过这里。</p></div>
            <footer>公开可见 · 发布即锁定 · 可举报</footer>
          </aside>
        </section>

        <section className="capability-index section-pad" id="open-layer" aria-labelledby="capability-index-title" data-signal-surface>
          <div className="capability-index-head" data-motion-reveal>
            <div className="section-index">
              <span>08</span><i aria-hidden="true" /><small>OPEN SYSTEM LAYER</small>
            </div>
            <div>
              <p>这些不是藏在代码里的概念，而是已经可以打开使用的公开入口。</p>
              <h2 id="capability-index-title">网站的另一层，<br /><span>已经上线。</span></h2>
            </div>
          </div>
          <a className="system-gateway" href="/system" data-spotlight data-signal-border data-motion-reveal>
            <span><small>ACCESSIBILITY · LOW BANDWIDTH · MACHINE LAYER · PROVENANCE · ZERO COST · RELEASES</small><strong>六项能力，收进一个清晰入口。</strong></span>
            <p>首页只回答“为什么值得了解”；完整说明、状态与公开文件集中到系统层，减少重复浏览。</p>
            <b>打开网站系统层 ↗</b>
          </a>
        </section>

        <section className="contact section-pad" id="contact" aria-labelledby="contact-title">
          <div className="contact-main" data-motion-reveal>
            <div className="section-index contact-index">
              <span>09</span><i aria-hidden="true" /><small>LET&apos;S CONNECT</small>
            </div>
            <p>有想法，欢迎来找我。</p>
            <h2 id="contact-title">一起聊聊<span>AI、创意</span><br />或者下一件作品。</h2>
            <div className="contact-services" aria-label="可约稿方向">
              <span>AI 视觉</span><span>产品宣传</span><span>个人网站</span><span>定制内容</span>
            </div>
            <p className="contact-process"><strong>首选联系：Gmail。</strong> 约稿按用途、数量、交付和授权范围单独报价；先确认档期，再沟通尺寸、修改范围与交付内容。QQ 邮箱仅作备用。</p>
            <EmailAction variant="main" subject="约稿或合作咨询｜来自个人网站" />
          </div>
          <aside className="contact-note" data-motion-reveal data-signal-border>
            <span className="contact-note-tape" aria-hidden="true" />
            <small>CONTACT / 找到我</small>
            <div className="contact-grid">
              <EmailAction variant="card" subject="约稿或合作咨询｜来自个人网站" />
              <CopyContact label="WECHAT" value="ETskling1X16" />
              <CopyContact label="DOUYIN" value="SKGing1973" />
              <a href="mailto:1052709298@qq.com"><b>QQ 邮箱</b><span>1052709298<br />@qq.com ↗</span></a>
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer section-pad">
        <a className="brand footer-brand" href="#home">
          <span className="brand-en">Serkon</span>
          <span className="brand-cn">侯世康</span>
        </a>
        <p>个人主页 · 第 {latestRelease.edition} 版 · 持续更新中</p>
        <a className="footer-top" href="#home">回到顶部 ↑</a>
        <div className="footer-legal">
          <span>© 2026 Serkon 侯世康 · 个人作品与创作交流站点</span>
          <span>部分互动内容由 AI 辅助生成；访客上传影像将公开展示，请确保拥有授权。不适或侵权内容可联系删除；约稿商用范围以双方确认内容为准。</span>
          <a href="/privacy">隐私与公共上传规则</a>
          <a href="/lobby">公共大厅</a>
          <a href="/accessibility">无障碍说明</a>
          <a href="/lite">纯文字版</a>
          <a href="/provenance">内容来源</a>
          <a href="/zero-cost">0 元运营原则</a>
          <a href="/serkon">身份说明：Serkon = 侯世康</a>
          <a className="footer-release-link" href="/updates">版本记录：第 {latestRelease.edition} 版 · {latestReleaseDate}</a>
          <a href="mailto:1052709298@qq.com">备用联系：1052709298@qq.com</a>
        </div>
      </footer>
    </div>
  );
}
