<script setup lang="ts">
import { avatargroupStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { AvatarGroupProps, AvatarGroupSlots } from './types';

// A row of overlapping avatars. It is a list when it is named — several
// people, one after another — and nothing at all when it is not.

defineOptions({ name: 'VtAvatarGroup' });

const props = withDefaults(defineProps<AvatarGroupProps>(), { unstyled: undefined });
defineSlots<AvatarGroupSlots>();

const { part } = useComponent(avatargroupStyle, props);
</script>

<template>
    <div :role="label ? 'group' : undefined" :aria-label="label" v-bind="part('root')">
        <slot />
    </div>
</template>
