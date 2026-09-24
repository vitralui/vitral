<script setup lang="ts">
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from '@vitral/vue';
import { ref } from 'vue';

const sections = [
    { value: 'general', title: 'General', body: 'Language, region and the start page.' },
    { value: 'appearance', title: 'Appearance', body: 'Theme, accent colour and density.' },
    { value: 'privacy', title: 'Privacy & security', body: 'Permissions, history and what is shared.' }
];

const several = ref<string | number | (string | number)[] | null>(['general', 'privacy']);
</script>

<template>
    <Accordion v-model:value="several" multiple style="width: 100%">
        <AccordionPanel v-for="s in sections" :key="s.value" :value="s.value">
            <AccordionHeader>{{ s.title }}</AccordionHeader>
            <AccordionContent>
                <p style="margin: 0">{{ s.body }}</p>
            </AccordionContent>
        </AccordionPanel>
    </Accordion>
    <small style="color: var(--vt-text-muted-color)">value: {{ several }}</small>
</template>
