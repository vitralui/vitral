import { areaChart, columns, listChecks, messageSquare, server, table } from '@vitral/icons';
import { Vitral } from '@vitral/vue';
import { createApp } from 'vue';
import App from './App.vue';
import { trackOutboundLinks } from './lib/analytics';
import { lang } from './lib/i18n';
import { preload } from './lib/preload';
import { interceptLinks, prepareWith, route } from './lib/router';
import { initialPreset } from './lib/theme';
import './site.css';

// `?scheme=dark` (or light) pins the scheme for this load without remembering
// it, which is what screenshots and links to a particular look need.
const scheme = new URLSearchParams(location.search).get('scheme');
const pinned = scheme === 'light' || scheme === 'dark' ? scheme : null;

function mount() {
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
}

// A page is shown whole: what it needs beyond the first chunk (its demos, its
// code, its words) is fetched before the application takes over the
// prerendered page, and before every page turn after that. Something that
// fails to arrive is fetched again by the part of the page that needs it.
prepareWith(preload);
preload(route.value.path, lang.value).then(mount, mount);

// Every internal link is a plain <a href>, which is what a crawler follows and
// what a middle click opens in a tab. This turns a plain press into navigation.
interceptLinks();
trackOutboundLinks();
