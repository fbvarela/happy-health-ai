import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createCohere } from "@ai-sdk/cohere";
import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { getProvider, buildSystemPrompt, getUsedMessages, recordUserMessage, DAILY_MSG_LIMIT } from "@/lib/chat";
import { computeHealthScore } from "@/lib/health-score";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat  Body: { patientId, messages: [{ role, content }] }
 * Streams the assistant reply. Context = active patient + latest vitals +
 * AI health score (SPEC §4.10). ES-only, no-medical-advice guardrail.
 */
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: "Falta el mensaje" }, { status: 400 });
  }

  // If no patient is selected, fall back to the user's first patient so the
  // chat always has context (active patient is set when viewing a patient page).
  let patientId = body.patientId;
  if (!patientId) {
    const [first] = await sql`
      SELECT p.id
      FROM patients p
      JOIN patient_members pm ON pm.patient_id = p.id
      WHERE pm.user_id = ${user.id}
      ORDER BY p.created_at DESC
      LIMIT 1
    `;
    patientId = first?.id ?? null;
  }
  if (!patientId) {
    return Response.json(
      { error: "Crea o selecciona un paciente para poder consultar al asistente." },
      { status: 400 }
    );
  }

  const access = await requirePatientAccess(user.id, patientId, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const provider = getProvider();
  if (!provider) {
    return Response.json(
      { error: "El asistente no está configurado (GROQ_API_KEY o COHERE_API_KEY)." },
      { status: 503 }
    );
  }

  const used = await getUsedMessages(user.id);
  if (used >= DAILY_MSG_LIMIT) {
    return Response.json(
      { error: `Has alcanzado el límite de ${DAILY_MSG_LIMIT} mensajes de hoy.` },
      { status: 429 }
    );
  }

  // Context: patient name + latest vitals + health score
  const [patient] = await sql`SELECT name FROM patients WHERE id = ${patientId}`;
  const patientName = patient?.name ?? "la persona a la que cuidas";
  const score = await computeHealthScore(patientId);

  const systemPrompt = buildSystemPrompt(patientName, score.summary);

  const model =
    provider.provider === "groq"
      ? createGroq({ apiKey: getEnv("GROQ_API_KEY") })(provider.model)
      : createCohere({ apiKey: getEnv("COHERE_API_KEY") })(provider.model);

  // Keep only the last N turns for context
  const recent = messages.slice(-10);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: recent,
    temperature: 0.4,
  });

  // Record the user message for rate limiting (history persistence is backlog).
  const userLast = messages[messages.length - 1];
  if (userLast?.role === "user") {
    await recordUserMessage(user.id, patientId, userLast.content);
  }

  return result.toUIMessageStreamResponse();
}
