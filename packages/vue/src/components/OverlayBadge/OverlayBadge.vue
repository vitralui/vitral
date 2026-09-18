<script setup lang="ts">
import { visuallyHidden } from '@vitral/core';
import { overlaybadgeStyle } from '@vitral/styles';
import { computed, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Badge from '../Badge/Badge.vue';
import type { OverlayBadgeProps, OverlayBadgeSlots } from './types';

// The badge drawn on the corner is hidden from assistive technology — it is a
// shape in a corner, possibly a bare dot — and its text is repeated in a
// visually hidden element whose id the slot hands out for aria-describedby.

defineOptions({ name: 'VtOverlayBadge' });

const props = withDefaults(defineProps<OverlayBadgeProps>(), { unstyled: undefined, severity: 'primary', value: undefined });
defineSlots<OverlayBadgeSlots>();

const { part } = useComponent(overlaybadgeStyle, props);
const textId = `${useId()}-badge`;

const hasValue = computed(() => props.value !== undefined && props.value !== null && props.value !== '');
</script>

<template>
    <div v-bind="part('root')">
        <slot :badge-id="hasValue ? textId : undefined" />
        <Badge :value="value" :severity="severity" :size="size" :unstyled="unstyled" aria-hidden="true" v-bind="part('badge')" />
        <span v-if="hasValue" :id="textId" :style="visuallyHidden">{{ value }}</span>
    </div>
</template>
