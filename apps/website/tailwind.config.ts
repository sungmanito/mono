import { skeleton } from '@skeletonlabs/tw-plugin';
import { SungmanitoTheme } from '@sungmanito/skeleton-plugin';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import { join } from 'node:path';
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(
      require.resolve('@skeletonlabs/skeleton'),
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
      themes: {
        custom: [SungmanitoTheme],
        preset: [
          {
            name: 'skeleton',
            enhancements: true,
          },
        ],
      },
    }),
  ],
} satisfies Config;
