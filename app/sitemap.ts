import { MetadataRoute } from 'next'
import { locales, type Locale } from '../config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://free-accounting.vercel.app'
  
  const routes = ['/privacy', '/terms']
  
  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
  
  // Add routes for each locale
  locales.forEach((locale: Locale) => {
    routes.forEach(route => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc: Locale) => [loc, `${baseUrl}/${loc}${route}`])
          ),
        },
      })
    })
  })
  
  return sitemap
} 
