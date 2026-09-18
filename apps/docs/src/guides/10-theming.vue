<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Theming',
    section: 'Theming',
    description: 'Three layers of tokens compiled to CSS variables, and the four ways to change one.'
};
</script>

<script setup lang="ts">
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

const { setPreset, setColorScheme, toggleDark, setPrimary, setSurface, isDark } = useTheme();

setPrimary('{emerald}');          // a palette reference
setPrimary('#7c3aed');            // or a hex value, and the shades are derived
setSurface({ dark: '{slate}' });  // the greys, per scheme
setColorScheme('system');         // light, dark, or whatever the OS says`;

const dt = `<!-- one instance, one token -->
<Button label="Square" :dt="{ button: { borderRadius: '0' } }" />

<!-- or a whole subtree, with the CSS variables directly -->
<div style="--vt-primary-color: tomato">
    <Button label="Tomato" />
</div>`;
</script>

<template>
    <p>
        A theme is data. A <strong>preset</strong> is a tree of tokens in three layers, and the engine compiles it to CSS variables under the <code>--vt-</code> prefix. Nothing
        re-renders when it changes: the variables are rewritten and the browser repaints.
    </p>

    <h2>The three layers</h2>
    <CodeBlock :code="layers" label="preset.ts" lang="ts" />
    <p>
        A value in braces is a <em>reference</em>, and it survives compilation as one: <code>'{primary.color}'</code> becomes <code>var(--vt-primary-color)</code>, not the colour
        it currently holds. That is what makes a single <code>setPrimary()</code> re-colour every button, tag, focus ring and chart series at once.
    </p>
    <CodeBlock :code="compiled" label="compiled" lang="css" />

    <h2>Naming</h2>
    <ul>
        <li>A component's token name is its lower-case name with no dashes: <code>ToggleSwitch</code> → <code>toggleswitch</code>.</li>
        <li>A <code>root</code> segment is dropped: <code>button.root.paddingX</code> → <code>--vt-button-padding-x</code>.</li>
        <li>Anything that differs between schemes goes under <code>colorScheme: &#123; light, dark &#125;</code> at any depth.</li>
    </ul>

    <h2>Extending a preset</h2>
    <CodeBlock :code="preset" label="theme.ts" lang="ts" />
    <p>
        <code>definePreset</code> deep-merges into a base, so a brand preset states only its differences. <code>palette('#7c3aed')</code> derives the eleven shades from one
        colour.
    </p>

    <h2>At runtime</h2>
    <CodeBlock :code="runtime" label="useTheme.ts" lang="ts" />

    <h2>One instance at a time</h2>
    <p>
        <code>dt</code> writes the same tokens on one component's root element, so a single control can differ without a preset for it. Below that, plain CSS variables work as
        they always did.
    </p>
    <CodeBlock :code="dt" label="Example.vue" lang="vue" />

    <h2>Scope and cascade</h2>
    <p>
        Component CSS is injected once per component, in document order, and can be wrapped in a cascade layer with the <code>cssLayer</code> option. With it, any application
        rule wins on specificity alone and <code>!important</code> stays out of your stylesheet.
    </p>
</template>
