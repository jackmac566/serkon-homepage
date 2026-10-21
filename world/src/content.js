/** Content is drawn from Serkon's existing public website and project links. */
export const HOME_URL = 'https://serkon-homepage-cn.pages.dev';
export const CONTACT = { email: 'shikanghou4@gmail.com', github: 'https://github.com/jackmac566' };

export const stations = [
  { id: 'works', name: '作品展馆', en: 'WORKSHOP', number: '01', x: -15, z: -10, stopX: -10, stopZ: -7, hint: '产品视觉、网站和本地工具', color: '#b65538' },
  { id: 'film', name: '影像棚', en: 'FILM LAB', number: '02', x: 15, z: -10, stopX: 10, stopZ: -7, hint: '伦敦 AI 影像的工作区与过程', color: '#467e85' },
  { id: 'music', name: '唱片亭', en: 'RECORD STORE', number: '03', x: 16, z: 12, stopX: 11, stopZ: 9, hint: '坐一会，听一首《创世纪》', color: '#314f42' },
  { id: 'life', name: '照片墙', en: 'PHOTO WALL', number: '04', x: -16, z: 12, stopX: -11, stopZ: 9, hint: '正经照片和不太正经的表情', color: '#ba894b' },
  { id: 'about', name: '我的信箱', en: 'SAY HELLO', number: '05', x: 0, z: -22, stopX: 0, stopZ: -16, hint: '认识侯世康，也可以写封信', color: '#63744d' },
];

export const projects = [
  { id: 'color', title: '强鹰彩色胶', kind: '产品视觉与网站', status: '商业项目', href: 'https://qiangying-color-sealant-cn.pages.dev/', description: '126 色、硬支与软支两类规格，再到实际使用场景：把产品信息放进一套统一的视觉和网站里。' },
  { id: 'writing', title: '妙笔 AI', kind: '文案工作台', status: '独立产品', href: 'https://miaobi-appl-serkon.pages.dev/', description: '从想法到文字的独立工作台。打开站外产品，看看它现在的样子。' },
  { id: 'yearbook', title: '微信年轮', kind: '本地工具', status: '持续完善', href: 'https://github.com/jackmac566/wechat-yearbook', description: '面向聊天记录的本地分析工具，继续完善双系统使用体验。源码与使用说明在仓库里。' },
];

export const photos = [
  { file: 'portrait.jpg', title: '先认真打个照面。', alt: '侯世康的灰色西装个人照片素材', note: '个人主页里的一张正面照片。', shape: 'portrait' },
  { file: 'wave.jpg', title: '嗨，来都来了。', alt: '侯世康穿灰色西装，举手打招呼的个人照片素材', note: '换个表情，打个招呼。', shape: 'portrait' },
  { file: 'call.jpg', title: '有事，直接说。', alt: '侯世康穿灰色西装，做电话手势的个人照片素材', note: '原站里的电话手势照片。', shape: 'portrait' },
  { file: 'polaroids.webp', title: '这面墙就随意一点。', alt: '多种表情与姿势组成的个人拍立得拼贴', note: '原站公开的表情拼贴。', shape: 'landscape' },
];
