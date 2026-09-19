<script setup lang="ts">
import { anchorTo, editorSelectionRange } from '@vitral/core';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { defaultBubbleMenu } from './buttons';
import { inheritRoot, useEditorContext } from './context';
import EditorItem from './EditorItem.vue';
import { useRoving } from './roving';
import type { EditorBubbleMenuProps } from './types';
import { keepFocus } from '../../base/press';

// A floating toolbar over selected text. It appears once a selection is made
// (not while the pointer is still dragging it), follows the selection, and
// goes when the text loses focus or Escape is pressed. It is a toolbar like
// the main one: Alt+F10 reaches it when there is no main toolbar.

defineOptions({ name: 'VtEditorBubbleMenu' });

const props = withDefaults(defineProps<EditorBubbleMenuProps>(), { unstyled: undefined, items: () => defaultBubbleMenu, placement: 'top' });
defineSlots<{ default?: () => unknown }>();
const ctx = useEditorContext('EditorBubbleMenu');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const overlayTarget = useOverlayTarget();

const panel = ref<HTMLElement | null>(null);
const inside = ref(false);
const roving = useRoving(panel, { onEscape: () => ctx.focus() });
let release: (() => void) | null = null;

const hasSelection = computed(() => !editorSelectionRange(ctx.state.value.selection).empty);
const visible = computed(() => ctx.editable.value && hasSelection.value && !ctx.selecting.value && !ctx.bubbleDismissed.value && (ctx.contentFocused.value || inside.value || ctx.popups.value > 0));

useOverlay({ overlay: panel, position: false });

function place() {
    release?.();
    release = null;
    const el = panel.value;
    const anchor = ctx.caretAnchor();
    if (!el || !anchor) return;
    release = anchorTo(anchor, el, { placement: props.placement, offset: 8 });
}

watch(
    [visible, () => ctx.state.value.selection],
    () => {
        if (!visible.value) {
            release?.();
            release = null;
            return;
        }
        nextTick(place);
    },
    { flush: 'post' }
);

watch(panel, (el) => {
    ctx.bubble.value = el;
    if (el) nextTick(roving.sync);
});

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !panel.value?.contains(next)) inside.value = false;
}

onBeforeUnmount(() => {
    release?.();
    ctx.bubble.value = null;
});
</script>

<template>
    <Teleport :to="overlayTarget">
        <Transition name="vt-overlay">
            <div
                v-if="visible"
                ref="panel"
                role="toolbar"
                :aria-label="ctx.locale.value.editor.bubble"
                :aria-controls="ctx.ids.content"
                v-bind="part('bubble')"
                @pointerdown="keepFocus"
                @focusin="inside = true; roving.onFocusin($event)"
                @focusout="onFocusout"
                @keydown="roving.onKeydown"
            >
                <slot>
                    <EditorItem v-for="item in items" :key="item" :item="item" />
                </slot>
            </div>
        </Transition>
    </Teleport>
</template>
