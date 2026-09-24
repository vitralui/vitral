<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'AutoComplete',
    category: 'Form',
    description:
        'A text box that suggests as you type, with suggestions supplied by your app, single or multiple values as chips, and a button for the whole list.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './AutoComplete/Basic.vue';
import DropdownAndForcedSelection from './AutoComplete/DropdownAndForcedSelection.vue';
import GroupsAndTemplates from './AutoComplete/GroupsAndTemplates.vue';
import Multiple from './AutoComplete/Multiple.vue';
import StringsSizesAndStates from './AutoComplete/StringsSizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Dropdown and forced selection"><DropdownAndForcedSelection /></DemoSection>
    <DemoSection title="Multiple"><Multiple /></DemoSection>
    <DemoSection title="Groups and templates"><GroupsAndTemplates /></DemoSection>
    <DemoSection title="Plain strings, sizes and states"><StringsSizesAndStates /></DemoSection>
</template>
