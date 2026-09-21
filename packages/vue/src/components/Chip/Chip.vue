<script setup lang="ts">
import { chipStyle } from '@vitral/styles';
import { useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { ChipEmits, ChipProps, ChipSlots } from './types';

// A chip is a static token; its remove button is the only control in it, named
// after the chip so a row of them is not a row of identical buttons.

defineOptions({ name: 'VtChip' });

const props = withDefaults(defineProps<ChipProps>(), { unstyled: undefined, imageAlt: '' });
const emit = defineEmits<ChipEmits>();
defineSlots<ChipSlots>();

const { part, locale } = useComponent(chipStyle, props);
const id = useId();
const labelId = `${id}-label`;
const removeId = `${id}-remove`;

// Delete and Backspace remove too, as they would in a field full of chips.
function onRemoveKeydown(event: KeyboardEvent) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    emit('remove', event);
}
</script>

<template>
    <span v-bind="part('root')">
        <img v-if="image" :src="image" :alt="imageAlt" v-bind="part('image')" />
        <slot name="icon">
            <Icon v-if="icon" :icon="icon" v-bind="part('icon')" />
        </slot>
        <span :id="labelId" v-bind="part('label')">
            <slot>{{ label }}</slot>
        </span>
        <button
            v-if="removable"
            :id="removeId"
            type="button"
            :aria-label="locale.aria.removeItem"
            :aria-labelledby="`${removeId} ${labelId}`"
            v-bind="part('removeButton')"
            @click="emit('remove', $event)"
            @keydown="onRemoveKeydown"
        >
            <slot name="removeicon">
                <Icon :icon="removeIcon ?? 'close'" />
            </slot>
        </button>
    </span>
</template>
