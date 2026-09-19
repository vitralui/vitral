<script setup lang="ts">
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { createSchedule, type EventContext, type ScheduleConfig, type ScheduleHandle, type ScheduleModels, type ToolbarContext } from '@vitral/schedule';
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
import type { ScheduleEmits, ScheduleProps, ScheduleResource, ScheduleSlots, ScheduleViewName } from './types';

// The schedule is `@vitral/schedule`'s framework-free renderer; this component
// only hands it the props, the Vitral configuration (locale, unstyled,
// pass-through, the overlay host, the theme) and the slots, and turns its
// events into emits. The element it renders becomes the schedule's root, so
// what is drawn — the grids, the events, the keyboard and the gestures — is
// the addon's, and the same scheduler can be drawn by React, by Angular or by
// a page with no framework at all.

defineOptions({ name: 'VtSchedule', inheritAttrs: false });

const props = withDefaults(defineProps<ScheduleProps>(), {
    unstyled: undefined,
    events: () => [],
    resources: () => [],
    toolbar: true,
    slotDuration: 30,
    timelineSlotDuration: 60,
    snapDuration: 15,
    minTime: '00:00',
    maxTime: '24:00',
    scrollTime: '08:00',
    businessHours: () => ({}),
    hour12: undefined,
    editable: true,
    selectable: true,
    nowIndicator: true,
    defaultDuration: 60,
    agendaDays: 7,
    timelineDays: 1,
    maxEventsPerDay: 3,
    scrollHeight: '36rem'
});
const view = defineModel<ScheduleViewName>('view', { default: 'week' });
const date = defineModel<Date>('date', { default: () => new Date() });
const emit = defineEmits<ScheduleEmits>();
const slots = defineSlots<ScheduleSlots>();

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const attrs = useAttrs();
const id = useId();
const instance = getCurrentInstance()!;
const host = shallowRef<HTMLElement | null>(null);
let schedule: ScheduleHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- slots: each is rendered by Vue into a container of its own, which the schedule places

// Slot content keeps what it would inject where the schedule is (a theme scope, an overlay host).
const SlotHost = defineComponent({
    name: 'VtScheduleSlot',
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

/** Containers whose part the schedule no longer draws are torn down with it. */
function sweep() {
    for (const [key, el] of containers) {
        if (el.isConnected) continue;
        render(null, el);
        containers.delete(key);
    }
}

/**
 * The parts a template wrote as children — `<Schedule.Toolbar>` and the
 * rest — read while a component that draws nothing renders, so what they read
 * is tracked like any other dependency.
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

const slotContent = (): ScheduleConfig['content'] => {
    const toolbar = contentFor('toolbar', 'Toolbar');
    const event = contentFor('event', 'Event');
    const resource = contentFor('resource', 'Resource');
    const empty = contentFor('empty', 'Empty');
    return {
        toolbar: toolbar && ((context: ToolbarContext) => node('toolbar', () => toolbar(context))),
        event: event && ((context: EventContext) => node(`event:${context.occurrence.key}`, () => event(context))),
        resource: resource && ((context: { resource: ScheduleResource }) => node(`resource:${context.resource.id}`, () => resource(context))),
        empty: empty && (() => node('empty', () => empty()))
    };
};

// ---- pass-through: the root takes class, style and design tokens; the grid its naming attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThrough(part: string, context: DomPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.schedule?.[part];
    const local = props.pt?.[part];
    let own: PassThroughAttrs | undefined;
    if (part === 'root') {
        own = { class: attrs.class, style: attrs.style };
        if (props.dt) own = mergeAttrs(vueAttrs(own), { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) });
    } else if (part === 'grid') {
        // Everything else dresses the grid, which is what a label belongs to.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { class: _class, style: _style, ...rest } = attrs;
        own = rest;
    }
    if (!own && !global && !local) return undefined;
    return mergeAttrs(vueAttrs(own ?? {}), vueAttrs(resolve(global, ctx)), vueAttrs(resolve(local, ctx)));
}

function passThroughMap(): PassThrough {
    const names = new Set(['root', 'grid', ...Object.keys(config.pt.schedule ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...names].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the schedule ------------------------------------------------------------------

const inputs = (): ScheduleConfig => ({
    events: toRaw(props.events),
    resources: toRaw(props.resources),
    views: props.views,
    toolbar: props.toolbar,
    slotDuration: props.slotDuration,
    timelineSlotDuration: props.timelineSlotDuration,
    snapDuration: props.snapDuration,
    minTime: props.minTime,
    maxTime: props.maxTime,
    scrollTime: props.scrollTime,
    businessHours: toRaw(props.businessHours),
    firstDayOfWeek: props.firstDayOfWeek,
    hour12: props.hour12,
    editable: props.editable,
    selectable: props.selectable,
    nowIndicator: props.nowIndicator,
    defaultDuration: props.defaultDuration,
    agendaDays: props.agendaDays,
    timelineDays: props.timelineDays,
    maxEventsPerDay: props.maxEventsPerDay,
    scrollHeight: props.scrollHeight,
    view: view.value,
    date: date.value,
    locale: config.locale,
    unstyled: unstyled(),
    pt: passThroughMap(),
    content: slotContent()
});

/** What the reader changed, put back where the application bound it. */
let writing = false;
function published(state: ScheduleModels) {
    writing = true;
    view.value = state.view;
    date.value = state.date;
    writing = false;
}

const events: ScheduleConfig['on'] = {
    change: published,
    'range-change': (range) => emit('range-change', range),
    'event-click': (payload) => emit('event-click', payload),
    'event-change': (change) => emit('event-change', change),
    select: (selection) => emit('select', selection),
    'date-click': (payload) => emit('date-click', payload)
};

onMounted(() => {
    schedule = createSchedule(host.value!, {
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

function push(next: Partial<ScheduleConfig>) {
    if (!schedule) return;
    schedule.update(next);
    sweep();
}

// Deep, over the reactive props (not their raw objects), so a change made in place is seen too.
watch(
    () => [props.events, props.resources, props.businessHours],
    () => push(inputs()),
    { deep: true }
);
watch(
    () => [
        props.views,
        props.toolbar,
        props.slotDuration,
        props.timelineSlotDuration,
        props.snapDuration,
        props.minTime,
        props.maxTime,
        props.scrollTime,
        props.firstDayOfWeek,
        props.hour12,
        props.editable,
        props.selectable,
        props.nowIndicator,
        props.defaultDuration,
        props.agendaDays,
        props.timelineDays,
        props.maxEventsPerDay,
        props.scrollHeight
    ],
    () => push(inputs())
);

// The models: what the application changed, which is not what the schedule just published.
watch(
    () => [view.value, date.value],
    () => {
        if (writing || !schedule) return;
        const state = schedule.state();
        const next: Partial<ScheduleModels> = {};
        if (view.value !== state.view) next.view = view.value;
        if (date.value instanceof Date && date.value.getTime() !== state.date.getTime()) next.date = date.value;
        if (Object.keys(next).length) push(next);
    }
);

watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.schedule, config.zIndex.overlay] as const,
    () => push({ locale: config.locale, unstyled: unstyled(), pt: passThroughMap(), zIndex: config.zIndex.overlay }),
    { deep: true }
);

// A slot added or removed, and the attributes the wrapper wears, are read
// through functions: draw again when the component that holds them re-rendered.
onUpdated(() => {
    if (!schedule) return;
    schedule.update({ pt: passThroughMap(), content: slotContent() });
    sweep();
});

const stopTheme = theme?.subscribe(() => schedule?.refresh());

onBeforeUnmount(() => {
    stopTheme?.();
    schedule?.destroy();
    schedule = null;
    containers.forEach((el) => render(null, el));
    containers.clear();
});

defineExpose({
    prev: () => schedule?.prev(),
    next: () => schedule?.next(),
    today: () => schedule?.today(),
    setView: (target: ScheduleViewName) => schedule?.setView(target),
    focus: () => schedule?.focus(),
    /** The framework-free schedule underneath, for anything this component does not expose. */
    schedule: () => schedule
});
</script>

<template>
    <div ref="host" :data-vt-parts="readParts()" />
</template>
