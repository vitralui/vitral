// The playground the Nuxt module is tested in: a page rendered on the server,
// hydrated, and switched between schemes.
export default defineNuxtConfig({
    compatibilityDate: '2026-09-17',
    modules: ['@vitral/nuxt'],
    devtools: { enabled: false },
    vitral: {
        preset: 'Prism',
        colorScheme: 'system',
        cookie: 'vitral-scheme'
    }
});
