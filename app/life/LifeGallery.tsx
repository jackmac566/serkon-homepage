"use client";

/* Public R2 images are dynamic user content and intentionally bypass the framework image proxy. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { awardArchiveStamp } from "../archive-client";

type GalleryPhoto = {
  id?: string;
  src: string;
  alt: string;
  category: string;
  note: string;
  ownerName?: string;
  createdAt?: number;
  canDelete?: boolean;
  isSitePhoto?: boolean;
  width?: number;
  height?: number;
};

type GalleryResponse = {
  signedIn: boolean;
  displayName: string | null;
  photos: GalleryPhoto[];
  error?: string;
};

const sitePhotos: GalleryPhoto[] = [
  { src: "/archive/polaroid-collage.webp", alt: "由多张日常自拍组成的拍立得拼贴", category: "个人瞬间", note: "同一天也可以有很多种表情", ownerName: "Serkon", isSitePhoto: true, width: 1800, height: 1128 },
  { src: "/archive/london-ai-workspace.webp", alt: "伦敦短片的 AI 影像素材工作区", category: "创作过程", note: "从地标、食物到人物，把零散画面整理成一条镜头路线", ownerName: "Serkon", isSitePhoto: true, width: 1800, height: 1105 },
  { src: "/archive/london-video-export.webp", alt: "伦敦 Vlog 视频导出设置与处理前后封面", category: "创作过程", note: "画面生成之后，还要面对分辨率、帧率与导出细节", ownerName: "Serkon", isSitePhoto: true, width: 1268, height: 1428 },
  { src: "/archive/lixiang-brand-mark.webp", alt: "玖源璃象蓝金色圆形品牌标志设计", category: "视觉作品", note: "蓝色星海与金色线条组成的品牌符号实验", ownerName: "Serkon", isSitePhoto: true, width: 1290, height: 1280 },
  { src: "/archive/serkon-first-build.webp", alt: "Serkon 个人网站第一版完成时的工作界面", category: "创作过程", note: "个人网站第一版完成时，留下的一张过程记录", ownerName: "Serkon", isSitePhoto: true, width: 1800, height: 1105 },
  { src: "/archive/genesis-music-release.webp", alt: "原创歌曲《创世纪》在网易云音乐的发布页面", category: "音乐", note: "《创世纪》公开发布，让网站拥有属于自己的声音", ownerName: "Serkon", isSitePhoto: true, width: 1800, height: 1036 },
  { src: "/serkon-hero.jpg", alt: "灰色西装正面照", category: "人物", note: "认真一点的我", ownerName: "Serkon", isSitePhoto: true },
  { src: "/serkon-moment-call.jpg", alt: "做打电话手势的瞬间", category: "随手拍", note: "镜头前也可以抽象", ownerName: "Serkon", isSitePhoto: true },
  { src: "/serkon-moment-wave.jpg", alt: "向镜头挥手的瞬间", category: "随手拍", note: "HELLO", ownerName: "Serkon", isSitePhoto: true },
  { src: "/serkon.jpg", alt: "Serkon 的个人照片", category: "人物", note: "第一张个人主页照片", ownerName: "Serkon", isSitePhoto: true },
];

const filters = ["全部", "站长影像", "访客影像", "个人瞬间", "创作过程", "视觉作品", "音乐", "人物", "日常", "旅行", "朋友", "随手拍"];

async function compressPhoto(file: File) {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .78));
  if (!blob) throw new Error("照片处理失败");
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

export default function LifeGallery() {
  const [filter, setFilter] = useState("全部");
  const [active, setActive] = useState<GalleryPhoto | null>(null);
  const [sharedPhotos, setSharedPhotos] = useState<GalleryPhoto[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [category, setCategory] = useState("访客影像");
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const refresh = async () => {
    try {
      const response = await fetch("/api/life/photos", { cache: "no-store" });
      const data = await response.json() as GalleryResponse;
      if (!response.ok) throw new Error(data.error || "共享相册暂时不可用");
      setSharedPhotos(data.photos);
      setSignedIn(data.signedIn);
      setDisplayName(data.displayName);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "共享相册暂时不可用");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    awardArchiveStamp("photo");
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [active]);

  const allPhotos = useMemo(() => [...sharedPhotos, ...sitePhotos], [sharedPhotos]);
  const visible = allPhotos.filter((photo) => {
    if (filter === "全部") return true;
    if (filter === "站长影像") return Boolean(photo.isSitePhoto);
    if (filter === "访客影像") return !photo.isSitePhoto;
    return photo.category === filter;
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setNotice("");
    try {
      for (const original of Array.from(files).slice(0, 8)) {
        const photo = await compressPhoto(original);
        const form = new FormData();
        form.set("photo", photo);
        form.set("note", note);
        form.set("category", category);
        form.set("ownerName", uploaderName);
        const response = await fetch("/api/life/photos", { method: "POST", body: form });
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error || "上传失败");
      }
      setNotice("照片已加入公共影像墙，其他访客现在也能看到。你登录后可随时删除自己的照片。");
      setNote("");
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
      setFilter("访客影像");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (photo: GalleryPhoto) => {
    if (!photo.id || !photo.canDelete || !window.confirm("确定删除这张照片吗？删除后无法恢复。")) return;
    const response = await fetch(`/api/life/photos?id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setNotice(data.error || "删除失败"); return; }
    if (active?.id === photo.id) setActive(null);
    setNotice("照片已删除。");
    await refresh();
  };

  return (
    <section className="gallery-section">
      <div className="gallery-toolbar">
        <div className="gallery-filters" aria-label="照片分类">
          {filters.map((item) => <button type="button" key={item} aria-pressed={filter === item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <span>{loading ? "LOADING" : `${visible.length} PHOTOS`}</span>
      </div>

      <div className="curated-archive-note">
        <small>CURATED BY SERKON</small>
        <strong>先看站长精选，再进入所有人共同留下的公共影像墙。</strong>
        <p>这里同时收录个人瞬间、创作过程和已经公开的作品证据；直播后台截图因包含其他人的昵称与评论，未直接公开展示。</p>
      </div>

      <div className="community-upload">
        <div>
          <small>COMMUNITY PHOTO WALL</small>
          <h2>把你眼中的生活，也留在这里。</h2>
          <p>{signedIn ? `已登录为 ${displayName || "访客"}。账号只用于核验删除权限；公开昵称由你自己填写，每次最多选择 8 张。` : "所有人都能浏览；登录后可以上传，并且只能删除自己上传的照片。"}</p>
        </div>
        {signedIn ? <div className="upload-controls">
          <select aria-label="照片分类" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>访客影像</option><option>日常</option><option>旅行</option><option>朋友</option><option>人物</option><option>随手拍</option>
          </select>
          <input aria-label="公开昵称" value={uploaderName} maxLength={20} onChange={(event) => setUploaderName(event.target.value)} placeholder="公开昵称（可选）" />
          <input className="upload-note" aria-label="照片说明" value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} placeholder="写一句照片背后的话（可选）" />
          <label className={`local-upload ${uploading ? "disabled" : ""}`}>{uploading ? "上传中…" : "＋ 选择并上传"}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={(event) => void upload(event.target.files)} /></label>
        </div> : <a className="signin-upload" href="/signin-with-chatgpt?return_to=%2Flife">登录后上传 ↗</a>}
      </div>

      <p className="upload-boundary">这是一个公开的共同影像墙。照片会显示给所有访客；上传者可管理自己的内容。为保持相册安全与整洁，不适合公开展示的内容可能会被移除。</p>
      {notice && <p className="upload-notice" role="status">{notice}</p>}

      {visible.length ? <div className="photo-wall" aria-busy={loading}>{visible.map((photo, index) => <article className={`photo-shell photo-${index + 1}`} key={photo.id || photo.src}>
        <button className="photo-item" type="button" onClick={() => setActive(photo)}><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" /><span><small>{photo.category} · {photo.ownerName || "访客"}</small><strong>{photo.note}</strong></span></button>
        {photo.canDelete && <button className="delete-photo" type="button" onClick={() => void remove(photo)}>删除这张照片</button>}
      </article>)}</div> : <div className="empty-album"><strong>{loading ? "正在翻开相册…" : "这一册还没有照片"}</strong><p>成为第一个留下生活切片的人。</p></div>}

      <aside className="gallery-note"><span>PUBLIC &amp; PERSONAL</span><p>每位上传者的删除权限都由服务器核验，隐藏按钮或修改网页代码也无法删除别人的照片。请不要上传他人隐私、联系方式或未经允许的肖像。</p></aside>
      {active && <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.alt} onClick={() => setActive(null)}><button ref={closeRef} type="button" onClick={() => setActive(null)} aria-label="关闭大图">×</button><img src={active.src} alt={active.alt} onClick={(event) => event.stopPropagation()} /><p onClick={(event) => event.stopPropagation()}>{active.note}<small>{active.ownerName ? `上传者：${active.ownerName}` : ""}</small></p></div>}
    </section>
  );
}
