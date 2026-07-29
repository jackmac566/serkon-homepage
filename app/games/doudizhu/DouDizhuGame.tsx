"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { awardArchiveStamp } from "../../archive-client";

type Card = { id: string; rank: string; value: number; suit: string; red: boolean };
type Combo = { type: string; value: number; length: number };
type Player = "user" | "left" | "right";

const ranks = [
  ["3", 3], ["4", 4], ["5", 5], ["6", 6], ["7", 7], ["8", 8], ["9", 9], ["10", 10],
  ["J", 11], ["Q", 12], ["K", 13], ["A", 14], ["2", 15],
] as const;
const suits = ["♠", "♥", "♣", "♦"];

function makeDeck() {
  const deck: Card[] = [];
  ranks.forEach(([rank, value]) => suits.forEach((suit, index) => deck.push({ id: `${rank}-${suit}`, rank, value, suit, red: index === 1 || index === 3 })));
  deck.push({ id: "SJ", rank: "小王", value: 16, suit: "◐", red: false });
  deck.push({ id: "BJ", rank: "大王", value: 17, suit: "●", red: true });
  return deck.sort(() => Math.random() - 0.5);
}

const sortCards = (cards: Card[]) => [...cards].sort((a, b) => a.value - b.value || a.suit.localeCompare(b.suit));

function deal() {
  const deck = makeDeck();
  const bottom = deck.slice(51);
  return {
    user: sortCards([...deck.slice(0, 17), ...bottom]),
    left: sortCards(deck.slice(17, 34)),
    right: sortCards(deck.slice(34, 51)),
    bottom,
  };
}

function analyze(cards: Card[]): Combo | null {
  if (!cards.length) return null;
  const values = cards.map((card) => card.value).sort((a, b) => a - b);
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  if (cards.length === 2 && values[0] === 16 && values[1] === 17) return { type: "王炸", value: 17, length: 2 };
  if (cards.length === 4 && groups.length === 1) return { type: "炸弹", value: groups[0][0], length: 4 };
  if (cards.length === 1) return { type: "单张", value: values[0], length: 1 };
  if (cards.length === 2 && groups.length === 1) return { type: "对子", value: values[0], length: 2 };
  if (cards.length === 3 && groups.length === 1) return { type: "三张", value: values[0], length: 3 };
  if (cards.length === 4 && groups.some(([, count]) => count === 3)) return { type: "三带一", value: groups.find(([, count]) => count === 3)![0], length: 4 };
  if (cards.length === 5 && groups.length === 2 && groups.some(([, count]) => count === 3) && groups.some(([, count]) => count === 2)) return { type: "三带二", value: groups.find(([, count]) => count === 3)![0], length: 5 };
  if (cards.length >= 5 && groups.length === cards.length && groups.at(-1)![0] <= 14 && groups.every(([value], index) => index === 0 || value === groups[index - 1][0] + 1)) return { type: "顺子", value: groups.at(-1)![0], length: cards.length };
  return null;
}

function beats(combo: Combo, last: Combo | null) {
  if (!last) return true;
  if (combo.type === "王炸") return true;
  if (last.type === "王炸") return false;
  if (combo.type === "炸弹" && last.type !== "炸弹") return true;
  return combo.type === last.type && combo.length === last.length && combo.value > last.value;
}

function groupsOf(hand: Card[]) {
  const map = new Map<number, Card[]>();
  hand.forEach((card) => map.set(card.value, [...(map.get(card.value) ?? []), card]));
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function aiChoice(hand: Card[], last: Combo | null): Card[] | null {
  const groups = groupsOf(hand);
  if (!last) return [hand[0]];
  const above = (size: number) => groups.find(([value, cards]) => value > last.value && cards.length >= size)?.[1].slice(0, size) ?? null;
  let choice: Card[] | null = null;
  if (last.type === "单张") choice = hand.find((card) => card.value > last.value) ? [hand.find((card) => card.value > last.value)!] : null;
  if (last.type === "对子") choice = above(2);
  if (last.type === "三张") choice = above(3);
  if (last.type === "三带一" || last.type === "三带二") {
    const triple = above(3);
    if (triple) {
      const rest = hand.filter((card) => card.value !== triple[0].value);
      if (last.type === "三带一" && rest.length) choice = [...triple, rest[0]];
      if (last.type === "三带二") {
        const pair = groupsOf(rest).find(([, cards]) => cards.length >= 2)?.[1].slice(0, 2);
        if (pair) choice = [...triple, ...pair];
      }
    }
  }
  if (last.type === "顺子") {
    const unique = groups.filter(([value]) => value <= 14);
    for (let start = 0; start <= unique.length - last.length; start += 1) {
      const run = unique.slice(start, start + last.length);
      if (run.every(([value], index) => index === 0 || value === run[index - 1][0] + 1) && run.at(-1)![0] > last.value) { choice = run.map(([, cards]) => cards[0]); break; }
    }
  }
  if (!choice && last.type === "炸弹") choice = groups.find(([value, cards]) => cards.length === 4 && value > last.value)?.[1] ?? null;
  if (!choice && last.type !== "王炸" && last.type !== "炸弹") choice = groups.find(([, cards]) => cards.length === 4)?.[1] ?? null;
  if (!choice) {
    const small = hand.find((card) => card.value === 16);
    const big = hand.find((card) => card.value === 17);
    if (small && big) choice = [small, big];
  }
  return choice;
}

const nextPlayer = (player: Player): Player => player === "user" ? "left" : player === "left" ? "right" : "user";

export default function DouDizhuGame() {
  const [hands, setHands] = useState(deal);
  const [turn, setTurn] = useState<Player>("user");
  const [selected, setSelected] = useState<string[]>([]);
  const [last, setLast] = useState<{ combo: Combo; cards: Card[]; player: Player } | null>(null);
  const [passes, setPasses] = useState(0);
  const [message, setMessage] = useState("你是地主，先出牌");
  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    awardArchiveStamp("card");
  }, []);

  useEffect(() => {
    if (winner || turn === "user") return;
    const timer = window.setTimeout(() => {
      const hand = hands[turn];
      const cards = aiChoice(hand, last?.combo ?? null);
      if (cards) {
        const combo = analyze(cards)!;
        const remaining = hand.filter((card) => !cards.some((played) => played.id === card.id));
        setHands((current) => ({ ...current, [turn]: remaining }));
        setLast({ combo, cards, player: turn });
        setPasses(0);
        setMessage(`${turn === "left" ? "左边农民" : "右边农民"}出了${combo.type}`);
        if (!remaining.length) setWinner(turn);
      } else {
        const nextPasses = passes + 1;
        if (nextPasses >= 2) { setLast(null); setPasses(0); } else setPasses(nextPasses);
        setMessage(`${turn === "left" ? "左边农民" : "右边农民"}选择不出`);
      }
      setTurn(nextPlayer(turn));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [turn, hands, last, passes, winner]);

  const reset = () => {
    setHands(deal()); setTurn("user"); setSelected([]); setLast(null); setPasses(0); setWinner(null); setMessage("你是地主，先出牌");
  };

  const play = () => {
    const cards = hands.user.filter((card) => selected.includes(card.id));
    const combo = analyze(cards);
    if (!combo) { setMessage("这组牌暂时不符合基础规则"); return; }
    if (!beats(combo, last?.combo ?? null)) { setMessage("需要用更大的同类型牌，或者炸弹"); return; }
    const remaining = hands.user.filter((card) => !selected.includes(card.id));
    setHands((current) => ({ ...current, user: remaining }));
    setLast({ combo, cards, player: "user" }); setPasses(0); setSelected([]); setMessage(`你出了${combo.type}`);
    if (!remaining.length) setWinner("user"); else setTurn("left");
  };

  const pass = () => {
    if (!last) { setMessage("新一轮必须出牌"); return; }
    const nextPasses = passes + 1;
    if (nextPasses >= 2) { setLast(null); setPasses(0); } else setPasses(nextPasses);
    setSelected([]); setMessage("你选择不出"); setTurn("left");
  };

  return (
    <main className="ddz-page">
      <header className="ddz-nav"><Link href="/">← 返回个人主页</Link><h1>Serkon 斗地主牌桌</h1><button type="button" onClick={reset}>重新发牌</button></header>
      <section className="ddz-table">
        <div className="opponent opponent-left"><span className="avatar">农</span><strong>左边农民</strong><small>{`${hands.left.length} 张`}</small></div>
        <div className="opponent opponent-right"><span className="avatar">农</span><strong>右边农民</strong><small>{`${hands.right.length} 张`}</small></div>
        <div className="bottom-cards"><small>地主底牌</small><div>{hands.bottom.map((card) => <CardView card={card} mini key={card.id} />)}</div></div>
        <div className="play-area">
          {winner ? <div className="winner"><strong>{winner === "user" ? "你赢了！" : "农民获胜"}</strong><button type="button" onClick={reset}>再来一局</button></div> : last ? <><small>{last.player === "user" ? "你" : last.player === "left" ? "左边农民" : "右边农民"} · {last.combo.type}</small><div className="played-cards">{last.cards.map((card) => <CardView card={card} mini key={card.id} />)}</div></> : <strong>新一轮 · 请出牌</strong>}
        </div>
        <div className="game-status"><span className={turn === "user" ? "active" : ""}>{turn === "user" ? "轮到你" : "对手思考中"}</span><p>{message}</p></div>
        <div className="player-zone">
          <div className="player-hand">{hands.user.map((card) => <button type="button" key={card.id} disabled={turn !== "user" || !!winner} className={selected.includes(card.id) ? "selected" : ""} onClick={() => setSelected((current) => current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id])}><CardView card={card} /></button>)}</div>
          <div className="game-actions"><button type="button" onClick={pass} disabled={turn !== "user" || !!winner}>不出</button><button type="button" onClick={play} disabled={turn !== "user" || !!winner}>出牌</button></div>
          <small className="rule-note">基础规则支持：单张、对子、三张、三带一、三带二、顺子、炸弹和王炸。</small>
        </div>
      </section>
    </main>
  );
}

function CardView({ card, mini = false }: { card: Card; mini?: boolean }) {
  return <span className={`poker-card ${card.red ? "red" : ""} ${mini ? "mini" : ""}`}><b>{card.rank}</b><i>{card.suit}</i></span>;
}
