import { useState, useRef } from "react";
import { Volume2 } from "lucide-react";

export function ReadAloudButton({ text, label, voiceName }) {
  const [speaking, setSpeaking] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const words = (text || "").split(/\s+/).filter(Boolean);
  const fallbackTimer = useRef(null);
  const boundaryFired = useRef(false);

  const stop = () => {
    window.speechSynthesis?.cancel();
    if (fallbackTimer.current) { clearInterval(fallbackTimer.current); fallbackTimer.current = null; }
    setSpeaking(false);
    setHighlightIdx(-1);
  };

  const speak = () => {
    if (!window.speechSynthesis) return;
    if (speaking) { stop(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    if (voiceName) {
      const match = window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
      if (match) utter.voice = match;
    }
    boundaryFired.current = false;
    utter.onboundary = (e) => {
      boundaryFired.current = true;
      const charIndex = e.charIndex || 0;
      const upTo = text.slice(0, charIndex);
      const idx = upTo.split(/\s+/).filter(Boolean).length;
      setHighlightIdx(idx);
    };
    utter.onstart = () => {
      // Fallback for browsers (notably iOS Safari) that don't reliably fire onboundary:
      // step through words on an estimated timer based on speech rate, so the
      // highlight still moves even without real word-boundary events.
      setTimeout(() => {
        if (boundaryFired.current) return;
        const wordsPerMinute = 150 * utter.rate;
        const msPerWord = Math.max(150, 60000 / wordsPerMinute);
        let i = 0;
        fallbackTimer.current = setInterval(() => {
          if (i >= words.length) { clearInterval(fallbackTimer.current); return; }
          setHighlightIdx(i);
          i++;
        }, msPerWord);
      }, 300);
    };
    utter.onend = () => { stop(); };
    utter.onerror = () => { stop(); };
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={speak}
        style={{
          display: "flex", alignItems: "center", gap: 8, background: speaking ? "rgba(255,122,0,0.18)" : "rgba(255,255,255,0.06)",
          border: speaking ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: 999, padding: "6px 14px", cursor: "pointer", color: speaking ? "#FF7A00" : "#e0e0e0",
          fontFamily: "Atkinson Hyperlegible", fontWeight: 700, fontSize: 13,
        }}
      >
        <Volume2 size={16} /> {speaking ? "Stop" : (label || "Read aloud")}
      </button>
      {speaking && (
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#e0e0e0" }}>
          {words.map((w, i) => (
            <span key={i} style={i === highlightIdx ? { background: "#FF7A00", color: "#000", borderRadius: 4, padding: "0 2px" } : {}}>
              {w}{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
