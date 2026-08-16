import { useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { cardStyle, labelStyle, inputStyle, primaryBtn, secondaryBtn, pillStyle } from "../../styles/theme";

const DEFAULT_AI_SETTINGS = { provider: "anthropic", apiKey: "" };

export function ProfileTab({ aiSettings, saveAiSettings }) {
  const [provider, setProvider] = useState(aiSettings.provider || "anthropic");
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || "");
  const [savedNote, setSavedNote] = useState("");

  const handleSave = () => {
    saveAiSettings({ provider, apiKey: apiKey.trim() });
    setSavedNote(apiKey.trim() ? "Saved. This app will now use your key." : "Saved. Using the app's built-in AI.");
  };

  const handleClear = () => {
    setProvider(DEFAULT_AI_SETTINGS.provider);
    setApiKey(DEFAULT_AI_SETTINGS.apiKey);
    saveAiSettings(DEFAULT_AI_SETTINGS);
    setSavedNote("Cleared. Using the app's built-in AI.");
  };

  return (
    <div style={{ padding: "24px 20px" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 22, margin: "0 0 16px" }}>Profile</p>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <KeyRound size={20} color="#FF7A00" />
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: 0 }}>Your AI</p>
        </div>
        <p style={{ color: "#c4c4c4", fontSize: 13, marginTop: 4, marginBottom: 14 }}>
          Add your own API key to use your own AI provider for meal scanning, suggestions, and recipe import. Leave blank to keep using the app's built-in AI.
        </p>

        <label style={labelStyle}>AI provider</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
          {[["anthropic", "Claude"], ["openai", "ChatGPT"]].map(([v, l]) => (
            <button key={v} onClick={() => setProvider(v)} style={{ ...pillStyle(provider === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
          ))}
        </div>

        <label style={labelStyle}>API key</label>
        <input
          style={inputStyle}
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-..."}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...primaryBtn, flex: 1 }} onClick={handleSave}>Save</button>
          <button style={{ ...secondaryBtn, flex: 1 }} onClick={handleClear}>Clear</button>
        </div>
        {savedNote && <p style={{ color: "#34C759", fontSize: 13, marginTop: 10, marginBottom: 0 }}>{savedNote}</p>}
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <UserRound size={20} color="#FF7A00" />
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: 0 }}>Account</p>
        </div>
        <p style={{ color: "#c4c4c4", fontSize: 13, marginTop: 4, marginBottom: 14 }}>
          Account editing is coming soon.
        </p>

        <label style={labelStyle}>Name</label>
        <input style={{ ...inputStyle, opacity: 0.5 }} value="" placeholder="Coming soon" disabled />

        <label style={labelStyle}>Email</label>
        <input style={{ ...inputStyle, opacity: 0.5, marginBottom: 0 }} value="" placeholder="Coming soon" disabled />
      </div>
    </div>
  );
}
