<script setup lang="ts">
import { dialogStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useAttrs, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useModal } from '../../composables/useModal';
import Icon from '../Icon/Icon.vue';
import type { DialogEmits, DialogProps, DialogSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// The WAI-ARIA modal dialog. Opening moves focus in — to an `autofocus`
// element, else the first thing to press in the content, then the footer, then
// the header — Tab cycles inside, Escape closes, and closing returns focus to
// where it was. A modeless dialog (`modal: false`) leaves the page usable.
// Attributes land on the dialog element, so `style="width: 30rem"`,
// `aria-label` and `aria-describedby` go where they mean something.

defineOptions({ name: 'VtDialog', inheritAttrs: false });

const props = withDefaults(defineProps<DialogProps>(), {
    unstyled: undefined,
    modal: true,
    closable: true,
    closeOnEscape: true,
    position: 'center',
    showHeader: true,
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<DialogEmits>();
const slots = defineSlots<DialogSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(dialogStyle, props);
const titleId = `${useId()}-title`;

const maskRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const footerRef = ref<HTMLElement | null>(null);
const maximized = ref(false);

const hasTitle = computed(() => props.showHeader && (!!props.header || !!slots.header));
const hasHeader = computed(() => props.showHeader && (hasTitle.value || props.closable || props.maximizable));
const labelledBy = computed(() => (attrs['aria-label'] || attrs['aria-labelledby'] || !hasTitle.value ? undefined : titleId));

const { onMaskPointerdown, onMaskClick } = useModal({
    panel: panelRef,
    mask: maskRef,
    modal: () => props.modal,
    closeOnEscape: () => props.closeOnEscape,
    dismissableMask: () => props.modal && props.dismissableMask,
    blockScroll: () => props.blockScroll,
    focusScopes: () => [contentRef.value, footerRef.value],
    onClose: () => close()
});

function close() {
    visible.value = false;
}

function toggleMaximize() {
    maximized.value = !maximized.value;
    if (maximized.value) emit('maximize');
    else emit('unmaximize');
}

watch(
    visible,
    (open, was) => {
        if (open) {
            maximized.value = false;
            emit('show');
        } else if (was) {
            emit('hide');
        }
    },
    { immediate: true }
);

defineExpose({ close, toggleMaximize, maximized });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-dialog-motion" appear @after-leave="emit('after-hide')">
            <div v-if="visible" ref="maskRef" v-bind="part('mask', { position, modal, maximized })" @pointerdown="onMaskPointerdown" @click="onMaskClick">
                <div ref="panelRef" role="dialog" :aria-modal="modal ? 'true' : undefined" :aria-labelledby="labelledBy" v-bind="mergeProps(part('root', { maximized }), attrs)">
                    <div v-if="hasHeader" v-bind="part('header')">
                        <div v-if="hasTitle" :id="titleId" v-bind="part('title')">
                            <slot name="header">{{ header }}</slot>
                        </div>
                        <div v-if="maximizable || closable" v-bind="part('headerActions')">
                            <button
                                v-if="maximizable"
                                type="button"
                                :aria-label="maximized ? locale.aria.restore : locale.aria.maximize"
                                v-bind="part('maximizeButton')"
                                @click="toggleMaximize"
                            >
                                <slot name="maximizeicon" :maximized="maximized">
                                    <Icon :icon="maximized ? 'restore' : 'maximize'" />
                                </slot>
                            </button>
                            <button v-if="closable" type="button" :aria-label="locale.aria.close" v-bind="part('closeButton')" @click="close">
                                <slot name="closeicon">
                                    <Icon icon="x" />
                                </slot>
                            </button>
                        </div>
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
