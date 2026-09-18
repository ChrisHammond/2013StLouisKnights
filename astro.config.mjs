import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.URL || 'https://2013-st-louis-knights.netlify.app',
  output: 'static',
  trailingSlash: 'always',
});
