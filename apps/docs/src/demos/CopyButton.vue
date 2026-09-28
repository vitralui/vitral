<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'CopyButton',
    category: 'Button',
    description: 'A button that copies text to the clipboard, answers with a tick for a moment, and tells a screen reader it worked.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './CopyButton/Basic.vue';
import InField from './CopyButton/InField.vue';
</script>

<template>
    <DemoSection title="Basic" description="With no `label` it shows only its icon, named “Copy”. `value` may be a function, and it may wait."><Basic /></DemoSection>
    <DemoSection title="Beside a field"><InField /></DemoSection>
</template>
