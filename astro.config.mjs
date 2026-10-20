import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sumithsb.github.io',
  base: '/portfolio',
  trailingSlash: 'ignore',
  output: 'static',
  build: { format: 'directory' },
});
