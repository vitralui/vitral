<script setup lang="ts">
import { equals, getField, rovingIndex, rovingMove } from '@vitral/core';
import { selectbuttonStyle } from '@vitral/styles';
import { computed, ref } from 'vue';
import type { IconProp } from '../../base/types';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { SelectButtonEmits, SelectButtonProps, SelectButtonSlots } from './types';

// A segmented control, as the APG describes a group of toggle buttons: the
// group is one tab stop, the arrow keys move between the buttons, and each one
// carries aria-pressed rather than a selected state, so a reader is told what
// is on, not merely what is highlighted.

defineOptions({ name: 'VtSelectButton' });

const props = withDefaults(defineProps<SelectButtonProps>(), { unstyled: undefined, allowEmpty: true });
const model = defineModel<unknown>();
const emit = defineEmits<SelectButtonEmits>();
defineSlots<SelectButtonSlots>();

const { part } = useComponent(selectbuttonStyle, props);

const buttons = ref<HTMLButtonElement[]>([]);
const options = computed(() => props.options ?? []);
const state = computed(() => ({ size: props.size, invalid: props.invalid, fluid: props.fluid }));

const labelOf = (option: unknown) => (props.optionLabel ? getField(option, props.optionLabel) : option);
const valueOf = (option: unknown) => (props.optionValue ? getField(option, props.optionValue) : option);
const iconOf = (option: unknown) => (props.optionIcon ? (getField(option, props.optionIcon) as IconProp | undefined) : undefined);
const disabledOf = (option: unknown) => !!props.disabled || (!!props.optionDisabled && !!getField(option, props.optionDisabled));

const same = (a: unknown, b: unknown) => equals(a, b, props.dataKey);

function isChecked(option: unknown) {
    const value = valueOf(option);
    return props.multiple ? Array.isArray(model.value) && model.value.some((item) => same(item, value)) : same(model.value, value);
}

function select(event: Event, option: unknown) {
    if (disabledOf(option)) return;
    const value = valueOf(option);
    let next: unknown;

    if (props.multiple) {
        const current = Array.isArray(model.value) ? [...model.value] : [];
        const index = current.findIndex((item) => same(item, value));
        if (index === -1) current.push(value);
        else if (props.allowEmpty || current.length > 1) current.splice(index, 1);
        next = current;
    } else {
        next = isChecked(option) ? (props.allowEmpty ? null : model.value) : value;
    }

    if (same(next, model.value)) return;
    model.value = next;
    emit('change', { originalEvent: event, value: next });
}

// One tab stop for the group: the pressed button takes the focus, or the first
// one that can, and the arrows move from there.
const focusIndex = computed(() => {
    const checked = options.value.findIndex((option) => isChecked(option));
    if (checked !== -1) return checked;
    return options.value.findIndex((option) => !disabledOf(option));
});

function onKeydown(event: KeyboardEvent, index: number) {
    const move = rovingMove(event.key);
    if (!move) return;
    event.preventDefault();
    const next = rovingIndex(move, options.value.length, index, (i) => disabledOf(options.value[i]));
    buttons.value[next]?.focus();
}
</script>

<template>
    <div role="group" :aria-label="label" v-bind="part('root', state)">
        <button
            v-for="(option, index) in options"
            :key="index"
            ref="buttons"
            type="button"
            :aria-pressed="isChecked(option) ? 'true' : 'false'"
            :disabled="disabledOf(option)"
            :tabindex="index === focusIndex ? 0 : -1"
            v-bind="part('item', { checked: isChecked(option), disabled: disabledOf(option) })"
            @click="select($event, option)"
            @keydown="onKeydown($event, index)"
        >
            <slot name="option" :option="option" :index="index" :checked="isChecked(option)">
                <slot name="icon" :option="option" :icon="iconOf(option)">
                    <Icon v-if="iconOf(option)" :icon="iconOf(option)!" v-bind="part('icon')" />
                </slot>
                <span v-bind="part('label')">{{ labelOf(option) }}</span>
            </slot>
        </button>
    </div>
</template>
