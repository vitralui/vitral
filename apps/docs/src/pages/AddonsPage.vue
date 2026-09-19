<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { addons, controlsPackage, domPackage } from '../lib/addons';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

/**
 * The addons: the parts of Vitral that draw themselves. Each card says what it
 * is, what its engine answers on its own, and how it is used without a
 * framework — which is how the Vue components use it too.
 */
const install = (id: string) => `npm install @vitral/${id}`;
</script>

<template>
    <main class="addons-page">
        <div class="doc-head">
            <span class="eyebrow">Addons</span>
            <h1>The big ones are not Vue</h1>
            <p>
                A chart, a data table, a scheduler, a task board, a rich text editor, a spreadsheet, a form's state and rules: months of work each, and none of it is
                about a framework. In Vitral they are written as plain TypeScript — an engine that answers a question (which marks, which rows, which period, which cell,
                which block, what that formula comes to, which field is invalid) and, where something is drawn, a renderer that draws the answer into an element you hand
                it. <code>@vitral/vue</code> wraps them; a React
                or an Angular component would wrap the same thing, and a page with no framework at all can call them directly.
            </p>
            <p class="addons-head-links">
                <a :href="href('/docs/introduction')">What Vitral is <Icon icon="arrowRight" /></a>
            </p>
        </div>

        <ul class="addons-list">
            <li v-for="addon in addons" :key="addon.id" class="addon-card">
                <div class="addon-head">
                    <span class="addon-icon" aria-hidden="true"><Icon :icon="addon.icon" /></span>
                    <div>
                        <h2>{{ addon.name }}</h2>
                        <p>{{ addon.summary }}</p>
                    </div>
                </div>
                <dl class="addon-facts">
                    <dt>Engine</dt>
                    <dd v-if="addon.headless">{{ addon.engine }}.</dd>
                    <dd v-else><code>@vitral/{{ addon.id }}/engine</code> — {{ addon.engine }}. No DOM, no timers.</dd>
                    <dt>Component</dt>
                    <dd>
                        <a :href="href(`/components/${addon.component}`)">The Vue component, in full <Icon icon="arrowRight" /></a>
                    </dd>
                </dl>
                <CodeBlock :code="install(addon.id)" label="Install" lang="bash" bare />
                <CodeBlock :code="addon.example" :label="`${addon.name}, on its own`" lang="ts" />
            </li>
        </ul>

        <section class="addons-shared" aria-labelledby="addons-shared-title">
            <h2 id="addons-shared-title">What they are built on</h2>
            <p><code>{{ domPackage.name }}</code> — {{ domPackage.summary }}</p>
            <p><code>{{ controlsPackage.name }}</code> — {{ controlsPackage.summary }}</p>
            <p>
                An addon describes its markup as plain objects on every change, and only what differs reaches the document — so an element that is kept keeps its focus and
                its animation. The classes come from the same style definitions the components use, which is why an addon looks like Vitral without importing any of it.
            </p>
        </section>

        <section class="addons-note" aria-labelledby="addons-note-title">
            <h2 id="addons-note-title">What the wrapper adds</h2>
            <p>
                The component hands the addon its props, the Vitral configuration — locale, unstyled, pass-through, the overlay host, the theme — and its slots, and turns
                the addon's events into emits. A slot is rendered by Vue into a container of its own, which the addon places as a node: that is how a cell, a card, an event
                or a column header written in a template ends up inside markup the addon built. Where the framework has a better control than plain markup — a select, say —
                the addon asks for it and draws its own only when nothing was given.
            </p>
        </section>
    </main>
</template>

<style>
.addons-page {
    max-width: var(--doc-width);
    margin: 0 auto;
    padding: var(--doc-padding);
}

.addons-head-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 500;
}

.addons-list {
    display: grid;
    /* `1fr` is `minmax(auto, 1fr)`, and a grid item is as wide as its widest
       child until it is told otherwise: a code block would set the width of
       the page rather than scroll inside its card. */
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    margin: 2rem 0 0;
    padding: 0;
    list-style: none;
}

.addon-card {
    min-width: 0;
    padding: 1.5rem;
    border: 1px solid var(--vt-content-border-color);
    border-radius: var(--vt-border-radius-lg);
    background: var(--vt-content-background);
}

.addon-head {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    /* A flex item is as wide as its content until it is told otherwise, and a
       package name does not break: without this the card runs off a phone. */
    min-width: 0;
}

.addon-head > div {
    min-width: 0;
}

.addon-head h2 {
    margin: 0;
    font-size: 1.125rem;
    font-family: var(--vt-font-family-mono, monospace);
    overflow-wrap: anywhere;
}

.addon-head p {
    margin: 0.375rem 0 0;
    color: var(--vt-text-muted-color);
}

.addon-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    flex: none;
    color: var(--vt-primary-color);
    background: var(--vt-primary-50, var(--vt-content-hover-background));
    border-radius: var(--vt-border-radius-md);
}

.addon-facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    margin: 1rem 0;
}

.addon-facts dt {
    font-weight: 600;
    color: var(--vt-text-muted-color);
}

.addon-facts dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
}

.addon-facts a {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
}

.addons-shared,
.addons-note {
    margin-top: 2.5rem;
}

.addons-shared h2,
.addons-note h2 {
    font-size: 1.125rem;
}

@media (max-width: 640px) {
    .addon-card {
        padding: 1rem;
    }

    .addon-facts {
        grid-template-columns: 1fr;
        gap: 0.125rem;
    }
}
</style>
