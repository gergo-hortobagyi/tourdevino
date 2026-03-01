export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:40001/api',
      appName: process.env.NUXT_PUBLIC_APP_NAME ?? 'Tour de Vino'
    }
  },
  devtools: { enabled: false },
  typescript: {
    strict: true,
    typeCheck: false
  }
});
