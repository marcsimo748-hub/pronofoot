"use client";

/**
 * 🪄 ThemeDecor — génère un fond animé léger selon le décor demandé.
 *
 * 100 % CSS pur : pas de canvas, pas de dépendance. Densité volontairement
 * faible (perf mobile) — l'overlay est purement esthétique et n'interfère
 * jamais avec les clics (pointer-events:none).
 *
 * Couvre : snow, rain, leaves, petals, sparkles, confetti, lights, stars, fireworks.
 */

import type { DecorKind } from "@/lib/theme";

export function ThemeDecor({ decor }: { decor?: DecorKind }) {
  if (!decor || decor === "none") return null;
  const count = 18; // particules
  const blocks: JSX.Element[] = [];

  for (let i = 0; i < count; i++) {
    const left = Math.round((i / count) * 100 + Math.random() * 4 - 2);
    const delay = Math.round(Math.random() * 9);
    const dur = 6 + Math.round(Math.random() * 8);
    const size = 4 + Math.round(Math.random() * 8);

    const styleBase: React.CSSProperties = {
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${dur}s`,
      width: `${size}px`,
      height: `${size}px`,
      willChange: "transform, opacity",
    };

    switch (decor) {
      case "snow":
        blocks.push(<span key={i} style={styleBase} className="decor-snow" />);
        break;
      case "rain":
        blocks.push(<span key={i} style={{ ...styleBase, width: "1px", height: `${10 + size}px` }} className="decor-rain" />);
        break;
      case "leaves":
        blocks.push(<span key={i} style={styleBase} className="decor-leaf" />);
        break;
      case "petals":
        blocks.push(<span key={i} style={styleBase} className="decor-petal" />);
        break;
      case "sparkles":
        blocks.push(<span key={i} style={styleBase} className="decor-sparkle" />);
        break;
      case "confetti":
        blocks.push(<span key={i} style={styleBase} className="decor-confetti" />);
        break;
      case "stars":
        blocks.push(<span key={i} style={styleBase} className="decor-star" />);
        break;
      case "fireworks":
        blocks.push(<span key={i} style={styleBase} className="decor-firework" />);
        break;
      case "lights":
        blocks.push(<span key={i} style={styleBase} className="decor-light" />);
        break;
      default:
        break;
    }
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes prono-fall {
  0% { transform: translateY(-10vh); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(110vh); opacity: 0; }
}
@keyframes prono-sway {
  0%,100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}
@keyframes prono-twinkle {
  0%,100% { opacity: 0.2; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes prono-blink {
  0%,100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes prono-fall-sway {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}
.decor-snow,.decor-rain,.decor-leaf,.decor-petal,.decor-sparkle,.decor-confetti,.decor-star,.decor-firework,.decor-light{
  position:absolute; top:-10vh; border-radius:9999px; pointer-events:none;
}
.decor-snow{ background:white; opacity:.9; animation: prono-fall linear infinite, prono-sway 3s ease-in-out infinite; filter: blur(.3px); }
.decor-rain{ background:linear-gradient(180deg,transparent,rgba(255,255,255,.7)); width:1px !important; height:14px; border-radius:1px; animation: prono-fall linear infinite; opacity:.5; }
.decor-leaf{ background:radial-gradient(circle, #f97316 30%, #b91c1c 70%); animation: prono-fall-sway linear infinite; }
.decor-petal{ background:radial-gradient(circle, #fbcfe8 30%, #f472b6 70%); animation: prono-fall-sway linear infinite; }
.decor-sparkle{ background:white; box-shadow:0 0 6px 2px rgba(255,255,255,.6); animation: prono-twinkle ease-in-out infinite; top:auto; bottom:30%; }
.decor-confetti{ background:hsl(${Math.round(Math.random() * 360)} 80% 60%); animation: prono-fall-sway linear infinite; border-radius:2px; }
.decor-star{ background:white; box-shadow:0 0 4px 1px rgba(255,255,255,.7); animation: prono-twinkle ease-in-out infinite; }
.decor-firework{ background:radial-gradient(circle, #fde047, #f97316 50%, transparent 80%); animation: prono-firework 3s ease-out infinite; }
.decor-light{ background:radial-gradient(circle, #fde047, #fbbf24 60%, transparent 80%); box-shadow:0 0 6px 2px rgba(253,224,71,.4); animation: prono-blink ease-in-out infinite; top:auto; bottom:4%; }
@keyframes prono-firework {
  0% { transform: scale(0.4); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
`,
        }}
      />
      {blocks}
    </div>
  );
}
