/**
 * Theme Service
 * 
 * Manages themes for UI definitions
 * Phase 7: Styling & Theming
 */

/**
 * Color palette definition
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
  inputBorder: string;
  inputFocus: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
}

/**
 * Typography definition
 */
export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing definition
 */
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * Border radius definition
 */
export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Shadow definition
 */
export interface Shadow {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Theme definition
 */
export interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadow;
  customCSS?: string; // Additional custom CSS
}

/**
 * Predefined Light Theme
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  description: 'Default light theme',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    inputFocus: '#3b82f6',
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#6b7280',
    buttonSecondaryHover: '#4b5563',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Predefined Dark Theme
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark theme',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    border: '#374151',
    inputBackground: '#1f2937',
    inputBorder: '#4b5563',
    inputFocus: '#60a5fa',
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#6b7280',
    buttonSecondaryHover: '#4b5563',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Predefined themes registry
 */
const predefinedThemes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

/**
 * Get all predefined themes
 */
export function getPredefinedThemes(): Theme[] {
  return Object.values(predefinedThemes);
}

/**
 * Get theme by ID
 */
export function getTheme(id: string): Theme | undefined {
  return predefinedThemes[id];
}

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(theme: Theme): string {
  const cssVars: string[] = [];

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars.push(`  --color-${key}: ${value};`);
  });

  // Typography
  cssVars.push(`  --font-family: ${theme.typography.fontFamily};`);
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`  --font-size-${key}: ${value};`);
  });
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`  --font-weight-${key}: ${value};`);
  });
  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`  --line-height-${key}: ${value};`);
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars.push(`  --spacing-${key}: ${value};`);
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars.push(`  --border-radius-${key}: ${value};`);
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars.push(`  --shadow-${key}: ${value};`);
  });

  return `:root {\n${cssVars.join('\n')}\n}${theme.customCSS ? `\n\n${theme.customCSS}` : ''}`;
}

/**
 * Apply theme to a DOM element
 */
export function applyTheme(element: HTMLElement, theme: Theme): void {
  const css = generateThemeCSS(theme);
  const styleId = `theme-${theme.id}`;
  
  // Remove existing theme style
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  
  // Apply to element or document head
  if (element) {
    element.appendChild(style);
  } else {
    document.head.appendChild(style);
  }
}

/**
 * Create a custom theme from base theme
 */
export function createCustomTheme(
  baseTheme: Theme,
  overrides: Partial<Theme>
): Theme {
  return {
    ...baseTheme,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    name: overrides.name || baseTheme.name,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
      fontSize: {
        ...baseTheme.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...baseTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
      lineHeight: {
        ...baseTheme.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrides.borderRadius,
    },
    shadows: {
      ...baseTheme.shadows,
      ...overrides.shadows,
    },
  };
}

