<script setup lang="ts">
import { iconfieldStyle } from '@vitral/styles';
import { computed, inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import { IconFieldKey } from './context';
import type { InputIconProps, InputIconSlots } from './types';

defineOptions({ name: 'VtInputIcon' });

const props = withDefaults(defineProps<InputIconProps>(), { unstyled: undefined });
defineSlots<InputIconSlots>();

const field = inject(IconFieldKey, null);
// `unstyled` falls back to the IconField's, so one switch covers both.
const { part } = useComponent(
    iconfieldStyle,
    new Proxy(props, { get: (target, key) => (key === 'unstyled' ? (target.unstyled ?? field?.unstyled()) : Reflect.get(target, key)) })
);
const hidden = computed(() => (props.label ? undefined : 'true'));
</script>

<template>
    <span v-bind="part('icon')" :aria-hidden="hidden">
        <slot>
            <Icon v-if="icon" :icon="icon" :label="label" :spin="spin" />
        </slot>
    </span>
</template>
