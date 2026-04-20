export default function Home() {
  const stages = [
    {
      eyebrow: 'EVENT DETECTED',
      title: 'Deadline Missed — Verified by Kernel',
      body: 'A required action did not occur. The event is recorded as system truth and bound to a governed obligation path.',
      signal: 'source event recorded',
      authority: 'kernel verified',
      tone: 'cyan',
    },
    {
      eyebrow: 'OBLIGATION TRIGGERED',
      title: 'Enforcement Initiated — Resolution Required',
      body: 'A non-negotiable obligation is open. It remains active until a valid receipt closes the chain.',
      signal: 'obligation opened',
      authority: 'receipt required',
      tone: 'emerald',
    },
    {
      eyebrow: 'ENFORCEMENT ACTIVE',
      title: 'Delivery Failed — Retry Scheduled',
      body: 'External delivery did not succeed. Retry state is governed through attempt_count, next_retry_at, and max_attempts.',
      signal: 'retry discipline active',
      authority: 'governed mutation path',
      tone: 'amber',
    },
    {
      eyebrow: 'RECEIPT PENDING',
      title: 'Proof Not Yet Established — Obligation Still Active',
      body: 'No valid receipt exists. The outcome remains unresolved and visible until proof-backed completion occurs.',
      signal: 'receipt absent',
      authority: 'failure cannot disappear',
      tone: 'rose',
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.background}>
        <div style={styles.radialA} />
        <div style={styles.radialB} />
        <div style={styles.grid} />
        <div style={styles.centerLine} />
      </div>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.badge}>
            <span>AutoKirk Future</span>
            <span style={styles.badgeDot} />
            <span>Enforcement Truth Path</span>
          </div>

          <h1 style={styles.headline}>Failures Don&apos;t Disappear.</h1>

          <p style={styles.subhead}>
            Every missed action becomes an obligation. Every obligation remains active.
            The system continues until valid proof exists.
          </p>

          <div style={styles.ctaRow}>
            <button style={styles.primaryButton}>View Active Enforcement</button>

            <div style={styles.lifecycleCard}>
              <div style={styles.lifecycleLabel}>Canonical lifecycle</div>
              <div style={styles.lifecycleValue}>
                event -&gt; obligation -&gt; resolution -&gt; receipt
              </div>
            </div>
          </div>
        </header>

        <section style={styles.timeline}>
          {stages.map((stage, index) => {
            const isRight = index % 2 === 0;

            return (
              <div key={stage.eyebrow} style={styles.timelineRow}>
                <div
                  style={{
                    ...styles.desktopSpacer,
                    ...(isRight ? {} : styles.desktopSpacerVisible),
                  }}
                />

                <div style={styles.nodeColumn}>
                  <div style={styles.nodeOuter}>
                    <div
                      style={{
                        ...styles.nodeGlow,
                        ...(stage.tone === 'cyan'
                          ? styles.nodeGlowCyan
                          : stage.tone === 'emerald'
                          ? styles.nodeGlowEmerald
                          : stage.tone === 'amber'
                          ? styles.nodeGlowAmber
                          : styles.nodeGlowRose),
                      }}
                    />
                    <div
                      style={{
                        ...styles.nodeCore,
                        background:
                          stage.tone === 'cyan'
                            ? '#67e8f9'
                            : stage.tone === 'emerald'
                            ? '#6ee7b7'
                            : stage.tone === 'amber'
                            ? '#fcd34d'
                            : '#fb7185',
                      }}
                    />
                  </div>
                </div>

                <article
                  style={{
                    ...styles.stageCard,
                    ...(isRight ? {} : styles.stageCardLeft),
                  }}
                >
                  <div style={styles.stageTop}>
                    <div>
                      <div style={styles.stageEyebrow}>{stage.eyebrow}</div>
                      <h2 style={styles.stageTitle}>{stage.title}</h2>
                    </div>

                    <div style={styles.truthPill}>system-truth</div>
                  </div>

                  <p style={styles.stageBody}>{stage.body}</p>

                  <div style={styles.metaGrid}>
                    <div style={styles.metaBox}>
                      <div style={styles.metaLabel}>Signal</div>
                      <div style={styles.metaValue}>{stage.signal}</div>
                    </div>

                    <div style={styles.metaBox}>
                      <div style={styles.metaLabel}>Authority</div>
                      <div style={styles.metaValue}>{stage.authority}</div>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </section>

        <section style={styles.bottomPanel}>
          <div style={styles.bottomEyebrow}>Certified Proof Chain</div>
          <p style={styles.bottomCopy}>
            Every step enforced. Every outcome proven. No unresolved failure is
            allowed to disappear.
          </p>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: '#05090f',
    color: '#f8fafc',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  background: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  radialA: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at top, rgba(90,211,255,0.18), transparent 30%)',
  },
  radialB: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 80% 20%, rgba(129,255,216,0.08), transparent 20%)',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.25,
    backgroundImage:
      'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
    backgroundSize: '72px 72px',
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    transform: 'translateX(-0.5px)',
    background:
      'linear-gradient(to bottom, rgba(103,232,249,0), rgba(103,232,249,0.28), rgba(103,232,249,0))',
  },
  main: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1280,
    margin: '0 auto',
    padding: '40px 24px 96px',
  },
  header: {
    maxWidth: 960,
    margin: '0 auto',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid rgba(103,232,249,0.18)',
    background: 'rgba(34,211,238,0.05)',
    color: 'rgba(207,250,254,0.86)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    backdropFilter: 'blur(8px)',
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    background: '#67e8f9',
  },
  headline: {
    margin: '24px auto 0',
    maxWidth: 900,
    fontSize: 'clamp(44px, 8vw, 88px)',
    lineHeight: 1,
    letterSpacing: '-0.05em',
    fontWeight: 700,
    color: '#ffffff',
  },
  subhead: {
    margin: '24px auto 0',
    maxWidth: 860,
    fontSize: 'clamp(18px, 2.2vw, 30px)',
    lineHeight: 1.6,
    color: '#cbd5e1',
  },
  ctaRow: {
    marginTop: 40,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    border: '1px solid rgba(103,232,249,0.32)',
    background: 'rgba(34,211,238,0.14)',
    color: '#ecfeff',
    borderRadius: 18,
    padding: '16px 24px',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.02em',
    boxShadow: '0 0 40px rgba(34,211,238,0.18)',
    cursor: 'pointer',
  },
  lifecycleCard: {
    textAlign: 'left',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: '14px 18px',
    backdropFilter: 'blur(10px)',
  },
  lifecycleLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
    color: '#94a3b8',
  },
  lifecycleValue: {
    marginTop: 6,
    fontSize: 14,
    color: '#e2e8f0',
  },
  timeline: {
    maxWidth: 1120,
    margin: '72px auto 0',
    display: 'grid',
    gap: 28,
  },
  timelineRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 1fr',
    gap: 24,
    alignItems: 'center',
  },
  desktopSpacer: {
    display: 'block',
  },
  desktopSpacerVisible: {
    order: 3,
  },
  nodeColumn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    order: 2,
  },
  nodeOuter: {
    position: 'relative',
    width: 92,
    height: 92,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeGlow: {
    position: 'absolute',
    inset: 12,
    borderRadius: '50%',
  },
  nodeGlowCyan: {
    background: 'rgba(103,232,249,0.12)',
    boxShadow: '0 0 50px rgba(34,211,238,0.22)',
  },
  nodeGlowEmerald: {
    background: 'rgba(110,231,183,0.12)',
    boxShadow: '0 0 50px rgba(16,185,129,0.22)',
  },
  nodeGlowAmber: {
    background: 'rgba(252,211,77,0.12)',
    boxShadow: '0 0 50px rgba(245,158,11,0.22)',
  },
  nodeGlowRose: {
    background: 'rgba(251,113,133,0.12)',
    boxShadow: '0 0 50px rgba(244,63,94,0.22)',
  },
  nodeCore: {
    position: 'relative',
    width: 16,
    height: 16,
    borderRadius: '50%',
  },
  stageCard: {
    order: 3,
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,0.1)',
    background:
      'linear-gradient(180deg, rgba(12,18,28,0.88), rgba(7,10,16,0.88))',
    padding: 24,
    boxShadow: '0 20px 80px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(14px)',
  },
  stageCardLeft: {
    order: 1,
  },
  stageTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  stageEyebrow: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.24em',
    color: '#94a3b8',
  },
  stageTitle: {
    margin: '12px 0 0',
    fontSize: 30,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    fontWeight: 700,
  },
  truthPill: {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    padding: '8px 12px',
    fontSize: 12,
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  stageBody: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 1.7,
    color: '#cbd5e1',
  },
  metaGrid: {
    marginTop: 24,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  metaBox: {
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    padding: '14px 16px',
  },
  metaLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
    color: '#64748b',
  },
  metaValue: {
    marginTop: 8,
    fontSize: 14,
    color: '#e2e8f0',
  },
  bottomPanel: {
    maxWidth: 980,
    margin: '80px auto 0',
    borderRadius: 32,
    border: '1px solid rgba(103,232,249,0.14)',
    background: 'rgba(34,211,238,0.04)',
    padding: '40px 28px',
    textAlign: 'center',
    boxShadow: '0 0 80px rgba(34,211,238,0.08)',
    backdropFilter: 'blur(12px)',
  },
  bottomEyebrow: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.28em',
    color: 'rgba(207,250,254,0.82)',
  },
  bottomCopy: {
    margin: '20px auto 0',
    maxWidth: 820,
    fontSize: 'clamp(28px, 4vw, 48px)',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    fontWeight: 600,
  },
};
