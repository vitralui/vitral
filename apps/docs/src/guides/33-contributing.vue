<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Contributing',
    section: 'Reference',
    description: 'What a component is made of, and where each piece lives.'
};
</script>

<script setup lang="ts">
import { T, t } from '../lib/i18n';
import CodeBlock from '../parts/CodeBlock.vue';

const tree = `packages/themes/src/presets/base/components/toggleswitch.ts   # tokens
packages/styles/src/toggleswitch/{toggleswitch.css,index.ts}   # CSS + class map
packages/vue/src/components/ToggleSwitch/
    types.ts            # the props interface, extending BaseProps
    ToggleSwitch.vue    # the component
    ToggleSwitch.spec.ts# axe + keyboard + ARIA
    index.ts
apps/docs/src/demos/ToggleSwitch.vue                           # the demo page`;

const component = `<script setup lang="ts">
defineOptions({ name: 'VtToggleSwitch' });

const props = withDefaults(defineProps<ToggleSwitchProps>(), {
    unstyled: undefined   // required: an absent boolean prop would be false,
});                       // and false would override the global setting

const { part } = useComponent(toggleswitchStyle, props);
<\/script>

<template>
    <!-- one call per element: theme classes, pass-through and state -->
    <div v-bind="part('root', state)">
        <span v-bind="part('thumb', state)" />
    </div>
</template>`;

const checks = `pnpm test                          # vitest + axe
pnpm typecheck                     # vue-tsc over every package and the site
node scripts/gen-index.mjs --check # barrels up to date
pnpm build                         # every package builds, with declarations`;
</script>

<template>
    <T k="intro">A component is five pieces, each in its own place. None of them is optional, and the order is the order they are written in.</T>
    <CodeBlock :code="tree" :label="t('where things go')" lang="bash" />

    <T k="tokens.title" as="h2">1. Tokens</T>
    <T k="tokens.text">
        A token tree whose values refer to the semantic layer (<code>'{formField.borderColor}'</code>, <code>'{control.minHeight}'</code>) rather than to a colour. Anything that
        differs between schemes goes under <code>colorScheme</code>. Every token becomes a <code>--vt-toggleswitch-…</code> variable.
    </T>

    <T k="style.title" as="h2">2. Style</T>
    <ul>
        <T k="style.classes" as="li">Classes are <code>vt-toggleswitch</code>, <code>vt-toggleswitch-&lt;part&gt;</code>, <code>vt-toggleswitch-&lt;modifier&gt;</code>.</T>
        <T k="style.vars" as="li">CSS reads only <code>var(--vt-…)</code>. A hard-coded colour, radius or duration is a bug.</T>
        <T k="style.chrome" as="li">Build on the shared chrome (<code>.vt-field</code>, <code>.vt-overlay</code>, <code>.vt-option</code>, <code>.vt-mask</code>) rather than restyling it.</T>
        <T k="style.focus" as="li">Keyboard focus shows the focus ring; anything that animates stops under <code>prefers-reduced-motion</code>.</T>
    </ul>

    <T k="component.title" as="h2">3. The component</T>
    <CodeBlock :code="component" label="ToggleSwitch.vue" lang="vue" />
    <T k="component.text">
        <code>v-bind="part(…)"</code> on every element is what makes a component themeable, reachable by pass-through and usable unstyled. A component wrapping a native control
        also uses <code>useSplitAttrs()</code> with <code>inheritAttrs: false</code>, so <code>class</code> dresses the wrapper while <code>name</code>,
        <code>aria-describedby</code> and the rest reach the control.
    </T>

    <T k="demo.title" as="h2">4. The demo</T>
    <T k="demo.text">
        A page in <code>apps/docs/src/demos/</code> exporting <code>meta: DemoMeta</code> from a plain <code>&lt;script&gt;</code> block. This site finds it by glob, and reads the
        same file again as text for the code beside each example, so a snippet cannot drift from what it documents.
    </T>

    <T k="barrels.title" as="h2">5. Barrels</T>
    <T k="barrels.text"><code>pnpm gen</code> writes every <code>index.ts</code> list. Nobody edits them by hand.</T>

    <T k="conventions.title" as="h2">Conventions worth knowing</T>
    <ul>
        <T k="conventions.model" as="li"><code>v-model</code> through <code>defineModel()</code>; ids from Vue's <code>useId()</code>.</T>
        <T k="conventions.text" as="li">Text comes from the locale, never from a literal in the template.</T>
        <T k="conventions.popups" as="li">Popups use <code>&lt;Teleport to="body"&gt;</code>, the <code>vt-overlay</code> transition and <code>useOverlay()</code>; modals add <code>useFocusTrap()</code> and <code>lockScroll()</code>.</T>
        <T k="conventions.core" as="li">Behaviour with no DOM in it (navigation, parsing, selection) goes to <code>@vitral/core</code>, with a test there.</T>
        <T k="conventions.option" as="li">Reach for an option before a new component: two things that differ only in what they refuse are one thing with a prop.</T>
    </ul>

    <T k="checks" as="h2">Checks</T>
    <CodeBlock :code="checks" label="terminal" lang="bash" />
</template>
