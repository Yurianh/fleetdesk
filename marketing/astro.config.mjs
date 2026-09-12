import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://fleetdesk.fr',
  trailingSlash: 'never',
  integrations: [
    react(),
    tailwind({ configFile: './tailwind.config.mjs' }),
    sitemap({
      // Pages de conversion et pages légales : utiles aux visiteurs, sans valeur en SERP.
      filter: page => !/\/(souscrire|legal)(\/|$)/.test(new URL(page).pathname),
      serialize(item) {
        const path = new URL(item.url).pathname
        if (path === '/') return { ...item, changefreq: 'weekly', priority: 1.0 }
        if (/^\/(logiciel-gestion-de-flotte|pricing|features|conformite)$/.test(path))
          return { ...item, changefreq: 'monthly', priority: 0.9 }
        if (path.startsWith('/secteurs')) return { ...item, changefreq: 'monthly', priority: 0.8 }
        if (path.startsWith('/guides') || path.startsWith('/outils'))
          return { ...item, changefreq: 'monthly', priority: 0.7 }
        return { ...item, changefreq: 'monthly', priority: 0.5 }
      },
    }),
  ],
  output: 'static',
})
