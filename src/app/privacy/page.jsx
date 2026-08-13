export const metadata = { title: "Privacidad — Happy Health AI" };

/**
 * Privacy policy (ES) — health data is sensitive (GDPR, SPEC §9.7). In-app
 * only; no third-party tracking beyond the listed services.
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg py-10 px-5">
      <div className="max-w-2xl mx-auto bg-surface rounded-[14px] border-[1.5px] border-line p-8">
        <h1 className="font-serif text-[1.8rem] text-bark mb-4">Política de privacidad</h1>
        <div className="space-y-4 text-sm text-bark leading-relaxed">
          <p>
            Happy Health AI es una aplicación de uso familiar para llevar un
            registro de la salud de personas mayores. Guarda información de
            salud de carácter sensible.
          </p>
          <h2 className="font-semibold text-[1.05rem]">Qué datos guardamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cuenta de Google (email y nombre) de los cuidadores.</li>
            <li>Datos de pacientes: constantes (SpO₂, frecuencia cardíaca, tensión, temperatura), notas de cuidado, citas, fotos y documentos.</li>
          </ul>
          <h2 className="font-semibold text-[1.05rem]">Cómo los usamos</h2>
          <p>
            Solo para mostrar el estado de salud de los pacientes a los
            cuidadores autorizados. No vendemos ni compartimos datos con
            terceros. Las fotos se guardan en almacenamiento privado con acceso
            firmado y caduco.
          </p>
          <h2 className="font-semibold text-[1.05rem]">Dónde se guardan</h2>
          <p>
            Los datos están en un servidor en la Unión Europea y en servicios
            de Cloudflare. Se protegen con cifrado en reposo y control de
            acceso por roles (propietario / cuidador / lector).
          </p>
          <h2 className="font-semibold text-[1.05rem]">Tus derechos (RGPD)</h2>
          <p>
            Puedes solicitar acceso, rectificación o borrado de los datos
            poniéndote en contacto con el administrador de la aplicación.
          </p>
          <p className="text-muted text-xs pt-2">
            Última actualización: 2026.
          </p>
        </div>
      </div>
    </main>
  );
}
