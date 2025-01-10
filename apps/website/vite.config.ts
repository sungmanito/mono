import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'jim-burbridge',
        project: 'javascript-sveltekit',
      },
    }),
    sveltekit(),
    svelteTesting(),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/testing/vitest-setup.ts'],
  },
});
