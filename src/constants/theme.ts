import { Platform } from 'react-native';

export const COLORS = {
  // Base backgrounds (Light Mode)
  page: '#F4F6F9',            // Crisp soft off-white background
  surface: '#FFFFFF',         // Pure white cards / panels
  surfaceElevated: '#FFFFFF', // Elevated cards / modals
  surfaceSubtle: '#F1F5F9',   // Recessed containers / input fills
  surfaceNavy: '#0F2942',     // Deep rich navy for curved hero header blocks (Bayin design)
  surfaceNavySubtle: '#1A3B5C',// Subtle navy pill / highlight
  border: '#E2E8F0',          // Slate-200 border
  borderFocus: '#0284C7',     // Active sky/cyan focus border

  // Status colors (Light Theme High Contrast)
  pass: '#059669',            // Deep emerald green text
  passMuted: '#ECFDF5',       // Soft mint background
  passBorder: '#A7F3D0',      // Mint border

  rework: '#D97706',          // Deep amber text
  reworkMuted: '#FFFBEB',     // Soft amber background
  reworkBorder: '#FDE68A',    // Amber border

  fail: '#DC2626',            // High-vis red text
  failMuted: '#FEF2F2',       // Soft red background
  failBorder: '#FECACA',      // Light red border

  // Interactive & Technical
  interactive: '#0284C7',     // Sky/Cyan primary accent
  interactiveMuted: '#E0F2FE',// Soft cyan background
  primaryNavy: '#0F2942',     // Deep brand navy
  orangeAccent: '#EA580C',    // Warm accent for action buttons (like screenshot)
  orangeMuted: '#FFEDD5',
  cyan: '#0891B2',

  // Typography (Dark text for light theme)
  textPrimary: '#0F172A',     // Slate-900 high contrast text
  textSecondary: '#475569',   // Slate-600 readable secondary text
  textMuted: '#94A3B8',       // Slate-400 hint text
  textDisabled: '#CBD5E1',    // Slate-300 disabled text
  textWhite: '#FFFFFF',       // Pure white for navy headers

  // Conveyor / Mock camera specific (Camera viewfinder stays industrial dark)
  conveyorBg: '#0B0F17',
  billetSteel: '#475569',
  billetHighlight: '#64748B',
  roller: '#1E293B',
  dimensionLine: '#38BDF8',
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
    black: 'Inter_900Black',
    primary: Platform.select({
      web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ios: 'Inter',
      android: 'Inter',
      default: 'Inter',
    }),
    mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    hero: 28,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const TOUCH_TARGET = {
  minHeight: 44,
  minWidth: 44,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  alert: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Backwards compatibility
export const Colors = {
  light: {
    text: COLORS.textPrimary,
    background: COLORS.page,
    tint: COLORS.interactive,
    icon: COLORS.textSecondary,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.interactive,
  },
  dark: {
    text: COLORS.textPrimary,
    background: COLORS.page,
    tint: COLORS.interactive,
    icon: COLORS.textSecondary,
    tabIconDefault: COLORS.textMuted,
    tabIconSelected: COLORS.interactive,
  },
};

export const Fonts = {
  mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  sans: 'System',
};

export const Spacing = SPACING;
export const MaxContentWidth = 800;
export type ThemeColor = keyof typeof Colors.light;
