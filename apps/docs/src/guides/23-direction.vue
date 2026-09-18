<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Direction',
    section: 'Customisation',
    description: 'Left to right unless you say otherwise: one attribute turns the layout, the keyboard and the icons that mean "next" round together.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const html = `<html lang="ar" dir="rtl">`;

const app = `import { Vitral } from '@vitral/vue';

createApp(App).use(Vitral, { direction: 'rtl' });`;

const nuxt = `export default defineNuxtConfig({
    modules: ['@vitral/nuxt'],
    vitral: { direction: 'rtl', locale: 'ar' }
});`;

const scoped = `<!-- One panel the other way round, inside a left-to-right page. -->
<div dir="rtl">
    <Menubar :model="items" />
    <DataTable :value="rows" />
</div>`;

const runtime = `const { direction, isRtl, setDirection } = useDirection();

setDirection('rtl');
document.documentElement.dir = 'rtl';   // the layout follows this one`;

const icon = `<!-- Ours know: a chevron that means "next" turns round, alignLeft does not. -->
<Button icon="chevronRight" label="Next" />

<!-- An icon from somewhere else cannot be asked, so tell it. -->
<Icon :icon="ArrowRightIcon" mirrored />

<!-- Or disagree about one of ours. -->
<Icon icon="undo" :mirrored="false" />`;

const own = `import { registerIcons } from '@vitral/icons';

registerIcons([{ name: 'nextStage', body: '<path d="M4 12h16M14 6l6 6-6 6"/>', mirrored: true }]);`;
</script>

<template>
    <p>
        Arabic, Hebrew, Persian and Urdu read right to left, and so does everything laid out for them: the sidebar starts on the right, a chevron that means “next” points left,
        and the Right arrow key moves backwards. Vitral is left to right by default and turns round on one attribute, because the browser already knows how to do most of it.
    </p>

    <h2>Set <code>dir</code></h2>
    <CodeBlock :code="html" label="index.html" lang="vue" />
    <p>
        That is the whole of the layout. Every stylesheet in the library is written in logical properties — <code>padding-inline-start</code>, <code>inset-inline-end</code>,
        <code>border-inline-start</code> — so the boxes, the paddings, the borders and the corners follow <code>dir</code> without a second stylesheet to ship or a build step to
        run. There is no <code>vitral.rtl.css</code>, and there is nothing to keep in sync.
    </p>
    <p>
        Set it on the element you mount in, not only the CSS <code>direction</code> property: <code>dir</code> is what the components measure when they work out which arrow key
        moves forward, and what the icons key off.
    </p>

    <h2>Tell the configuration too</h2>
    <CodeBlock :code="app" label="main.ts" lang="ts" />
    <p>
        A popup is teleported to <code>&lt;body&gt;</code>, outside whatever <code>dir</code> your application carries, so it would open the wrong way round. The library gives
        each one the direction of the thing it belongs to, and falls back to this setting for the ones that belong to the page rather than to an anchor — a dialog, a toast. It
        is also what the server assumes, where there is no layout to measure.
    </p>
    <CodeBlock :code="nuxt" label="nuxt.config.ts" lang="ts" />
    <p>In Nuxt the module puts <code>dir</code> on <code>&lt;html&gt;</code> as it renders, so the page arrives the right way round instead of turning over on hydration.</p>

    <h2>Part of a page</h2>
    <p>A direction is not an application-wide decision; it is a property of a piece of text. Nest it where it belongs:</p>
    <CodeBlock :code="scoped" label="template" lang="vue" />
    <p>Components read the direction they are actually laid out in, so a right-to-left panel inside a left-to-right page behaves, keyboard included.</p>

    <h2>The keyboard</h2>
    <p>
        Reading right to left, Left is forward. Every component that moves with the arrow keys already knows: the tabs, menus, menubar, toolbar, stepper, rating, splitter,
        carousel, task board, schedule and the charts all swap Left and Right, and a swipe goes the other way with them. Overlays flip with it too — a menu that opens to the
        end of its trigger opens to the left.
    </p>

    <h2>Icons</h2>
    <p>
        An icon that means a direction has to turn round; an icon that means a side must not. <code>chevronRight</code> on a “next” button means the way the reader is
        travelling, so it is mirrored; <code>alignLeft</code> means the left of the paragraph in every language, so it is not. The set answers for itself and you can overrule
        it:
    </p>
    <CodeBlock :code="icon" label="template" lang="vue" />
    <p>
        Media transport (<code>play</code>, <code>rewind</code>, <code>fastForward</code>) is deliberately left alone, because a timeline runs left to right everywhere, and so
        is rotation, which is clockwise or it is not. An icon of your own says which it is:
    </p>
    <CodeBlock :code="own" label="icons.ts" lang="ts" />
    <p>
        The flip is CSS keyed off <code>dir</code>, not script: it costs nothing, it is the same on the server, and it follows a <code>dir</code> changed at runtime without
        anything re-rendering. <code>renderSvg(def, {}, { direction: 'rtl' })</code> does the same for an icon drawn outside a component.
    </p>

    <h2>At runtime</h2>
    <CodeBlock :code="runtime" label="ts" lang="ts" />
    <p>
        <code>useDirection()</code> is the reactive handle: the configured direction, whether it is right to left, and a setter that every component follows — the same shape as
        <a :href="href('/docs/locale')">useLocale()</a>, which you will usually be changing at the same moment. Moving the layout is still the <code>dir</code> attribute's job.
    </p>
</template>
