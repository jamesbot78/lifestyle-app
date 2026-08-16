export function formatTime(timeValue) {
  if (!timeValue) return "";
  const [h, m] = timeValue.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export const MOTIVATIONAL_QUOTES = [
  "Small steps every day add up to big change.",
  "You don't have to be perfect, just consistent.",
  "Progress, not perfection.",
  "Every meal logged is a step toward knowing yourself better.",
  "Strong today, stronger tomorrow.",
  "Discipline is choosing what you want most over what you want now.",
  "One good habit beats ten good intentions.",
  "Your only competition is who you were yesterday.",
  "Showing up is half the battle.",
  "Fuel your body like you respect it.",
  "Consistency beats intensity.",
  "Rest is part of the plan, not a break from it.",
  "You're building something that lasts.",
  "Today's effort is tomorrow's strength.",
  "Keep going, you're doing better than you think.",
  "Focus on the next right choice, not the whole journey.",
  "Every gauge you fill is proof you showed up.",
  "Momentum starts with one small win.",
  "Take care of your body, it's the only place you have to live.",
  "Trust the process.",
];

export function getDailyQuote() {
  const d = new Date();
  const dayNum = Math.floor(d.getTime() / 86400000);
  return MOTIVATIONAL_QUOTES[dayNum % MOTIVATIONAL_QUOTES.length];
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
