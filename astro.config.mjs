import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.URL || 'https://hockey.chrishammond.com',
  output: 'static',
  trailingSlash: 'always',
});
