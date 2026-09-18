<script setup lang="ts">
import { getFocusableElements, pushLayer, toCssLength } from '@vitral/core';
import { splitviewStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { SplitViewProps, SplitViewSlotProps, SplitViewSlots } from './types';

// The split view. Inline modes lay the pane beside the content; overlay
// modes float it above, as a light-dismiss layer: a press outside or Escape
// closes it, through the shared layer stack so a popup opened inside the pane
// closes first. Focus goes into a floating pane when it opens and back to where
// it was when it closes.

defineOptions({ name: 'VtSplitView' });

const props = withDefaults(defineProps<SplitViewProps>(), {
    unstyled: undefined,
    displayMode: 'overlay',
    placement: 'left',
    openPaneLength: 320,
    compactPaneLength: 48,
    as: 'div'
});
const open = defineModel<boolean>('open', { default: false });
defineSlots<SplitViewSlots>();

const { part } = useComponent(splitviewStyle, props);

const autoId = useId();
const paneId = computed(() => props.paneId ?? `${autoId}-pane`);
const paneRef = ref<HTMLElement | null>(null);

const floating = computed(() => props.displayMode === 'overlay' || props.displayMode === 'compactOverlay');
const compactMode = computed(() => props.displayMode === 'compactInline' || props.displayMode === 'compactOverlay');
/** Closed with no compact strip: out of view, out of the tab order and out of the accessibility tree. */
const hidden = computed(() => !open.value && !compactMode.value);
const start = computed(() => props.placement !== 'right');

const openLength = computed(() => toCssLength(props.openPaneLength) ?? '320px');
const compactLength = computed(() => toCssLength(props.compactPaneLength) ?? '48px');
const paneWidth = computed(() => (open.value ? openLength.value : compactMode.value ? compactLength.value : '0px'));

const state = computed(() => ({ displayMode: props.displayMode, placement: props.placement, open: open.value }));

const rootStyle = computed(() => ({
    position: 'relative',
    display: 'flex',
    flexDirection: start.value ? 'row' : 'row-reverse',
    overflow: 'hidden'
}));

const paneStyle = computed(() => ({
    boxSizing: 'border-box',
    flex: '0 0 auto',
    width: paneWidth.value,
    overflow: 'hidden',
    visibility: hidden.value ? 'hidden' : undefined,
    ...(floating.value ? { position: 'absolute', top: '0', bottom: '0', zIndex: 1, [start.value ? 'insetInlineStart' : 'insetInlineEnd']: '0' } : {})
}));

// The pane's content keeps the open width whatever the pane's own width, so a
// compact or animating pane clips it instead of squeezing it.
const paneContentStyle = computed(() => ({
    boxSizing: 'border-box',
    width: openLength.value,
    height: '100%',
    overflowX: 'hidden',
    overflowY: 'auto'
}));

// In compactOverlay the strip stays beside the content; the floating pane grows over it.
const contentStyle = computed(() => ({
    flex: '1 1 0%',
    minWidth: '0',
    overflow: 'auto',
    [start.value ? 'marginInlineStart' : 'marginInlineEnd']: props.displayMode === 'compactOverlay' ? compactLength.value : undefined
}));

function setOpen(value: boolean) {
    if (open.value !== value) open.value = value;
}
const toggle = () => setOpen(!open.value);
const close = () => setOpen(false);

const slotProps = computed<SplitViewSlotProps>(() => ({ open: open.value, compact: compactMode.value && !open.value, paneId: paneId.value, toggle, close }));

/** Whatever toggles the pane, meaning anything whose `aria-controls` names it, counts as inside it. */
function controllers(): Element[] {
    return Array.from(document.querySelectorAll('[aria-controls]')).filter((el) => el.getAttribute('aria-controls')!.split(/\s+/).includes(paneId.value));
}

watch(
    () => (open.value && floating.value ? paneRef.value : null),
    (pane, _previous, onCleanup) => {
        if (!pane) return;
        onCleanup(
            pushLayer({
                elements: () => [pane, ...controllers()],
                onEscape: close,
                onPointerDownOutside: close
            })
        );
    },
    { immediate: true, flush: 'post' }
);

let returnFocus: HTMLElement | null = null;

watch(open, (isOpen) => {
    const pane = paneRef.value;
    if (!pane) return;
    if (isOpen) {
        const active = document.activeElement as HTMLElement | null;
        returnFocus = active && active !== document.body && !pane.contains(active) ? active : null;
        if (!floating.value) return;
        nextTick(() => {
            if (!open.value) return;
            (getFocusableElements(pane)[0] ?? pane).focus({ preventScroll: true });
        });
        return;
    }
    // Closing: focus inside the pane goes back where it came from, before the
    // pane hides; focus the user has already moved elsewhere stays there.
    const target = returnFocus;
    returnFocus = null;
    if (pane.contains(document.activeElement) && target?.isConnected) target.focus({ preventScroll: true });
});

defineExpose({ toggle, close, show: () => setOpen(true) });
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: rootStyle }, part('root', state))">
        <aside
            :id="paneId"
            ref="paneRef"
            tabindex="-1"
            :aria-label="paneLabel"
            :inert="hidden || undefined"
            v-bind="mergeProps({ style: paneStyle }, part('pane'))"
        >
            <div v-bind="mergeProps({ style: paneContentStyle }, part('paneContent'))">
                <slot name="pane" v-bind="slotProps" />
            </div>
        </aside>
        <div v-bind="mergeProps({ style: contentStyle }, part('content'))">
            <slot v-bind="slotProps" />
        </div>
    </component>
</template>
