import type { Category } from './types';

export const CATEGORY_DOT_COLORS: Record<Category, string> = {
  AI: '#ff8787',
  Power: '#ffa94d',
  Cyber: '#3bc9db',
  Biotech: '#69db7c',
  Defense: '#74c0fc',
  Industrial: '#e599f7',
};

export const CATEGORY_BENCHMARKS: Record<Category, string> = {
  AI: 'SMH / SOXX',
  Power: 'XLE / XLU',
  Cyber: 'HACK',
  Biotech: 'XBI / IBB',
  Defense: 'ITA',
  Industrial: 'XLI',
};
