<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ConfirmDialog',
    category: 'Overlay',
    description: 'A modal question before an action, opened from anywhere with useConfirm, that can default to the safe answer.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Severity from './ConfirmDialog/Severity.vue';
import WithoutHeader from './ConfirmDialog/WithoutHeader.vue';
</script>

<template>
    <DemoSection title="Severity" description="The icon and the accept button take the severity’s colour."><Severity /></DemoSection>
    <DemoSection title="Without a header" description="The labels come from the locale and the dialog is named “Confirmation”."><WithoutHeader /></DemoSection>
</template>
