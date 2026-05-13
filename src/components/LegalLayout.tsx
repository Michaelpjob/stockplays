import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function LegalLayout({ title, subtitle, children }: Props) {
  return (
    <article style={{ maxWidth: 720, paddingBottom: 60 }}>
      <div className="screen-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <div className="legal-body">{children}</div>
    </article>
  );
}
