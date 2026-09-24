<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Colour schemes',
    section: 'Theming',
    description: 'Light, dark and system: one branch inside the preset, not a second theme.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
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
    <T k="intro">
        A scheme is not a second theme: it is a branch inside the one preset. Any token can carry a <code>colorScheme</code> object, and the compiler writes the light values on
        the root and the dark ones under the dark selector.
    </T>
    <CodeBlock :code="tokens" label="preset.ts" lang="ts" />

    <T k="choosing.title" as="h2">Choosing one</T>
    <CodeBlock :code="setup" label="main.ts" lang="ts" />
    <ul>
        <T k="choosing.pin" as="li"><code>'light'</code> and <code>'dark'</code> pin the scheme.</T>
        <T k="choosing.system" as="li"><code>'system'</code> follows <code>prefers-color-scheme</code> and keeps following it, so a reader who changes their OS theme sees the page change under them.</T>
        <T k="choosing.storage" as="li"><code>storageKey</code> remembers an explicit choice across visits; <code>false</code> forgets it, which is what a screenshot wants.</T>
    </ul>

    <T k="runtime.title" as="h2">Switching at runtime</T>
    <CodeBlock :code="toggle" label="Bar.vue" lang="ts" />
    <T k="runtime.text">
        <code>toggleDark()</code> flips between light and dark, leaving <code>'system'</code> behind the first time it is used. The bar at the top of this site is exactly these
        three lines.
    </T>

    <T k="selector.title" as="h2">The selector</T>
    <T k="selector.text">
        By default the dark branch is written under <code>.vt-dark</code> on the <code>&lt;html&gt;</code> element. <code>darkModeSelector</code> takes any class or attribute
        selector such as <code>[data-theme="dark"]</code>, or <code>'system'</code>, which emits the dark values inside a <code>prefers-color-scheme</code> media query for a site that
        never offers a switch; <code>false</code> emits no dark scheme at all.
    </T>
</template>
