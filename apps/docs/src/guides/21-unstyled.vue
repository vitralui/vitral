<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Unstyled mode',
    section: 'Customisation',
    description: 'Keep the behaviour and the accessibility, drop every class.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { Button } from '@vitral/vue';
import CodeBlock from '../parts/CodeBlock.vue';

const one = `<Button
    label="Tailwind"
    unstyled
    :pt="{ root: 'px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700' }"
/>`;

const all = `createApp(App).use(Vitral, {
    unstyled: true,
    pt: {
        button: { root: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-md' },
        inputtext: { root: 'border rounded-md px-3 py-2 w-full' }
    }
});`;
</script>

<template>
    <T k="intro">
        <code>unstyled</code> removes the built-in classes and nothing else. The roles, the names, the states, the focus trap, the keyboard, the overlay positioning and the
        dismissal all stay: what you give up is the look, which is the point.
    </T>

    <T k="one.title" as="h2">One instance</T>
    <CodeBlock :code="one" label="Example.vue" lang="vue" />
    <p><Button label="Tailwind" unstyled :pt="{ root: { style: 'padding: 0.5rem 1rem; border-radius: 6px; border: 0; background: #7c3aed; color: white; font: inherit; cursor: pointer' } }" /></p>
    <T k="one.text">
        <em>Above</em> is the unstyled button dressed with inline styles rather than utility classes, since this site does not ship Tailwind. The mechanism is the same either
        way.
    </T>

    <T k="all.title" as="h2">The whole application</T>
    <CodeBlock :code="all" label="main.ts" lang="ts" />
    <T k="all.text">
        Set globally, <code>unstyled</code> also skips injecting every component's CSS, so the page carries none of it. A single component can still opt back in with
        <code>:unstyled="false"</code>.
    </T>

    <T k="kept.title" as="h2">What a component still gives you</T>
    <ul>
        <T k="kept.aria" as="li">The ARIA pattern: roles, names, <code>aria-expanded</code>, <code>aria-selected</code>, <code>aria-activedescendant</code> and the relations between them.</T>
        <T k="kept.keyboard" as="li">The keyboard: type-ahead, roving focus, Home/End, Escape, Tab out of an overlay.</T>
        <T k="kept.overlay" as="li">Overlay behaviour: positioning with flipping, the layer stack, scroll lock, focus return.</T>
        <T k="kept.data" as="li">Data behaviour: filtering, sorting, paging, selection, tree expansion.</T>
    </ul>
    <T k="kept.summary">Which is to say: everything that is tedious and easy to get wrong, and none of what is opinionated.</T>
</template>
