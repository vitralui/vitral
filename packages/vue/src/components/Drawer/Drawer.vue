<script setup lang="ts">
import { drawerStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useAttrs, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useModal } from '../../composables/useModal';
import Icon from '../Icon/Icon.vue';
import type { DrawerEmits, DrawerProps, DrawerSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A dialog against one edge of the viewport: the same WAI-ARIA modal dialog
// behaviour as <Dialog> (shared through useModal), sliding in from `position`.

defineOptions({ name: 'VtDrawer', inheritAttrs: false });

const props = withDefaults(defineProps<DrawerProps>(), {
    unstyled: undefined,
    position: 'left',
    modal: true,
    dismissable: true,
    closeOnEscape: true,
    showCloseIcon: true,
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<DrawerEmits>();
const slots = defineSlots<DrawerSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(drawerStyle, props);
const titleId = `${useId()}-title`;

const maskRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const footerRef = ref<HTMLElement | null>(null);

const hasTitle = computed(() => !!props.header || !!slots.header);
const hasHeader = computed(() => hasTitle.value || props.showCloseIcon);
const labelledBy = computed(() => (attrs['aria-label'] || attrs['aria-labelledby'] || !hasTitle.value ? undefined : titleId));
const state = computed(() => ({ position: props.position, modal: props.modal }));

const { onMaskPointerdown, onMaskClick } = useModal({
    panel: panelRef,
    mask: maskRef,
    modal: () => props.modal,
    closeOnEscape: () => props.closeOnEscape,
    dismissableMask: () => props.modal && props.dismissable,
    blockScroll: () => props.blockScroll,
    focusScopes: () => [contentRef.value, footerRef.value],
    onClose: () => close()
});

function close() {
    visible.value = false;
}

watch(
    visible,
    (open, was) => {
        if (open) emit('show');
        else if (was) emit('hide');
    },
    { immediate: true }
);

defineExpose({ close });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-drawer-motion" appear @after-leave="emit('after-hide')">
            <div v-if="visible" ref="maskRef" v-bind="part('mask', state)" @pointerdown="onMaskPointerdown" @click="onMaskClick">
                <div ref="panelRef" role="dialog" :aria-modal="modal ? 'true' : undefined" :aria-labelledby="labelledBy" v-bind="mergeProps(part('root', state), attrs)">
                    <div v-if="hasHeader" v-bind="part('header')">
                        <div v-if="hasTitle" :id="titleId" v-bind="part('title')">
                            <slot name="header">{{ header }}</slot>
                        </div>
                        <button v-if="showCloseIcon" type="button" :aria-label="locale.aria.close" v-bind="part('closeButton')" @click="close">
                            <slot name="closeicon">
                                <Icon icon="x" />
                            </slot>
                        </button>
                    </div>
                    <div ref="contentRef" v-bind="part('content')">
                        <slot />
                    </div>
                    <div v-if="$slots.footer" ref="footerRef" v-bind="part('footer')">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
