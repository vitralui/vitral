import { listChecks, server } from '@vitral/icons';
import { Prism, Vitral } from '@vitral/vue';
import { createApp } from 'vue';
import App from './App.vue';
import { interceptLinks } from './lib/router';
import './site.css';

// `?scheme=dark` (or light) pins the scheme for this load without remembering
// it, which is what screenshots and links to a particular look need.
const scheme = new URLSearchParams(location.search).get('scheme');
const pinned = scheme === 'light' || scheme === 'dark' ? scheme : null;

createApp(App)
    .use(Vitral, {
        theme: { preset: Prism, colorScheme: pinned ?? 'system', storageKey: pinned ? false : 'vitral-docs-scheme' },
        // Two icons the landing page wants that are not in the base set.
        icons: [listChecks, server]
    })
    .mount('#app');

// Every internal link is a plain <a href>, which is what a crawler follows and
// what a middle click opens in a tab. This turns a plain press into navigation.
interceptLinks();
