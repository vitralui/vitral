<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Installation',
    section: 'Get started',
    description: 'One package, one plugin call — and what every option on it does.'
};
</script>

<script setup lang="ts">
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
    <h2>Install</h2>
    <CodeBlock :code="install" label="terminal" lang="bash" />
    <p>Vue 3.5 or newer is the only peer dependency. The other <code>@vitral/*</code> packages come with it.</p>

    <h2>Register the plugin</h2>
    <CodeBlock :code="plugin" label="main.ts" lang="ts" />
    <p>
        There is no stylesheet to import. The plugin injects the theme as CSS variables, and each component injects its own CSS the first time it renders — so a page pays for the
        components it uses.
    </p>

    <h3>Options</h3>
    <table class="api-table">
        <thead>
            <tr>
                <th>Option</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>theme</td>
                <td class="type">{ preset, colorScheme, storageKey, options } | 'none'</td>
                <td class="doc">The preset and the scheme. <code>'none'</code> injects nothing: bring your own variables, or go unstyled.</td>
            </tr>
            <tr>
                <td>locale</td>
                <td class="type">Locale</td>
                <td class="doc"><code>en</code> and <code>ptBR</code> ship; a locale is a plain object, so a third is a literal.</td>
            </tr>
            <tr>
                <td>inputVariant</td>
                <td class="type">'outlined' | 'filled'</td>
                <td class="doc">The default look of every field. Reactive: change it at runtime and the page follows.</td>
            </tr>
            <tr>
                <td>unstyled</td>
                <td class="type">boolean</td>
                <td class="doc">Drop every built-in class, everywhere. See <a href="#/docs/unstyled">unstyled mode</a>.</td>
            </tr>
            <tr>
                <td>pt</td>
                <td class="type">GlobalPassThrough</td>
                <td class="doc">Pass-through for every instance of a component, keyed by name. See <a href="#/docs/pass-through">pass-through</a>.</td>
            </tr>
            <tr>
                <td>cssLayer</td>
                <td class="type">string | false</td>
                <td class="doc">Wrap component CSS in <code>@layer</code>, so application CSS wins without <code>!important</code>.</td>
            </tr>
            <tr>
                <td>zIndex</td>
                <td class="type">Partial&lt;ZIndexConfig&gt;</td>
                <td class="doc">The stacking floors for modals, overlays, menus and tooltips.</td>
            </tr>
            <tr>
                <td>csp</td>
                <td class="type">{ nonce?: string }</td>
                <td class="doc">The nonce put on every injected <code>&lt;style&gt;</code>, for a strict Content-Security-Policy.</td>
            </tr>
        </tbody>
    </table>

    <h2>Without import lines</h2>
    <p>
        In Nuxt the <a href="#/docs/server-rendering">module</a> does this for you. In a plain Vite application, the same lists are behind
        <code>@vitral/vue/resolver</code>, for unplugin-vue-components and unplugin-auto-import:
    </p>
    <CodeBlock :code="autoImport" label="vite.config.ts" lang="ts" />
    <p><code>VitralResolver({ prefix: 'Vt' })</code> answers to <code>&lt;VtButton&gt;</code> instead, and leaves every other name to your own components.</p>

    <h2>Two components at the root</h2>
    <p>
        <code>useToast()</code> and <code>useConfirm()</code> send events; the components that show them have to be on the page — once, near the root, so they outlive the views
        that call them.
    </p>
    <CodeBlock :code="services" label="App.vue" lang="vue" />

    <h2>Without JavaScript</h2>
    <p>A page that only wants the look can take the compiled theme and the components' CSS as two files.</p>
    <CodeBlock :code="noJs" label="index.html" lang="vue" />

    <h2>Working on Vitral itself</h2>
    <CodeBlock :code="dev" label="terminal" lang="bash" />
</template>
