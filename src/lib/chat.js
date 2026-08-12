import { getEnv } from "@/lib/env";
import sql from "@/lib/db";

const DAILY_LIMIT = 20;

/** Returns the AI provider config for Groq or Cohere (free tier, D8). */
export function getProvider() {
  const groqKey = getEnv("GROQ_API_KEY");
  const cohereKey = getEnv("COHERE_API_KEY");

  if (groqKey) {
    return { provider: "groq", model: "llama-3.3-70b-versatile" };
  }
  if (cohereKey) {
    return { provider: "cohere", model: "command-r" };
  }
  return null;
}

/** How many chat messages the user has used today (UTC day). */
export async function getUsedMessages(userId) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM chat_messages
    WHERE user_id = ${userId} AND role = 'user' AND created_at >= ${startOfDay}
  `;
  return rows[0]?.n ?? 0;
}

export const DAILY_MSG_LIMIT = DAILY_LIMIT;

/** Records the user message (rate limiting; full history persistence is backlog). */
export async function recordUserMessage(userId, patientId, content) {
  await sql`
    INSERT INTO chat_messages (user_id, patient_id, role, content)
    VALUES (${userId}, ${patientId}, 'user', ${content})
  `;
}

/**
 * System prompt — Health AI. ES-only, strict no-medical-advice guardrail,
 * scope restriction. Context = active patient + latest vitals + health score.
 */
export function buildSystemPrompt(patientName, contextSummary) {
  return `You are Health AI, the assistant of a family health-tracking app for caregivers
of elder people. You help with: explaining vital readings (SpO2, heart rate,
blood pressure, temperature), day-by-day care journal notes, spotting trends,
drafting questions for doctors, and explaining the AI health score.

The app is Spanish-only (es-ES): ALWAYS answer in European Spanish.

Crucial safety rules — non-negotiable:
- You provide INFORMATION, not medical advice. Never diagnose, never recommend
  treatments, dosages or medications, never interpret symptoms as diseases.
- If the user asks for something medical you cannot do, respond briefly:
  "No puedo dar consejo médico. Consulta con el médico de ${patientName}."
- For suspected emergencies (chest pain, loss of consciousness, severe
  breathing difficulty) say: "Ante una emergencia llama al 112 ahora mismo."

Reference the active patient's vitals and score when provided.
Be concise (3–5 sentences), warm and practical.

CONTEXT (active patient) — use it to ground your answer, do not invent data:
${contextSummary}

IMPORTANT — Scope restriction:
You ONLY answer questions about the tracked patient's readings, notes and care
journal. If asked anything outside this scope, reply briefly in Spanish that
you can only help with the care journal of their tracked patients.`;
}
