<script setup lang="ts">
import { getFocusableElements } from '@vitral/core';
import { inplaceStyle } from '@vitral/styles';
import { nextTick, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import type { InplaceEmits, InplaceProps, InplaceSlots } from './types';

// A display that becomes its editor. The display is a button — Enter and
// Space activate it as a click does — and activation moves focus to the first
// control in the content. Escape in the content, or the close button, goes
// back to the display and focuses it again.

defineOptions({ name: 'VtInplace' });

const props = withDefaults(defineProps<InplaceProps>(), { unstyled: undefined });
const active = defineModel<boolean>('active', { default: false });
const emit = defineEmits<InplaceEmits>();
defineSlots<InplaceSlots>();

const { part, locale } = useComponent(inplaceStyle, props);
const displayRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

function open(event: Event) {
    if (props.disabled || active.value) return;
    active.value = true;
    emit('open', event);
    nextTick(() => {
        const content = contentRef.value;
        if (content) (getFocusableElements(content)[0] ?? content).focus();
    });
}

function close(event: Event = new Event('close')) {
    if (!active.value) return;
    active.value = false;
    emit('close', event);
    nextTick(() => displayRef.value?.focus());
}

function onDisplayKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(event);
    }
}

function onContentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.closable) {
        event.stopPropagation();
        close(event);
    }
}
</script>

<template>
    <div v-bind="part('root')">
        <div
            v-if="!active"
            ref="displayRef"
            role="button"
            :tabindex="disabled ? -1 : 0"
            :aria-disabled="disabled ? 'true' : undefined"
            v-bind="part('display', { disabled })"
            @click="open"
            @keydown="onDisplayKeydown"
        >
            <slot name="display" />
        </div>
        <div v-else ref="contentRef" tabindex="-1" v-bind="part('content')" @keydown="onContentKeydown">
            <slot name="content" :close-callback="close" />
            <Button v-if="closable" icon="x" variant="text" severity="secondary" :aria-label="locale.close" :unstyled="unstyled" v-bind="part('close')" @click="close" />
        </div>
    </div>
</template>
