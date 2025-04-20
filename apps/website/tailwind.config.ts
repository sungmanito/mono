import { join } from 'node:path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/skeleton/plugin';
import forms from '@tailwindcss/forms';
import { SungmanitoTheme } from '@sungmanito/skeleton-plugin';
import * as themes from '@skeletonlabs/skeleton/themes';

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(
      require.resolve('@skeletonlabs/skeleton-svelte'),
      '../**/*.{html,js,svelte,ts}',
    ),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
    containerQueries,
    skeleton({
      themes: [themes.cerberus, themes.rose, themes.pine],
    }),
  ],
} satisfies Config;
