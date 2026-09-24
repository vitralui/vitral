<script setup lang="ts">
import { formatMessage, getFocusableElements } from '@vitral/core';
import { treeselectStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Chip from '../Chip/Chip.vue';
import Icon from '../Icon/Icon.vue';
import Tree from '../Tree/Tree.vue';
import type { TreeNodeLike } from '../Tree/types';
import type { TreeSelectEmits, TreeSelectProps, TreeSelectSlots, TreeSelectValue } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A select-only combobox whose popup is a WAI-ARIA tree: the whole of <Tree>,
// with its keyboard, filter and checkbox selection. Opening moves focus into
// the tree (or its search box); Escape closes and gives focus back, as does
// Tab, since the tree lives at the end of <body>. A single choice closes the
// popup; several stay open until the reader leaves.

defineOptions({ name: 'VtTreeSelect', inheritAttrs: false });

const props = withDefaults(defineProps<TreeSelectProps>(), {
    unstyled: undefined,
    variant: undefined,
    options: () => [],
    selectionMode: 'single',
    display: 'comma',
    filterBy: 'label',
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<TreeSelectValue | null>();
const expandedKeys = defineModel<Record<string, boolean>>('expandedKeys', { default: () => ({}) });
const emit = defineEmits<TreeSelectEmits>();
const slots = defineSlots<TreeSelectSlots>();

const { part, config, locale } = useComponent(treeselectStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const treeId = `${id}-tree`;
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const treeRef = ref<InstanceType<typeof Tree> | null>(null);
const open = ref(false);
const labelFromFor = ref<string>();

const selection = computed<TreeSelectValue>(() => model.value ?? {});
const isOn = (entry: TreeSelectValue[string] | undefined) => (typeof entry === 'object' && entry !== null ? entry.checked : !!entry);

/** The chosen nodes, in tree order. */
const selectedNodes = computed(() => {
    const out: TreeNodeLike[] = [];
    const walk = (list: readonly TreeNodeLike[]) =>
        list.forEach((node) => {
            if (isOn(selection.value[node.key])) out.push(node);
            if (node.children) walk(node.children);
        });
    walk(props.options);
    return out;
});

const hasValue = computed(() => selectedNodes.value.length > 0);
const overLimit = computed(() => props.maxSelectedLabels !== undefined && selectedNodes.value.length > props.maxSelectedLabels);
const commaText = computed(() => {
    if (!hasValue.value) return props.placeholder || ' ';
    if (overLimit.value) return formatMessage(props.selectedItemsLabel ?? locale.value.selectionMessage, { count: selectedNodes.value.length });
    return selectedNodes.value.map((node) => node.label ?? node.key).join(', ');
});
const showChips = computed(() => props.display === 'chip' && hasValue.value && !overLimit.value);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    fluid: props.fluid,
    focused: open.value,
    open: open.value,
    placeholder: !hasValue.value,
    chips: showChips.value
}));

const treeLabelledBy = computed(() => (controlAttrs.value['aria-labelledby'] as string | undefined) ?? labelFromFor.value);
const treeLabel = computed(() => (controlAttrs.value['aria-label'] as string | undefined) ?? props.placeholder ?? locale.value.choose);

useOverlay({
    anchor: rootRef,
    overlay: overlayRef,
    matchWidth: true,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

function show() {
    if (props.disabled || open.value) return;
    const label = triggerRef.value?.labels?.[0];
    if (label) {
        label.id ||= `${id}-label`;
        labelFromFor.value = label.id;
    }
    open.value = true;
    emit('show');
    nextTick(() => {
        const search = overlayRef.value?.querySelector<HTMLInputElement>('[role="searchbox"]');
        if (search) search.focus();
        else treeRef.value?.focus();
    });
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    emit('hide');
    if (returnFocus) triggerRef.value?.focus();
}

function onSelectionChange(value: TreeSelectValue) {
    model.value = value;
    emit('change', value);
}

function onNodeSelect(node: TreeNodeLike) {
    emit('node-select', node);
    if (props.selectionMode === 'single') hide();
}

function clear(event: Event) {
    event.stopPropagation();
    onSelectionChange({});
    triggerRef.value?.focus();
}

function onTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    switch (event.key) {
        case 'ArrowDown':
        case 'Enter':
        case ' ':
            event.preventDefault();
            show();
            break;
        case 'Backspace':
        case 'Delete':
            if (props.showClear && hasValue.value) {
                event.preventDefault();
                clear(event);
            }
            break;
    }
}

function onTriggerKeyup(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault();
}

// The popup is at the end of <body>: Tab past its last control (or back past
// its first) closes it and goes on from the combobox.
function onOverlayKeydown(event: KeyboardEvent) {
    const panel = overlayRef.value;
    if (event.key !== 'Tab' || !panel) return;
    const items = getFocusableElements(panel);
    const active = document.activeElement;
    const leaving = event.shiftKey ? active === items[0] : active === items[items.length - 1] || (active as HTMLElement | null)?.getAttribute('role') === 'treeitem';
    if (!leaving) return;
    event.preventDefault();
    hide();
}

function onRootClick(event: MouseEvent) {
    if (props.disabled || (event.target as Element).closest('[data-vt-clear]')) return;
    if (open.value) hide();
    else show();
}

defineExpose({ show, hide, focus: () => triggerRef.value?.focus() });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @click="onRootClick">
        <button
            ref="triggerRef"
            type="button"
            role="combobox"
            v-bind="mergeProps(controlAttrs, part('label'))"
            :disabled="disabled"
            aria-haspopup="tree"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? treeId : undefined"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            @keydown="onTriggerKeydown"
            @keyup="onTriggerKeyup"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)"
        >
            <slot name="value" :value="selectedNodes" :placeholder="placeholder">
                <template v-if="showChips">
                    <Chip v-for="node in selectedNodes" :key="node.key" :label="node.label ?? node.key" :unstyled="unstyled" v-bind="part('chip')" />
                </template>
                <template v-else>{{ commaText }}</template>
            </slot>
        </button>
        <button v-if="showClear" :style="!hasValue || disabled ? { visibility: 'hidden' } : undefined" type="button" tabindex="-1" data-vt-clear :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="close" />
        </button>
        <span v-bind="part('dropdown')" aria-hidden="true">
            <slot name="dropdownicon" :open="open">
                <Icon :icon="loading ? 'spinner' : 'chevronDown'" :spin="loading" />
            </slot>
        </span>
    </div>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="open" ref="overlayRef" v-bind="part('overlay')" @keydown="onOverlayKeydown">
                <slot name="header" />
                <Tree
                    :id="treeId"
                    ref="treeRef"
                    v-model:expanded-keys="expandedKeys"
                    :selection-keys="selection"
                    :value="options"
                    :selection-mode="selectionMode"
                    :filter="filter"
                    :filter-by="filterBy"
                    :filter-placeholder="filterPlaceholder"
                    :empty-message="emptyMessage"
                    :unstyled="unstyled"
                    :aria-labelledby="treeLabelledBy"
                    :aria-label="treeLabelledBy ? undefined : treeLabel"
                    v-bind="part('tree')"
                    @update:selection-keys="onSelectionChange"
                    @node-select="onNodeSelect"
                    @node-unselect="emit('node-unselect', $event)"
                    @node-expand="emit('node-expand', $event)"
                    @node-collapse="emit('node-collapse', $event)"
                    @filter="emit('filter', $event)"
                >
                    <template v-if="slots.option" #default="p">
                        <slot name="option" :node="p.node" :expanded="p.expanded" :selected="p.selected" :checked="p.checked" />
                    </template>
                    <template v-if="slots.empty" #empty>
                        <slot name="empty" />
                    </template>
                </Tree>
                <slot name="footer" />
            </div>
        </Transition>
    </Teleport>
</template>
