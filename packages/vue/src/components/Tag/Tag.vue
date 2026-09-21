<script setup lang="ts">
import { tagStyle } from '@vitral/styles';
import { computed, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { TagEmits, TagProps, TagSlots } from './types';

defineOptions({ name: 'VtTag' });

const props = withDefaults(defineProps<TagProps>(), { unstyled: undefined, severity: 'primary' });
const emit = defineEmits<TagEmits>();
defineSlots<TagSlots>();

const { part, locale } = useComponent(tagStyle, props);
const id = useId();
const labelId = `${id}-label`;
const removeId = `${id}-remove`;

const state = computed(() => ({ severity: props.severity, rounded: props.rounded }));

// Delete and Backspace on the button remove too, as they would a chip in an input.
function onRemoveKeydown(event: KeyboardEvent) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    emit('remove', event);
}
</script>

<template>
    <span v-bind="part('root', state)">
        <slot name="icon">
            <Icon v-if="icon" :icon="icon" v-bind="part('icon')" />
        </slot>
        <span :id="labelId" v-bind="part('label')">
            <slot>{{ value }}</slot>
        </span>
        <!-- Named "Remove" + the tag's text, so a row of them is not a row of identical buttons. -->
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
                <Icon icon="close" />
            </slot>
        </button>
    </span>
</template>
