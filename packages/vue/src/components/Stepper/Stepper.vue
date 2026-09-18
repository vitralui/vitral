<script setup lang="ts">
import { rovingIndex } from '@vitral/core';
import { stepperStyle } from '@vitral/styles';
import { computed, provide, shallowReactive, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { StepperKey, type StepEntry } from './context';
import type { StepperProps, StepperSlots, StepValue } from './types';

// Steps and their panels: StepList with Steps and
// StepPanels with StepPanels, or StepItems pairing one of each. In a list the
// steps are WAI-ARIA tabs (arrows move focus, Enter or Space choose, which is
// manual activation, since a step is a commitment); in items each step is a
// disclosure button over its panel. `linear` keeps the steps ahead unreachable.

defineOptions({ name: 'VtStepper' });

const props = withDefaults(defineProps<StepperProps>(), { unstyled: undefined });
const model = defineModel<StepValue>('value');
defineSlots<StepperSlots>();

const { part } = useComponent(stepperStyle, props);
const id = useId();
const steps = shallowReactive<StepEntry[]>([]);

const ordered = computed(() =>
    steps
        .filter((s) => s.el.value)
        .sort((a, b) => (a.el.value!.compareDocumentPosition(b.el.value!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
);
const active = computed(() => model.value ?? ordered.value[0]?.value());
const indexOf = (value: StepValue | undefined) => (value === undefined ? -1 : ordered.value.findIndex((s) => s.value() === value));
const slug = (value: StepValue | undefined) => String(value).replace(/[^\w-]/g, '_');

provide(StepperKey, {
    unstyled: () => props.unstyled,
    active,
    linear: () => props.linear,
    select(value) {
        model.value = value;
    },
    register(entry) {
        steps.push(entry);
        return () => {
            const index = steps.indexOf(entry);
            if (index >= 0) steps.splice(index, 1);
        };
    },
    indexOf,
    count: computed(() => ordered.value.length),
    reachable: (value) => !props.linear || indexOf(value) <= indexOf(active.value),
    move(from, to) {
        const list = ordered.value;
        const next = list[rovingIndex(to, list.length, list.indexOf(from))];
        next?.el.value?.focus();
    },
    stepId: (value) => `${id}-step-${slug(value)}`,
    panelId: (value) => `${id}-panel-${slug(value)}`
});
</script>

<template>
    <div v-bind="part('root')">
        <slot />
    </div>
</template>
