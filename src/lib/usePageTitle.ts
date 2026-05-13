import { useEffect } from 'react';

const DEFAULT_TITLE = 'Plays — Thematic Stock Bundles';

export function usePageTitle(title: string | undefined | null) {
  useEffect(() => {
    if (!title) {
      document.title = DEFAULT_TITLE;
      return;
    }
    document.title = `${title} — Plays`;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
