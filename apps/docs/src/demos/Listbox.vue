<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Listbox',
    category: 'Data',
    description: 'A list to choose one or several options from, always open: the sibling of Select.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import GroupsAndCustomOptions from './Listbox/GroupsAndCustomOptions.vue';
import MultipleWithFilter from './Listbox/MultipleWithFilter.vue';
import Single from './Listbox/Single.vue';
import States from './Listbox/States.vue';
</script>

<template>
    <DemoSection title="Single" description="Selection follows the arrows, as in a native list box. Évora is disabled."><Single /></DemoSection>
    <DemoSection title="Multiple, with a filter" description="Search ignores accents and case: “ingles” is not needed, “espanol” finds Español."><MultipleWithFilter /></DemoSection>
    <DemoSection title="Groups and custom options"><GroupsAndCustomOptions /></DemoSection>
    <DemoSection title="States"><States /></DemoSection>
</template>
