/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// AdSense tag in <head> (Google uses it to verify the site and, once "Privacy &
// messaging" is set up, to show its CMP). Only injected when a client ID is set
// (VITE_ADSENSE_CLIENT=ca-pub-…); otherwise the <!--adsense--> marker in
// index.html is simply removed.
function adsenseTag(client: string): Plugin {
  return {
    name: 'adsense-tag',
    transformIndexHtml(html) {
      const tag = client
        ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}" crossorigin="anonymous"></script>`
        : '';
      return html.replace('<!--adsense-->', tag);
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const adsenseClient = env.VITE_ADSENSE_CLIENT ?? ''
  if (adsenseClient && !/^ca-pub-\d{16}$/.test(adsenseClient)) {
    throw new Error(`Invalid VITE_ADSENSE_CLIENT: "${adsenseClient}" (expected format: ca-pub-XXXXXXXXXXXXXXXX).`)
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      adsenseTag(adsenseClient),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  }
})
