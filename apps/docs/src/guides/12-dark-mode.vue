<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Colour schemes',
    section: 'Theming',
    description: 'Light, dark and system — one branch inside the preset, not a second theme.'
};
</script>

<script setup lang="ts">
import CodeBlock from '../parts/CodeBlock.vue';

const setup = `createApp(App).use(Vitral, {
    theme: {
        colorScheme: 'system',        // follow the OS, and keep following it
        storageKey: 'app-scheme',     // or false, to not remember
        options: { darkModeSelector: '.vt-dark' }
    }
});`;

const tokens = `{
    formField: {
        background: '{surface.0}',
        colorScheme: {
            dark: { background: 'rgb(255 255 255 / 0.06)' }
        }
    }
}`;

const toggle = `const { colorScheme, isDark, toggleDark, setColorScheme } = useTheme();

<Button :icon="isDark ? 'sun' : 'moon'" @click="toggleDark()" />`;
</script>

<template>
    <p>
        A scheme is not a second theme: it is a branch inside the one preset. Any token can carry a <code>colorScheme</code> object, and the compiler writes the light values on
        the root and the dark ones under the dark selector.
    </p>
    <CodeBlock :code="tokens" label="preset.ts" lang="ts" />

    <h2>Choosing one</h2>
    <CodeBlock :code="setup" label="main.ts" lang="ts" />
    <ul>
        <li><code>'light'</code> and <code>'dark'</code> pin the scheme.</li>
        <li><code>'system'</code> follows <code>prefers-color-scheme</code> and keeps following it — a reader who changes their OS theme sees the page change under them.</li>
        <li><code>storageKey</code> remembers an explicit choice across visits; <code>false</code> forgets it, which is what a screenshot wants.</li>
    </ul>

    <h2>Switching at runtime</h2>
    <CodeBlock :code="toggle" label="Bar.vue" lang="ts" />
    <p>
        <code>toggleDark()</code> flips between light and dark, leaving <code>'system'</code> behind the first time it is used. The bar at the top of this site is exactly these
        three lines.
    </p>

    <h2>The selector</h2>
    <p>
        By default the dark branch is written under <code>.vt-dark</code> on the <code>&lt;html&gt;</code> element. <code>darkModeSelector</code> takes any class or attribute
        selector — <code>[data-theme="dark"]</code> — or <code>'system'</code>, which emits the dark values inside a <code>prefers-color-scheme</code> media query for a site that
        never offers a switch; <code>false</code> emits no dark scheme at all.
    </p>
</template>
