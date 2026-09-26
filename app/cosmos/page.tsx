import type { Metadata } from "next";
import CosmosExperience from "./CosmosExperience";
import releases from "../../data/releases.json";
import "./cosmos.css";

export const metadata: Metadata = {
  title: "Serkon Motion Lab｜动态思想档案",
  description: "将 20 条站长随笔、作品线索与强动态滚动叙事合并成一段原创前端体验。",
  alternates: { canonical: "/cosmos" },
  openGraph: { title: "Serkon Motion Lab｜动态思想档案", description: "五幕镜头、20 条随笔与会回应访客的原创动态页面。", url: "/cosmos", type: "website" },
};

export default function CosmosPage() {
  const latestEdition = releases.at(-1)?.edition ?? 1;
  return <CosmosExperience edition={latestEdition} />;
}
