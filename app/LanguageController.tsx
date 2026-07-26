"use client";

import { useEffect, useState } from "react";

type Language = "zh" | "en";

const STORAGE_KEY = "serkon_language_v1";

const PAGE_TITLE_EN: Record<string, string> = {
  "Serkon 侯世康｜个人主页": "Serkon Hou Shikang | Personal Site",
  "Serkon 侯世康｜个人主页与作品档案": "Serkon Hou Shikang | Personal Site & Work Archive",
  "Serkon 是侯世康｜官方身份说明": "Serkon Is Hou Shikang | Official Identity",
  "互动档案｜Serkon 侯世康": "Playable Archive | Serkon",
  "网站系统层｜Serkon 侯世康": "Website System Layer | Serkon",
  "生活影像｜Serkon 侯世康": "Creative & Life Archive | Serkon",
  "站长随笔｜Serkon 侯世康": "Notes | Serkon",
  "公共大厅｜Serkon 侯世康": "Public Lobby | Serkon",
  "版本更新记录｜Serkon 侯世康": "Release Ledger | Serkon",
  "隐私与公共上传规则｜Serkon 侯世康": "Privacy & Public Content Rules | Serkon",
};

const EN: Record<string, string> = {
  "跳到主要内容": "Skip to main content",
  "关于我": "About",
  "兴趣爱好": "Interests",
  "作品案例": "Selected work",
  "互动档案": "Interactive archive",
  "公共大厅": "Public lobby",
  "站长随笔": "Notes",
  "开放能力": "Open capabilities",
  "版本记录": "Release log",
  "纯文字版": "Text-only edition",
  "目录": "Menu",
  "你好，我是": "Hello, I am",
  "大一在读，正在探索 AI 与创作的更多可能。": "A university freshman exploring what AI and creativity can become.",
  "记录成长，也把想法变成作品。": "Documenting growth and turning ideas into real work.",
  "认识我": "Meet me",
  "查看作品": "View my work",
  "持续成长中": "Always evolving",
  "认真生活，保持好奇。": "Live sincerely. Stay curious.",
  "大一": "FRESHMAN",
  "当前年级": "CURRENT YEAR",
  "兴趣关键词": "INTERESTS",
  "AI · 游戏 · 牌局 · 影像": "AI · GAMES · CARDS · VISUALS",
  "合作与交流": "COLLABORATION",
  "保持联系": "STAY IN TOUCH",
  "“我想很早就去尝试新的技术，更在意前所未见的想法；先做出第一版，再一路把它变得更好。”": "“I want to explore new technology early and pursue ideas that have not existed before. Build version one, then keep making it better.”",
  "我是 Serkon 侯世康，目前是一名大一学生。现在的我正处在不断认识世界、也不断认识自己的阶段。": "I am Serkon, a university freshman learning more about the world and myself at the same time.",
  "我会用 AI 做图、做内容和个人网页，把模糊的想法慢慢打磨成看得见、能分享的作品。闲下来时，我喜欢打王者荣耀、和朋友玩扑克牌，也喜欢用照片和短视频记录有氛围的瞬间。": "I use AI to create visuals, content and websites, shaping vague thoughts into work people can see and share. Away from the screen, I enjoy Honor of Kings, card games with friends, photography and short videos.",
  "对我来说，AI 是一种放大想象力的方式。我喜欢研究不同模型和表达方法，也愿意不断试错。我的做事方式是先让想法拥有第一版，再边学边改；我希望多年以后，别人能从这些作品里看到一个很早就敢于尝试新技术的人。": "For me, AI amplifies imagination. I study different models and forms of expression, and I am willing to learn through trial and error. I give every idea a first version, then improve it while learning. Years from now, I hope this work shows someone who dared to try new technology early.",
  "保持好奇，继续创造。": "Stay curious. Keep creating.",
  "接受私人定制和商用约稿": "PRIVATE & COMMERCIAL COMMISSIONS",
  "把你的天马行空告诉我，我用 AI 帮你实现。按需求单独报价，先确认档期再开始。": "Tell me your wildest idea and I will help bring it to life with AI. Each brief is quoted individually after availability is confirmed.",
  "聊聊你的想法": "Share your idea",
  "兴趣不只是消遣，它们也在悄悄塑造我的观察方式。": "Interests are more than pastimes—they quietly shape how I observe the world.",
  "玩 AI": "AI EXPLORATION",
  "喜欢尝试新的 AI 工具，把脑海里的点子快速变成图像、内容和真正能使用的作品。": "I explore new AI tools and quickly turn ideas into visuals, content and genuinely usable work.",
  "打开个人 AI 创作站": "Open my AI studio",
  "王者荣耀": "HONOR OF KINGS",
  "享受团队协作、临场判断和每一局不断变化的节奏，也把它当作放松的一种方式。": "I enjoy teamwork, split-second decisions and the changing rhythm of every match—and use it to unwind.",
  "尝试启动王者荣耀": "Launch Honor of Kings",
  "扑克牌": "CARD GAMES",
  "喜欢牌局里的观察、概率与默契。对我来说，玩牌也是朋友之间很自然的社交时刻。": "I enjoy observation, probability and unspoken coordination at the card table. It is also an easy, natural way to spend time with friends.",
  "进入斗地主牌桌": "Open the Dou Dizhu table",
  "影像记录": "VISUAL JOURNAL",
  "喜欢用照片和短视频留住有氛围的瞬间，也在慢慢找到更适合自己的表达方式。": "I use photos and short videos to preserve atmospheric moments while developing a visual language of my own.",
  "打开我的生活相册": "Open my life gallery",
  "前三项来自已经上线的产品视觉，最后一项是持续更新的个人网站；AI 参与创作，但成果都可以直接查看。": "The first three are live product-visual projects; the fourth is this evolving personal site. AI supported the process, and every result can be viewed directly.",
  "强鹰彩色胶·色彩主视觉": "Qiangying Color Sealant · Hero Visual",
  "包装细节信息图": "Packaging Detail Infographic",
  "六项核心优势视觉": "Six Core Benefits System",
  "Serkon 个人主页": "Serkon Personal Website",
  "查看项目详情": "View project details",
  "查看真实成果": "View live result",
  "有人路过，这里就会多一个真实的声音。": "Every visitor can leave one real voice behind.",
  "进入全站共享的公共大厅": "Enter the shared public lobby",
  "不用实名，不制造虚假的在线人数。所有访客看到同一条频道；留言一旦公开，访客本人不能随手撤回，站长只为隐私、安全与公共规则进行必要处理。": "No real name required and no fake online count. Everyone sees the same channel. Published messages cannot be casually withdrawn; moderation is limited to privacy, safety and public rules.",
  "进入世界频道": "Enter the world channel",
  "共享频道": "SHARED CHANNEL",
  "系统公告": "SYSTEM NOTICE",
  "欢迎来到 Serkon 公共大厅。这里也许安静，但不是一间空房。": "Welcome to Serkon's public lobby. It may be quiet, but it is not an empty room.",
  "你好，第一次路过这里。": "Hello—my first time passing through.",
  "公开可见 · 发布即锁定 · 可举报": "PUBLIC · LOCKED AFTER POSTING · REPORTABLE",
  "这些不是藏在代码里的概念，而是已经可以打开使用的公开入口。": "These are not hidden concepts in the code; they are public features you can open now.",
  "网站的另一层，已经上线。": "Another layer of the site is already live.",
  "阅读辅助": "Reading assistance",
  "字号、高对比度、减少动画和链接标识。": "Text size, high contrast, reduced motion and clearer links.",
  "打开功能": "Open feature",
  "纯文字轻量版": "Low-bandwidth text edition",
  "不加载大图、音乐和游戏，低带宽也能阅读。": "Read without large images, music or games—even on a slow connection.",
  "进入轻量版": "Open light edition",
  "机器可读资料": "Machine-readable profile",
  "个人、项目、当前关注、RSS 与 llms.txt。": "Person, projects, current focus, RSS and llms.txt.",
  "身份与机器可读资料": "Identity and machine-readable data",
  "公开 Serkon 与侯世康的身份关联，以及个人、项目、RSS、llms.txt 和结构化数据。": "Publishes the Serkon–Hou Shikang identity link together with person, project, RSS, llms.txt and structured data.",
  "查看身份说明": "View identity profile",
  "公开 JSON": "Open JSON",
  "内容来源档案": "Content provenance",
  "公开人工与 AI 分工、文件摘要和 SHA-256。": "Discloses human/AI roles, file digests and SHA-256.",
  "诚实披露": "View disclosure",
  "0 元运营原则": "Zero-cost operating principle",
  "记录免费边界，不接入会暗中产生费用的能力。": "Documents the free operating boundary and avoids hidden paid services.",
  "规则公开": "View policy",
  "版本更新记录": "Release ledger",
  "只记日期与改动，不回放可能泄露隐私的旧页面。": "Records dates and changes without replaying privacy-sensitive old pages.",
  "查看档案": "View archive",
  "有想法，欢迎来找我。": "Have an idea? I would love to hear it.",
  "一起聊聊AI、创意或者下一件作品。": "Let's talk about AI, creativity, or your next project.",
  "AI 视觉": "AI VISUALS",
  "产品宣传": "PRODUCT CAMPAIGNS",
  "个人网站": "PERSONAL WEBSITES",
  "定制内容": "CUSTOM CONTENT",
  "首选联系：Gmail。": "Preferred contact: Gmail.",
  "约稿按用途、数量、交付和授权范围单独报价；先确认档期，再沟通尺寸、修改范围与交付内容。QQ 邮箱仅作备用。": "Commissions are quoted by use, quantity, deliverables and licensing. We confirm availability first, then align on dimensions, revisions and delivery. QQ Mail is a backup only.",
  "找到我": "CONTACT",
  "QQ 邮箱": "QQ MAIL",
  "个人主页 · 第": "PERSONAL SITE · EDITION",
  "版 · 持续更新中": "· CONTINUOUSLY UPDATED",
  "回到顶部": "Back to top",
  "个人作品与创作交流站点": "Personal work & creative exchange",
  "隐私与公共上传规则": "Privacy & public upload rules",
  "无障碍说明": "Accessibility statement",
  "内容来源": "Provenance",
  "身份说明：Serkon = 侯世康": "Identity: Serkon = Hou Shikang",
  "备用联系：": "Backup contact: ",
  "创作": "Create",
  "匹配": "Match",
  "纪念卡": "Keepsake",
  "成长": "Progress",
  "快捷创作工坊": "Quick creation studio",
  "当前使用站内模板引擎，输入内容不会发送给外部模型。适合快速起草，重要内容请自行核对。": "This local template engine does not send your input to an external model. It is intended for quick drafts; please verify important content.",
  "进入妙笔 AI 全能文案助手": "Open Miaobi AI Writing Workspace",
  "输入主题": "TOPIC",
  "生成内容": "Generate",
  "站长匹配测试": "Serkon match quiz",
  "到访纪念信笺": "Visitor keepsake letter",
  "访客成长手册": "Visitor progress book",
  "阅读站长随笔": "Read Serkon's notes",
  "页面缩放": "PAGE ZOOM",
  "增强对比度": "High contrast",
  "减少动画": "Reduce motion",
  "链接加下划线": "Underline links",
  "已开启": "On",
  "关闭": "Off",
  "恢复默认": "Reset",
  "完整说明": "Full statement",
  "返回个人主页": "Back to the homepage",
  "生活碎碎念、开发日志，以及那些不适合塞进个人介绍里的话。": "Fragments of life, development notes and thoughts that do not belong in a short profile.",
  "用同样的情绪继续写一段": "Continue writing in this mood",
  "下一篇随笔，正在生活里发生。": "The next note is still happening in real life.",
};

const NOTE_EN: Array<[string, string]> = [
  ["建站手记", "SITE NOTE"], ["我不想只做一张漂亮的电子名片", "I do not want this to be just a beautiful digital business card"], ["刚开始，这个网站只是用来介绍我是谁。后来我慢慢发现，访客没有义务停下来读完一份陌生人的履历。于是我开始往里面加入音乐、小游戏、照片、抽象文案和一张会记住浏览过程的纪念卡。比起把网站做得更满，我更在意它有没有一点真实的温度。", "At first, this site only introduced who I was. Then I realized visitors had no obligation to read a stranger's résumé. I added music, small games, photographs, playful writing and a keepsake that remembers the visit. More than filling the page, I wanted it to feel genuinely human."],
  ["此刻", "RIGHT NOW"], ["十九岁，不急着把自己定义清楚", "Nineteen, with no rush to define myself"], ["我喜欢 AI，也喜欢游戏、扑克牌和镜头里的生活。它们看起来没有一个统一答案，但这也正是现在的我：愿意尝试，愿意推翻上一版，也愿意在做完以后承认还可以更好。成长可能不是突然找到方向，而是在一次次真实行动里慢慢排除不属于自己的答案。", "I like AI, games, cards and life through a camera. They do not form one neat answer, and that is exactly who I am now: willing to experiment, replace the previous version and admit there is always room to improve. Growth may be less about suddenly finding a direction and more about eliminating the wrong ones through real action."],
  ["怀旧碎片", "NOSTALGIA"], ["我们舍不得的，也许不是那个旧账号", "Maybe it is not the old account we cannot let go of"], ["很久以前的 QQ、空间相册和聊天记录，总会让人产生一种很特别的情绪。账号只是入口，真正让人舍不得的，是那时候还没有说出口的话、已经走散的人，以及当时觉得普通、后来再也回不去的日常。互联网也会变旧，而我们的青春刚好被它保存过。", "Old QQ accounts, photo albums and chat histories carry a peculiar emotion. The account is only an entrance. What we miss are the unsaid words, the people who drifted away and the ordinary days we can never revisit. The internet ages too, and it once happened to preserve our youth."],
  ["生活碎片", "LIFE FRAGMENT"], ["凌晨两点以后，很多想法都会变得认真", "After 2 a.m., many thoughts begin to feel serious"], ["白天觉得无所谓的事情，到了深夜总会重新浮上来。也许是一个没做完的页面，也许是一句没有发出去的话。后来我发现，深夜并没有替人解决问题，它只是暂时把世界调小声，让我们终于能听见自己的想法。", "Things that seem unimportant by day return late at night: an unfinished page or an unsent sentence. Night does not solve problems; it simply turns down the world long enough for us to hear our own thoughts."],
  ["AI 实验", "AI EXPERIMENT"], ["AI 最有意思的地方，不是替我完成", "The most interesting thing about AI is not that it finishes for me"], ["我喜欢 AI，并不是因为它可以一键给出答案，而是它能把一个原本模糊的念头迅速变成可以继续修改的东西。真正属于我的部分，往往发生在第一次生成之后：删掉什么、留下什么、为什么觉得还不够好。", "I like AI not because it gives an answer in one click, but because it quickly turns a vague idea into something I can keep shaping. The truly personal part begins after the first generation: what to remove, what to keep and why it still is not good enough."],
  ["城市观察", "CITY NOTE"], ["北京朝阳的风，总是比计划先到", "The wind in Chaoyang always arrives before the plan"], ["这座城市很快，地铁、消息、工作和新的想法都在往前赶。但偶尔走在傍晚的街上，看到路边摊升起的热气，又会觉得生活其实没有那么复杂。宏大的未来和一顿热饭，可以同时存在。", "This city moves quickly—trains, messages, work and new ideas all race forward. Yet an evening walk past the steam of a street stall makes life feel simple again. A grand future and a warm meal can exist at once."],
  ["朋友与游戏", "FRIENDS & GAMES"], ["有些友谊，就是从一句“开一把”开始", "Some friendships begin with: one game?"], ["一起玩游戏时，输赢当然重要，但很多年以后真正记住的，可能是某个人突然笑到说不出话，或者大家明明很困却还要再开最后一局。游戏结束得很快，陪伴留下来的时间却比想象中长。", "Winning matters while we play, but years later we may remember someone laughing too hard to speak, or everyone starting one last round while exhausted. A game ends quickly; the feeling of company lasts much longer."],
  ["影像记录", "VISUAL MEMORY"], ["照片替我们记住了当时没有注意的东西", "Photographs remember what we failed to notice"], ["拍照的时候，我们总以为主角是人。过几年再看，最先打动人的也许是身后的旧招牌、桌上的饮料、朋友穿过一次就没再见过的衣服。照片珍贵，是因为它把无意间流走的生活留了下来。", "When taking a picture, we assume the person is the subject. Years later, an old sign, a drink on the table or a friend's long-lost shirt may move us first. Photographs matter because they preserve the life that slipped by unnoticed."],
  ["开发日志", "DEV LOG"], ["一个网站为什么要反复修改", "Why does a website need constant revision?"], ["因为第一次做出来的，通常只是“它能运行”。第二次开始才是在问：别人为什么愿意看？哪里会觉得无聊？什么东西只是在炫技？每一次修改都像在重新认识自己，也重新理解站在屏幕另一边的人。", "The first build usually proves only that it works. The second begins asking why anyone would stay, where boredom appears and what is merely showing off. Every revision helps me understand both myself and the person on the other side of the screen."],
  ["写给以后", "TO THE FUTURE"], ["希望未来的我，还愿意推翻今天的答案", "I hope my future self is still willing to overturn today's answers"], ["现在喜欢的风格、相信的事情和想去的方向，以后可能都会改变。我希望那不是背叛过去，而是证明自己真的往前走过。唯一不想丢掉的，是对新东西的好奇，以及把想法变成现实的行动力。", "The style, beliefs and direction I prefer today may all change. I hope that is not a betrayal of the past, but proof that I moved forward. What I never want to lose is curiosity and the will to turn ideas into reality."],
  ["行动方式", "HOW I WORK"], ["先做出第一版，比等一个完美答案更重要", "Building version one matters more than waiting for a perfect answer"], ["很多事情在脑子里想得越久，越容易变成一个不敢开始的宏大计划。我更愿意先把它做出来，哪怕粗糙、哪怕会被指出问题。第一版不是答案，而是让答案真正开始出现的地方。", "The longer an idea stays in my head, the easier it becomes a grand plan I am afraid to start. I would rather build it, even if it is rough and open to criticism. Version one is not the answer; it is where answers begin to appear."],
  ["细节偏执", "DETAILS"], ["我追求的完美，不是永远不出错", "The perfection I pursue is not the absence of mistakes"], ["真正的完美不是把所有瑕疵藏起来，而是愿意看见每一个不舒服的地方，再一次次把它修得更合理。按钮多一像素、手机横屏少一块空间、陌生人看不懂一句话，这些都值得认真对待。", "Perfection is not hiding every flaw. It is noticing each uncomfortable detail and repeatedly making it more reasonable. One pixel on a button, missing space in landscape, or a sentence a stranger cannot understand—all deserve attention."],
  ["现实主义", "REALISM"], ["零成本不是廉价，而是一种设计限制", "Zero cost is not cheapness; it is a design constraint"], ["没有预算时，更需要分清什么是真正重要的。免费并不代表随便，而是尽量用更聪明的结构、更克制的功能和更透明的规则，把有限资源变成可以长期运行的产品。", "Without a budget, priorities matter even more. Free does not mean careless. It means using smarter structure, restrained features and transparent rules to turn limited resources into a product that can last."],
  ["人与连接", "HUMAN CONNECTION"], ["我给网站加上大厅，是因为不想让它太孤独", "I added a lobby because I did not want the site to feel lonely"], ["个人网站很容易变成一个人站在台上自我介绍。公共大厅让我觉得屏幕另一边真的有人来过。即使只留下一句你好，那一刻网站也不再只是作品，而是发生过一次真实连接的地方。", "A personal site can feel like one person introducing himself on a stage. The lobby shows that someone truly visited. Even a single hello turns the site from a piece of work into a place where a real connection happened."],
  ["游戏思维", "PLAYFUL THINKING"], ["好产品应该允许人先玩，再慢慢理解", "A good product should let people play before they understand"], ["不是每个人都愿意先读完说明书。一个小游戏、一次选择、一张纪念卡，有时比十段介绍更容易让人理解你。可玩并不等于幼稚，它是一种降低陌生感、让信息被亲自发现的方法。", "Not everyone wants to read the manual first. A small game, a choice or a keepsake can communicate more than ten paragraphs. Playfulness is not childish; it reduces distance and lets people discover meaning themselves."],
  ["公开边界", "PUBLIC BOUNDARIES"], ["愿意分享，不代表什么都应该公开", "Being willing to share does not mean everything should be public"], ["我希望网站足够真实，但真实不等于把自己和访客的所有信息都摆出来。好的公开表达需要边界：展示作品，保护身份；保留记忆，不回放隐私；让人参与，也让每个人知道数据会去哪里。", "I want the site to feel real, but reality does not require exposing every detail about me or my visitors. Good public expression needs boundaries: show the work, protect identities; preserve memories, not private history; invite participation and explain where data goes."],
  ["前瞻思考", "FORWARD THINKING"], ["比别人早想到，还要比别人早做出", "Thinking early only matters if you also build early"], ["超前不是堆上听起来未来感十足的名词，而是在大多数人还没有重视时，就把无障碍、机器可读、内容来源和长期版本记录真正做进去。未来感最后要落在今天可以使用的细节里。", "Being ahead is not about futuristic vocabulary. It is implementing accessibility, machine readability, provenance and a long-term release ledger before most people consider them. The future must ultimately work in today's details."],
  ["耐心", "PATIENCE"], ["失败不是暂停键，它只是下一次判断的线索", "Failure is not a pause button; it is a clue for the next decision"], ["部署失败、页面错位、按钮没有反应时，我当然会烦。但每一次报错都在缩小问题范围。与其把失败理解成能力不够，我更愿意把它当成系统终于告诉了我：下一步应该看哪里。", "Failed deployments, broken layouts and unresponsive buttons are frustrating, but every error narrows the search. Instead of treating failure as a lack of ability, I treat it as the system finally revealing where to look next."],
  ["全面性", "COMPLETENESS"], ["大众想到的问题要解决，没想到的也要预留位置", "Solve the obvious problems and leave room for the overlooked ones"], ["全面不是功能越多越好，而是能同时站在第一次访问的人、手机用户、英语访客、低带宽用户、机器和未来维护者的位置上思考。真正的全能，是不同的人都能找到一条适合自己的路。", "Completeness is not a larger feature count. It means thinking like a first-time visitor, a phone user, an English reader, someone on low bandwidth, a machine and a future maintainer. True versatility gives each of them a suitable path."],
  ["持续更新", "CONTINUOUS UPDATE"], ["网站没有最终版，我也没有", "The website has no final version—and neither do I"], ["每次更新都应该让它比上一版更清楚、更好用、更像我。保留版本记录不是为了证明做过多少，而是提醒自己：今天的答案只是当前最好的一版，明天仍然可以继续推翻和生长。", "Every update should make the site clearer, easier and more like me. The ledger is not proof of how much I have done; it reminds me that today's answer is only the best current version, ready to be challenged and grown tomorrow."],
];

const UI_EN: Record<string, string> = {
  "分享": "Share", "联系我": "Contact", "个人档案局": "Archive Office", "开场": "Opening",
  "怀旧文案": "Nostalgic copy", "旧时光、青春与回忆氛围": "Old days, youth and memory",
  "诗词对仗": "Poetic couplets", "生成有画面感的对仗句式": "Create vivid parallel lines",
  "短视频口播": "Short-video script", "口播开头、正文与朋友圈": "Hook, script and social caption",
  "网站与代码": "Web & code", "搭建需求与排错提示模板": "Brief and debugging prompt templates",
  "新的技术": "new technology", "从卖点到购买理由": "From product feature to reason to buy",
  "已上线产品视觉": "LIVE PRODUCT VISUAL", "把 126 色、使用场景与产品包装放进同一张主视觉，让“颜色丰富”从一句卖点变成可直接感知的画面。": "A hero visual combines 126 colors, use cases and packaging, turning “color variety” into something immediately visible.",
  "真实成果 01": "LIVE RESULT 01", "详情图": "Detail image", "场景图": "Lifestyle image", "视觉内容": "Visual content",
  "把一款普通产品转化成具有卖点层级、使用场景和购买理由的完整电商视觉方案。": "Transform an ordinary product into a complete commerce visual system with clear benefits, use cases and reasons to buy.",
  "梳理产品核心卖点": "Define core benefits", "设计主图与场景构图": "Design hero and scene composition", "统一整套页面的视觉节奏": "Unify the page rhythm",
  "主视觉已用于强鹰彩色胶产品网站，承担首屏卖点说明与色彩认知": "The hero visual is live on the Qiangying product site, communicating benefits and color range above the fold.",
  "主视觉": "Hero visual", "场景系列": "Scene series", "详情页结构": "Detail-page structure",
  "让产品拥有完整故事": "Give the product a complete story", "已上线详情视觉": "LIVE DETAIL VISUAL",
  "把瓶口、封装、胶嘴与包装卖点拆成可读的信息层级，让访客不用猜，就能看懂不同规格的细节。": "Break the nozzle, seal and packaging benefits into a readable hierarchy so visitors understand every specification without guessing.",
  "真实成果 02": "LIVE RESULT 02", "内容策划": "Content strategy",
  "围绕产品从生产到使用的过程，练习把零散素材整理成一条清晰、可信的宣传故事线。": "Organize scattered production and usage material into a clear, credible campaign narrative.",
  "确定受众与传播重点": "Define audience and message", "规划仓库、施工、质检画面": "Plan warehouse, application and QA scenes", "组合成系列化传播内容": "Build a campaign series",
  "将包装细节、规格差异和使用优势整理为一张可独立传播的信息图": "Package details, specification differences and advantages become a standalone infographic.",
  "传播主题": "Campaign theme", "内容脚本": "Content script", "系列构图": "Series composition",
  "把专业感放进现场": "Put professionalism on site", "已上线卖点系统": "LIVE BENEFIT SYSTEM",
  "把颜色、定制、固化、防水、粘结和施工六类信息统一成一套产品语言，兼顾专业感与阅读效率。": "Unify color, customization, curing, waterproofing, adhesion and application into one professional, readable product language.",
  "真实成果 03": "LIVE RESULT 03", "场景策划": "Scene planning", "工程视觉": "Engineering visuals", "AI 概念": "AI concept",
  "用工厂、发货、施工与验收场景建立工程项目的规模感，让产品表达更专业。": "Use factory, shipping, application and inspection scenes to convey project scale and professionalism.",
  "拆分工程使用流程": "Map the project workflow", "匹配不同阶段的视觉场景": "Match visuals to each stage", "强化真实感与统一性": "Strengthen realism and consistency",
  "形成可延展到网站、销售沟通与工程介绍的核心卖点视觉系统": "Create a core-benefit visual system that extends to the website, sales and project presentations.",
  "工厂场景": "Factory scenes", "施工节点": "Application stages", "验收表达": "Inspection story",
  "一个会继续生长的网站": "A website designed to keep growing", "个人网站实作": "LIVE PERSONAL WEBSITE",
  "从个人信息、内容结构到视觉风格，完成属于自己的数字名片，并持续记录新的兴趣与作品。": "Build a personal digital identity through content, structure and art direction, then keep documenting new interests and work.",
  "真实上线 04": "LIVE PROJECT 04", "个人品牌": "Personal brand", "网页设计": "Web design", "内容整理": "Content design",
  "这是我持续更新的数字名片：从个人资料、内容结构到视觉体验，都围绕“真实、年轻、有想法”展开。": "This evolving digital identity is built around being genuine, young and full of ideas—from profile and structure to visual experience.",
  "整理个人信息与兴趣": "Organize identity and interests", "确定杂志感混合视觉": "Define the editorial hybrid style", "加入可浏览的作品互动": "Add explorable project interactions",
  "上线一个可以公开分享并持续成长的网站": "Launch a public website that can keep growing.", "视觉设计": "Visual design", "互动功能": "Interaction design", "公开部署": "Public release",
  "播放《创世纪》": "Play Genesis", "位面之子 FK · 原创音乐": "Weimian Zhizi FK · Original music",
  "互动档案局": "Interactive Archive", "这些玩法分别对应我的视觉判断、内容想象、游戏设计和真实沟通能力。": "These activities reveal my visual judgment, imagination, game design and communication skills.",
  "换一种网站气氛": "Change the site's mood", "四套高可读氛围，每一套都保留清晰文字与舒适对比。": "Four readable moods, each preserving clear text and comfortable contrast.",
  "赤线留白": "Red-line editorial", "暖杏信笺": "Warm apricot letter", "青绿胶片": "Sage film", "霞光珊瑚": "Sunset coral",
  "抽一张 AI 灵感卡": "Draw an AI idea card", "收藏这张": "Save card", "融合两张": "Fuse two cards",
  "Serkon 记忆翻牌": "Serkon Memory Flip", "翻开两张卡，找出属于 Serkon 的 6 组相同记忆。": "Flip two cards and find six matching Serkon memories.",
  "快速 4 对": "Quick · 4 pairs", "完整 6 对": "Full · 6 pairs", "玩法：每次翻两张，图形和文字相同即保留；卡面使用本站专属双色档案符号。": "How to play: flip two cards; matching symbols and labels stay open. Every card uses this site's two-color archive system.",
  "AI 分身": "AI double", "王者时刻": "Gaming moment", "朋友牌局": "Card night", "生活影像": "Life visual", "原创音乐": "Original music", "灵感闪现": "Idea spark", "开始翻牌": "Start flipping",
  "捕捉灵感": "Catch the idea", "10 秒内判断颜色并捕捉：黄色加分、蓝色稀有、红色会打断连击。": "React to colors for 10 seconds: yellow scores, blue is rare and red breaks the combo.",
  "黄色 +1 · 蓝色 +2 · 红色会打断连击": "Yellow +1 · Blue +2 · Red breaks combo", "准备好了吗？": "Ready?", "手机和电脑都能玩": "Works on phones and computers", "排行榜昵称": "Leaderboard name", "开始挑战": "Start challenge",
  "全站历史最高榜": "All-time global leaderboard", "暂时无法连接全站榜": "Leaderboard temporarily unavailable", "榜单还空着，来成为第一位上榜者。": "The board is empty—be the first to rank.",
  "个人线索": "personal clues", "简单说：不只是读“我喜欢什么”，而是亲手玩一次我的音乐、照片与创作选择。五种玩法都可以单独体验，不需要按顺序通关。": "Instead of merely reading what I like, experience my music, photographs and creative choices yourself. Each of the five activities stands alone—no fixed order required.",
  "第一次来，任选一个开始": "First visit? Start anywhere", "每个小游戏都是一条关于 Serkon 的个人线索；玩完会得到结果、看到故事，或把你的选择留进全站共同档案。": "Each activity is a clue about Serkon. Play to receive a result, reveal a story or add your choice to the shared archive.",
  "选择玩法": "Choose an activity", "从下面五个标签任选一个": "Pick any of the five tabs", "照提示操作": "Follow the prompt", "点击、选择或投票即可": "Click, choose or vote", "收下线索": "Collect the clue", "获得结果并推进档案进度": "Get a result and advance the archive",
  "当前玩法：": "CURRENT ACTIVITY: ", "《创世纪》节奏档案": "Genesis Rhythm Archive", "这不是通用音游皮肤，而是用站内原创音乐做成的一段短挑战。听见脉冲、看见暗红档案线收拢时点击。": "A short challenge built from this site's original music—not a generic rhythm-game skin. Tap when you hear the pulse and the dark-red archive ring closes.",
  "开始 12 拍挑战": "Start the 12-beat challenge", "正式、轻松、带一点玩心——都是我。": "Formal, relaxed and a little playful—all of it is me.",
  "已经上线。": "is already live.", "AI、创意": "AI and creativity", "首选 · 写封邮件 ↗": "Preferred · Write an email ↗", "点击复制": "Click to copy",
  "部分互动内容由 AI 辅助生成；访客上传影像将公开展示，请确保拥有授权。不适或侵权内容可联系删除；约稿商用范围以双方确认内容为准。": "Some interactive content is AI-assisted. Visitor uploads are public, so please upload only authorized media. Contact me to remove harmful or infringing content; commercial usage follows the agreed commission terms.",
  "大一 · FRESHMAN": "UNIVERSITY FRESHMAN", "保持联系 ↗": "STAY IN TOUCH ↗", "AI 创作": "AI creation", "访客-CN0001": "VISITOR-CN0001",
  "打开功能 ↗": "Open feature ↗", "进入轻量版 ↗": "Open light edition ↗", "公开 JSON ↗": "Open JSON ↗", "诚实披露 ↗": "View disclosure ↗", "规则公开 ↗": "View policy ↗", "查看档案 ↗": "View archive ↗",
  "CONTACT / 找到我": "CONTACT", "回到顶部 ↑": "Back to top ↑", "© 2026 Serkon 侯世康 · 个人作品与创作交流站点": "© 2026 Serkon 侯世康 · Personal work & creative exchange", "备用联系：1052709298@qq.com": "Backup contact: 1052709298@qq.com",
  "← 返回个人主页": "← Back to homepage", "返回主页 →": "Back to homepage →", "回到个人主页 →": "Back to homepage →",
  "大厅规则": "Lobby rules", "这里也许很安静，但不是一间空房。": "It may be quiet here, but this is not an empty room.",
  "所有访客看到同一个频道。你可以匿名留下一句话；内容会写入全站共享数据库并长期保留，退出、刷新或换设备都不会让它消失。发布后不能自行编辑或删除，站长只会为隐私、安全和公共规则进行必要处理。": "Every visitor sees the same channel. You may leave one anonymous message; it is stored in the shared database and remains after exit, refresh or device changes. Posts cannot be edited or deleted by their authors. The administrator intervenes only for privacy, safety and public rules.",
  "不要求实名，不显示真实账号": "No real name or public account required", "历史留言长期保留，可持续读取更早内容": "Messages remain available and older history can be loaded", "实时在线按最近 2 分钟活跃统计，不公开名单": "Online count uses the last two minutes of activity; no public member list", "不允许联系方式、外链与私人号码": "No contact details, external links or private numbers", "管理员可处理举报、侵权与不适内容": "Administrators may handle reports, infringement and harmful content",
  "世界频道": "World channel", "全站共享 · 准实时更新": "SHARED SITE-WIDE · NEAR REAL TIME", "实时在线": "Online now", "访客编号": "Visitor ID", "已读取 / 全部": "Loaded / all",
  "欢迎来到 Serkon 公共大厅。在线数字来自真实活跃访客，不要求真实姓名；请不要发布联系方式或他人隐私。": "Welcome to Serkon's public lobby. The online count reflects real active visitors without requiring real names. Do not post contact information or anyone else's private data.",
  "频道现在很安静。": "The channel is quiet right now.", "你留下第一句话以后，这里就不再是一间空房。": "Leave the first message and this will no longer be an empty room.",
  "这个网站很有意思。": "This website is interesting.", "愿你一直保持好奇。": "Stay curious.", "期待看到下一次更新。": "Looking forward to the next update.", "公开昵称": "Public nickname", "留言内容": "Message", "发送前确认": "Confirm before posting", "你可以成为第一个留下声音的人": "You can be the first voice here", "发送到世界频道 ↗": "Post to world channel ↗", "在线人数来自真实活跃状态；安静也是真实状态。": "The online count reflects real activity; quiet is real too.", "0 元运营承诺": "Zero-cost commitment",
  "把正式介绍之外的日常、朋友、旅行和随手记录，慢慢整理成一本可以翻阅的线上相册。": "An online album for everyday life, friends, travel and spontaneous moments beyond the formal introduction.",
  "全部": "All", "站长影像": "Serkon", "访客影像": "Visitors", "人物": "People", "日常": "Everyday", "旅行": "Travel", "朋友": "Friends", "随手拍": "Snapshots",
  "把你眼中的生活，也留在这里。": "Leave your view of life here too.", "所有人都能浏览；登录后可以上传，并且只能删除自己上传的照片。": "Everyone can browse. Signed-in visitors may upload and can delete only their own photos.", "登录后上传 ↗": "Sign in to upload ↗",
  "这是一个公开的共同影像墙。照片会显示给所有访客；上传者可管理自己的内容。为保持相册安全与整洁，不适合公开展示的内容可能会被移除。": "This is a public shared photo wall. Images are visible to every visitor and uploaders manage their own content. Material unsuitable for public display may be removed to keep the gallery safe and orderly.",
  "认真一点的我": "My more serious side", "镜头前也可以抽象": "Playful in front of the camera", "第一张个人主页照片": "The first personal-site portrait",
  "每位上传者的删除权限都由服务器核验，隐藏按钮或修改网页代码也无法删除别人的照片。请不要上传他人隐私、联系方式或未经允许的肖像。": "Deletion permission is verified by the server. Hiding buttons or changing page code cannot delete someone else's photo. Do not upload private information, contact details or unauthorized portraits.",
  "Serkon 斗地主牌桌": "Serkon Dou Dizhu Table", "重新发牌": "Redeal", "农": "FARMER", "左边农民": "Left farmer", "右边农民": "Right farmer", "地主底牌": "Landlord's reserve cards", "新一轮 · 请出牌": "New round · Play a hand", "轮到你": "Your turn", "你是地主，先出牌": "You are the landlord—play first", "不出": "Pass", "出牌": "Play", "大王": "BIG JOKER", "小王": "SMALL JOKER", "基础规则支持：单张、对子、三张、三带一、三带二、顺子、炸弹和王炸。": "Supported hands: singles, pairs, triples, three-with-one, three-with-two, straights, bombs and the joker bomb.",
  "目标不是贴一个“无障碍”标签，而是让更多人能真正读、看、点、玩。当前能力会继续通过真实设备和不同使用方式迭代；本页不宣称已经获得 WCAG 认证。": "The goal is not to attach an accessibility label, but to let more people genuinely read, see, click and play. These capabilities will keep improving through real devices and usage patterns; this page does not claim WCAG certification.",
  "键盘可达": "Keyboard access", "主要链接、按钮、表单和弹窗可以通过键盘获得焦点，页面提供“跳到主要内容”入口，并保留清晰的焦点轮廓。": "Primary links, buttons, forms and dialogs can receive keyboard focus. The page offers a skip-to-content link and preserves a clear focus outline.",
  "阅读控制": "Reading controls", "右下角“阅读辅助”可选择 100%、115%、130% 页面缩放，开启增强对比、减少动画和链接下划线。选择只保存在当前浏览器。": "Reading assistance in the lower-right offers 100%, 115% and 130% zoom, higher contrast, reduced motion and underlined links. Preferences remain in this browser.",
  "系统偏好": "System preferences", "如果设备已经启用“减少动态效果”，网站会主动降低动画；设置不会上传，也不会用于识别你的身份。": "If reduced motion is enabled on the device, the site automatically lowers animation. Preferences are not uploaded or used to identify you.",
  "轻量入口": "Lightweight access", "纯文字版不加载人物大图、作品图、音乐和游戏，适合网络较慢、流量受限，或只想快速理解网站内容的人。": "The text edition skips portraits, project images, music and games. It suits slow networks, limited data or anyone who wants a quick understanding.", "打开纯文字版 →": "Open text edition →",
  "互动说明": "Interaction notes", "公共大厅的状态会通过文字播报；游戏仍会持续补充键盘操作。某个互动若暂时不适合你，可以通过文字版读取其目的与结论。": "Lobby states are announced in text and games will continue adding keyboard controls. If an interaction does not suit you, its purpose and outcome remain available in the text edition.",
  "反馈与边界": "Feedback and boundaries", "无障碍不是一次性完成。如果你遇到无法聚焦、对比不足、读屏语义不清或操作困难，可以通过联系区告诉站长具体页面与设备。": "Accessibility is never finished in one pass. If focus, contrast, screen-reader semantics or controls cause difficulty, use the contact section to report the page and device.", "隐私说明": "Privacy statement",
  "← 返回完整视觉版": "← Back to visual edition", "低带宽 · 纯文字 · 无音乐": "LOW BANDWIDTH · TEXT ONLY · NO MUSIC", "一名正在探索 AI、视觉创作、个人网站与互动体验的大一学生。": "A university freshman exploring AI, visual creation, personal websites and interactive experiences.", "关于": "About", "作品": "Work", "入口": "Links", "机器资料": "Machine data",
  "我喜欢尝试新的 AI 工具，也喜欢游戏、扑克牌和影像记录。我希望被记住为很早就敢于尝试新技术的人；做作品时更重视前所未见的想法，遇到不会的事会先做第一版，再边学边改。": "I explore new AI tools and enjoy games, cards and visual journaling. I hope to be remembered as someone who tried new technology early, valued unprecedented ideas and built version one before learning through iteration.",
  "公开作品": "Public work", "把 126 色、使用场景与产品包装组织成可直接感知的产品主视觉。": "A product hero that makes 126 colors, use cases and packaging immediately understandable.", "查看项目": "View project", "把包装细节、规格差异和使用优势整理为可独立传播的信息图。": "A standalone infographic for packaging details, specification differences and product advantages.", "用统一的视觉语言表达定制、固化、防水、粘结与施工等核心卖点。": "A unified visual language for customization, curing, waterproofing, adhesion and application.", "融合个人档案、作品、公共大厅、影像、游戏与开放机器层的数字空间。": "A digital space combining a personal archive, projects, lobby, visuals, games and an open machine layer.",
  "妙笔 AI 全能文案助手": "Miaobi AI Writing Workspace", "面向更完整创作需求的独立 AI 文案工作台，可从个人网站创作工坊直接进入。": "An independent AI writing workspace for more complete creative briefs, linked directly from the personal site's studio.", "功能入口": "Feature links", "公共大厅：所有访客共享的匿名留言频道": "Public lobby: an anonymous channel shared by every visitor", "隐私与公共规则": "Privacy and public rules", "内容来源与哈希档案": "Provenance and hash archive", "机器可读入口": "Machine-readable links", "个人资料 JSON-LD": "Person JSON-LD", "项目列表 JSON-LD": "Project list JSON-LD", "当前关注 JSON": "Current focus JSON", "版本更新 RSS": "Release RSS",
  "这不是一页藏在角落里的套话。下面用尽量清楚的方式说明：网站会保存什么、为什么保存、哪些内容会公开，以及站长怎样处理举报、隐私与删除请求。": "This is not boilerplate hidden in a corner. It explains as clearly as possible what the site stores, why it is stored, what becomes public and how reports, privacy and deletion requests are handled.",
  "公共影像墙": "Public photo wall", "你主动上传的照片、公开昵称、分类和说明会展示给所有访客。上传前请确认拥有图片使用权，不要上传他人隐私、联系方式、未经允许的肖像或不适合公开展示的内容。": "Photos, public nicknames, categories and descriptions you upload are shown to every visitor. Upload only media you may use; never upload private details, contact information, unauthorized portraits or unsuitable content.",
  "登录身份仅用于服务器核验“谁有权删除这张照片”，不会直接作为公开昵称展示。原始文件名不会显示给访客。": "Sign-in identity is used only by the server to verify who may delete a photo. It is not shown as the public nickname, and original filenames are hidden.",
  "互动与排行榜": "Interactions and leaderboard", "“捕捉灵感”会用随机访客标识、你填写的昵称和历史最高分维护全站榜单；灵感投票和星球只保存选项，不收集自由文本。随机标识不是实名账号。": "Catch the Idea uses a random visitor ID, your chosen nickname and best score for the global leaderboard. Idea votes save choices only, not free-form text. The random ID is not a real-name account.",
  "个人档案章、主题、灵感收藏和部分成长进度默认保存在当前浏览器，用于恢复本机体验；清除网站数据后会消失。": "Archive stamps, themes, saved ideas and some progress remain in this browser to restore the local experience. Clearing site data removes them.",
  "大厅不要求实名。浏览器会获得一个随机设备凭证，用来生成公开访客编号、限制刷屏并识别重复举报；服务器保存的是哈希后的设备与按日网络标识，不在公开页面展示原始 IP。": "The lobby requires no real name. The browser receives a random device credential for a public visitor ID, rate limiting and duplicate-report detection. The server stores hashed device and daily network identifiers; raw IP addresses are never displayed.",
  "“实时在线”只统计最近 2 分钟保持页面活跃的随机设备哈希，不公开在线名单；在线状态记录最多保留 24 小时。昵称和留言会公开给所有访客。发布前必须确认“公开且不能自行编辑或删除”；站长可以根据举报、隐私、侵权和公共规则隐藏、恢复或删除。请不要填写手机号、邮箱、微信、身份证号或他人隐私。": "Online now counts hashed random devices active within two minutes and never publishes a member list. Presence records last no more than 24 hours. Nicknames and messages are public. Posting requires confirmation that the message cannot be edited or deleted by its author. The administrator may hide, restore or remove content for reports, privacy, infringement or public rules. Never enter phone numbers, email, WeChat, ID numbers or private information.",
  "安全与必要限制": "Safety and necessary limits", "上传接口会检查登录状态、请求来源、文件类型、真实文件头、大小、频率和个人总量；大厅限制发送频率、重复内容、联系方式和外链；排行榜会核验有效对局。这些限制用于保护公共空间和其他访客。大厅消息写入共享数据库，不因退出、刷新或更换设备而消失，也没有自动到期时间。": "Uploads check sign-in, request origin, file type, real file headers, size, frequency and personal totals. The lobby limits posting frequency, duplicates, contact details and links; leaderboard games are verified. These safeguards protect the public space. Lobby messages stay in the shared database across exits, refreshes and devices, with no automatic expiry.",
  "联系与约稿": "Contact and commissions", "当你主动通过邮箱、微信或抖音联系时，你提供的信息只用于回复咨询与沟通需求。约稿的用途、报价、档期、修改和商用授权以双方实际确认内容为准。": "Information you voluntarily provide by email, WeChat or Douyin is used only to respond and discuss the request. Commission use, price, schedule, revisions and commercial license follow the terms both sides confirm.",
  "删除与纠错": "Deletion and correction", "登录后的上传者可以删除自己上传的照片；大厅留言不能由发布者直接撤回，但站长可以处理隐私、侵权、不适或违反规则的内容。若公开内容涉及你的权利，请提供页面位置和必要说明。": "Signed-in uploaders may delete their own photos. Lobby authors cannot retract posts directly, but the administrator may handle privacy, infringement, harmful or rule-breaking content. If public content affects your rights, provide its location and necessary context.", "发送删除或隐私请求 ↗": "Send a deletion or privacy request ↗",
  "本地偏好与阅读辅助": "Local preferences and reading assistance", "主题、档案章、游戏进度、阅读缩放、对比度、动画偏好和大厅昵称可能保存在当前浏览器。它们不会因为打开页面而发送给第三方；清除网站数据后会消失或重新生成。": "Themes, stamps, game progress, zoom, contrast, motion preferences and lobby nickname may remain in this browser. Opening the page does not send them to third parties; clearing site data removes or regenerates them.",
  "本页更新": "Policy updates", "当网站新增会保存数据的功能，或处理方式发生明显变化时，这一页会同步更新。最近整理日期：2026 年 7 月。": "This page is updated when the site adds a data-storing feature or materially changes processing. Last reviewed: July 2026.", "前往公共影像墙 →": "Open public photo wall →", "查看公共大厅规则 →": "View lobby rules →",
  "读取 JSON": "Read JSON", "这里公开“人做了什么、AI 参与了什么”以及每个文件的 SHA-256 指纹。它能帮助发现文件是否被替换，但不是受信任机构签发的 C2PA Content Credential，也不会显示虚假的“官方认证”徽章。": "This page discloses what the human did, where AI participated and each file's SHA-256 fingerprint. It can reveal replacement, but it is not a C2PA Content Credential issued by a trusted authority and does not display a false official certification badge.",
  "AI 辅助产品视觉": "AI-assisted product visual", "人工贡献": "Human contribution", "需求梳理、卖点选择、构图判断、文字与最终筛选": "Brief analysis, benefit selection, composition decisions, writing and final selection", "AI 参与": "AI participation", "参与生成和视觉草案探索": "Generation and visual-draft exploration", "公开说明": "Disclosure", "AI 辅助，不代表完全由模型自动完成": "AI-assisted does not mean fully automated by a model", "文件大小": "File size", "查看当前文件 →": "View current file →",
  "AI 辅助信息设计": "AI-assisted information design", "信息层级、内容组织、版式判断与最终筛选": "Information hierarchy, content organization, layout decisions and final selection", "参与视觉素材和草案生成": "Visual asset and draft generation",
  "AI 辅助产品叙事": "AI-assisted product storytelling", "卖点拆分、场景规划、统一风格与最终筛选": "Benefit breakdown, scene planning, style unification and final selection", "参与场景素材和视觉草案生成": "Scene asset and visual-draft generation",
  "网站分享视觉": "Website sharing visual", "Serkon 个人主页分享图": "Serkon personal-site social image", "个人网站设计、内容选择与发布决定": "Site design, content selection and publishing decisions", "参与页面与视觉方案辅助": "Assistance with page and visual directions", "用于网站分享预览；不包含受信任 C2PA 签章": "Used for social previews; contains no trusted C2PA signature",
  "为什么暂时不挂 C2PA 认证徽章？": "Why is there no C2PA certification badge yet?", "下载机器记录": "Download machine record", "查看 0 元边界": "View zero-cost boundary",
  "这是网站自行公开的来源与哈希档案，不冒充受信任机构签发的 C2PA Content Credential。": "This is the site's own public provenance and hash record; it does not impersonate a C2PA Content Credential issued by a trusted authority.", "等确认到长期免费、可验证且适合个人站点的签发方式后，才会升级为真正可验证的凭证。": "A genuinely verifiable credential will be added only after a permanently free and suitable signing method is confirmed.", "返回首页": "Back to homepage", "公开内容来源记录": "Public provenance records", "页面阅读进度": "Page reading progress", "大一在读": "University freshman", "身穿灰色西装、面带微笑的 Serkon 侯世康": "Serkon Hou Shikang smiling in a gray suit",
  "CONFIRMED / 已启用": "CONFIRMED / ENABLED", "确定为 0 成本的能力": "Confirmed zero-cost capabilities", "无障碍控制面板": "Accessibility control panel", "浏览器本地 CSS 与 localStorage": "Local browser CSS and localStorage", "静态页面": "Static pages", "机器可读资料、RSS 与 llms.txt": "Machine-readable profile, RSS and llms.txt", "构建时生成静态文件": "Generated as static files during build", "作品来源与 SHA-256 哈希档案": "Provenance and SHA-256 archive", "构建时本地计算": "Calculated locally during build", "公共大厅前期版": "Early public lobby", "沿用现有 Cloudflare Pages、Workers 与 D1 免费额度": "Uses existing Cloudflare Pages, Workers and D1 free quotas", "大厅实时在线人数": "Lobby online count", "复用现有 D1，低频匿名心跳并在页面隐藏时暂停": "Reuses D1 with low-frequency anonymous heartbeats that pause when the page is hidden", "版本更新文字档案": "Text release ledger", "源码构建时自动记录": "Automatically recorded during source build",
  "NOT ENABLED / 未启用": "NOT ENABLED", "不确定或不适合的能力": "Uncertain or unsuitable capabilities", "实名认证": "Real-name verification", "不上线": "Not enabled", "现阶段不必要，也会增加隐私与信任成本": "Unnecessary at this stage and would add privacy and trust costs", "付费内容审核 API": "Paid content-moderation API", "不符合 0 成本原则": "Conflicts with the zero-cost principle", "官方可信 C2PA 签章": "Official trusted C2PA signature", "未确认长期免费证书与签发链，不伪造认证标志": "No confirmed permanently free certificate and signing chain; no false certification mark", "旧页面按年份回放": "Replay old pages by year", "用户明确拒绝，避免历史照片、联系方式或其他隐私被重新暴露": "Explicitly rejected to avoid re-exposing old photos, contact details or private data", "外部 AI 分身": "External AI double", "免费额度与长期成本不确定": "Free quota and long-term cost are uncertain",
  "免费额度用完时，宁可暂时停，也不自动花钱。": "When a free quota ends, pause the feature rather than spend automatically.", "公共大厅、实时在线人数、排行榜和共享影像依赖现有免费额度。达到平台限制时，对应动态接口可能暂时不可用；静态主页、文字版、版本档案和机器资料仍可读取。任何升级付费方案都必须由站长主动决定。": "The lobby, presence count, leaderboard and shared gallery rely on existing free quotas. Dynamic endpoints may pause at platform limits, while the static homepage, text edition, release ledger and machine data remain readable. Any paid upgrade requires the administrator's explicit decision.", "隐私规则": "Privacy rules",
  "这是一份网站自己的成长档案。": "This is the website's own record of growth.", "从第一版到现在，每次正式更新只留下日期、版本号和主要变化。这里不保存可回放的旧页面、旧照片或旧联系方式，避免历史内容重新暴露隐私。": "From version one onward, every formal update records only its date, edition and major changes. Old pages, photos and contact details are not replayable, preventing historical content from re-exposing private information.", "持续更新中": "Continuously updated", "首版日期": "First edition", "可核实版本": "Verifiable editions", "记录方式": "Recording method", "源码变化自动追加": "Automatically appended when source changes", "从最新一版往回看": "Browse from the newest edition", "同一天可能发布多个版本，因为每一次可独立使用的正式改进都会单独留档。": "Several editions may ship on one day because each independently usable improvement receives its own record.", "当前版本": "Current edition",
  "横屏导航、双语体验与内容扩充": "Landscape navigation, bilingual experience and expanded content", "修复手机横屏目录遮挡，加入本地中英文切换，将站长随笔扩充至20条，并在创作工坊接入妙笔AI。": "Fixes the landscape menu overlap, adds a local Chinese/English switch, expands notes to 20 entries and links Miaobi AI from the creation studio.", "横屏目录改为带遮罩和滚动能力的独立浮层": "Turn the landscape directory into a scrollable overlay with a backdrop", "加入中文与English本地切换并记住访客选择": "Add a local Chinese/English switch that remembers the visitor's choice", "站长随笔由10条扩充至20条并完善双语内容": "Expand Serkon's notes from 10 to 20 with complete bilingual content", "在快捷创作工坊加入妙笔AI完整版入口": "Add the full Miaobi AI entry to the quick creation studio", "机器可读项目资料同步加入妙笔AI": "Add Miaobi AI to the machine-readable project profile", "全部能力继续遵守零成本运营原则": "Keep every capability within the zero-cost operating principle",
  "国内版安全增量与身份校验": "Domestic security increment and identity verification", "加强国内版关键响应头、接口输入边界与管理员校验，同时继续沿用固定网址和全部既有数据。": "Strengthen security headers, API input boundaries and administrator verification while preserving the fixed URL and all existing data.", "补强正式页面与接口的安全响应头": "Strengthen security headers for pages and APIs", "收紧公共输入、来源检查与异常返回边界": "Tighten public input, origin checks and error boundaries", "继续使用服务端站长密钥校验管理操作": "Continue verifying management operations with the server-side admin secret", "保留公共大厅、共享影像、排行榜与现有 D1 数据": "Preserve the lobby, shared gallery, leaderboard and existing D1 data",
  "动效灵感公开，": "Open inspiration,", "实现留在本站。": "locally built interactions.", "动效灵感公开，实现留在本站。": "Open inspiration, locally built interactions.", "本轮界面研究参考了三个公开 UI 社区，但没有整包安装，也没有直接接入外部脚本。流动显影、聚光卡片、点阵光场、信号边框与按钮扫光均使用本站已有的 React、CSS 和浏览器能力重新实现；不产生新的运行费用，也不会把访客数据发送给这些网站。": "This interface study references three public UI communities without installing their libraries or loading external scripts. Reveal effects, card spotlights, dotted light fields, signal borders and button sweeps are rebuilt with the site's existing React, CSS and browser capabilities. They add no operating cost and send no visitor data to those websites.", "文字、显影与指针互动节奏参考 ↗": "Text, reveal and pointer-rhythm reference ↗", "仅参考免费组件目录的光场与边框思路 ↗": "Light-field and border ideas from the free component catalog only ↗", "按钮扫光与微交互反馈参考 ↗": "Button sweep and micro-feedback reference ↗", "读取动效参考 JSON": "Read interaction-reference JSON",
  "沉浸式动效档案升级": "Immersive motion archive upgrade", "参考公开 UI 社区的交互模式，以本站原生 CSS 和浏览器能力加入点阵光场、聚光卡片、信号边框、墨迹显影与按钮扫光。": "Reference public UI interaction patterns and add dotted light fields, card spotlights, signal borders, ink reveals and button sweeps with native CSS and browser capabilities.", "加入跟随指针的点阵光场与卡片聚光": "Add pointer-following dotted light fields and card spotlights", "加入悬停信号边框、按钮扫光与滚动墨迹显影": "Add hover signal borders, button sweeps and scroll-triggered ink reveals", "触屏设备与减少动态效果模式自动降级": "Gracefully reduce effects on touch devices and in reduced-motion mode", "不安装新组件库、不加载外部脚本并保持零成本": "Keep zero cost with no new UI package or external runtime script", "在内容来源页和机器文件公开动效参考": "Publish interaction references on the provenance page and machine-readable layer",
  "一段不需要通关的沉浸叙事。": "An immersive story with nothing to beat.", "离开档案纸面，": "Leave the paper archive,", "进入一片宇宙。": "enter a universe.", "五幕光、距离、声音与文字。没有任务、积分或排行榜，只需要滚动、观看，并留一点时间给尚未被命名的想法。": "Five movements of light, distance, sound and words. No missions, points or leaderboard—just scroll, watch and leave some time for ideas not yet named.", "进入 Serkon Cosmos": "Enter Serkon Cosmos",
  "播放原创音乐": "Play original music", "声音已开启": "Sound on", "宇宙章节": "Cosmos chapters", "跳到宇宙叙事": "Skip to the cosmos story", "滚动穿越": "SCROLL TO TRAVEL",
  "从一个念头，": "From one thought,", "这里没有任务和分数。只留一点时间给尺度、光和仍未被命名的想法。": "There are no missions or scores here. Just a little time for scale, light and ideas that have not yet been named.",
  "好奇心，": "Curiosity", "是最早的引力。": "is the earliest gravity.", "它把 AI、影像、声音与网页拉进同一条轨道，也让第一版不断靠近下一版。": "It pulls AI, imagery, sound and the web into one orbit, carrying every first edition toward the next.",
  "距离很远，": "The distance is vast,", "感受可以很近。": "but feeling can be close.", "屏幕只有几毫米厚，却能让陌生人在不同时间看见同一个瞬间。技术真正迷人的，是它缩短理解的距离。": "A screen is only millimeters thick, yet lets strangers witness the same moment at different times. Technology is most compelling when it shortens the distance to understanding.",
  "把今天的信号，": "Send today's signal", "发给未来。": "into the future.", "多年以后回头看，希望这里留下的不只是效果，而是一个普通人很早就愿意认真想象未来的证据。": "Years from now, I hope this holds more than effects: evidence that an ordinary person chose early to imagine the future seriously.",
  "宇宙很大，": "The universe is vast,", "生活仍是坐标。": "life remains the coordinate.", "探索不是逃离现实。每一次回望，都为了带着新的尺度继续生活、继续创造。": "Exploration is not an escape from reality. Every look back helps us return with a new sense of scale—to live and create again.",
  "宇宙叙事包含五幕文字：起源、轨道、距离、传输与返回。开启 JavaScript 可观看本地星空动效。": "The cosmos story has five acts: origin, orbit, distance, transmission and return. Enable JavaScript for the locally rendered starfield.",
  "独立沉浸空间设计定稿": "Independent immersive-space direction", "确定将动态前端体验放入独立模块，保持主页原有编辑档案画风与阅读节奏。": "Place the dynamic front-end experience in an independent module, preserving the homepage's editorial archive style and reading rhythm.", "明确首页只保留克制入口": "Keep only a restrained entry on the homepage", "确定沉浸模块不加入游戏任务与积分": "Keep games, missions and points out of the immersive module", "确定全部视觉使用本地浏览器能力实现": "Build all visuals with local browser capabilities",
  "Serkon Cosmos 宇宙沉浸档案": "Serkon Cosmos immersive archive", "上线由五幕滚动叙事、实时星空、轨道光场与原创音乐组成的独立宇宙体验。": "Launch an independent cosmos experience with five scroll-driven scenes, a real-time starfield, orbital light and original music.", "上线独立 Serkon Cosmos 宇宙入口": "Launch the standalone Serkon Cosmos entry", "加入起源、轨道、距离、传输与返回五幕叙事": "Add five scenes: origin, orbit, distance, transmission and return", "使用 Canvas 实现本地星空、轨道与指针视差": "Render the local starfield, orbits and pointer parallax with Canvas", "提供中英双语、键盘导航与减少动态效果降级": "Provide bilingual copy, keyboard navigation and reduced-motion fallback", "可选播放站内原创音乐且不自动播放": "Offer optional original music without autoplay", "参考 MotionSites 的沉浸叙事方向并公开来源": "Disclose MotionSites as an immersive-storytelling reference",
  "以后更新，档案会跟着长大。": "The archive grows with every future update.", "网站进入构建时会比对真正参与页面运行的源码。内容有变化，就自动追加下一版；同一份内容重复构建，不会重复生成版本。更新摘要会按页面、视觉、互动、数据和维护范围自动归类，也可以在发布时写得更具体。更新记录保留，但明确不提供旧页面“时光机”或按年份回放。": "During each build, the site compares the source that actually runs the page. A real change appends the next edition; rebuilding identical content creates no duplicate. Summaries are classified by page, visuals, interactions, data and maintenance, and can be made more specific at release time. The record remains, but there is deliberately no old-page time machine or yearly replay.", "隐私与公共上传规则 →": "Privacy & public upload rules →", "用同样的情绪继续写一段 →": "Continue writing in this mood →", "共享影像正在连接，请稍后刷新页面": "Connecting to the shared gallery—please refresh shortly.",
};

const RELEASE_EN: Record<string, string> = {
  "个人主页首版": "First personal-site edition", "Serkon 个人主页首次上线，完成个人介绍、兴趣与作品的基础结构。": "The first Serkon personal site launches with the core profile, interests and project structure.", "建立个人主页首屏与人物介绍": "Build the homepage hero and personal introduction", "加入兴趣爱好和作品案例": "Add interests and project cases", "形成可公开访问的数字名片": "Create a publicly accessible digital identity",
  "资料与作品补全": "Expanded profile and work", "更新个人资料、兴趣、作品案例与微信联系方式。": "Update the profile, interests, project cases and WeChat contact.", "补充个人资料和兴趣": "Expand profile and interests", "丰富作品内容": "Enrich project content", "加入微信联系入口": "Add a WeChat contact entry",
  "公开互动版": "Public interactive edition", "网站开放公开访问，加入基础互动并更新人物主视觉。": "Open the site to the public, add basic interactions and update the portrait hero.", "调整公开访问状态": "Enable public access", "加入基础互动": "Add basic interactions", "更新首页人物照片": "Update the homepage portrait",
  "互动实验室上线": "Interactive lab launch", "新增主题切换、默契测试、灵感卡和视频片段。": "Add theme switching, a compatibility quiz, idea cards and video moments.", "加入多套主题": "Add multiple themes", "上线默契测试与灵感卡": "Launch the compatibility quiz and idea cards", "补充生活视频片段": "Add everyday video moments",
  "社交联系补充": "More social contacts", "补充抖音联系方式，让访客有更多联系渠道。": "Add Douyin so visitors have more ways to get in touch.", "加入抖音联系入口": "Add a Douyin contact entry", "整理联系信息层级": "Improve the contact hierarchy",
  "创作与音乐扩展": "Creation and music expansion", "新增摘要提取、原创音乐播放器与捕捉灵感游戏。": "Add summary extraction, an original-music player and the Catch the Idea game.", "加入快捷创作工具": "Add quick creation tools", "上线原创音乐播放器": "Launch the original-music player", "新增捕捉灵感小游戏": "Add the Catch the Idea mini-game",
  "生活与游戏分区": "Life and game sections", "加入北京资料、生活影像、独立游戏页面与应用启动入口。": "Add Beijing details, life visuals, a standalone game page and app launch links.", "补充所在地资料": "Add location details", "上线生活影像页面": "Launch the life gallery", "加入独立游戏路由与启动入口": "Add a dedicated game route and launch entry",
  "个人创作工具栏": "Personal creation toolbar", "新增原创音乐、创作工具栏、匹配测试与访客卡片。": "Add original music, a creation toolbar, a match quiz and visitor cards.", "扩充原创音乐体验": "Expand the original-music experience", "加入创作工具栏": "Add the creation toolbar", "上线匹配测试与访客卡片": "Launch the match quiz and visitor cards",
  "成长档案扩充": "Growth archive expansion", "加入怀旧留言、设备内榜单、任务与站长随笔。": "Add nostalgic messages, an on-device leaderboard, quests and Serkon's notes.", "新增访客留言": "Add visitor messages", "加入本设备榜单和任务": "Add an on-device leaderboard and quests", "上线站长随笔": "Launch Serkon's notes",
  "分享与导航完善": "Sharing and navigation improvements", "扩充随笔与测试，改进分享、导航和访客编号。": "Expand notes and quizzes while improving sharing, navigation and visitor IDs.", "扩展随笔内容": "Expand note content", "完善测试体验": "Improve the quiz experience", "优化分享与页面导航": "Improve sharing and page navigation",
  "访客体验升级": "Visitor experience upgrade", "升级个性化访客卡、可读主题、照片上传权限与作品案例。": "Upgrade personalized visitor cards, readable themes, photo permissions and project cases.", "增强访客卡个性化": "Improve visitor-card personalization", "提升主题可读性": "Improve theme readability", "补充照片权限和作品详情": "Expand photo permissions and project details",
  "共享生活影像墙": "Shared life gallery", "上线共享生活影像墙，并调整个人阶段信息。": "Launch the shared life gallery and update personal-stage information.", "支持访客共享生活影像": "Let visitors share life visuals", "加入上传者删除权限": "Add uploader deletion permission", "更新个人阶段表述": "Update the description of the current life stage",
  "百张灵感卡": "One hundred idea cards", "灵感卡扩充为 100 张不重复内容，并修正资料编号。": "Expand idea cards to 100 non-repeating prompts and correct profile numbering.", "扩充 100 张灵感内容": "Expand to 100 idea prompts", "控制单轮不重复": "Prevent repeats within a round", "修正个人资料编号": "Correct profile numbering",
  "记忆翻牌与站点说明": "Memory Flip and site notes", "将摘要工具改为记忆翻牌，加入站点说明与备用邮箱。": "Replace the summary tool with Memory Flip and add site notes plus a backup email.", "上线记忆翻牌": "Launch Memory Flip", "补充站点使用说明": "Add site usage notes", "加入备用联系邮箱": "Add a backup contact email",
  "全站排行榜": "Global leaderboard", "加入全站持久排行榜并完善游戏交互反馈。": "Add a persistent site-wide leaderboard and improve game feedback.", "上线跨访客排行榜": "Launch a cross-visitor leaderboard", "保存历史最高分": "Save all-time best scores", "完善游戏状态反馈": "Improve game-state feedback",
  "专业体验与安全整改": "Professional experience and security update", "完善约稿流程、无障碍、隐私和上传安全。": "Improve the commission flow, accessibility, privacy and upload security.", "重整约稿与联系流程": "Restructure commissions and contact", "补强键盘和读屏体验": "Strengthen keyboard and screen-reader support", "完善隐私、限流和图片校验": "Improve privacy, rate limits and image validation",
  "视觉档案与玩法升级": "Visual archive and gameplay upgrade", "升级编辑档案式画风、真实作品展示与互动游戏群。": "Upgrade the editorial archive art direction, real project display and interactive game collection.", "形成旧纸档案与年轻 AI 实验室画风": "Create the old-paper archive and young AI-lab style", "作品区改用真实成果视觉": "Use real project visuals in the work section", "加入创作节奏、照片侦探、人生分支等玩法": "Add rhythm creation, photo detective, life branches and more",
  "版本档案与双版本同步": "Release archive and dual-version sync", "新增版本更新档案与自动记录机制，统一原站与国内版的更新依据。": "Add the release archive and automatic recording mechanism, unifying the source for the original and domestic sites.", "完整整理第 1 版至第 18 版的发布日期与更新内容": "Organize release dates and changes from editions 1 through 18", "新增独立版本记录页面、首页入口和搜索索引": "Add a standalone release page, homepage entry and search index", "未来源码发生变化时自动追加新版本且避免重复记录": "Automatically append future source changes without duplicate records",
  "匿名公共大厅与开放零成本能力": "Anonymous lobby and open zero-cost capabilities", "上线不要求实名的全站公共大厅，并补齐无障碍、轻量阅读、机器可读资料、内容来源哈希与零成本构建保护。": "Launch a site-wide lobby without real-name verification and add accessibility, low-bandwidth reading, machine-readable data, provenance hashes and zero-cost build protection.", "上线匿名公共大厅、举报流程与站长管理台": "Launch the anonymous lobby, reporting flow and admin console", "加入阅读辅助控制和纯文字轻量版": "Add reading controls and the text-only edition", "生成机器可读资料、RSS 与 llms.txt": "Generate machine-readable data, RSS and llms.txt", "公布作品来源、人工与 AI 分工及 SHA-256 哈希": "Publish provenance, human/AI roles and SHA-256 hashes", "新增零成本构建闸门与免费额度边界": "Add a zero-cost build gate and free-quota boundaries", "明确版本记录不保存或回放旧页面": "Clarify that the release ledger does not preserve or replay old pages",
  "持久大厅与未来交互层": "Persistent lobby and future interaction layer", "修复公共大厅发送引导并补齐精确时间与完整历史读取，同时上线流动文字、照片扫描、卡片倾斜、磁性按钮和阅读进度等交互设计。": "Fix lobby posting guidance and add precise timestamps plus complete history loading, while launching fluid text, photo scanning, card tilt, magnetic buttons and reading progress.", "大厅发送按钮改为可操作并提供明确的缺项提示": "Make the lobby send button actionable with clear missing-field guidance", "所有留言统一显示精确到秒的北京时间": "Show every message with Beijing time to the second", "取消前端最近 200 条限制，允许持续读取全部历史留言": "Remove the latest-200 client limit and allow full history loading", "公开说明消息写入共享数据库且不会因退出或换设备消失": "Explain that messages enter the shared database and survive exits or device changes", "上线流动文字、照片扫描、卡片倾斜、磁性按钮和章节阅读进度": "Launch fluid text, photo scanning, card tilt, magnetic buttons and chapter progress", "公开展示已上线的无障碍、轻量版、机器层、来源档案与零成本入口": "Expose the live accessibility, light edition, machine layer, provenance and zero-cost links",
  "大厅发送确认体验修正": "Lobby posting confirmation fix", "公共大厅发送前确认改为默认勾选，减少访客误以为发送功能失效的情况，同时继续保留公开与不可自行删除说明。": "Check posting confirmation by default so visitors do not mistake the send action for being broken, while retaining the public and non-deletable notice.", "公共大厅发送前确认改为默认勾选": "Check the lobby posting confirmation by default", "保留公开展示与发布后不可自行删除的醒目说明": "Keep a prominent public and non-deletable notice", "访客主动取消确认时继续阻止发送并提示原因": "Block posting and explain why when the visitor actively unchecks confirmation",
  "世界频道实时在线人数": "Real-time world-channel presence", "公共大厅上线真实活跃访客计数，以低频匿名心跳显示当前在线人数，并补齐零成本与隐私说明。": "Add a real active-visitor count using low-frequency anonymous heartbeats, with zero-cost and privacy documentation.", "世界频道显示真实的实时在线人数": "Show a real-time active visitor count", "在线状态按最近2分钟活跃统计并每30秒刷新": "Count activity from the last two minutes and refresh every 30 seconds", "同一匿名设备低频写入且页面隐藏时暂停轮询": "Write low-frequency heartbeats per anonymous device and pause when hidden", "在线状态记录最多保留24小时且不公开名单": "Retain presence records for at most 24 hours without a public list", "复用现有D1免费额度并在额度不足时自动降级": "Reuse the existing D1 free quota and degrade gracefully at the limit",
  "公共大厅视觉与玩法引导": "Lobby visuals and gameplay guidance", "将世界频道整理为更聚焦的信号卡片流，补齐个人线索小游戏的三步说明与逐项玩法提示，并调整公开能力入口文案。": "Refine the world channel into focused signal cards, add a three-step guide and per-activity instructions for personal clues, and adjust capability-link copy.", "留言改为居中的独立信号卡片并取消贯穿式横线": "Use centered independent signal cards instead of full-width divider rows", "昵称、编号、时间、正文与操作收束为统一视觉组": "Group nickname, ID, time, body and actions into one visual unit", "优化公告、快捷留言、输入框与发送按钮的层次": "Improve the hierarchy of notices, quick replies, inputs and send action", "为个人线索小游戏新增第一次访问三步引导": "Add a three-step first-visit guide to the personal-clue games", "五种玩法随当前标签显示对应操作说明": "Show instructions for the currently selected activity", "移除两个功能入口的0元小标签并保留0元运营原则": "Remove two zero-yuan badges while keeping the zero-cost principle",
};

const MOTION_LAB_EN: Record<string, string> = {
  "动态思想档案": "Motion archive",
  "一段不需要通关的动态思想叙事。": "A motion-led story with nothing to beat.",
  "把想法变成，": "Turn thoughts into",
  "会运动的画面。": "images that move.",
  "五幕滚动镜头连接 20 条站长随笔、个人影像与真实作品。没有任务、积分或排行榜；页面会回应滚动、指针、键盘与触碰。": "Five scroll-driven scenes connect 20 notes, personal imagery and real work. No missions, scores or leaderboard—the page responds to scrolling, pointer, keyboard and touch.",
  "进入动态思想档案": "Enter the motion archive",
  "跳到动态叙事": "Skip to the motion story",
  "动态章节": "Motion chapters",
  "滚动推进镜头": "SCROLL TO DIRECT",
  "先看到，": "See it first,",
  "后理解。": "understand it next.",
  "第一幕先制造冲击：文字、人物和空间不是排成一页，而是像镜头一样同时进入视野。": "The opening creates impact: type, portrait and space enter together like a shot, not a conventional page.",
  "兴趣不是清单，": "Interests are not a list,",
  "是一条路线。": "but a route.",
  "AI、影像、产品视觉、音乐与网页彼此连接；滚动不是翻页，而是在 Serkon 的线索之间移动。": "AI, imagery, product visuals, music and the web connect. Scrolling does not turn pages—it moves between Serkon's clues.",
  "真正好看的，": "What looks truly good",
  "不只是效果。": "is more than an effect.",
  "每一次放大、遮罩与转场都必须解释内容：强调什么、隐藏什么，以及下一步为什么出现。": "Every zoom, mask and transition must explain the content: what matters, what recedes and why the next step appears.",
  "页面应该，": "The page should",
  "回应你的动作。": "respond to you.",
  "移动指针、使用键盘或触碰卡片，画面会重新编排。你不是旁观者，而是这一刻的共同导演。": "Move the pointer, use the keyboard or touch a card and the composition rearranges. You are not only watching—you co-direct the moment.",
  "第一版，": "Version one",
  "从来不是终点。": "is never the end.",
  "这不是一个模板的复刻，而是一份持续生长的个人动态作品。下一次更新，会从这一次继续向前。": "This is not a template replica, but an evolving personal motion work. The next edition will move forward from this one.",
  "AI / 想象": "AI / IMAGINATION",
  "视觉 / 秩序": "VISUAL / ORDER",
  "工程 / 真实": "BUILD / REALITY",
  "生活 / 感受": "LIFE / FEELING",
  "安静阅读全部 20 条随笔": "Read all 20 notes quietly",
  "带着新的尺度返回主页": "Return home with a new perspective",
  "动态实验室包含五幕文字与作品线索。开启 JavaScript 可观看本地滚动、指针与画面重组效果。": "The motion lab contains five acts of writing and project clues. Enable JavaScript for local scroll, pointer and compositional motion.",
  "Serkon 动态思想档案与导航升级": "Serkon motion archive and navigation upgrade",
  "将强动态滚动叙事、20 条站长随笔与个人作品线索合并，并补齐首页、顶部与横屏目录入口。": "Merge high-motion scroll storytelling, 20 notes and personal work clues, while adding clear homepage, top and landscape-menu entries.",
  "将 Serkon Cosmos 重构为原创动态思想档案": "Rebuild Serkon Cosmos as an original motion archive",
  "五幕叙事分别连接全部 20 条站长随笔": "Connect all 20 notes across five narrative acts",
  "加入大字重组、人物遮罩、作品卡片与验证流程动效": "Add kinetic type, portrait masks, project cards and a verification sequence",
  "顶部和手机横屏目录增加清晰入口": "Add clear entries to desktop and landscape mobile navigation",
  "保留纯文字随笔页作为安静阅读与无障碍版本": "Keep the text notes page for quiet reading and accessibility",
  "仅参考 MotionSites 公开展示并使用本地 React、Canvas 与 CSS 原创实现": "Reference only MotionSites' public showcase and rebuild originally with local React, Canvas and CSS",
  "界面研究参考了三个公开 UI 社区及 MotionSites 的公开展示与用户提供录屏，但没有购买、复制或接入其付费模板、提示词、代码与素材。流动显影、聚光卡片、点阵光场、信号边框、按钮扫光与 Serkon 动态思想档案均使用本站已有的 React、Canvas、CSS 和浏览器能力原创实现；不产生新的运行费用，也不会把访客数据发送给这些网站。": "This interface study references three public UI communities, MotionSites' public showcase and user-provided recordings, without buying, copying or connecting its paid templates, prompts, code or assets. Reveals, spotlights, dotted fields, signal borders, button sweeps and the Serkon motion archive are rebuilt originally with the site's existing React, Canvas, CSS and browser capabilities. They add no operating cost and send no visitor data to those sites.",
  "仅参考公开展示的镜头式滚动与层级节奏，本站原创实现 ↗": "Public cinematic scrolling and hierarchy are references only; this site is an original implementation ↗",
};

Object.assign(EN, UI_EN, RELEASE_EN, MOTION_LAB_EN, Object.fromEntries(NOTE_EN));

Object.assign(EN, {
  "此刻正在推进": "What I am building now",
  "不是模糊的“持续更新”，而是现在真正投入时间的三件事。": "Not a vague “continuously updated” label, but three things receiving real attention now.",
  "第 31 版内容升级": "Edition 31 content upgrade",
  "用四条真实案例、精选影像和独立互动归档，把首页重整为更清晰的个人叙事。": "Reshape the homepage into a clearer personal story through four real cases, curated images and a dedicated interactive archive.",
  "第30版·基础质量修复": "Edition 30 · Foundation quality fixes",
  "补齐完整双语、搜索入口、站点地图、robots、品牌化错误页与安全响应头，并完成正式部署验收。": "Complete bilingual coverage, search entry points, sitemap, robots, a branded error page and security headers, followed by production verification.",
  "补齐双语文本、图片替代文字与页面元信息": "Complete bilingual text, image alternatives and page metadata",
  "加入动态站点地图、robots与品牌化404页面": "Add dynamic sitemap and robots routes plus a branded 404 page",
  "补齐内容安全策略、HSTS与跨窗口隔离等安全响应头": "Add CSP, HSTS, cross-window isolation and other security headers",
  "完成构建、路由、响应头与正式部署验收": "Verify the build, routes, response headers and production deployment",
  "第31版·内容与结构升级": "Edition 31 · Content and structure upgrade",
  "重整首页信息层级，补齐四大真实作品案例、精选生活影像、NOW 状态与独立互动归档。": "Restructure the homepage with four real project cases, curated life images, a NOW board and a dedicated interactive archive.",
  "首页按当前关注、兴趣、作品与独立入口重整层级": "Restructure the homepage around current focus, interests, work and dedicated entry points",
  "四个作品案例改为不同方向并公开问题、过程与结果": "Present four distinct project directions with their problems, process and outcomes",
  "加入六张精选创作与生活影像并保护第三方隐私": "Add six curated creation and life images while protecting third-party privacy",
  "互动档案与网站系统层改为独立页面": "Move the interactive archive and website system layer to dedicated pages",
  "加入 NOW 状态板并减少首页重复功能陈列": "Add a NOW board and reduce repeated feature displays on the homepage",
  "微信年轮": "WeChat Yearbook",
  "继续完善面向完整聊天记录的本地分析与双系统使用体验，安全边界优先于功能数量。": "Continue improving local analysis of complete chat records and the two-system experience, with safety ahead of feature count.",
  "强鹰彩色胶": "Qiangying Color Sealant",
  "继续整理产品视觉、规格信息与销售场景，让网站真正服务于理解和沟通。": "Continue refining product visuals, specifications and sales contexts so the site genuinely supports understanding and communication.",
  "不再重复陈列同一个项目：这里选择四条不同方向，并同时公开问题、我的角色、过程与当前结果。": "No repeated slices of the same project: these four directions disclose the problem, my role, process and current result.",
  "强鹰彩色胶·产品视觉系统": "Qiangying Color Sealant · Product Visual System",
  "伦敦 Vlog·AI 影像实验": "London Vlog · AI Film Experiment",
  "《创世纪》·原创音乐发布": "Genesis · Original Music Release",
  "妙笔 AI 全能文案助手": "Miaobi AI Writing Workspace",
  "另外两项可直接使用的产品": "Two more products you can open now",
  "它们不冒充视觉案例，但同样是已经做出来、可以打开验证的真实成果。": "They are not presented as visual case studies, but they are real products that can be opened and verified.",
  "打开产品": "Open product",
  "查看开源项目": "View open-source project",
  "把兴趣变成，": "Turn interests into",
  "可以亲自试的线索。": "clues you can try yourself.",
  "主题切换、100 张灵感卡、记忆翻牌、灵感球和五种个人线索玩法已移入独立互动档案。首页只保留说明，想玩时再进入，不打断作品阅读。": "Themes, 100 idea cards, memory matching, the inspiration orb and five personal-clue activities now live in a dedicated playable archive. The homepage keeps only the explanation so work remains easy to read.",
  "任选一个玩法": "Choose any activity",
  "按照当前提示操作": "Follow its instructions",
  "完成后收下档案线索": "Collect the archive clue",
  "进入完整互动档案": "Open the full playable archive",
  "六项能力，收进一个清晰入口。": "Six capabilities, one clear entrance.",
  "首页只回答“为什么值得了解”；完整说明、状态与公开文件集中到系统层，减少重复浏览。": "The homepage explains why these capabilities matter; full descriptions, status and public files are gathered in the system layer.",
  "打开网站系统层": "Open the website system layer",
  "网站系统层": "Website system layer",
  "把整座网站，玩成一份个人档案。": "Turn the whole site into a personal field file.",
  "怎么玩：": "How it works:",
  "互动档案": "Playable archive",
  "第一次来，任选一项开始。每个玩法都有独立说明；除全站排行榜外，操作主要保存在当前浏览器，不需要下载应用。": "First time here? Start anywhere. Every activity explains itself; except for the public leaderboard, progress mainly stays in this browser and needs no app download.",
  "返回个人主页": "Return to the homepage",
  "动态思想档案": "Motion archive",
  "把技术能力从首页的视觉噪音中移出来，集中说明它们解决什么问题、现在能做什么，以及公开入口在哪里。": "Move technical capabilities out of the homepage noise and clearly explain what they solve, what is available now and where to verify it.",
  "网站公开能力": "Public website capabilities",
  "能力必须真实存在、说明必须可以验证、成本边界必须公开；如果某项服务需要付费或无法确认，就不把它包装成已经上线。": "Capabilities must exist, claims must be verifiable and cost boundaries must be public. Anything paid or uncertain is never presented as already available.",
  "这页不在档案里。": "This page is not in the archive.",
  "链接可能已经变化，或者你来到了一个尚未公开的页面。可以从下面三个真实入口继续。": "The link may have changed, or this page is not public yet. Continue through one of these three real routes.",
  "浏览创作与生活影像": "Browse creative and life imagery",
  "查看版本记录": "View the release ledger",
  "先看站长精选，再进入所有人共同留下的公共影像墙。": "Start with Serkon's selection, then enter the public wall shared by all visitors.",
  "这里同时收录个人瞬间、创作过程和已经公开的作品证据；直播后台截图因包含其他人的昵称与评论，未直接公开展示。": "This archive includes personal moments, process records and evidence of published work. A livestream-console screenshot is withheld because it contains other people's names and comments.",
  "个人瞬间": "Personal moments",
  "创作过程": "Creative process",
  "视觉作品": "Visual work",
  "音乐": "Music",
  "当前状态": "Current status",
  "返回首页": "Return home",
  "主导航": "Primary navigation",
  "网站主题": "Website theme",
  "翻牌难度": "Memory-game difficulty",
  "未翻开的记忆卡": "Hidden memory card",
  "把兴趣变成能玩的个人线索": "Turn interests into playable personal clues",
  "玩法说明": "How to play",
  "玩法选择": "Activity selection",
  "可约稿方向": "Commission services",
  "公共大厅规则预览": "Public lobby rules preview",
  "身穿灰色西装、面带微笑的 Serkon 侯世康": "Serkon smiling in a grey suit",
  "灰色西装正面照": "Front portrait in a grey suit",
  "例如：高中最后一个夏天": "For example: the last summer of high school",
  "侯世康": "Hou Shikang",
  "进入全站共享的": "Enter the site-wide",
  "把 126 色、两类产品规格、施工场景与核心卖点组织成一套可持续扩展的网站与销售视觉。": "Organize 126 colors, two product formats, application scenes and core benefits into an extensible website and sales system.",
  "真实商业项目": "Real commercial project",
  "让访客在很短时间内理解产品是什么、颜色有多少、适合哪些场景，并为后续销售沟通提供统一素材。": "Help visitors quickly understand the product, its color range and applications while creating consistent material for sales conversations.",
  "梳理硬支与软支产品信息": "Structure cartridge and foil-pack product information",
  "建立色彩、场景与规格层级": "Build a hierarchy for color, scenarios and specifications",
  "把主视觉、详情与网站整合上线": "Integrate the hero visual, details and website",
  "已形成可公开访问的完整产品网站，主视觉、规格信息与六项卖点使用同一套表达逻辑": "A complete public product site now uses one visual logic across the hero, specifications and six benefit areas.",
  "已上线 01": "LIVE 01",
  "把复杂产品讲清楚": "Make a complex product clear",
  "产品网站": "Product site",
  "信息设计": "Information design",
  "视觉系统": "Visual system",
  "销售素材": "Sales assets",
  "从素材规划、镜头生成到超清导出，尝试把 AI 图像组织成一条有场景逻辑的旅行短片工作流。": "From shot planning and generation to final export, organize AI images into a travel-film workflow with visual continuity.",
  "创作过程实录": "Documented creative process",
  "不是只生成一张好看的图，而是验证人物、地标、食物与街景能否被组织成连续的旅行叙事。": "Go beyond one attractive image and test whether people, landmarks, food and streets can form a continuous travel narrative.",
  "规划伦敦地标与人物镜头": "Plan London landmark and portrait shots",
  "生成并筛选可衔接素材": "Generate and select connectable material",
  "统一画面并完成视频导出": "Unify the visuals and export the film",
  "保留了从 AI 素材工作区到视频导出设置的完整过程证据，形成可继续迭代的影像流程": "The full trail from AI workspace to export settings is preserved as evidence of a repeatable film workflow.",
  "实验完成 02": "EXPERIMENT 02",
  "从单张图走向镜头叙事": "From single images to shot-led storytelling",
  "镜头策划": "Shot planning",
  "AI 影像": "AI filmmaking",
  "后期导出": "Post-production export",
  "镜头板": "Shot board",
  "视觉素材": "Visual assets",
  "视频导出": "Film export",
  "把关于宇宙、回声与创造的文字写成原创歌曲，并完成公开发布，让个人网站拥有自己的声音。": "Turn writing about space, echoes and creation into an original song and public release, giving the personal site a sound of its own.",
  "真实公开成果": "Real public result",
  "音乐不是装饰，而是个人表达的一部分；从主题、歌词到发布页面都围绕同一套创作世界观。": "Music is part of personal expression, not decoration; its concept, lyrics and release page share one creative world.",
  "确定宇宙与创造主题": "Define the space-and-creation theme",
  "完成歌词与声音表达": "Complete the lyrical and sonic expression",
  "发布并接入网站互动档案": "Publish and connect it to the playable archive",
  "《创世纪》已在网易云音乐公开发布，并作为站内可选音乐与档案线索使用": "Genesis is publicly released on NetEase Cloud Music and used as optional music and an archive clue on this site.",
  "已发布 03": "RELEASED 03",
  "让网站拥有自己的声音": "Give the site its own sound",
  "原创音乐": "Original music",
  "歌词表达": "Lyric writing",
  "公开发布": "Public release",
  "原创歌曲": "Original song",
  "发布页面": "Release page",
  "站内播放器": "On-site player",
  "从第一版数字名片发展为包含作品、公共大厅、生活影像、动态叙事与机器可读资料的长期个人产品。": "Grow a first-version calling card into a long-term personal product with work, a public lobby, visual archive, motion storytelling and machine-readable data.",
  "持续更新的个人产品": "An evolving personal product",
  "不把网站当一次性展示页，而是把内容、交互、数据、安全、无障碍与版本记录作为同一件长期产品来维护。": "Treat the site as a long-term product where content, interaction, data, safety, accessibility and releases are maintained together.",
  "从个人资料建立第一版": "Build version one from personal material",
  "按真实反馈补齐功能与安全": "Improve capability and safety from real feedback",
  "持续重整结构并公开版本记录": "Keep refining structure and publish the release ledger",
  "已形成可持续更新、可双语阅读、可互动并拥有公开更新档案的个人数字空间": "An evolving bilingual and interactive personal space now includes a public release archive.",
  "持续上线 04": "EVOLVING 04",
  "第一版之后继续生长": "Keep growing after version one",
  "产品设计": "Product design",
  "网页工程": "Web engineering",
  "持续迭代": "Continuous iteration",
  "体验设计": "Experience design",
  "前后端功能": "Front- and back-end capability",
  "版本体系": "Release system",
  "同一天也可以有很多种表情": "One day can hold many expressions",
  "从地标、食物到人物，把零散画面整理成一条镜头路线": "Arrange landmarks, food and people into one visual route",
  "画面生成之后，还要面对分辨率、帧率与导出细节": "After generation come resolution, frame rate and export details",
  "蓝色星海与金色线条组成的品牌符号实验": "A brand-symbol experiment in cosmic blue and gold lines",
  "个人网站第一版完成时，留下的一张过程记录": "A process record from the completion of the site's first version",
  "《创世纪》公开发布，让网站拥有属于自己的声音": "Genesis goes public and gives the site a sound of its own",
  "Serkon 侯世康的个人主页，记录兴趣、AI 创作与成长中的作品。": "Serkon Hou Shikang's personal site: interests, AI creation and work in progress.",
  "Serkon 的个人瞬间、创作过程、视觉作品与公共生活影像记录。": "Serkon's personal moments, creative process, visual work and public life archive.",
  "把 Serkon 的 AI、影像、游戏、音乐与个人线索变成可以亲自体验的互动档案。": "A playable archive connecting Serkon's AI, imagery, games, music and personal clues.",
  "Serkon 个人网站的无障碍、低带宽、机器可读、来源、零成本与版本记录入口。": "Accessibility, low-bandwidth, machine-readable, provenance, zero-cost and release layers of Serkon's site.",
  "强鹰彩色胶产品色彩主视觉，展示多色胶条、产品包装与适用范围": "Qiangying color-sealant hero visual showing its color range, packaging and applications",
  "伦敦 Vlog 的 AI 影像素材工作区，展示地标、人物和食物镜头": "AI visual workspace for the London vlog, showing landmarks, people and food shots",
  "原创歌曲《创世纪》在网易云音乐的公开发布页面": "Public NetEase Cloud Music release page for the original song Genesis",
  "Serkon 个人网站第一版在 ChatGPT Sites 中完成时的工作记录": "Process record from the first Serkon personal-site build in ChatGPT Sites",
});

const FRAGMENTS: Array<[string, string]> = [
  ["“我想很早就去尝试", "“I want to explore "], ["新的技术", "new technology"], ["，更在意前所未见的想法；先做出第一版，再一路把它变得更好。”", " early, pursue unseen ideas, build version one, and keep making it better.”"],
  ["保持好奇，", "Stay curious, "], ["继续创造。", "keep creating."],
  ["接受私人定制", "Private commissions"], ["和商用约稿", "and commercial work"],
  ["把你的天马行空告诉我，", "Tell me your wildest idea, "], ["我用 AI 帮你实现。按需求单独报价，先确认档期再开始。", "and I will help bring it to life with AI. Each brief is quoted after availability is confirmed."],
  ["网站的另一层，", "Another layer of the site "], ["一起聊聊", "Let's talk about "], ["或者下一件作品。", "or your next project."],
  ["个人主页 · 第 ", "PERSONAL SITE · EDITION "], [" 版 · 持续更新中", " · CONTINUOUSLY UPDATED"],
  [" 项输出", " deliverables"], ["打开产品", "Open product"], ["查看开源项目", "View open-source project"], ["打开网站系统层", "Open the website system layer"],
  ["© 2026 Serkon 侯世康 · ", "© 2026 Serkon 侯世康 · "], ["个人档案局 · ", "ARCHIVE OFFICE · "], [" / 开场", " / OPENING"],
  ["今日灵感", "DAILY IDEA"], ["已收藏 ", "SAVED "],
];

const SUBJECT_EN: Record<string, string> = {
  "小时候最舍不得吃完的一包零食": "the childhood snack you never wanted to finish",
  "一个多年没登录的 QQ 账号": "a QQ account left untouched for years",
  "北京深夜最后一班公交车": "Beijing's last late-night bus",
  "王者荣耀里一次默契的团战": "a perfectly coordinated Honor of Kings team fight",
  "朋友围坐时的一局扑克牌": "a card game around the table with friends",
  "大一宿舍熄灯后的十分钟": "the ten minutes after lights-out in a freshman dorm",
  "相册里一张舍不得删除的旧照片": "an old photo you cannot delete",
  "一首还没有被很多人听见的原创歌": "an original song few people have heard",
  "一个拥有自己性格的 AI 分身": "an AI double with a personality of its own",
  "一枚只属于自己的旧式印章": "a vintage seal that belongs only to you",
  "街角营业到凌晨的便利店": "a corner convenience store open past midnight",
  "雨后反光的小巷": "an alley reflecting the rain",
  "五年后的自己寄来的一封信": "a letter sent by yourself five years from now",
  "聊天框里一条没有发送的消息": "an unsent message in a chat box",
  "城市楼顶短暂出现的晚霞": "a brief sunset over the city rooftops",
  "最近反复出现的一个梦": "a dream that keeps returning",
  "摆满杂物却很安心的书桌": "a cluttered but comforting desk",
  "口袋里忘记丢掉的一张旧票根": "an old ticket stub forgotten in a pocket",
  "朋友突然笑出声的那个瞬间": "the moment a friend suddenly bursts out laughing",
  "一件看起来毫不起眼的日用品": "an ordinary-looking everyday object",
};

const originals = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function translateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const exact = EN[trimmed.replace(/\s+/g, " ")];
  if (exact) return value.replace(trimmed, exact);
  let next = value;
  for (const [zh, en] of FRAGMENTS) if (next.includes(zh)) next = next.replaceAll(zh, en);
  const subjectMatch = trimmed.match(/“([^”]+)”/);
  if (subjectMatch) {
    const subject = SUBJECT_EN[subjectMatch[1]] ?? subjectMatch[1];
    if (trimmed.startsWith("把“") && trimmed.endsWith("设计成一张只使用三种颜色的电影海报。")) return `Design “${subject}” as a movie poster using only three colors.`;
    if (trimmed.startsWith("围绕“") && trimmed.includes("可点击的网页互动")) return `Create a clickable web interaction around “${subject}” that asks visitors to make one choice in 30 seconds.`;
    if (trimmed.startsWith("以“") && trimmed.includes("15 秒短视频口播")) return `Write a 15-second short-video script about “${subject}” with one final twist.`;
    if (trimmed.startsWith("为“") && trimmed.includes("微型品牌")) return `Build a miniature brand for “${subject}”: a name, slogan, graphic symbol and one piece of merchandise.`;
    if (trimmed.startsWith("用 AI 重构“")) return `Reimagine “${subject}” with AI using film grain, futuristic materials and the warmth of real life.`;
  }
  const dateMatch = trimmed.match(/^(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日$/);
  if (dateMatch) return `${dateMatch[2]}/${dateMatch[3]}/${dateMatch[1]}`;
  const countMatch = trimmed.match(/^(\d+) 次$/);
  if (countMatch) return `${countMatch[1]} editions`;
  return next;
}

function shouldSkip(node: Node) {
  const parent = node.parentElement;
  return !parent || Boolean(parent.closest("script, style, [data-no-translate]"));
}

function applyLanguage(root: Node, language: Language) {
  const documentRoot = root.nodeType === Node.DOCUMENT_NODE ? (root as Document).body : root;
  if (!documentRoot) return;
  const walker = document.createTreeWalker(documentRoot, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (shouldSkip(node)) continue;
    if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
    const original = originals.get(node) ?? "";
    node.nodeValue = language === "en" ? translateValue(original) : original;
  }
  const elements = documentRoot instanceof Element ? [documentRoot, ...documentRoot.querySelectorAll("[aria-label], [title], [placeholder], [alt]")] : [...document.querySelectorAll("[aria-label], [title], [placeholder], [alt]")];
  for (const element of elements) {
    if (element.closest("[data-no-translate]")) continue;
    if (!originalAttributes.has(element)) {
      const values: Record<string, string> = {};
      for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value) values[attribute] = value;
      }
      originalAttributes.set(element, values);
    }
    for (const [attribute, original] of Object.entries(originalAttributes.get(element) ?? {})) {
      element.setAttribute(attribute, language === "en" ? translateValue(original) : original);
    }
  }
}

function applyPageMetadata(language: Language) {
  const root = document.documentElement;
  if (PAGE_TITLE_EN[document.title]) root.dataset.originalTitle = document.title;
  const originalTitle = root.dataset.originalTitle ?? document.title;
  document.title = language === "en" ? (PAGE_TITLE_EN[originalTitle] ?? translateValue(originalTitle)) : originalTitle;

  const description = document.querySelector('meta[name="description"]');
  if (!description) return;
  const current = description.getAttribute("content") ?? "";
  const saved = description.getAttribute("data-original-content") ?? "";
  const savedEnglish = saved ? translateValue(saved) : "";
  if (!saved || (current !== saved && current !== savedEnglish)) description.setAttribute("data-original-content", current);
  const originalDescription = description.getAttribute("data-original-content") ?? current;
  description.setAttribute("content", language === "en" ? translateValue(originalDescription) : originalDescription);
}

export default function LanguageController() {
  const [language, setLanguage] = useState<Language>("zh");
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { if (window.localStorage.getItem(STORAGE_KEY) === "en") setLanguage("en"); } catch { /* current session still works */ }
      setPreferenceLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferenceLoaded) return;
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = language;
    applyPageMetadata(language);
    try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* current session still works */ }
    applyLanguage(document, language);

    const observer = new MutationObserver((records) => {
      observer.disconnect();
      for (const record of records) {
        if (record.type === "characterData") originals.set(record.target, record.target.nodeValue ?? "");
        for (const node of record.addedNodes) applyLanguage(node, language);
      }
      applyLanguage(document, language);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const headObserver = new MutationObserver(() => {
      headObserver.disconnect();
      applyPageMetadata(language);
      headObserver.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    });
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    return () => { observer.disconnect(); headObserver.disconnect(); };
  }, [language, preferenceLoaded]);

  return (
    <div className="language-control" data-no-translate role="group" aria-label="Language / 语言">
      <button type="button" className={language === "zh" ? "active" : ""} aria-pressed={language === "zh"} onClick={() => setLanguage("zh")}>中文</button>
      <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
    </div>
  );
}
