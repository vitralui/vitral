<script setup lang="ts">
import { createChart, mergeAttrs, type ChartEventName, type ChartHandle, type ChartHooks, type ChartPassThrough, type ChartPassThroughContext, type ChartTooltipRenderContext, type DownloadKind, type LegendItemContext, type PieCenter } from '@vitral/chart';
import { loadStyle } from '@vitral/core';
import { baseStyle } from '@vitral/styles';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import { defineComponent, getCurrentInstance, h, normalizeClass, normalizeStyle, onBeforeUnmount, onMounted, onUpdated, ref, render, toRaw, useAttrs, useId, watch, type ComponentInternalInstance } from 'vue';
import { useVitral } from '../../config/config';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import type { ChartEmits, ChartProps, ChartSlots } from './types';

// The chart is `@vitral/chart`'s framework-free renderer; this component only
// hands it the props, the Vitral configuration (locale, unstyled, pass-through,
// the overlay host, the theme) and the slots, and turns its events into emits.
// The element it renders becomes the chart's root. Class and style go on that
// root; every other attribute goes on the focusable plot, where a label or a
// description belongs.

defineOptions({ name: 'VtChart', inheritAttrs: false });

const props = withDefaults(defineProps<ChartProps>(), { unstyled: undefined });
const emit = defineEmits<ChartEmits>();
const slots = defineSlots<ChartSlots>();
const attrs = useAttrs();
const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const id = useId();
const instance = getCurrentInstance()!;
const host = ref<HTMLElement | null>(null);
let chart: ChartHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- pass-through: the root takes class, style and design tokens; the plot the other attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThrough(part: string, context: ChartPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.chart?.[part];
    const local = props.pt?.[part];
    let own: PassThroughAttrs | undefined;
    if (part === 'root') {
        own = { class: attrs.class, style: attrs.style };
        if (props.dt) own = mergeAttrs(vueAttrs(own), { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) });
    } else if (part === 'canvas') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { class: _class, style: _style, ...rest } = attrs;
        own = rest;
    }
    if (!own && !global && !local) return undefined;
    return mergeAttrs(vueAttrs(own ?? {}), vueAttrs(resolve(global, ctx)), vueAttrs(resolve(local, ctx)));
}

function passThroughMap(): ChartPassThrough {
    const parts = new Set(['root', 'canvas', ...Object.keys(config.pt.chart ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...parts].map((part) => [part, (context: ChartPassThroughContext) => passThrough(part, context)]));
}

// ---- slots: each is rendered by Vue into a container of its own, which the chart places

// Slot content keeps what it would inject where the chart is (a theme scope, an overlay host).
const SlotHost = defineComponent({
    name: 'VtChartSlot',
    props: { name: { type: String, required: true }, data: { type: Object, default: undefined } },
    setup(p) {
        const self = getCurrentInstance() as ComponentInternalInstance & { provides: object };
        self.provides = (instance as ComponentInternalInstance & { provides: object }).provides;
        return () => (slots as Record<string, ((data: unknown) => unknown) | undefined>)[p.name]?.(p.data);
    }
});

const containers = new Map<string, HTMLElement>();
function slotNode(key: string, name: string, data?: object): Node {
    let el = containers.get(key);
    if (!el) {
        el = document.createElement('div');
        el.style.display = 'contents';
        containers.set(key, el);
    }
    const vnode = h(SlotHost, { name, data });
    vnode.appContext = instance.appContext;
    render(vnode, el);
    return el;
}

// Read on every draw, so a slot added or removed later is noticed.
const hooks: ChartHooks = {
    get tooltip() {
        return slots.tooltip ? { render: (context: ChartTooltipRenderContext) => slotNode('tooltip', 'tooltip', context) } : undefined;
    },
    get legend() {
        return slots.legend ? { item: (context: LegendItemContext) => slotNode(`legend-${context.seriesIndex}`, 'legend', context) } : undefined;
    },
    get noData() {
        return slots.noData ? { render: () => slotNode('noData', 'noData') } : undefined;
    },
    get center() {
        return slots.center ? { render: (context: PieCenter) => slotNode('center', 'center', context) } : undefined;
    }
};

// ---- the chart

const inputs = () => ({
    type: props.type,
    series: toRaw(props.series),
    options: toRaw(props.options),
    height: props.height,
    width: props.width
});

const events: ChartEventName[] = ['dataPointSelection', 'dataPointMouseEnter', 'dataPointMouseLeave', 'legendClick', 'zoomed', 'selection', 'click'];

onMounted(() => {
    if (!unstyled()) loadStyle(baseStyle.name, baseStyle.css, { nonce: config.csp.nonce, cssLayer: config.cssLayer });
    chart = createChart(host.value!, {
        ...inputs(),
        id,
        locale: config.locale,
        unstyled: unstyled(),
        pt: passThroughMap(),
        hooks,
        nonce: config.csp.nonce,
        cssLayer: config.cssLayer,
        overlayTarget: () => overlayTarget.value,
        zIndex: config.zIndex.overlay
    });
    for (const name of events) chart.on(name, (payload) => (emit as (event: string, payload: unknown) => void)(name, payload));
});

// Deep, over the reactive props (not their raw objects), so a change made in place is seen too.
watch(
    () => [props.type, props.series, props.options, props.height, props.width],
    () => chart?.update(inputs()),
    { deep: true }
);
watch(
    () => [config.locale, unstyled(), config.zIndex.overlay] as const,
    ([locale, flag, zIndex]) => {
        if (!flag) loadStyle(baseStyle.name, baseStyle.css, { nonce: config.csp.nonce, cssLayer: config.cssLayer });
        chart?.update({ locale, unstyled: flag, zIndex });
    }
);
// Pass-through and slots are read through functions: redraw when they may have changed.
watch(
    () => [props.pt, props.dt, config.pt.chart],
    () => chart?.update({ pt: passThroughMap() }),
    { deep: true }
);
onUpdated(() => chart?.refresh());

// The theme's font sizes feed the layout: measure again when the preset or scheme changes.
const stopTheme = theme?.subscribe(() => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => chart?.resize()) : chart?.resize()));

onBeforeUnmount(() => {
    stopTheme?.();
    chart?.destroy();
    chart = null;
    containers.forEach((el) => render(null, el));
    containers.clear();
});

const handle = () => chart!;

defineExpose({
    /** Zooms the x axis to `[min, max]`, in domain units. */
    zoomX: (min: number, max: number) => handle().zoomX(min, max),
    resetZoom: () => handle().resetZoom(),
    toggleSeries: (target: number | string) => handle().toggleSeries(target),
    showSeries: (target: number | string) => handle().showSeries(target),
    hideSeries: (target: number | string) => handle().hideSeries(target),
    download: (kind: DownloadKind) => handle().download(kind),
    scene: () => handle().scene(),
    /** The framework-free chart underneath, for anything this component does not expose. */
    chart: () => chart
});
</script>

<template>
    <div ref="host" />
</template>
