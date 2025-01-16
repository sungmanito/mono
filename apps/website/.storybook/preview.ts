import type { Preview, SvelteRenderer } from '@storybook/svelte';
import './stories.css';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    withThemeByDataAttribute<SvelteRenderer>({
      themes: {
        sungmanito: 'sungmanito',
      },
      defaultTheme: 'sungmanito',
      parentSelector: 'body',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
