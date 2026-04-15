export default function OfflinePage() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      gap: '12px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '48px' }}>📡</span>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Sin conexión</h1>
      <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
        918 necesita conexión para funcionar.<br />
        Revisá tu red y volvé a intentar.
      </p>
    </main>
  );
}
