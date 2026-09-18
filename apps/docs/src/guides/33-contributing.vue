<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Contributing',
    section: 'Reference',
    description: 'What a component is made of, and where each piece lives.'
};
</script>

<script setup lang="ts">
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
    <p>A component is five pieces, each in its own place. None of them is optional, and the order is the order they are written in.</p>
    <CodeBlock :code="tree" label="where things go" lang="bash" />

    <h2>1. Tokens</h2>
    <p>
        A token tree whose values refer to the semantic layer — <code>'{formField.borderColor}'</code>, <code>'{control.minHeight}'</code> — rather than to a colour. Anything that
        differs between schemes goes under <code>colorScheme</code>. Every token becomes a <code>--vt-toggleswitch-…</code> variable.
    </p>

    <h2>2. Style</h2>
    <ul>
        <li>Classes are <code>vt-toggleswitch</code>, <code>vt-toggleswitch-&lt;part&gt;</code>, <code>vt-toggleswitch-&lt;modifier&gt;</code>.</li>
        <li>CSS reads only <code>var(--vt-…)</code>. A hard-coded colour, radius or duration is a bug.</li>
        <li>Build on the shared chrome — <code>.vt-field</code>, <code>.vt-overlay</code>, <code>.vt-option</code>, <code>.vt-mask</code> — rather than restyling it.</li>
        <li>Keyboard focus shows the focus ring; anything that animates stops under <code>prefers-reduced-motion</code>.</li>
    </ul>

    <h2>3. The component</h2>
    <CodeBlock :code="component" label="ToggleSwitch.vue" lang="vue" />
    <p>
        <code>v-bind="part(…)"</code> on every element is what makes a component themeable, reachable by pass-through and usable unstyled. A component wrapping a native control
        also uses <code>useSplitAttrs()</code> with <code>inheritAttrs: false</code>, so <code>class</code> dresses the wrapper while <code>name</code>,
        <code>aria-describedby</code> and the rest reach the control.
    </p>

    <h2>4. The demo</h2>
    <p>
        A page in <code>apps/docs/src/demos/</code> exporting <code>meta: DemoMeta</code> from a plain <code>&lt;script&gt;</code> block. This site finds it by glob, and reads the
        same file again as text for the code beside each example — so a snippet cannot drift from what it documents.
    </p>

    <h2>5. Barrels</h2>
    <p><code>pnpm gen</code> writes every <code>index.ts</code> list. Nobody edits them by hand.</p>

    <h2>Conventions worth knowing</h2>
    <ul>
        <li><code>v-model</code> through <code>defineModel()</code>; ids from Vue's <code>useId()</code>.</li>
        <li>Text comes from the locale, never from a literal in the template.</li>
        <li>Popups use <code>&lt;Teleport to="body"&gt;</code>, the <code>vt-overlay</code> transition and <code>useOverlay()</code>; modals add <code>useFocusTrap()</code> and <code>lockScroll()</code>.</li>
        <li>Behaviour with no DOM in it — navigation, parsing, selection — goes to <code>@vitral/core</code>, with a test there.</li>
        <li>Reach for an option before a new component: two things that differ only in what they refuse are one thing with a prop.</li>
    </ul>

    <h2>Checks</h2>
    <CodeBlock :code="checks" label="terminal" lang="bash" />
</template>
