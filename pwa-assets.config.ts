import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

// Genera los PNG (64, 192, 512, maskable 512, apple-touch 180) y favicon.ico
// a partir de public/logo.svg. Ejecutar con `npm run generate-pwa-assets`.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    // Fondo oscuro también en los iconos con relleno (maskable y Apple).
    maskable: { ...preset.maskable, resizeOptions: { background: '#0f1115' } },
    apple: { ...preset.apple, resizeOptions: { background: '#0f1115' } },
  },
  images: ['public/logo.svg'],
})
