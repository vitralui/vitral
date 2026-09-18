<script setup lang="ts">
import { rovingMove } from '@vitral/core';
import { stepperStyle } from '@vitral/styles';
import { computed, inject, onBeforeUnmount, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, StepItemKey, StepperKey, type StepEntry } from './context';
import type { StepProps, StepSlots } from './types';

defineOptions({ name: 'VtStep' });

const props = withDefaults(defineProps<StepProps>(), { unstyled: undefined });
defineSlots<StepSlots>();

const stepper = inject(StepperKey, null);
const item = inject(StepItemKey, null);
const { part } = useComponent(stepperStyle, inheritUnstyled(props, stepper));

const el = ref<HTMLElement | null>(null);
const value = computed(() => props.value ?? item?.value());
const entry: StepEntry = { value: () => value.value, el };
if (stepper) onBeforeUnmount(stepper.register(entry));

const index = computed(() => stepper?.indexOf(value.value) ?? -1);
const active = computed(() => stepper?.active.value === value.value);
const done = computed(() => index.value >= 0 && index.value < (stepper?.indexOf(stepper.active.value) ?? -1));
const disabled = computed(() => props.disabled || !(stepper?.reachable(value.value) ?? true));
const last = computed(() => !!stepper && index.value === stepper.count.value - 1);
// A step in a list is a tab; in an item, a disclosure over its panel.
const asTab = computed(() => !item);

function onClick() {
    if (!disabled.value && value.value !== undefined) stepper?.select(value.value);
}

function onKeydown(event: KeyboardEvent) {
    if (!asTab.value || !stepper) return;
    const move = rovingMove(event.key, { orientation: 'horizontal', rtl: getComputedStyle(event.currentTarget as Element).direction === 'rtl' });
    if (!move) return;
    event.preventDefault();
    stepper.move(entry, move);
}
</script>

<template>
    <div v-bind="part('step', { active, done, disabled })">
        <button
            :id="stepper?.stepId(value)"
            ref="el"
            type="button"
            :role="asTab ? 'tab' : undefined"
            :aria-selected="asTab ? (active ? 'true' : 'false') : undefined"
            :aria-expanded="asTab ? undefined : active ? 'true' : 'false'"
            :aria-controls="active ? stepper?.panelId(value) : undefined"
            :aria-current="active ? 'step' : undefined"
            :tabindex="asTab && !active ? -1 : undefined"
            :disabled="disabled"
            v-bind="part('header')"
            @click="onClick"
            @keydown="onKeydown"
        >
            <span v-bind="part('number')">{{ index + 1 }}</span>
            <span v-bind="part('title')">
                <slot :value="value!" :index="index" :active="active" :done="done" />
            </span>
        </button>
        <span v-if="asTab && !last" aria-hidden="true" v-bind="part('separator')" />
    </div>
</template>
