<script setup lang="ts">
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from '@vitral/vue';
</script>

<template>
    <Accordion value="a" expand-icon="plus" collapse-icon="minus" style="width: 100%">
        <AccordionPanel value="a">
            <AccordionHeader>What is Vitral?</AccordionHeader>
            <AccordionContent>A Vue 3 component library with a theme engine of its own.</AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="b">
            <AccordionHeader>Does it work unstyled?</AccordionHeader>
            <AccordionContent>Yes: every part takes pass-through, and `unstyled` drops the built-in classes.</AccordionContent>
        </AccordionPanel>
    </Accordion>
</template>
