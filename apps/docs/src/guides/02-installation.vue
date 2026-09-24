<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Installation',
    section: 'Get started',
    description: 'One package, one plugin call, and what every option on it does.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const install = `pnpm add @vitral/vue
# npm install @vitral/vue
# yarn add @vitral/vue`;

const plugin = `import { createApp } from 'vue';
import { Vitral, Prism, ptBR } from '@vitral/vue';
import App from './App.vue';

createApp(App)
    .use(Vitral, {
        theme: {
            preset: Prism,           // Prism, Ink, Avalonia, Simple, or your own
            colorScheme: 'system',   // 'light' | 'dark' | 'system'
            storageKey: 'app-scheme' // remember the reader's choice
        },
        locale: ptBR,
        inputVariant: 'outlined',    // every field, unless it says otherwise
        cssLayer: 'vitral'           // wrap component CSS in @layer
    })
    .mount('#app');`;

const noJs = `<link rel="stylesheet" href="/node_modules/@vitral/themes/css/prism.css" />
<link rel="stylesheet" href="/node_modules/@vitral/styles/vitral.css" />`;

const services = `<script setup lang="ts">
import { Toast, ConfirmDialog } from '@vitral/vue';
<\/script>

<template>
    <RouterView />
    <Toast />
    <ConfirmDialog />
</template>`;

const autoImport = `import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { VitralResolver, vitralAutoImports } from '@vitral/vue/resolver';

export default defineConfig({
    plugins: [
        vue(),
        Components({ resolvers: [VitralResolver()] }),        // <Button>, v-tooltip
        AutoImport({ imports: [vitralAutoImports()] })        // useTheme(), Form
    ]
});`;

const dev = `pnpm install
pnpm dev        # this site, at http://localhost:5180
pnpm test       # vitest + axe
pnpm typecheck
pnpm build`;
</script>

<template>
    <T k="install.title" as="h2">Install</T>
    <CodeBlock :code="install" label="terminal" lang="bash" />
    <T k="install.text">Vue 3.5 or newer is the only peer dependency. The other <code>@vitral/*</code> packages come with it.</T>

    <T k="plugin.title" as="h2">Register the plugin</T>
    <CodeBlock :code="plugin" label="main.ts" lang="ts" />
    <T k="plugin.text">
        There is no stylesheet to import. The plugin injects the theme as CSS variables, and each component injects its own CSS the first time it renders, so a page only carries
        the components it uses.
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
                    <td>theme</td>
                    <td class="type">{ preset, colorScheme, storageKey, options } | 'none'</td>
                    <T k="options.theme" as="td" class="doc">The preset and the scheme. <code>'none'</code> injects nothing: bring your own variables, or go unstyled.</T>
                </tr>
                <tr>
                    <td>locale</td>
                    <td class="type">Locale</td>
                    <T k="options.locale" as="td" class="doc"><code>en</code> and <code>ptBR</code> ship; a locale is a plain object, so a third is a literal.</T>
                </tr>
                <tr>
                    <td>inputVariant</td>
                    <td class="type">'outlined' | 'filled'</td>
                    <T k="options.inputVariant" as="td" class="doc">The default look of every field. Reactive: change it at runtime and the page follows.</T>
                </tr>
                <tr>
                    <td>unstyled</td>
                    <td class="type">boolean</td>
                    <T k="options.unstyled" as="td" class="doc">Drop every built-in class, everywhere. See <a :href="href('/docs/unstyled')">unstyled mode</a>.</T>
                </tr>
                <tr>
                    <td>pt</td>
                    <td class="type">GlobalPassThrough</td>
                    <T k="options.pt" as="td" class="doc">Pass-through for every instance of a component, keyed by name. See <a :href="href('/docs/pass-through')">pass-through</a>.</T>
                </tr>
                <tr>
                    <td>cssLayer</td>
                    <td class="type">string | false</td>
                    <T k="options.cssLayer" as="td" class="doc">Wrap component CSS in <code>@layer</code>, so application CSS wins without <code>!important</code>.</T>
                </tr>
                <tr>
                    <td>zIndex</td>
                    <td class="type">Partial&lt;ZIndexConfig&gt;</td>
                    <T k="options.zIndex" as="td" class="doc">The stacking floors for modals, overlays, menus and tooltips.</T>
                </tr>
                <tr>
                    <td>csp</td>
                    <td class="type">{ nonce?: string }</td>
                    <T k="options.csp" as="td" class="doc">The nonce put on every injected <code>&lt;style&gt;</code>, for a strict Content-Security-Policy.</T>
                </tr>
            </tbody>
        </table>
    </div>

    <T k="autoImport.title" as="h2">Without import lines</T>
    <T k="autoImport.text">
        In Nuxt the <a :href="href('/docs/server-rendering')">module</a> does this for you. In a plain Vite application, the same lists are behind
        <code>@vitral/vue/resolver</code>, for unplugin-vue-components and unplugin-auto-import:
    </T>
    <CodeBlock :code="autoImport" label="vite.config.ts" lang="ts" />
    <T k="autoImport.prefix"><code>VitralResolver({ prefix: 'Vt' })</code> answers to <code>&lt;VtButton&gt;</code> instead, and leaves every other name to your own components.</T>

    <T k="root.title" as="h2">Two components at the root</T>
    <T k="root.text">
        <code>useToast()</code> and <code>useConfirm()</code> send events, so the components that show them have to be on the page. Put them once, near the root, where they
        outlive the views that call them.
    </T>
    <CodeBlock :code="services" label="App.vue" lang="vue" />

    <T k="noJs.title" as="h2">Without JavaScript</T>
    <T k="noJs.text">A page that only wants the look can take the compiled theme and the components' CSS as two files.</T>
    <CodeBlock :code="noJs" label="index.html" lang="vue" />

    <T k="dev" as="h2">Working on Vitral itself</T>
    <CodeBlock :code="dev" label="terminal" lang="bash" />
</template>
