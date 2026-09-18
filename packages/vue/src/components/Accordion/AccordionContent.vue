<script setup lang="ts">
import { accordionStyle } from '@vitral/styles';
import { computed, inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useCollapseTransition } from '../../composables/useCollapseTransition';
import { AccordionKey, AccordionPanelKey, inheritUnstyled } from './context';
import type { AccordionContentProps } from './types';

defineOptions({ name: 'VtAccordionContent' });

const props = withDefaults(defineProps<AccordionContentProps>(), { unstyled: undefined });

const accordion = inject(AccordionKey, null);
const panel = inject(AccordionPanelKey, null);
const { part } = useComponent(accordionStyle, inheritUnstyled(props, accordion));
const collapse = useCollapseTransition();

const open = computed(() => panel?.open.value ?? false);
const lazy = computed(() => accordion?.lazy() ?? false);
const state = computed(() => ({ open: open.value }));
</script>

<template>
    <Transition name="vt-accordion-collapse" v-bind="collapse">
        <div
            v-if="!lazy || open"
            v-show="open"
            :id="panel ? `${panel.id}-content` : undefined"
            role="region"
            :aria-labelledby="panel ? `${panel.id}-header` : undefined"
            v-bind="part('content', state)"
        >
            <div v-bind="part('contentInner')">
                <slot />
            </div>
        </div>
    </Transition>
</template>
