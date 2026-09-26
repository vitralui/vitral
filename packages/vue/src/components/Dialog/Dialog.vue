<script setup lang="ts">
import { dialogStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { usePointerDrag } from '../../base/usePointerDrag';
import { useModal } from '../../composables/useModal';
import Icon from '../Icon/Icon.vue';
import type { DialogEmits, DialogProps, DialogSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// The WAI-ARIA modal dialog. Opening moves focus in, to an `autofocus`
// element, else the first thing to press in the content, then the footer, then
// the header. Tab cycles inside, Escape closes, and closing returns focus to
// where it was. A modeless dialog (`modal: false`) leaves the page usable.
// Attributes land on the dialog element, so `style="width: 30rem"`,
// `aria-label` and `aria-describedby` go where they mean something.
// The header moves it (`draggable`), and it stays whole on the screen while it
// does (`keepInViewport`): a dialog dragged half off the edge hid its own
// buttons, and its header with them — the only thing to bring it back by.

defineOptions({ name: 'VtDialog', inheritAttrs: false });

const props = withDefaults(defineProps<DialogProps>(), {
    unstyled: undefined,
    modal: true,
    closable: true,
    closeOnEscape: true,
    position: 'center',
    showHeader: true,
    draggable: true,
    keepInViewport: true,
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

// ---- moving it by its header

/** How far the dialog has been moved from where the layout puts it. */
const offset = ref({ x: 0, y: 0 });
const canDrag = computed(() => props.draggable && !maximized.value);
let from = { x: 0, y: 0 };

/** `next`, held so the dialog stays inside the mask — the screen, unless it is rendered in place. */
function keep(next: { x: number; y: number }) {
    const panel = panelRef.value;
    const mask = maskRef.value;
    if (!props.keepInViewport || !panel || !mask) return next;
    const rect = panel.getBoundingClientRect();
    const bounds = mask.getBoundingClientRect();
    // Where the layout alone would put it.
    const left = rect.left - offset.value.x;
    const top = rect.top - offset.value.y;
    // Wider or taller than the screen, it keeps its start edge on it, where the title is.
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    return {
        x: clamp(next.x, bounds.left - left, bounds.right - rect.width - left),
        y: clamp(next.y, bounds.top - top, bounds.bottom - rect.height - top)
    };
}

const drag = usePointerDrag<null>({
    onStart: (_, info) => {
        from = { ...offset.value };
        emit('dragstart', info.event);
    },
    onMove: (_, info) => {
        offset.value = keep({ x: from.x + info.dx, y: from.y + info.dy });
    },
    onEnd: (_, info) => emit('dragend', info.event),
    onCancel: () => {
        offset.value = from;
    }
});

function onHeaderPointerdown(event: PointerEvent) {
    if (!canDrag.value) return;
    // The buttons in the header, and anything else in it that takes a press, keep it.
    if ((event.target as Element).closest?.('button, a, input, select, textarea, [contenteditable="true"]')) return;
    drag.press(event, null);
}

// A smaller window can leave a moved dialog past its edge: it is brought back in.
function onResize() {
    if (offset.value.x || offset.value.y) offset.value = keep(offset.value);
}
onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

const moved = computed(() => (!maximized.value && (offset.value.x || offset.value.y) ? { translate: `${offset.value.x}px ${offset.value.y}px` } : undefined));

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
            // Each opening starts where the layout puts it.
            offset.value = { x: 0, y: 0 };
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
                <div ref="panelRef" role="dialog" :aria-modal="modal ? 'true' : undefined" :aria-labelledby="labelledBy" v-bind="mergeProps(part('root', { maximized, dragging: drag.active.value }), attrs, { style: moved })">
                    <div v-if="hasHeader" v-bind="part('header', { draggable: canDrag })" @pointerdown="onHeaderPointerdown">
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
                                    <Icon icon="close" />
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
