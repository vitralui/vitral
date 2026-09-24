<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Theming',
    section: 'Theming',
    description: 'Three layers of tokens compiled to CSS variables, and the four ways to change one.'
};
</script>

<script setup lang="ts">
import { T, t } from '../lib/i18n';
import CodeBlock from '../parts/CodeBlock.vue';

const layers = `// primitive: palettes, radii, the raw material
{ blue: { 500: '#3b82f6' }, borderRadius: { md: '4px' } }

// semantic: what the application means
{ primary: { color: '{blue.500}' },
  formField: { borderColor: '{surface.300}' },
  colorScheme: { dark: { formField: { borderColor: '{surface.700}' } } } }

// component: what one control needs
{ button: { root: { paddingX: '0.875rem', borderRadius: '{borderRadius.md}' } } }`;

const compiled = `/* '{primary.color}' becomes a reference, not a copy */
--vt-primary-color: #3b82f6;
--vt-button-padding-x: 0.875rem;
--vt-button-border-radius: var(--vt-border-radius-md);`;

const preset = `import { definePreset, palette, Prism } from '@vitral/vue';

export const Brand = definePreset(Prism, {
    semantic: {
        primary: palette('#7c3aed'),
        formField: { borderRadius: '2px' }
    },
    components: {
        button: { root: { borderRadius: '999px' } }
    }
});`;

const runtime = `import { useTheme } from '@vitral/vue';

const { setPreset, setColorScheme, toggleDark, setPrimary, setSurface, setBorders, isDark } = useTheme();

setPrimary('{emerald}');          // a palette reference
setPrimary('#7c3aed');            // or a hex value, and the shades are derived
setSurface({ dark: '{slate}' });  // the greys, per scheme
setColorScheme('system');         // light, dark, or whatever the OS says
setBorders('strong');             // the edges that meet WCAG 1.4.11`;

const borders = `export const Brand = definePreset(Ink, {
    semantic: { colorScheme: { light: { formField: { borderColor: '{surface.200}' } } } },
    // Only what changes when the stronger edges are asked for.
    strongBorders: {
        colorScheme: {
            light: { formField: { borderColor: 'color-mix(in srgb, {text.color} 40%, {surface.200})' } },
            dark: { formField: { borderColor: 'color-mix(in srgb, {text.color} 26%, {surface.800})' } }
        }
    }
});

app.use(Vitral, { theme: { preset: Brand, borders: 'strong' } });`;

const dt = `<!-- one instance, one token -->
<Button label="Square" :dt="{ button: { borderRadius: '0' } }" />

<!-- or a whole subtree, with the CSS variables directly -->
<div style="--vt-primary-color: tomato">
    <Button label="Tomato" />
</div>`;
</script>

<template>
    <T k="intro">
        A theme is data. A <strong>preset</strong> is a tree of tokens in three layers, and the engine compiles it to CSS variables under the <code>--vt-</code> prefix. Nothing
        re-renders when it changes: the variables are rewritten and the browser repaints.
    </T>

    <T k="layers.title" as="h2">The three layers</T>
    <CodeBlock :code="layers" label="preset.ts" lang="ts" />
    <T k="layers.text">
        A value in braces is a <em>reference</em>, and it survives compilation as one: <code>'{primary.color}'</code> becomes <code>var(--vt-primary-color)</code>, not the colour
        it currently holds. That is what makes a single <code>setPrimary()</code> re-colour every button, tag, focus ring and chart series at once.
    </T>
    <CodeBlock :code="compiled" :label="t('compiled')" lang="css" />

    <T k="naming.title" as="h2">Naming</T>
    <ul>
        <T k="naming.component" as="li">A component's token name is its lower-case name with no dashes: <code>ToggleSwitch</code> → <code>toggleswitch</code>.</T>
        <T k="naming.root" as="li">A <code>root</code> segment is dropped: <code>button.root.paddingX</code> → <code>--vt-button-padding-x</code>.</T>
        <T k="naming.scheme" as="li">Anything that differs between schemes goes under <code>colorScheme: &#123; light, dark &#125;</code> at any depth.</T>
    </ul>

    <T k="extend.title" as="h2">Extending a preset</T>
    <CodeBlock :code="preset" label="theme.ts" lang="ts" />
    <T k="extend.text">
        <code>definePreset</code> deep-merges into a base, so a brand preset states only its differences. <code>palette('#7c3aed')</code> derives the eleven shades from one
        colour.
    </T>

    <T k="runtime" as="h2">At runtime</T>
    <CodeBlock :code="runtime" label="useTheme.ts" lang="ts" />

    <T k="borders.title" as="h2">Two sets of edges</T>
    <T k="borders.text">
        A preset draws its borders the way it wants to look, which in most of them is quieter than
        <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast" target="_blank" rel="noreferrer">WCAG 1.4.11</a> asks of a control's boundary. The stronger set
        lives in the preset under <code>strongBorders</code>, compiles into a block of its own, and is chosen with <code>borders: 'strong'</code> when the plugin is installed or
        <code>setBorders</code> afterwards. Nothing is recompiled either way — it is an attribute on <code>&lt;html&gt;</code>, so the switch is instant and a preset of your own
        can carry its own pair.
    </T>
    <CodeBlock :code="borders" label="theme.ts" lang="ts" />

    <T k="instance.title" as="h2">One instance at a time</T>
    <T k="instance.text">
        <code>dt</code> writes the same tokens on one component's root element, so a single control can differ without a preset for it. Below that, plain CSS variables work as
        they always did.
    </T>
    <CodeBlock :code="dt" label="Example.vue" lang="vue" />

    <T k="cascade.title" as="h2">Scope and cascade</T>
    <T k="cascade.text">
        Component CSS is injected once per component, in document order, and can be wrapped in a cascade layer with the <code>cssLayer</code> option. With it, any application
        rule wins on specificity alone and <code>!important</code> stays out of your stylesheet.
    </T>
</template>
