<script setup lang="ts">
import { avatarStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { AvatarProps, AvatarSlots } from './types';

// An avatar is decorative unless its image says otherwise: the name it stands
// for is normally beside it, and repeating it in the image's alt text makes a
// screen reader say it twice. `alt` is there for when it is not.

defineOptions({ name: 'VtAvatar' });

const props = withDefaults(defineProps<AvatarProps>(), { unstyled: undefined, shape: 'square', alt: '' });
defineSlots<AvatarSlots>();

const { part } = useComponent(avatarStyle, props);
const state = computed(() => ({ size: props.size, shape: props.shape }));
</script>

<template>
    <span v-bind="part('root', state)">
        <img v-if="image" :src="image" :alt="alt" v-bind="part('image')" />
        <Icon v-else-if="icon" :icon="icon" v-bind="part('icon')" />
        <span v-else v-bind="part('label')">
            <slot>{{ label }}</slot>
        </span>
    </span>
</template>
