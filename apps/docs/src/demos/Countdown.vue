<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Countdown',
    category: 'Misc',
    description: 'The time left until a moment, in tiles or in words, named in the reader’s language and announced to a screen reader without a word every second.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Countdown/Basic.vue';
import Custom from './Countdown/Custom.vue';
import TextAndUnits from './Countdown/TextAndUnits.vue';
</script>

<template>
    <DemoSection title="Basic" description="`to` is a Date, an ISO string or a timestamp. The unit names come from the browser, in the locale's language, and a leading unit at zero is left out."><Basic /></DemoSection>
    <DemoSection title="Words, units and a pause" description="`variant=&quot;text&quot;` writes it as a line. `units` picks what to count in — here minutes and seconds only, so an hour and a half reads 90 minutes. `paused` stops the clock where it is, and `end` fires when it gets there."><TextAndUnits /></DemoSection>
    <DemoSection title="Drawn your own way" description="The default slot is given what is left and whether it is over, and draws the rest itself."><Custom /></DemoSection>
</template>
