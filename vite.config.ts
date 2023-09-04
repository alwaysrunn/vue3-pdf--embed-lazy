import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import path from 'path';
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  AntDesignVueResolver,
} from 'unplugin-vue-components/resolvers'


// https://vitejs.dev/config/
export default defineConfig({
  // base: '/zjzb/',
  server: {
    proxy: {
      '/zjzb': {
        // target: 'http://192.168.4.246:8790/zjzb',
        // target: 'http://192.168.4.246:8789/zjzb',
        target: 'https://duotougpt.wenge.com/zjzb',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/zjzb/, ''),
      },
    },
    host: '192.168.4.100', 
    port: 3333,
  },
  css: {
    preprocessorOptions: {
      less: {
        // 使用 less-loader
        javascriptEnabled: true
      }
    },
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
  },
  },
  plugins: [
    vue(),
    // 按需引入ant
    Components({
      extensions: ['vue'],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
      resolvers: [
        AntDesignVueResolver(),
      ],
    }),
    //自动引入
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue/macros',
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/stores',
      ],
      vueTemplate: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },

})
