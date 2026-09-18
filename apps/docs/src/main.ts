import { Prism, Vitral } from '@vitral/vue';
import { createApp } from 'vue';
import App from './App.vue';
import './site.css';

// `?scheme=dark` (or light) pins the scheme for this load without remembering
// it — what screenshots and links to a particular look need.
const scheme = new URLSearchParams(location.search).get('scheme');
const pinned = scheme === 'light' || scheme === 'dark' ? scheme : null;

createApp(App)
    .use(Vitral, {
        theme: { preset: Prism, colorScheme: pinned ?? 'system', storageKey: pinned ? false : 'vitral-docs-scheme' }
    })
    .mount('#app');
