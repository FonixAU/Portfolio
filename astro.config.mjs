import { defineConfig } from 'astro/config';

// SITE and BASE come from the environment so the same source builds for any host.
// RELATIVE_ASSETS=1 makes asset URLs relative, for previews served from an unknown path.
export default defineConfig({
  site: process.env.SITE,
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  build: process.env.RELATIVE_ASSETS ? { assetsPrefix: '.' } : {},
});
