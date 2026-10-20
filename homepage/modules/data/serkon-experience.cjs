
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spaces = exports.nowItems = exports.archiveItems = exports.projects = exports.CONTACT = exports.HOME_URL = exports.text = void 0;
exports.resolveHref = resolveHref;
exports.externalProps = externalProps;
const text = (zh, en) => ({ zh, en });
exports.text = text;
exports.HOME_URL = 'https://serkon-homepage-cn.pages.dev';
exports.CONTACT = { email: 'shikanghou4@gmail.com', wechat: 'ETskling1X16', douyin: 'SKGing1973', backup: '1052709298@qq.com' };
exports.projects = [
    { id: 'color', number: '01', category: 'product', label: 'PRODUCT & VISUAL SYSTEM',
        title: (0, exports.text)('强鹰彩色胶', 'Qiangying colour sealant'), short: (0, exports.text)('把复杂产品，讲清楚。', 'Making a complex product clear.'),
        copy: (0, exports.text)('把 126 色、两类产品规格、施工场景与核心卖点，组织成一套统一的产品视觉系统。', '126 colours, two product formats, real use cases and a coherent visual system.'),
        brief: (0, exports.text)('让访客在很短时间内理解产品是什么、颜色有多少、适合哪些场景，并为后续销售沟通提供统一素材。', 'Help visitors understand the product, its colours and applications, with consistent material for sales conversations.'),
        process: [(0, exports.text)('梳理硬支与软支产品信息', 'Organise rigid- and soft-pack product information'), (0, exports.text)('建立色彩、场景与规格层级', 'Structure colours, applications and specifications'), (0, exports.text)('把主视觉、详情与网站整合上线', 'Bring the visual identity, details and website together')],
        result: (0, exports.text)('已形成可公开访问的完整产品网站，主视觉、规格信息与六项卖点使用同一套表达逻辑。', 'A publicly accessible product website with a shared visual language across imagery, specifications and six selling points.'),
        tags: [(0, exports.text)('产品网站', 'Product website'), (0, exports.text)('信息设计', 'Information design'), (0, exports.text)('视觉系统', 'Visual system')], status: (0, exports.text)('已上线 · 商业项目', 'LIVE · COMMERCIAL PROJECT'),
        href: 'https://qiangying-color-sealant-cn.pages.dev/', image: '/work-color-system.webp', tone: 'color' },
    { id: 'london', number: '02', category: 'film', label: 'AI FILM EXPERIMENT',
        title: (0, exports.text)('伦敦 Vlog', 'London, in frames'), short: (0, exports.text)('从单张图，走向镜头叙事。', 'From a single image to a story.'),
        copy: (0, exports.text)('从素材规划、镜头生成到超清导出，探索 AI 图像如何组成一段连贯的旅行叙事。', 'From shot planning and image generation to export: an experiment in coherent AI travel storytelling.'),
        brief: (0, exports.text)('不是只生成一张好看的图，而是验证人物、地标、食物与街景能否被组织成连续的旅行叙事。', 'Explore whether people, landmarks, food and street scenes can form a continuous travel narrative.'),
        process: [(0, exports.text)('规划伦敦地标与人物镜头', 'Plan landmarks and character shots'), (0, exports.text)('生成并筛选可衔接素材', 'Generate and select connected visual material'), (0, exports.text)('统一画面并完成视频导出', 'Unify the images and export the video')],
        result: (0, exports.text)('保留了从 AI 素材工作区到视频导出设置的过程证据，形成可继续迭代的影像流程。', 'The workspace and export settings document a repeatable, evolving image-to-film workflow.'),
        tags: [(0, exports.text)('镜头策划', 'Shot planning'), (0, exports.text)('AI 影像', 'AI imagery'), (0, exports.text)('后期导出', 'Post-production')], status: (0, exports.text)('实验完成 · 过程实录', 'EXPERIMENT · DOCUMENTED PROCESS'),
        href: '/life', image: '/archive/london-ai-workspace.webp', tone: 'london' },
    { id: 'genesis', number: '03', category: 'music', label: 'ORIGINAL MUSIC',
        title: (0, exports.text)('创世纪', 'Genesis'), short: (0, exports.text)('让网站，拥有自己的声音。', 'Giving this space its own voice.'),
        copy: (0, exports.text)('把宇宙、回声与创造写成原创歌曲。音乐不只是装饰，也是个人表达的一部分。', 'An original song about the universe, echoes and creation. Music as personal expression, not decoration.'),
        brief: (0, exports.text)('从主题、歌词到公开发布，都围绕同一套创作世界观，让个人网站拥有自己的声音。', 'Connect the theme, lyrics and public release through one creative world.'),
        process: [(0, exports.text)('确定宇宙与创造主题', 'Define a theme of cosmos and creation'), (0, exports.text)('完成歌词与声音表达', 'Develop lyrics and musical expression'), (0, exports.text)('发布并接入网站互动档案', 'Publish and connect it to the website archive')],
        result: (0, exports.text)('《创世纪》已在网易云音乐公开发布，并作为站内可选音乐与档案线索使用。', 'Genesis is published on NetEase Cloud Music and referenced in the site’s optional music and interactive archive.'),
        tags: [(0, exports.text)('原创音乐', 'Original music'), (0, exports.text)('歌词表达', 'Lyrics'), (0, exports.text)('公开发布', 'Public release')], status: (0, exports.text)('已发布 · 原创作品', 'RELEASED · ORIGINAL WORK'),
        href: 'https://music.163.com/#/song?id=2753362002', image: '/archive/genesis-music-release.webp', tone: 'genesis' },
    { id: 'website', number: '04', category: 'web', label: 'AN EVOLVING PERSONAL PROJECT',
        title: (0, exports.text)('Serkon 个人主页', 'A personal space, in progress'), short: (0, exports.text)('第一版之后，继续生长。', 'Keep growing beyond version one.'),
        copy: (0, exports.text)('从一张数字名片，到作品、公共大厅、生活影像与互动档案。这是一个持续生长的个人产品。', 'From a digital calling card to work, public conversation, images and interactive archives: a personal product in progress.'),
        brief: (0, exports.text)('把内容、交互、数据、安全、无障碍与版本记录，当作同一件长期产品来维护。', 'Maintain content, interactions, data, safety, accessibility and release history as one long-term product.'),
        process: [(0, exports.text)('从个人资料建立第一版', 'Build the first version around personal information'), (0, exports.text)('按真实反馈补齐功能与安全', 'Respond to feedback on function and safety'), (0, exports.text)('持续重整结构并公开版本记录', 'Refine the structure and publish release notes')],
        result: (0, exports.text)('已形成可双语阅读、可互动并拥有公开更新档案的个人数字空间。', 'A bilingual, interactive personal space with a public history of updates.'),
        tags: [(0, exports.text)('产品设计', 'Product design'), (0, exports.text)('网页工程', 'Web engineering'), (0, exports.text)('持续迭代', 'Iteration')], status: (0, exports.text)('持续更新 · 个人产品', 'ONGOING · PERSONAL PRODUCT'),
        href: '/updates', image: '/archive/serkon-first-build.webp', tone: 'website' },
];
exports.projects.push(
    { id: 'yearbook', number: '05', category: 'product', label: 'LOCAL DATA & PERSONAL HISTORY',
        title: text('微信年轮', 'WeChat Yearbook'), short: text('让个人历史，留在自己的手里。', 'Keeping personal history in your hands.'),
        copy: text('面向完整聊天记录的本地分析工具，持续完善双系统使用体验。', 'A local analysis tool for complete chat histories, with evolving cross-platform usability.'),
        brief: text('整理个人记录，同时把本地数据安全放在功能数量之前。', 'Organise personal records while putting local data safety ahead of feature count.'),
        process: [text('本地记录分析', 'Analyse records locally'), text('持续完善双系统体验', 'Improve cross-platform usability'), text('公开源码协作', 'Collaborate through public source')],
        result: text('持续完善中；可查看公开仓库、使用说明与当前进展。', 'In progress. Explore the public repository, usage notes and current development.'),
        tags: [text('本地工具', 'Local tool'), text('个人历史', 'Personal history')], status: text('持续完善', 'IN PROGRESS'),
        href: 'https://github.com/jackmac566/wechat-yearbook', tone: 'yearbook' },
    { id: 'writing', number: '06', category: 'product', label: 'AI WRITING WORKSPACE',
        title: text('妙笔 AI', 'Miaobi AI'), short: text('从一个念头，到一段表达。', 'From a thought to an expression.'),
        copy: text('让想法找到文字，打开独立的 AI 文案工作台。', 'Help ideas find their words in a dedicated AI writing workspace.'),
        brief: text('把创作从图像延伸到文字表达。', 'Extend creative work from images into written expression.'),
        process: [text('现有网站公开链接的独立产品', 'An independent product linked by the existing site'), text('直接进入工作台体验', 'Open the workspace to explore')],
        result: text('已上线；具体能力与使用条件以产品当前页面为准。', 'Live. Features and usage conditions are described on the product itself.'),
        tags: [text('文案工作台', 'Writing workspace'), text('AI 工具', 'AI tool')], status: text('已上线', 'LIVE'),
        href: 'https://miaobi-appl-serkon.pages.dev/', tone: 'writing' }
);
exports.archiveItems = [
    { id: 'profile', title: (0, exports.text)('认真生活，保持好奇。', 'Stay curious. Live attentively.'), eyebrow: '01 / PERSONAL FILE', description: (0, exports.text)('Serkon 侯世康，大一在读。正在探索 AI 与创作的更多可能，记录成长，也把想法变成作品。', 'Serkon / Hou Shikang is a first-year university student exploring AI and creativity, documenting growth and turning ideas into work.'), cover: 'profile', href: '/serkon', sourceImage: '/serkon-hero.jpg' },
    { id: 'color', title: exports.projects[0].title, eyebrow: '02 / COLOUR SYSTEM', description: exports.projects[0].copy, cover: 'color', href: exports.projects[0].href, sourceImage: exports.projects[0].image },
    { id: 'london', title: exports.projects[1].title, eyebrow: '03 / AI & FILM', description: exports.projects[1].copy, cover: 'london', href: '/life', sourceImage: exports.projects[1].image },
    { id: 'genesis', title: exports.projects[2].title, eyebrow: '04 / SOUND & CREATION', description: exports.projects[2].copy, cover: 'genesis', href: exports.projects[2].href, sourceImage: exports.projects[2].image },
    { id: 'website', title: exports.projects[3].title, eyebrow: '05 / BUILD IN PUBLIC', description: exports.projects[3].copy, cover: 'website', href: '/updates', sourceImage: exports.projects[3].image },
    { id: 'moments', title: (0, exports.text)('收集生活的切片', 'Collecting little moments'), eyebrow: '06 / EVERYDAY ARCHIVE', description: (0, exports.text)('喜欢用照片和短视频留住有氛围的瞬间，也在慢慢找到更适合自己的表达方式。', 'Keeping moments in photos and short videos, and finding a personal way to express them.'), cover: 'moments', href: '/life', sourceImage: '/archive/polaroid-collage.webp' },
    { id: 'writing', title: (0, exports.text)('妙笔 AI 全能文案助手', 'Miaobi AI writing assistant'), eyebrow: '07 / AI WRITING', description: (0, exports.text)('原站公开的可用产品入口。把创作想法继续延伸到文字表达。', 'A publicly linked product from the original site, extending creative ideas into written expression.'), cover: 'writing', href: 'https://miaobi-appl-serkon.pages.dev/' },
    { id: 'yearbook', title: (0, exports.text)('微信年轮', 'WeChat Yearbook'), eyebrow: '08 / LOCAL DATA TOOL', description: (0, exports.text)('面向完整聊天记录的本地分析工具，继续完善双系统使用体验；安全边界优先于功能数量。', 'Local analysis of complete chat records, with cross-platform usability and safety ahead of feature count.'), cover: 'yearbook', href: 'https://github.com/jackmac566/wechat-yearbook' },
];
exports.nowItems = [
    { title: (0, exports.text)('Serkon 个人网站', 'Serkon homepage'), copy: (0, exports.text)('校正内容层级、移动端细节、双语与长期维护流程。', 'Refining content hierarchy, mobile details, bilingual reading and maintenance.'), href: '/updates' },
    { title: (0, exports.text)('微信年轮', 'WeChat Yearbook'), copy: (0, exports.text)('完善本地分析与双系统体验，安全边界优先。', 'Improving local analysis and cross-platform use, with safety first.'), href: 'https://github.com/jackmac566/wechat-yearbook' },
    { title: (0, exports.text)('强鹰彩色胶', 'Qiangying colour sealant'), copy: (0, exports.text)('整理产品视觉、规格信息与销售场景。', 'Organising product visuals, specifications and real sales contexts.'), href: exports.projects[0].href },
];
exports.spaces = [
    { id: 'cosmos', index: '01', title: (0, exports.text)('动态思想档案', 'Motion archive'), copy: (0, exports.text)('五幕滚动镜头，连接随笔、影像与作品。', 'Five scrolling scenes connect notes, images and work.'), href: '/cosmos', label: 'MOTION LAB' },
    { id: 'play', index: '02', title: (0, exports.text)('互动档案', 'Playable archive'), copy: (0, exports.text)('灵感卡、记忆翻牌与个人线索，亲自试一试。', 'Inspiration cards, memory games and personal clues to explore.'), href: '/play', label: 'PLAY & DISCOVER' },
    { id: 'lobby', index: '03', title: (0, exports.text)('公共大厅', 'Public lobby'), copy: (0, exports.text)('留下一个真实的声音。不虚构在线人数。', 'A place for real conversation. No invented online counts.'), href: '/lobby', label: 'WORLD CHANNEL' },
    { id: 'life', index: '04', title: (0, exports.text)('生活与共享影像', 'Life & shared images'), copy: (0, exports.text)('查看生活记录，进入原有的共享影像空间。', 'Visit the original collection of everyday and shared images.'), href: '/life', label: 'LIFE IN FRAMES' },
];
function resolveHref(href, preview) { return preview && href.startsWith('/') ? exports.HOME_URL + href : href; }
function externalProps(href) { return /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}; }

