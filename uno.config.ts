import { defineConfig, presetAttributify, presetUno, presetIcons } from 'unocss';
import type { IconifyJSON } from '@iconify/types';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        'material-symbols': async () => {
          const icons = await import('@iconify-json/material-symbols/icons.json');
          return icons.default as unknown as IconifyJSON;
        },
      },
    }),
  ],
  theme: {
    colors: {
      primary: 'hsl(var(--primary))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      muted: 'hsl(var(--muted))',
      border: 'hsl(var(--border))',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
  shortcuts: {
    'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75',
    'btn-primary': 'bg-primary text-white hover:bg-primary/90',
    'input': 'px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
    'card': 'bg-background border border-border rounded-lg p-4 shadow-sm',
  },
  rules: [
    ['bg-gradient-primary', { background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary-light)))' }],
  ],
}); 