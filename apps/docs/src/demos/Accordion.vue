<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Accordion',
    category: 'Panel',
    description:
        'Stacked sections that open and close. It is the WAI-ARIA accordion: each header is a button inside a heading (`headingLevel`, 3 by default) controlling a labelled region; Down/Up move between headers, Home/End go to the ends. `multiple` lets several stay open.'
};
</script>

<script setup lang="ts">
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const sections = [
    { value: 'general', title: 'General', body: 'Language, region and the start page.' },
    { value: 'appearance', title: 'Appearance', body: 'Theme, accent colour and density.' },
    { value: 'privacy', title: 'Privacy & security', body: 'Permissions, history and what is shared.' },
    { value: 'updates', title: 'Updates', body: 'Channel and when to install.', disabled: true }
];

const single = ref<string | number | (string | number)[] | null>('general');
const several = ref<string | number | (string | number)[] | null>(['general', 'privacy']);
</script>

<template>
    <DemoSection title="One open at a time" class="stack">
        <Accordion v-model:value="single" style="width: 100%">
            <AccordionPanel v-for="s in sections" :key="s.value" :value="s.value" :disabled="s.disabled">
                <AccordionHeader>{{ s.title }}</AccordionHeader>
                <AccordionContent>
                    <p style="margin: 0">{{ s.body }}</p>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
        <span class="demo-hint">value: {{ single ?? 'null' }}</span>
    </DemoSection>
    <DemoSection title="Multiple" class="stack">
        <Accordion v-model:value="several" multiple style="width: 100%">
            <AccordionPanel v-for="s in sections.slice(0, 3)" :key="s.value" :value="s.value">
                <AccordionHeader>{{ s.title }}</AccordionHeader>
                <AccordionContent>
                    <p style="margin: 0">{{ s.body }}</p>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
        <span class="demo-hint">value: {{ several }}</span>
    </DemoSection>
    <DemoSection title="Custom icons">
        <Accordion value="a" expand-icon="plus" collapse-icon="minus" style="width: 100%">
            <AccordionPanel value="a">
                <AccordionHeader>What is Vitral?</AccordionHeader>
                <AccordionContent>A Vue 3 component library with a theme engine of its own.</AccordionContent>
            </AccordionPanel>
            <AccordionPanel value="b">
                <AccordionHeader>Does it work unstyled?</AccordionHeader>
                <AccordionContent>Yes — every part takes pass-through, and `unstyled` drops the built-in classes.</AccordionContent>
            </AccordionPanel>
        </Accordion>
    </DemoSection>
</template>
