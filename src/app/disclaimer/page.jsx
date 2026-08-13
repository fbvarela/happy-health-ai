export const metadata = { title: "Aviso legal — Happy Health AI" };

/**
 * Disclaimer (ES) — the app is a tracking tool, not a medical device.
 * Non-negotiable per SPEC (no medical advice).
 */
export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-bg py-10 px-5">
      <div className="max-w-2xl mx-auto bg-surface rounded-[14px] border-[1.5px] border-line p-8">
        <h1 className="font-serif text-[1.8rem] text-bark mb-4">Aviso legal y exención de responsabilidad</h1>
        <div className="space-y-4 text-sm text-bark leading-relaxed">
          <p>
            Happy Health AI es una <strong>herramienta de seguimiento</strong>,
            no un dispositivo médico. Los datos y valores registrados son
            información, no un diagnóstico.
          </p>
          <h2 className="font-semibold text-[1.05rem]">Nunca sustituye a un profesional</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No uses esta aplicación para decidir tratamientos, dosis o diagnósticos.</li>
            <li>Ante cualquier duda, emergencia o síntoma grave, contacta con un médico o llama al <strong>112</strong>.</li>
            <li>Los umbrales de alerta son orientativos y configurables; una lectura fuera de rango no es necesariamente un problema médico.</li>
          </ul>
          <h2 className="font-semibold text-[1.05rem]">Asistente de salud</h2>
          <p>
            El asistente responde solo sobre los registros de tus pacientes y
            se le ha indicado explícitamente que no proporcione consejo médico,
            dosis ni diagnósticos. Su respuesta puede ser incompleta o
            imprecisa: verifica siempre con un profesional.
          </p>
          <p className="text-muted text-xs pt-2">Última actualización: 2026.</p>
        </div>
      </div>
    </main>
  );
}
