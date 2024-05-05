import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte'],

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
    csp: {
      directives: {
        'worker-src': ['self', 'blob:'],
        'child-src': ['self', 'blob:'],
      },
    },
    alias: {
      $components: 'src/lib/components',
    },
  },
};

export default config;
