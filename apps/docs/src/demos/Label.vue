<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Label',
    category: 'Form',
    description: "A native label with the fields' typography, that checks what it points at and dims when that control is disabled."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Label/Basic.vue';
import CheckboxAndDisabled from './Label/CheckboxAndDisabled.vue';
import NamingGroup from './Label/NamingGroup.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Beside a checkbox, and disabled"><CheckboxAndDisabled /></DemoSection>
    <DemoSection title="Naming a group"><NamingGroup /></DemoSection>
</template>
