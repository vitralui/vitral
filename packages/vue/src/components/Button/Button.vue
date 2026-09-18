<script setup lang="ts">
import { buttonStyle } from '@vitral/styles';
import { computed, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { ButtonProps, ButtonSlots } from './types';

defineOptions({ name: 'VtButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
    unstyled: undefined,
    iconPos: 'left',
    severity: 'primary',
    variant: 'filled',
    type: 'button',
    as: 'button'
});
defineSlots<ButtonSlots>();

const slots = useSlots();
const { part } = useComponent(buttonStyle, props);

const isNative = computed(() => props.as === 'button');
const inactive = computed(() => props.disabled || props.loading);
const iconOnly = computed(() => !props.label && !slots.default && !!(props.icon || slots.icon || props.loading));

const state = computed(() => ({
    severity: props.severity,
    variant: props.variant,
    size: props.size,
    rounded: props.rounded,
    raised: props.raised,
    iconOnly: iconOnly.value,
    iconPos: props.iconPos,
    loading: props.loading,
    fluid: props.fluid
}));

// A native button takes `disabled`; anything else — a link, a router link —
// has no such attribute, so it is announced as disabled and taken out of the
// tab order instead.
const nativeAttrs = computed(() =>
    isNative.value
        ? { type: props.type, disabled: inactive.value || undefined }
        : { role: props.as === 'a' ? undefined : 'button', 'aria-disabled': inactive.value ? 'true' : undefined, tabindex: inactive.value ? -1 : undefined }
);
</script>

<template>
    <component :is="as" v-bind="{ ...part('root', state), ...nativeAttrs }" :aria-busy="loading ? 'true' : undefined">
        <slot>
            <slot v-if="loading" name="loadingicon">
                <Icon :icon="loadingIcon ?? 'spinner'" spin v-bind="part('loadingIcon')" />
            </slot>
            <slot v-else-if="icon || $slots.icon" name="icon">
                <Icon v-if="icon" :icon="icon" v-bind="part('icon')" />
            </slot>
            <span v-if="label" v-bind="part('label')">{{ label }}</span>
            <span v-if="badge !== undefined && badge !== null" v-bind="part('badge')">{{ badge }}</span>
        </slot>
    </component>
</template>
