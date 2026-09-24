<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Server rendering',
    section: 'Get started',
    description: 'Collecting the CSS a render used, so the page arrives styled instead of styling itself later.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const entry = `import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Vitral, collectStyles, colorSchemeTag } from '@vitral/vue';
import App from './App.vue';

export async function render() {
    const app = createSSRApp(App).use(Vitral, { theme: { storageKey: 'app-scheme' } });
    const html = await renderToString(app);

    // After the render: by now every component has asked for its stylesheet.
    const { tags } = collectStyles(app);
    return { html, head: colorSchemeTag(app) + tags };
}`;

const template = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <!--vitral-head-->
    </head>
    <body>
        <div id="app"><!--app-html--></div>
        <script type="module" src="/src/entry-client.ts"><\/script>
    </body>
</html>`;

const cookie = `import { colorSchemeAttrs } from '@vitral/vue';

// The server already knows the scheme, so nothing has to run before the paint.
const dark = request.cookies.get('app-scheme')?.value === 'dark';
const attrs = colorSchemeAttrs(dark); // { class: 'vt-dark' }, or {}`;

const nuxt = `export default defineNuxtConfig({
    modules: ['@vitral/nuxt'],
    vitral: {
        preset: 'Prism',          // or '~/theme/brand', or false
        colorScheme: 'system',
        cookie: 'vitral-scheme',  // where the reader's choice is kept
        prefix: 'Vt'              // '' registers <Button> instead of <VtButton>
    }
});`;

const nuxtPage = `<template>
    <VtButton label="Save" icon="check" @click="toast.add({ severity: 'success', summary: 'Saved' })" />
    <VtForm.Root :initial-values="{ email: '' }">
        <VtForm.Field name="email" label="Email" required>
            <VtInputText type="email" />
        </VtForm.Field>
    </VtForm.Root>
</template>

<script setup lang="ts">
const toast = useToast();   // auto-imported, like every composable
<\/script>`;
</script>

<template>
    <T k="intro">
        In the browser a component puts its stylesheet in the head the first time it renders, so a page only carries the components it uses and nothing has to be imported by hand.
        On a server there is no head to put it in, so the render collects the stylesheets instead and the application writes them into the document it sends.
    </T>

    <T k="render.title" as="h2">The render</T>
    <T k="render.text">
        Call <code>collectStyles(app)</code> <em>after</em> <code>renderToString</code>, once every component has asked for what it needs. It returns the theme's custom
        properties followed by the stylesheet of each component that rendered, either as one <code>css</code> string or as <code>tags</code>, the <code>&lt;style&gt;</code>
        elements ready for the head.
    </T>
    <CodeBlock :code="entry" label="entry-server.ts" lang="ts" />
    <CodeBlock :code="template" label="index.html" lang="vue" />
    <T k="render.markers">
        The elements carry the same <code>data-vitral-theme</code> and <code>data-vitral-style</code> markers the browser writes, so hydration finds them and does not inject a
        second copy, and they carry the <code>csp.nonce</code> the plugin was given. Ids come from Vue's <code>useId()</code>, which gives the server and the client the same
        ones, so <code>aria-controls</code> and <code>&lt;label for&gt;</code> survive hydration.
    </T>

    <T k="dark.title" as="h2">Dark before the first paint</T>
    <T k="dark.text">
        A remembered dark scheme is only known to the browser, so a server-rendered page would arrive light and turn dark once the bundle runs, which is a white flash.
        <code>colorSchemeTag(app)</code> writes a small script for the head that reads the remembered choice and the system preference, and marks <code>&lt;html&gt;</code>
        before anything is painted.
    </T>
    <T k="dark.known">A server that already knows the scheme, from a cookie or a session or the user's account, needs no script and can render the mark itself:</T>
    <CodeBlock :code="cookie" label="server.ts" lang="ts" />
    <T k="dark.spread">Spread those attributes on <code>&lt;html&gt;</code>. Both follow <code>darkModeSelector</code>, so a custom selector needs no second edit.</T>

    <T k="client.title" as="h2">What cannot be drawn on a server</T>
    <T k="client.chart">
        A chart is drawn by measuring the element it is in, which no server can do. It still renders that element, an empty host, and fills it on mount, so the markup the
        browser hydrates is the markup it was sent. Holding a component back until after it has mounted (<code>&lt;ClientOnly&gt;</code>) is worse: its <code>mounted</code>
        then runs with nothing to draw in.
    </T>
    <T k="client.overlays">Overlays (dialogs, menus, tooltips) open on interaction, so they never render on the server either. They teleport once the page is alive.</T>

    <T k="nuxt.title" as="h2">Nuxt</T>
    <T k="nuxt.intro">The module does all of the above, and the auto-imports besides.</T>
    <CodeBlock :code="nuxt" label="nuxt.config.ts" lang="ts" />
    <CodeBlock :code="nuxtPage" label="app.vue" lang="vue" />
    <T k="nuxt.cookie">
        The scheme lives in a cookie rather than in <code>localStorage</code>, because only a cookie reaches the server. The page is then rendered in the scheme the reader
        picked, <code>&lt;html class="vt-dark"&gt;</code> and all. Under <code>'system'</code>, which no server can resolve, the module writes the script above instead.
    </T>
    <T k="nuxt.directives">
        Directives keep their plain names (<code>v-tooltip</code>, whatever the prefix) because they are registered on the application rather than imported. A template is
        compiled before any auto-import runs, so a registration is the only thing that reaches it.
    </T>

    <T k="options.title" as="h3">Options</T>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <T k="options.option" as="th">Option</T>
                    <T k="options.type" as="th">Type</T>
                    <T k="options.description" as="th">Description</T>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>preset</td>
                    <td class="type">'Prism' | 'Ink' | 'Avalonia' | 'Simple' | 'Astra' | string | false</td>
                    <T k="options.preset" as="td" class="doc">A shipped preset by name, a module that default-exports one, or <code>false</code> for no theme.</T>
                </tr>
                <tr>
                    <td>colorScheme</td>
                    <td class="type">'light' | 'dark' | 'system'</td>
                    <T k="options.colorScheme" as="td" class="doc">The scheme to start in, when the cookie says nothing.</T>
                </tr>
                <tr>
                    <td>cookie</td>
                    <td class="type">string | false</td>
                    <T k="options.cookie" as="td" class="doc">Where the reader's choice is kept, so the server can read it. <code>false</code> forgets it between visits.</T>
                </tr>
                <tr>
                    <td>darkModeSelector</td>
                    <td class="type">string | false</td>
                    <T k="options.darkModeSelector" as="td" class="doc">Where the dark scheme applies: a class, an attribute, <code>'system'</code>, or <code>false</code>.</T>
                </tr>
                <tr>
                    <td>locale</td>
                    <td class="type">'en' | 'ptBR' | string | false</td>
                    <T k="options.locale" as="td" class="doc">A shipped locale by name, or a module that default-exports one.</T>
                </tr>
                <tr>
                    <td>prefix</td>
                    <td class="type">string</td>
                    <T k="options.prefix" as="td" class="doc">The prefix on every registered component: <code>'Vt'</code> by default, <code>''</code> for <code>&lt;Button&gt;</code>.</T>
                </tr>
                <tr>
                    <td>components / composables</td>
                    <td class="type">boolean</td>
                    <T k="options.global" as="td" class="doc">Register them globally. Off means importing from <code>@vitral/vue</code> by hand.</T>
                </tr>
                <tr>
                    <td>cssLayer, inputVariant, unstyled</td>
                    <td class="type">string | false, 'outlined' | 'filled', boolean</td>
                    <T k="options.shared" as="td" class="doc">The same options the plugin takes; see <a :href="href('/docs/installation')">installation</a>.</T>
                </tr>
            </tbody>
        </table>
    </div>
</template>
