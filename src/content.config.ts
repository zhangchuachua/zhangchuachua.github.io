import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'
import { DEFAULT_FRONTMATTER as d } from '@/config'

const posts = defineCollection({
  loader: glob({ base: './posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    titleIcon: z.string().default(d.titleIcon),
    titleColor: z.string().default(d.titleColor),
    publishDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    tags: z.string().array().optional(),
    categories: z.string().array().default(d.categories),
    description: z.string().default(d.description),
    top: z.number().optional(), //置顶,数字越大越靠前
    password: z.string().optional(),
    encrypt: z.object({
      description: z.string().default(d.encrypt.description),
      placeholder: z.string().default(d.encrypt.placeholder),
    }).default({}),
    bodyJoin: z.string().array().optional()
  }),
})

const seoSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(15).max(160).optional(),
  keywords: z.array(z.string()).optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().optional()
    })
    .optional(),
  pageType: z.enum(['website', 'article']).default('website')
})

const zcc = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/zcc' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()).default([]),
    slug: z.string(),
    lang: z.string().default('cn'),
    publish_date: z.coerce.date(),
    update_date: z.coerce.date().optional(),
    share: z.boolean().default(true),
    seo: seoSchema.optional()
  })
})

export const collections = { posts }
