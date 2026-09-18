<script setup lang="ts">
import { lockScroll } from '@vitral/core';
import { blockuiStyle } from '@vitral/styles';
import { ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useFocusTrap } from '../../composables/useFocusTrap';
import { useOverlay } from '../../composables/useOverlay';
import type { BlockUIEmits, BlockUIProps, BlockUISlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// While blocked, the region is `inert` (no pointer, no Tab, not in the
// accessibility tree) and `aria-busy`; the veil carries a status saying why.
// A full-screen block veils the page instead: it stacks as a modal, holds focus
// on itself and keeps the page from scrolling, then gives focus back.

defineOptions({ name: 'VtBlockUI' });

const props = withDefaults(defineProps<BlockUIProps>(), { unstyled: undefined });
const overlayTarget = useOverlayTarget();
const emit = defineEmits<BlockUIEmits>();
defineSlots<BlockUISlots>();

const { part, locale } = useComponent(blockuiStyle, props);
const maskRef = ref<HTMLElement | null>(null);
const fullMask = ref<HTMLElement | null>(null);

useOverlay({ overlay: fullMask, position: false, zIndexKey: 'modal' });
useFocusTrap(fullMask, () => props.fullScreen && props.blocked, { initialFocus: 'container' });

watch(
    () => props.blocked,
    (blocked, was) => {
        if (blocked) emit('block');
        else if (was) emit('unblock');
    }
);

watch(
    () => props.fullScreen && props.blocked,
    (on, _was, onCleanup) => {
        if (on) onCleanup(lockScroll());
    },
    { immediate: true }
);

function setMask(el: unknown) {
    maskRef.value = el as HTMLElement | null;
    fullMask.value = props.fullScreen ? maskRef.value : null;
}
</script>

<template>
    <div v-bind="part('root')" :aria-busy="blocked ? 'true' : undefined">
        <div v-bind="part('content')" :inert="blocked && !fullScreen ? true : undefined">
            <slot />
        </div>
        <Teleport :to="overlayTarget" :disabled="!fullScreen">
            <Transition name="vt-blockui">
                <div v-if="blocked" :ref="setMask" role="status" :tabindex="fullScreen ? -1 : undefined" v-bind="part('mask', { fullScreen })">
                    <slot name="mask" />
                    <span class="vt-sr-only">{{ label ?? locale.loading }}</span>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
