import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'html-og-absolute-url',
        transformIndexHtml(html) {
          if (!siteUrl) return html
          const ogImage = `${siteUrl}/og-banner.png?v=2`
          return html
            .replace(/content="\/og-banner\.png\?v=2"/g, `content="${ogImage}"`)
        },
      },
    ],
  }
})
