import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Absolute site URL for link-preview tags (WhatsApp etc. need full URLs).
// Set VITE_SITE_URL to your custom domain; on Vercel it falls back to the production domain.
function siteUrl() {
  const raw = process.env.VITE_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || 'https://kela-counter.vercel.app';
  return raw.replace(/\/+$/, '');
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', siteUrl()) }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely, so keep them in their own long-cached files
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
