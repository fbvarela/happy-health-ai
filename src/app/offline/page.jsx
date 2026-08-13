/**
 * PWA offline fallback — served by next-pwa when the app is offline
 * (fallbacks.document = "/offline"). Must render statically, no redirects.
 */
export default function OfflinePage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "3rem" }}>📴</div>
        <h1 style={{ fontFamily: "Fraunces, serif", color: "var(--bark)" }}>
          You&apos;re offline
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "360px", lineHeight: 1.6 }}>
          Happy Health needs a connection to show health data — for your
          privacy, nothing is stored on this device. Reconnect to continue.
        </p>
      </div>
    </div>
  );
}
