import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte|md)'],
  staticDirs: ['../static'],
  addons: [
    {
      name: '@storybook/addon-svelte-csf',
      options: {
        legacyTemplate: true,
      },
    },
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {},
  },
};

export default config;
