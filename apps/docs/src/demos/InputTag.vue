<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputTag',
    category: 'Form',
    description: 'A field whose value is a list of short strings, each shown as a removable tag, added with Enter, a separator or a paste.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputTag/Basic.vue';
import CheckedOnAdd from './InputTag/CheckedOnAdd.vue';
import Maximum from './InputTag/Maximum.vue';
import SizesAndStates from './InputTag/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic" description="Type and press Enter, or type a comma. Backspace in an empty box removes the last tag."><Basic /></DemoSection>
    <DemoSection
        title="Checked as they are added"
        description="`validate` refuses a tag and leaves the text in the box to be fixed; `reject` says what happened, so the field can explain itself. Several separators are allowed: this one takes a comma, a semicolon or a space."
    ><CheckedOnAdd /></DemoSection>
    <DemoSection title="A maximum" description="`max` stops the list where it should stop; what is refused is reported rather than dropped quietly."><Maximum /></DemoSection>
    <DemoSection title="Sizes and states" description="The field chrome is the shared one: the same sizes, variants, invalid and disabled states as every other input."><SizesAndStates /></DemoSection>
</template>
