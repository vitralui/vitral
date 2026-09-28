<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tour',
    category: 'Overlay',
    description:
        'A guided tour over the page, driven from props or from code, with steps that wait, skip, move on by themselves and remember where the reader got to.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AppWide from './Tour/AppWide.vue';
import Basic from './Tour/Basic.vue';
import Interactive from './Tour/Interactive.vue';
import FromCode from './Tour/FromCode.vue';
import Progress from './Tour/Progress.vue';
</script>

<template>
    <DemoSection title="Basic" description="`v-model:open` starts and ends it. The arrow keys move between steps, Escape ends it, and each popover is a dialog a screen reader reads as it arrives."><Basic /></DemoSection>
    <DemoSection title="Progress, sides and the overlay" description="`progressStyle` draws the progress as text, dots or a bar; `side` and `align` place the popover; `overlayClickBehavior=&quot;nextStep&quot;` makes a press on the dimmed page move on."><Progress /></DemoSection>
    <DemoSection title="Steps that wait and move on by themselves" description="`advanceOn` moves on when the reader does what the step asks, `beforeShow` is waited for before a step shows, `waitFor` waits for an element that is not there yet, and `when` leaves out a step that does not apply."><Interactive /></DemoSection>
    <DemoSection title="One tour for the whole app" description="`useGlobalTour()` returns the application's own tour, the same one from any component: it belongs to the app rather than to the page that started it, so an onboarding that walks through several screens carries on across route changes. The plugin's `tour` option sets what every tour starts from — `<Tour>`, `useTour()` and this one — and each tour's own props go over it."><AppWide /></DemoSection>
    <DemoSection title="From code" description="`useTour()` returns the tour itself — `drive()`, `moveNext()`, `highlight()`, `destroy()` — and here `highlight()` shows one element on its own."><FromCode /></DemoSection>
</template>
