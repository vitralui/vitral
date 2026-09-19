<script setup lang="ts">
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { createTaskboard, type CardContext, type ColumnContext, type TaskboardConfig, type TaskboardHandle, type TaskboardModels } from '@vitral/taskboard';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import {
    defineComponent,
    getCurrentInstance,
    h,
    normalizeClass,
    normalizeStyle,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    render,
    shallowRef,
    toRaw,
    useAttrs,
    useId,
    watch,
    type ComponentInternalInstance,
    type Slots
} from 'vue';
import { collectParts, contentOf } from '../../base/parts';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { useVitral } from '../../config/config';
import type { TaskboardColumn, TaskboardEmits, TaskboardKey, TaskboardLane, TaskboardProps, TaskboardSlots } from './types';

// The board is `@vitral/taskboard`'s framework-free renderer; this component
// only hands it the props, the Vitral configuration (locale, unstyled,
// pass-through, the overlay host, the theme) and the slots, and turns its
// events into emits. What is drawn — the columns, the cards, the keyboard and
// the accessible drag and drop — is the addon's, and the same board can be
// drawn by React, by Angular or by a page with no framework at all.

defineOptions({ name: 'VtTaskboard', inheritAttrs: false });

const props = withDefaults(defineProps<TaskboardProps>(), {
    unstyled: undefined,
    columns: () => [],
    items: undefined,
    columnField: 'column',
    dataKey: 'id',
    cardLabel: 'title',
    disabledField: 'disabled',
    lockedField: 'locked',
    dragdrop: true,
    reorderColumns: true,
    collapsible: true,
    autoScroll: true,
    touchDelay: 250
});
const collapsedColumns = defineModel<TaskboardKey[]>('collapsedColumns');
const collapsedLanes = defineModel<TaskboardKey[]>('collapsedLanes');
const emit = defineEmits<TaskboardEmits>();
const slots = defineSlots<TaskboardSlots>();

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const attrs = useAttrs();
const id = useId();
const instance = getCurrentInstance()!;
const host = shallowRef<HTMLElement | null>(null);
let board: TaskboardHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- slots: each is rendered by Vue into a container of its own, which the board places

// Slot content keeps what it would inject where the board is (a theme scope, an overlay host).
const SlotHost = defineComponent({
    name: 'VtTaskboardSlot',
    props: { draw: { type: Function, required: true } },
    setup(p) {
        const self = getCurrentInstance() as ComponentInternalInstance & { provides: object };
        self.provides = (instance as ComponentInternalInstance & { provides: object }).provides;
        return () => (p.draw as () => unknown)();
    }
});

const containers = new Map<string, HTMLElement>();
function node(key: string, draw: () => unknown): Node {
    let el = containers.get(key);
    if (!el) {
        el = document.createElement('div');
        el.style.display = 'contents';
        containers.set(key, el);
    }
    const vnode = h(SlotHost, { draw });
    vnode.appContext = instance.appContext;
    render(vnode, el);
    return el;
}

/** Containers whose card or column the board no longer draws are torn down with it. */
function sweep() {
    for (const [key, el] of containers) {
        if (el.isConnected) continue;
        render(null, el);
        containers.delete(key);
    }
}

const cardKey = (context: CardContext) => `card:${context.column.key}:${context.index}:${context.dragging ? 'drag' : ''}`;

/**
 * The parts a template wrote as children — `<Taskboard.Card>` and the rest —
 * read while a component that draws nothing renders, so what they read is
 * tracked like any other dependency.
 */
const parts = shallowRef<Map<string, Slots>>(new Map());
/**
 * Read while this component renders — as an attribute that is never written —
 * so what the parts read is tracked the way anything else in a template is.
 */
function readParts(): undefined {
    const found = new Map<string, Slots>();
    collectParts(slots.default?.(), found);
    parts.value = found;
    return undefined;
}

const contentFor = (slot: string, part: string) => contentOf(slots as Slots, slot, parts.value, part);

const slotContent = (): TaskboardConfig['content'] => {
    const card = contentFor('card', 'Card');
    const columnHeader = contentFor('column-header', 'ColumnHeader');
    const columnFooter = contentFor('column-footer', 'ColumnFooter');
    const addCard = contentFor('add-card', 'AddCard');
    const laneHeader = contentFor('lane-header', 'LaneHeader');
    const empty = contentFor('empty', 'Empty');
    return {
        card: card && ((context: CardContext) => node(cardKey(context), () => card(context))),
        columnHeader: columnHeader && ((context: ColumnContext) => node(`column-header:${context.column.key}`, () => columnHeader(context))),
        columnFooter: columnFooter && ((context: ColumnContext) => node(`column-footer:${context.column.key}`, () => columnFooter(context))),
        addCard:
            addCard && ((context: { column: TaskboardColumn; lane?: TaskboardLane }) => node(`add-card:${context.column.key}:${context.lane?.key ?? ''}`, () => addCard(context))),
        laneHeader:
            laneHeader &&
            ((context: { lane: TaskboardLane; count: number; collapsed: boolean; toggle: () => void }) => node(`lane-header:${context.lane.key}`, () => laneHeader(context))),
        empty: empty && ((context: { column: TaskboardColumn; lane?: TaskboardLane }) => node(`empty:${context.column.key}:${context.lane?.key ?? ''}`, () => empty(context)))
    };
};

// ---- pass-through: the root takes class, style, design tokens and the rest of the attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThrough(part: string, context: DomPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.taskboard?.[part];
    const local = props.pt?.[part];
    let own: PassThroughAttrs | undefined;
    if (part === 'root') {
        own = { ...attrs };
        if (props.dt) own = mergeAttrs(vueAttrs(own), { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) });
    }
    if (!own && !global && !local) return undefined;
    return mergeAttrs(vueAttrs(own ?? {}), vueAttrs(resolve(global, ctx)), vueAttrs(resolve(local, ctx)));
}

function passThroughMap(): PassThrough {
    const names = new Set(['root', ...Object.keys(config.pt.taskboard ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...names].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the board ----------------------------------------------------------------------

const inputs = (): TaskboardConfig => ({
    columns: toRaw(props.columns),
    items: props.items === undefined ? undefined : toRaw(props.items),
    columnField: props.columnField,
    laneField: props.laneField,
    lanes: toRaw(props.lanes),
    dataKey: props.dataKey,
    cardLabel: props.cardLabel,
    disabledField: props.disabledField,
    lockedField: props.lockedField,
    canDrop: props.canDrop,
    dragdrop: props.dragdrop,
    reorderColumns: props.reorderColumns,
    collapsible: props.collapsible,
    autoScroll: props.autoScroll,
    touchDelay: props.touchDelay,
    scrollHeight: props.scrollHeight,
    disabled: props.disabled,
    collapsedColumns: collapsedColumns.value,
    collapsedLanes: collapsedLanes.value,
    locale: config.locale,
    unstyled: unstyled(),
    pt: passThroughMap(),
    content: slotContent()
});

/** What the reader collapsed, put back where the application bound it. */
let writing = false;
function published(state: TaskboardModels) {
    writing = true;
    collapsedColumns.value = state.collapsedColumns;
    collapsedLanes.value = state.collapsedLanes;
    writing = false;
}

const events: TaskboardConfig['on'] = {
    change: published,
    'update:columns': (value) => emit('update:columns', value),
    'update:items': (value) => emit('update:items', value),
    'card-move': (event) => emit('card-move', event),
    'column-move': (event) => emit('column-move', event),
    'card-click': (event) => emit('card-click', event),
    'drop-refused': (event) => emit('drop-refused', event)
};

onMounted(() => {
    board = createTaskboard(host.value!, {
        ...inputs(),
        id,
        nonce: config.csp.nonce,
        cssLayer: config.cssLayer,
        overlayTarget: () => overlayTarget.value,
        zIndex: config.zIndex.overlay,
        on: events
    });
    sweep();
});

function push(next: Partial<TaskboardConfig>) {
    if (!board) return;
    board.update(next);
    sweep();
}

// Deep, over the reactive props (not their raw objects), so a change made in place is seen too.
watch(
    () => [props.columns, props.items, props.lanes],
    () => push(inputs()),
    { deep: true }
);
watch(
    () => [
        props.columnField,
        props.laneField,
        props.dataKey,
        props.cardLabel,
        props.disabledField,
        props.lockedField,
        props.canDrop,
        props.dragdrop,
        props.reorderColumns,
        props.collapsible,
        props.autoScroll,
        props.touchDelay,
        props.scrollHeight,
        props.disabled
    ],
    () => push(inputs())
);

// The models: what the application changed, which is not what the board just published.
watch(
    () => [collapsedColumns.value, collapsedLanes.value],
    () => {
        if (writing || !board) return;
        const state = board.state();
        const next: Partial<TaskboardConfig> = {};
        if (collapsedColumns.value && collapsedColumns.value !== state.collapsedColumns) next.collapsedColumns = collapsedColumns.value;
        if (collapsedLanes.value && collapsedLanes.value !== state.collapsedLanes) next.collapsedLanes = collapsedLanes.value;
        if (Object.keys(next).length) push(next);
    },
    { deep: true }
);

watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.taskboard, config.zIndex.overlay] as const,
    () => push({ locale: config.locale, unstyled: unstyled(), pt: passThroughMap(), zIndex: config.zIndex.overlay }),
    { deep: true }
);

// A slot added or removed, and the attributes the wrapper wears, are read
// through functions: draw again when the component that holds them re-rendered.
onUpdated(() => {
    if (!board) return;
    board.update({ pt: passThroughMap(), content: slotContent() });
    sweep();
});

const stopTheme = theme?.subscribe(() => board?.refresh());

onBeforeUnmount(() => {
    stopTheme?.();
    board?.destroy();
    board = null;
    containers.forEach((el) => render(null, el));
    containers.clear();
});

defineExpose({
    focusCard: (key: string) => board?.focusCard(key),
    cancel: () => board?.cancel(),
    /** The framework-free board underneath, for anything this component does not expose. */
    board: () => board
});
</script>

<template>
    <div ref="host" :data-vt-parts="readParts()" />
</template>
