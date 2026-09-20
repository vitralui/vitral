import { areaChart, columns, listChecks, messageSquare, server, table } from '@vitral/icons';
import { Vitral } from '@vitral/vue';
import { createApp } from 'vue';
import App from './App.vue';
import { interceptLinks } from './lib/router';
import { initialPreset } from './lib/theme';
import './site.css';

// `?scheme=dark` (or light) pins the scheme for this load without remembering
// it, which is what screenshots and links to a particular look need.
const scheme = new URLSearchParams(location.search).get('scheme');
const pinned = scheme === 'light' || scheme === 'dark' ? scheme : null;

createApp(App)
    .use(Vitral, {
        // The preset the reader last chose, so the theme mounts wearing it
        // rather than mounting the default and being changed a frame later.
        theme: { preset: initialPreset(), colorScheme: pinned ?? 'system', storageKey: pinned ? false : 'vitral-docs-scheme' },
        // The icons the site wants that are not in the base set: two for the
        // landing page, four for the addons menu.
        icons: [listChecks, server, areaChart, columns, table, messageSquare]
    })
    .mount('#app');

// Every internal link is a plain <a href>, which is what a crawler follows and
// what a middle click opens in a tab. This turns a plain press into navigation.
interceptLinks();
