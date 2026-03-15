export const metadata = {
  title: 'Golf Intelligence',
  description: 'Program-level analytics dashboards for collegiate golf.',
};

export default function GolfIntelligencePage() {
  return (
    <div className="page-hero">
      <div className="page-hero-inner">
        <p className="eyebrow" style={{ marginBottom: '20px' }}>
          Dashboard
        </p>

        <h1 className="display-heading">
          Golf{' '}
          <span style={{ color: 'var(--color-accent)' }}>Intelligence</span>
        </h1>

        <p className="display-sub">
          Your program's full analytics suite — strokes gained by category,
          shot-by-shot data, benchmark comparisons, and round-level trends.
          Every college logs in and sees only their own players' data.
        </p>

        {/* Framework strip */}
        <div className="loop-strip" style={{ marginTop: '48px' }}>
          <p className="eyebrow" style={{ marginBottom: '24px' }}>
            The Framework
          </p>
          <div className="loop-steps">
            <div className="loop-step">
              <span className="loop-step-num">01</span>
              <p className="loop-step-title">Tiger 5</p>
              <p className="loop-step-body">When did the round break down?</p>
            </div>
            <div className="loop-arrow">→</div>
            <div className="loop-step">
              <span className="loop-step-num">02</span>
              <p className="loop-step-title">Root Cause</p>
              <p className="loop-step-body">Where specifically did it happen?</p>
            </div>
            <div className="loop-arrow">→</div>
            <div className="loop-step">
              <span className="loop-step-num">03</span>
              <p className="loop-step-title">Strokes Gained</p>
              <p className="loop-step-body">How much did it cost?</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://intelligence.theory.golf"
          className="dashboard-cta"
        >
          Open Dashboard →
        </a>
        <p className="cta-note">
          Don't have access?{' '}
          <a href="/contact">Contact us</a> to get your program set up.
        </p>
      </div>
    </div>
  );
}
