export function getExerciseWarning(exerciseName, profile) {
  if (!profile) return null;
  const rawInjuries = profile.injuries || [];
  if (!rawInjuries.length) return null;
  // ease off the warning for injuries recorded more than a year ago, since they're likely healed by then
  const injuries = rawInjuries
    .filter((i) => {
      if (!i.date) return true;
      const monthsAgo = (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 12;
    })
    .map((i) => i.key);
  if (!injuries.length) return null;
  const n = (exerciseName || "").toLowerCase();
  const isLegMove = /leg|squat|calf|lunge|quad|hamstring|deadlift/.test(n);
  const isKneeMove = /leg|squat|lunge|quad|calf/.test(n);
  const isHipMove = /squat|lunge|hip|deadlift/.test(n);
  const isShoulderMove = /shoulder|delt|overhead|military|bench|press|pulldown|pull.?up/.test(n);
  const isBackMove = /row|deadlift|back|pull.?up|good.?morning/.test(n);
  const isWristElbowMove = /curl|bicep|tricep|dip|press|bench/.test(n);
  const isAnkleMove = /calf|lunge|jump|run/.test(n);

  const checks = [
    { keys: ["knee_replacement", "acl", "meniscus", "general_joint"], test: isKneeMove, label: "your knee" },
    { keys: ["hip_replacement", "hip_impingement"], test: isHipMove, label: "your hip" },
    { keys: ["shoulder_replacement", "rotator_cuff", "frozen_shoulder"], test: isShoulderMove, label: "your shoulder" },
    { keys: ["back_surgery", "herniated_disc", "sciatica", "neck_injury"], test: isBackMove, label: "your back" },
    { keys: ["wrist_injury", "tendonitis"], test: isWristElbowMove, label: "your wrist or elbow" },
    { keys: ["ankle_sprain", "plantar_fasciitis"], test: isAnkleMove, label: "your ankle or foot" },
    { keys: ["broken_bone"], test: isLegMove || isShoulderMove, label: "your healing bone" },
    { keys: ["hernia_surgery"], test: /crunch|core|plank|sit.?up|deadlift|squat/.test(n), label: "your hernia recovery" },
  ];

  for (const c of checks) {
    if (c.test && injuries.some((i) => c.keys.includes(i))) {
      return `This may stress ${c.label}: you flagged a related injury or surgery. Check with your doctor or go easy.`;
    }
  }
  return null;
}

export function guessMuscleGroupStandalone(name) {
  const n = (name || "").toLowerCase();
  if (/calf|calve/.test(n)) return "Calves";
  if (/quad|leg press|leg extension|squat|lunge|front squat/.test(n)) return "Quads";
  if (/hamstring|leg curl|deadlift|rdl|romanian/.test(n)) return "Hamstrings";
  if (/glute|hip thrust|kickback/.test(n)) return "Glutes";
  if (/bench|chest|press.*chest|pec|fly|dip(?!.*tricep)/.test(n)) return "Chest";
  if (/lat|pulldown|pull.?up|row/.test(n)) return "Lats";
  if (/lower back|back extension|good morning/.test(n)) return "Lower back";
  if (/upper back|shrug|trap|face pull|rear delt/.test(n)) return "Upper back";
  if (/shoulder press|overhead|military|delt|arnold/.test(n)) return "Shoulders";
  if (/bicep|curl(?!.*leg)/.test(n)) return "Biceps";
  if (/tricep|skullcrusher|pushdown|dip/.test(n)) return "Triceps";
  if (/forearm|wrist|grip/.test(n)) return "Forearms";
  if (/oblique|side bend|russian twist|woodchop/.test(n)) return "Obliques";
  if (/ab|core|plank|crunch|sit.?up/.test(n)) return "Abs";
  return "Other";
}
