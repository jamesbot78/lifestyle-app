import { FONT_LINK } from "../lib/constants";

export function GlobalStyle() {
  return (
    <style>{`
      @import url('${FONT_LINK}');
      :root {
        --bg: #F1F4ED; --surface: #FFFFFF; --ink: #24352A; --ink-soft: #5B6B5C;
        --protein: #C97A2B; --carbs: #4A7A8C; --fat: #8B4A6B; --success: #4A6E49; --border: #DDE4D6; --gold: #C9932E;
      }
      html, body { margin: 0; padding: 0; }
      * { font-family: 'Atkinson Hyperlegible', sans-serif; box-sizing: border-box; }
      body, p, span, div, button, select { font-size: 16px; line-height: 1.5; }
      button:focus-visible, input:focus-visible { outline: 3px solid var(--success); outline-offset: 2px; }
      .spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
      .app-shell { height: 100vh; height: 100dvh; overflow-x: hidden; }

      .app-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(180deg, rgba(36,53,42,0.90) 0%, rgba(36,53,42,0.82) 45%, rgba(201,147,46,0.32) 100%),
          url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27800%27%20height%3D%271000%27%20viewBox%3D%270%200%20800%201000%27%3E%3Crect%20width%3D%27800%27%20height%3D%271000%27%20fill%3D%27%25232B2118%27/%3E%3Cg%20opacity%3D%270.35%27%20stroke%3D%27%2523140F0A%27%20stroke-width%3D%272%27%3E%3Cline%20x1%3D%270%27%20y1%3D%2760%27%20x2%3D%27800%27%20y2%3D%2760%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27190%27%20x2%3D%27800%27%20y2%3D%27190%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27320%27%20x2%3D%27800%27%20y2%3D%27320%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27450%27%20x2%3D%27800%27%20y2%3D%27450%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27580%27%20x2%3D%27800%27%20y2%3D%27580%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27710%27%20x2%3D%27800%27%20y2%3D%27710%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27840%27%20x2%3D%27800%27%20y2%3D%27840%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27970%27%20x2%3D%27800%27%20y2%3D%27970%27/%3E%3C/g%3E%3Ccircle%20cx%3D%27150%27%20cy%3D%27170%27%20r%3D%2755%27%20fill%3D%27%2523C9432E%27/%3E%3Cpath%20d%3D%27M150%20118c6-14%2022-16%2030-8%27%20stroke%3D%27%25234A6E49%27%20stroke-width%3D%276%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%3Cg%20fill%3D%27%2523D98A2E%27%3E%3Crect%20x%3D%27330%27%20y%3D%27430%27%20width%3D%2716%27%20height%3D%27120%27%20rx%3D%278%27%20transform%3D%27rotate%288%20338%20490%29%27/%3E%3Cpath%20d%3D%27M330%20430l-18-30%2026%2010%204-28%2014%2024%2020-16-6%2028%2026-2-18%2020z%27%20/%3E%3C/g%3E%3Cg%20fill%3D%27%25234A6E49%27%3E%3Cellipse%20cx%3D%27560%27%20cy%3D%27250%27%20rx%3D%2770%27%20ry%3D%2734%27%20transform%3D%27rotate%28-18%20560%20250%29%27/%3E%3Cellipse%20cx%3D%27610%27%20cy%3D%27230%27%20rx%3D%2730%27%20ry%3D%2714%27%20transform%3D%27rotate%2810%20610%20230%29%27/%3E%3C/g%3E%3Cg%20fill%3D%27%2523C9932E%27%20opacity%3D%270.9%27%3E%3Ccircle%20cx%3D%27240%27%20cy%3D%27680%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27270%27%20cy%3D%27700%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27210%27%20cy%3D%27705%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27250%27%20cy%3D%27725%27%20r%3D%2710%27/%3E%3C/g%3E%3Cpath%20d%3D%27M600%20620c40-20%2090-10%20100%2030s-30%2070-70%2060-70-60-30-90z%27%20fill%3D%27%25237A3B2E%27/%3E%3Cpath%20d%3D%27M600%20780q90-40%20170%2010%27%20stroke%3D%27%25233A2B20%27%20stroke-width%3D%2710%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20opacity%3D%270.5%27/%3E%3C/svg%3E");
        background-size: cover;
        background-position: center top;
        opacity: 1;
      }
    `}</style>
  );
}
