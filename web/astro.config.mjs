import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'

export default defineConfig({
  site: 'https://recall.pixeltowers.io',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
