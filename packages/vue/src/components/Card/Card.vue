<script setup lang="ts">
import { cardStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { CardProps, CardSlots } from './types';

// A plain container: no role of its own. Put a heading in the `title` slot
// when the card should appear in the page outline.

defineOptions({ name: 'VtCard' });

const props = withDefaults(defineProps<CardProps>(), { unstyled: undefined });
defineSlots<CardSlots>();

const { part } = useComponent(cardStyle, props);
</script>

<template>
    <div v-bind="part('root')">
        <div v-if="$slots.header" v-bind="part('header')">
            <slot name="header" />
        </div>
        <div v-bind="part('body')">
            <div v-if="title || subtitle || $slots.title || $slots.subtitle" v-bind="part('caption')">
                <div v-if="title || $slots.title" v-bind="part('title')">
                    <slot name="title">{{ title }}</slot>
                </div>
                <div v-if="subtitle || $slots.subtitle" v-bind="part('subtitle')">
                    <slot name="subtitle">{{ subtitle }}</slot>
                </div>
            </div>
            <div v-if="$slots.default" v-bind="part('content')">
                <slot />
            </div>
            <div v-if="$slots.footer" v-bind="part('footer')">
                <slot name="footer" />
            </div>
        </div>
    </div>
</template>
