<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Grid',
    category: 'Layout',
    description:
        'A grid with star sizing: rows and columns sized to content, as shares of what is left, or in pixels, with children placed by row and column.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Definitions from './Grid/Definitions.vue';
import FormLayout from './Grid/FormLayout.vue';
</script>

<template>
    <DemoSection title="Definitions" description="rows=&quot;Auto,*,2*,48&quot; columns=&quot;160,*,Auto&quot;, with showGridLines outlining each cell."><Definitions /></DemoSection>
    <DemoSection title="A form" description="columns=&quot;Auto,*&quot;: labels take what they need, fields take the rest. Row and column spacing are set separately."><FormLayout /></DemoSection>
</template>
