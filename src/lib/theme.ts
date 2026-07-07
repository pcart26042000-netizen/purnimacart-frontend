function readCssVar(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getBrandTheme() {
  return {
    primary: readCssVar('--brand-primary', '#008cff'),
    primaryHover: readCssVar('--brand-primary-hover', '#0072d6'),
    background: readCssVar('--brand-background', '#f4f7fa'),
    surface: readCssVar('--brand-surface', '#ffffff'),
    surfaceTint: readCssVar('--brand-primary', '#008cff'),
    onBackground: readCssVar('--brand-on-background', '#111827'),
    onSurfaceVariant: readCssVar('--brand-on-surface-variant', '#4b5563'),
    outline: readCssVar('--brand-outline', '#f1f3f5'),
    outlineVariant: readCssVar('--brand-outline-variant', '#e2e8f0'),
  } as const;
}

export const brandTheme = getBrandTheme();
