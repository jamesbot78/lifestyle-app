import { useState } from "react";
import { inputStyle, secondaryBtn } from "../styles/theme";

export function WeighInInput({ onLog, currentWeight }) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (!val) return;
    onLog(val);
    setVal("");
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <input
        type="number"
        inputMode="decimal"
        placeholder={`Today's weight, e.g. ${currentWeight}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
      />
      <button onClick={submit} style={{ ...secondaryBtn, padding: "0 18px" }}>Log</button>
    </div>
  );
}
