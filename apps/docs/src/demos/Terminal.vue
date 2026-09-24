<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Terminal',
    category: 'Misc',
    description: 'A prompt and a log, for a console inside an application, with a command history.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Terminal/Basic.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
</template>
