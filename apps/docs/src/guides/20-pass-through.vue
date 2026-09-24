<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Pass-through',
    section: 'Customisation',
    description: 'Reach any element of any component: attributes, classes, or a function of that part’s state.'
};
</script>

<script setup lang="ts">
import { T, t } from '../lib/i18n';
import { href } from '../lib/router';
import { Button, Select } from '@vitral/vue';
import { ref } from 'vue';
import CodeBlock from '../parts/CodeBlock.vue';

const city = ref(null);
const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Recife', code: 'REC' },
    { name: 'Curitiba', code: 'CWB' }
];

const basic = `<!-- attributes on a part -->
<Select :pt="{ overlay: { style: 'min-width: 20rem' } }" />

<!-- a bare string is taken as a class -->
<Button :pt="{ root: 'rounded-full shadow-lg' }" />

<!-- a function of the part's context -->
<Select
    :pt="{
        option: ({ state }) => ({ class: state.selected ? 'font-semibold' : '' })
    }"
/>`;

const global = `createApp(App).use(Vitral, {
    pt: {
        button: { root: { 'data-analytics': 'button' } },
        select: { overlay: 'shadow-xl' }
    }
});`;

const live = `<Select
    v-model="city"
    :options="cities"
    option-label="name"
    option-value="code"
    placeholder="Where"
    :pt="{
        root: { style: 'min-width: 14rem' },
        label: { style: 'letter-spacing: 0.04em; text-transform: uppercase' },
        dropdown: { style: 'color: var(--vt-primary-color)' }
    }"
/>`;
</script>

<template>
    <T k="intro">
        Every element a component renders carries one call: <code>v-bind="part('name', state)"</code>. That call is what merges the theme's classes, the reader's pass-through and
        the part's state, so anything the component draws can be reached without a fork, a wrapper or a <code>:deep()</code> selector.
    </T>

    <T k="shapes.title" as="h2">Three shapes</T>
    <CodeBlock :code="basic" label="Example.vue" lang="vue" />
    <T k="shapes.text">
        The string shorthand is there for utility CSS: <code>{ root: 'px-4 py-2 rounded bg-violet-600' }</code> is all a Tailwind user needs to write. The function form receives
        <code>{ props, state, part }</code>, where <code>state</code> is whatever the component passed for that element, such as <code>{ selected, focused }</code> for an option.
    </T>

    <T k="merge.title" as="h2">It merges, not replaces</T>
    <T k="merge.text">Classes are concatenated, styles merged and listeners chained, so a pass-through class sits beside the theme's rather than deleting it. To start from nothing, see <a :href="href('/docs/unstyled')">unstyled mode</a>.</T>

    <T k="live" as="h2">Live</T>
    <CodeBlock :code="live" label="Select.vue" lang="vue" />
    <p>
        <Select
            v-model="city"
            :options="cities"
            option-label="name"
            option-value="code"
            :placeholder="t('Where')"
            :pt="{
                root: { style: 'min-width: 14rem' },
                label: { style: 'letter-spacing: 0.04em; text-transform: uppercase' },
                dropdown: { style: 'color: var(--vt-primary-color)' }
            }"
        />
    </p>

    <T k="global.title" as="h2">Globally</T>
    <T k="global.text">The same object, keyed by component name, applies to every instance. That is the hook for an analytics attribute or a house rule.</T>
    <CodeBlock :code="global" label="main.ts" lang="ts" />

    <T k="parts.title" as="h2">Which parts exist</T>
    <T k="parts.text">
        A component's parts are the keys of its class map in <code>@vitral/styles</code>: <code>root</code>, and then whatever it draws, such as <code>label</code>,
        <code>dropdown</code>, <code>overlay</code>, <code>option</code>. They are also its CSS class names, minus the <code>vt-</code> prefix, so the DOM inspector is the
        reference.
    </T>
</template>
