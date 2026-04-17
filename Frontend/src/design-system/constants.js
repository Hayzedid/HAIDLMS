/**
 * Design System Constants
 * Centralized design tokens for the HAIDLMS platform
 */
export const COLORS = {
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1', // Main brand color
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
    },
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        700: '#15803d',
    },
    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        700: '#b45309',
    },
    danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        700: '#b91c1c',
    },
    accent: {
        500: '#a855f7',
        600: '#9333ea',
    },
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
};
export const TYPOGRAPHY = {
    fontFamily: {
        sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        display: 'Lexend, Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    },
    fontSize: {
        xs: '0.75rem', // 12px
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem', // 48px
        'display-lg': '3rem', // 48px
        'display-xl': '3.75rem', // 60px
        'display-2xl': '4.5rem', // 72px
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },
};
export const SPACING = {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
};
export const BORDER_RADIUS = {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
};
export const SHADOWS = {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
};
export const TRANSITIONS = {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};
export const ANIMATION_CURVES = {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
export const Z_INDEX = {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
};
export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};
// Helper functions
export const getRiskColor = (riskLevel) => {
    const colors = {
        low: COLORS.success[500],
        medium: COLORS.warning[500],
        high: COLORS.danger[500],
        critical: COLORS.danger[700],
    };
    return colors[riskLevel] || COLORS.gray[500];
};
export const getRiskBgColor = (riskLevel) => {
    const colors = {
        low: COLORS.success[50],
        medium: COLORS.warning[50],
        high: COLORS.danger[50],
        critical: COLORS.danger[100],
    };
    return colors[riskLevel] || COLORS.gray[50];
};
export const getStatusColor = (status) => {
    const colors = {
        success: COLORS.success[500],
        warning: COLORS.warning[500],
        danger: COLORS.danger[500],
        info: COLORS.primary[500],
    };
    return colors[status];
};
