// Pure constants shared between client and server.
// IMPORTANT: no server-only imports here (no db, no env) — client components
// import from this module so db.js never leaks into the browser bundle.

export const METRICS = {
  spo2: { label: "SpO₂", unit: "%", decimals: 0 },
  hr: { label: "Frecuencia cardíaca", unit: "ppm", decimals: 0 },
  bp_systolic: { label: "Tensión (sistólica)", unit: "mmHg", decimals: 0 },
  bp_diastolic: { label: "Tensión (diastólica)", unit: "mmHg", decimals: 0 },
  temp: { label: "Temperatura", unit: "°C", decimals: 1 },
  poo: { label: "Deposición", unit: "", decimals: 0 },
  mood: { label: "Estado de ánimo", unit: "", decimals: 0 },
  night_events: { label: "Llamadas/levantadas nocturnas", unit: "", decimals: 0 },
};

export const MOOD_LEVELS = [
  { value: 3, label: "Bien", tone: "green" },
  { value: 2, label: "Regular", tone: "orange" },
  { value: 1, label: "Mal", tone: "red" },
];

export const moodLabel = (v) => MOOD_LEVELS.find((m) => m.value === Number(v))?.label ?? null;

export const moodTone = (v) => MOOD_LEVELS.find((m) => m.value === Number(v))?.tone ?? null;

export const DEFAULT_SETTINGS = {
  spo2_min: 92,
  hr_min: 50,
  hr_max: 120,
  temp_min: 36,
  temp_max: 37.5,
  bp_sys_max: 140,
  bp_dia_max: 90,
};
