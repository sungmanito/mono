import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte'],
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  // compilerOptions: {
  //   experimental: {
  //     async: true,
  //   }
  // },

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
    // experimental: {
    //   remoteFunctions: true
    // },
    csp: {
      directives: {
        'worker-src': ['self', 'blob:'],
        'child-src': ['self', 'blob:'],
      },
    },
    alias: {
      $components: 'src/lib/components',
      $utils: 'src/lib/util',
    },
  },
};

export default config;
