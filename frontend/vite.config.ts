import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isWebOnly = process.env.ELECTRON_DISABLE === '1'

  const plugins: any[] = [
    vue(),
    Components({
      dts: true,
      dirs: ['src/components'],
      resolvers: [
        // Custom resolver for UI components
        (componentName) => {
          // Auto-import from components/ui/*
          if (componentName.startsWith('Alert') ||
            componentName.startsWith('Dialog') ||
            componentName.startsWith('Button') ||
            componentName.startsWith('Input') ||
            componentName.startsWith('Label') ||
            componentName.startsWith('Select') ||
            componentName.startsWith('Card') ||
            componentName.startsWith('Badge') ||
            componentName.startsWith('Tabs') ||
            componentName.startsWith('Table') ||
            componentName.startsWith('Checkbox') ||
            componentName.startsWith('Avatar') ||
            componentName.startsWith('Dropdown') ||
            componentName.startsWith('Sheet') ||
            componentName.startsWith('Popover') ||
            componentName.startsWith('Command') ||
            componentName.startsWith('Separator') ||
            componentName.startsWith('Scroll') ||
            componentName.startsWith('Toast') ||
            componentName.startsWith('Switch') ||
            componentName.startsWith('Radio') ||
            componentName.startsWith('Slider') ||
            componentName.startsWith('Progress') ||
            componentName.startsWith('Skeleton')) {

            // Map component names to their directories
            const dirMap: Record<string, string> = {
              'Alert': 'alert',
              'AlertDialog': 'alert-dialog',
              'Button': 'button',
              'Card': 'card',
              'Dialog': 'dialog',
              'Input': 'input',
              'Label': 'label',
              'Select': 'select',
              'Badge': 'badge',
              'Tabs': 'tabs',
              'Table': 'table',
              'Checkbox': 'checkbox',
              'Avatar': 'avatar',
              'Dropdown': 'dropdown-menu',
              'Sheet': 'sheet',
              'Popover': 'popover',
              'Command': 'command',
              'Separator': 'separator',
              'Scroll': 'scroll-area',
              'Toast': 'toast',
              'Switch': 'switch',
              'Radio': 'radio-group',
              'Slider': 'slider',
              'Progress': 'progress',
              'Skeleton': 'skeleton',
            }

            // Find matching directory
            for (const [prefix, dir] of Object.entries(dirMap)) {
              if (componentName.startsWith(prefix)) {
                return {
                  name: componentName,
                  from: `@/components/ui/${dir}`
                }
              }
            }
            return undefined
          }
          return undefined
        }
      ]
    }),
  ]

  // Add PWA plugin only in web-only mode (not for Electron builds)
  if (isWebOnly) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-light.png', 'logo-dark.png', 'vite.svg'],
        manifest: {
          name: 'YTRC Center',
          short_name: 'YTRC',
          description: 'YTRC Center Management System',
          theme_color: '#0c0c0c',
          background_color: '#0c0c0c',
          display: 'standalone',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/app\.ytrc\.co\.th\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      })
    )
  }

  // Only add electron plugin if not in web-only mode
  if (!isWebOnly) {
    plugins.push(
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: 'electron/main.ts',
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === 'test'
          // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
          ? undefined
          : {},
      }) as any
    )
  }

  return {
    cacheDir: isWebOnly ? 'node_modules/.vite-web' : 'node_modules/.vite-electron',
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'pinia',
        'vue-router',
        'axios',
        'date-fns',
        'dayjs',
        'lucide-vue-next',
        'vue-i18n',
        'clsx',
        'tailwind-merge',
        'radix-vue',
        'reka-ui'
      ],
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['app.ytrc.co.th', 'localhost', '122.154.46.21'],
      proxy: {
        '/api/socket.io': {
          target: 'https://app.ytrc.co.th',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/api': {
          target: 'https://app.ytrc.co.th',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path,
        },
        '/api-staging/socket.io': {
          target: 'http://app.ytrc.co.th:2531',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api-staging/, ''),
        },
        '/api-staging': {
          target: 'http://app.ytrc.co.th:2531',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api-staging/, '/api'),
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
