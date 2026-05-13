import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 40, marginBottom: 12 }}>
        Not found
      </h2>
      <p style={{ marginBottom: 16 }}>That page doesn't exist.</p>
      <Link to="/" style={{ color: 'var(--text)', textDecoration: 'underline' }}>
        Back to Discover
      </Link>
    </div>
  );
}
