import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Last updated: May 13, 2026">
      <p>
        This Privacy Policy describes how Plays ("we", "us") collects, uses, and shares
        information when you use the Service.
      </p>

      <h3>1. Information we collect</h3>
      <ul>
        <li>
          <b>Account information.</b> Email address, password (hashed), display name, handle,
          optional bio and links.
        </li>
        <li>
          <b>Content you create.</b> Plays, comments, dissertations, votes, subscriptions, and
          other engagement.
        </li>
        <li>
          <b>Technical information.</b> IP address, browser type, device information, pages
          visited. We use this to operate and improve the Service.
        </li>
        <li>
          <b>Cookies.</b> We use a small number of essential cookies for authentication and
          session management. We use privacy-friendly analytics (Plausible) which does not set
          tracking cookies.
        </li>
      </ul>

      <h3>2. How we use information</h3>
      <ul>
        <li>To provide, operate, and maintain the Service.</li>
        <li>To send transactional emails (account verification, password resets, notifications you opt into).</li>
        <li>To detect and prevent abuse, spam, and security incidents.</li>
        <li>To improve the Service through aggregate, non-identifying analytics.</li>
      </ul>

      <h3>3. Sharing</h3>
      <p>
        We do not sell personal information. We share information with the following
        third-party service providers solely to operate the Service:
      </p>
      <ul>
        <li>Supabase (database, authentication)</li>
        <li>Resend (transactional email)</li>
        <li>Polygon.io (stock data — no user data shared)</li>
        <li>Plausible (privacy-friendly analytics)</li>
        <li>Sentry (error tracking)</li>
        <li>Cloudflare Turnstile (bot prevention at signup)</li>
      </ul>
      <p>We may also disclose information when required by law or to protect rights and safety.</p>

      <h3>4. Your rights</h3>
      <p>
        Depending on your jurisdiction (GDPR, CCPA, others) you have rights to access, correct,
        export, or delete your personal information. To exercise these rights, email{' '}
        <b>privacy@plays.example</b> (placeholder).
      </p>
      <p>
        You can export all of your data from the Settings page. You can delete your account
        from Settings; content you posted is preserved with author replaced by [removed] to
        maintain thread coherence.
      </p>

      <h3>5. Data retention</h3>
      <p>
        We retain your information for as long as your account is active. Backup and audit logs
        may persist for up to 90 days after deletion.
      </p>

      <h3>6. Security</h3>
      <p>
        We use industry-standard security practices including encryption in transit (TLS),
        encryption at rest, and Row-Level Security in our database. No system is perfectly
        secure; if you suspect a breach affecting your account, contact us immediately.
      </p>

      <h3>7. Children</h3>
      <p>
        The Service is not directed to children under 18 and we do not knowingly collect
        information from them.
      </p>

      <h3>8. Changes to this Policy</h3>
      <p>
        We may update this Policy. Material changes will be communicated by email or a
        prominent notice on the Service.
      </p>

      <h3>9. Contact</h3>
      <p>
        Privacy questions: <b>privacy@plays.example</b> (placeholder).
      </p>
    </LegalLayout>
  );
}
