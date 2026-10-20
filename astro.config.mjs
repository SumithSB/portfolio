import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sumithsb.com',
  trailingSlash: 'ignore',
  output: 'static',
  build: { format: 'directory' },
});
