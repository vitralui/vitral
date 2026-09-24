<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ConfirmPopup',
    category: 'Overlay',
    description: 'A confirmation anchored to the element it is about, opened with useConfirm and holding focus until answered.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './ConfirmPopup/Basic.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
</template>
