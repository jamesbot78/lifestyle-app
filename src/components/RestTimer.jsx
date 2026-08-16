import { useState, useCallback, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { cardStyle, primaryBtn, secondaryBtn } from "../styles/theme";

export function RestTimer() {
  const [workSec, setWorkSec] = useState(60);
  const [restSec, setRestSec] = useState(30);
  const [phase, setPhase] = useState("idle"); // 'idle' | 'work' | 'rest'
  const [secLeft, setSecLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const audioCtxRef = useRef(null);

  const beep = useCallback((freq = 880, duration = 150) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) { /* audio not available */ }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          let nextPhase;
          setPhase((p) => {
            nextPhase = p === "work" ? "rest" : "work";
            return nextPhase;
          });
          beep(nextPhase === "work" ? 1050 : 700, 200);
          return nextPhase === "work" ? workSec : restSec;
        }
        if (s <= 4) beep(600, 80);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, workSec, restSec, beep]);

  const start = () => {
    if (phase === "idle") {
      setPhase("work");
      setSecLeft(workSec);
      beep(1050, 200);
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setSecLeft(workSec);
  };

  const minutes = Math.floor(secLeft / 60);
  const seconds = secLeft % 60;
  const label = phase === "idle" ? "Ready" : phase === "work" ? "Work" : "Rest";
  const color = phase === "rest" ? "#FFD60A" : "#34C759";

  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Timer size={20} color="#FF7A00" />
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Interval Training Timer</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color, letterSpacing: 1 }}>{label.toUpperCase()}</p>
        <p style={{ margin: "4px 0 0", fontFamily: "Quicksand", fontWeight: 700, fontSize: 48, color: "#fff" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: "#c4c4c4" }}>Work (seconds)</label>
          <input
            type="number"
            min={5}
            max={600}
            value={workSec}
            disabled={running}
            onChange={(e) => {
              const v = Math.max(5, parseInt(e.target.value) || 5);
              setWorkSec(v);
              if (phase === "idle") setSecLeft(v);
            }}
            style={{ width: "100%", marginTop: 4, fontSize: 16, padding: "8px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: "#c4c4c4" }}>Rest (seconds)</label>
          <input
            type="number"
            min={5}
            max={600}
            value={restSec}
            disabled={running}
            onChange={(e) => setRestSec(Math.max(5, parseInt(e.target.value) || 5))}
            style={{ width: "100%", marginTop: 4, fontSize: 16, padding: "8px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {!running ? (
          <button onClick={start} style={{ ...primaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Play size={18} /> {phase === "idle" ? "Start" : "Resume"}
          </button>
        ) : (
          <button onClick={pause} style={{ ...primaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Pause size={18} /> Pause
          </button>
        )}
        <button onClick={reset} style={{ ...secondaryBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px" }}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>
    </div>
  );
}
