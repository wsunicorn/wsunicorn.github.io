// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wsunicorn.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', vi: 'vi' } } })],
  build: { inlineStylesheets: 'auto' },
});
