import { defineCollection, z } from 'astro:content'

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    // SEO
    title: z.string(),          // <title> sans suffixe de marque
    description: z.string(),    // meta description (150-160 caractères)
    // Page
    heading: z.string(),        // h1
    intro: z.string(),          // chapô sous le h1
    tag: z.string(),            // catégorie affichée sur la carte de l'index
    cardTitle: z.string().optional(),
    cardDesc: z.string(),
    // Dates (ISO) — alimentent le schema Article et le « Mis à jour le »
    published: z.string(),
    updated: z.string(),
    order: z.number().default(50),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    related: z.array(z.object({ title: z.string(), href: z.string() })).default([]),
    sources: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
})

export const collections = { guides }
