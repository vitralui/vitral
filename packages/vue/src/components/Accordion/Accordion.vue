<script setup lang="ts">
import { isExpanded, rovingIndex, toggleExpanded, type RovingMove } from '@vitral/core';
import { accordionStyle } from '@vitral/styles';
import { provide, type Ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { AccordionKey } from './context';
import type { AccordionPanelValue, AccordionProps, AccordionSlots, AccordionValue } from './types';

// The WAI-ARIA accordion: each header is a <button> inside a heading, with
// aria-expanded and aria-controls; each content is a region labelled by its
// header. Down/Up move between headers (wrapping), Home/End go to the ends.

defineOptions({ name: 'VtAccordion' });

const props = withDefaults(defineProps<AccordionProps>(), { unstyled: undefined, headingLevel: 3 });
const model = defineModel<AccordionValue>('value', { default: null });
defineSlots<AccordionSlots>();

const { part } = useComponent(accordionStyle, props);

const buttons: Ref<HTMLButtonElement | null>[] = [];

const inDocumentOrder = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

provide(AccordionKey, {
    unstyled: () => props.unstyled,
    lazy: () => props.lazy,
    headingLevel: () => Math.min(6, Math.max(1, Math.round(props.headingLevel))),
    expandIcon: () => props.expandIcon,
    collapseIcon: () => props.collapseIcon,
    isOpen: (value: AccordionPanelValue) => isExpanded(model.value, value),
    toggle: (value: AccordionPanelValue) => {
        model.value = toggleExpanded(model.value, value, props.multiple);
    },
    register(button) {
        buttons.push(button);
        return () => {
            const index = buttons.indexOf(button);
            if (index >= 0) buttons.splice(index, 1);
        };
    },
    move(from: HTMLButtonElement, move: RovingMove) {
        const ordered = buttons
            .map((button) => button.value)
            .filter((el): el is HTMLButtonElement => !!el)
            .sort(inDocumentOrder);
        const next = ordered[rovingIndex(move, ordered.length, ordered.indexOf(from), (i) => ordered[i]!.disabled)];
        next?.focus();
    }
});
</script>

<template>
    <div v-bind="part('root')">
        <slot />
    </div>
</template>
