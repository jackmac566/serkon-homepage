import type { Metadata } from "next";
import DouDizhuGame from "./DouDizhuGame";
import "./game.css";

export const metadata: Metadata = {
  title: "斗地主牌桌｜Serkon",
  description: "在 Serkon 的个人网站里玩一局斗地主基础对战。",
  alternates: { canonical: "/games/doudizhu" },
  openGraph: { title: "斗地主牌桌｜Serkon", description: "进入 Serkon 的个人档案，玩一局斗地主基础对战。", url: "/games/doudizhu", images: ["/serkon-share.jpg"] },
};

export default function DouDizhuPage() {
  return <DouDizhuGame />;
}
