import LegalLayout from '../components/LegalLayout';

export default function Disclaimer() {
  return (
    <LegalLayout title="Investment Disclaimer" subtitle="Last updated: May 13, 2026">
      <p>
        <b>The information on Plays is for informational and educational purposes only and is
        not investment advice.</b>
      </p>

      <h3>Not investment advice</h3>
      <p>
        Plays publishes "plays" — thematic stock bundles with written theses and target weights —
        contributed by curators. Nothing on this Service constitutes investment advice, an
        offer or solicitation to buy or sell any security, or a recommendation tailored to your
        personal financial situation. Plays is not a registered investment advisor, broker-
        dealer, or financial planner.
      </p>

      <h3>Performance is hypothetical</h3>
      <p>
        Performance numbers shown on the Service (YTD, 1Y, vs benchmark, etc.) are computed
        from publicly available adjusted closing prices and the published holdings and weights
        of each play. They are <b>hypothetical</b>. They do not reflect:
      </p>
      <ul>
        <li>The cost of actually executing trades (commissions, spreads, slippage)</li>
        <li>Taxes</li>
        <li>The behavior of an actual investor (entry/exit timing, rebalancing latency)</li>
        <li>Dividends or distributions, unless specifically noted</li>
      </ul>
      <p>
        <b>Past performance does not predict future results.</b> Markets fluctuate; investments
        can lose value, including total loss of principal.
      </p>

      <h3>Curator disclosures</h3>
      <p>
        Where a curator has disclosed personal holdings in a play's securities, that disclosure
        is shown alongside the play. Where no disclosure is shown, no representation is made
        about the curator's personal holdings. Curators may have positions, conflicts of
        interest, or change their views without notice.
      </p>

      <h3>Do your own research</h3>
      <p>
        Before making any investment decision, you should: (a) consult a licensed financial
        advisor, tax professional, and/or attorney about your individual situation;
        (b) read all relevant disclosures from the security's issuer; (c) understand that you
        are responsible for your own decisions and outcomes.
      </p>

      <h3>Forward-looking statements</h3>
      <p>
        Theses and commentary on the Service may contain forward-looking statements (predictions
        about future events, market conditions, or company performance). These are inherently
        uncertain. Actual results may differ materially.
      </p>

      <h3>Coverage limits</h3>
      <p>
        The Service covers US-listed equities including ADRs. We do not provide data on
        international equities, derivatives, options, futures, crypto, or non-public
        instruments. We do not facilitate trade execution; Plays is not a brokerage.
      </p>

      <h3>No fiduciary relationship</h3>
      <p>
        Use of the Service does not create a fiduciary, advisory, or any other professional
        relationship between you and Plays or any curator on the Service.
      </p>
    </LegalLayout>
  );
}
