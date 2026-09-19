<script setup lang="ts">
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { createSpreadsheet, type SpreadsheetHandle, type SpreadsheetOptions } from '@vitral/spreadsheet';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import { normalizeClass, normalizeStyle, onBeforeUnmount, onMounted, onUpdated, shallowRef, toRaw, useAttrs, useId, watch } from 'vue';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import { useVitral } from '../../config/config';
import type { SpreadsheetEmits, SpreadsheetProps } from './types';

// The grid is `@vitral/spreadsheet`'s framework-free renderer; this component
// only hands it the props and the Vitral configuration (locale, unstyled,
// pass-through, the theme) and turns its events into emits. The element it
// renders becomes the sheet's root, so what is drawn — the cells, the
// headers, the formula bar and the whole keyboard — is the addon's, and the
// same sheet can be drawn by React, by Angular or by a page with no framework
// at all.

defineOptions({ name: 'VtSpreadsheet', inheritAttrs: false });

const props = withDefaults(defineProps<SpreadsheetProps>(), {
    unstyled: undefined,
    rows: 100,
    columns: 26,
    formulaBar: true
});
const cells = defineModel<Record<string, string | number | boolean | null>>();
const emit = defineEmits<SpreadsheetEmits>();

const { config, theme } = useVitral();
const attrs = useAttrs();
const id = useId();
const host = shallowRef<HTMLElement | null>(null);
let sheet: SpreadsheetHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- pass-through: the root takes class, style, design tokens and the rest of the attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

function passThrough(part: string, context: DomPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.spreadsheet?.[part];
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
    const names = new Set(['root', ...Object.keys(config.pt.spreadsheet ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...names].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the sheet ----------------------------------------------------------------------

const inputs = (): SpreadsheetOptions => ({
    cells: cells.value === undefined ? undefined : toRaw(cells.value),
    rows: props.rows,
    columns: props.columns,
    formats: toRaw(props.formats),
    columnWidths: toRaw(props.columnWidths),
    rowHeights: toRaw(props.rowHeights),
    formulaBar: props.formulaBar,
    readonly: props.readonly,
    ariaLabel: props.ariaLabel,
    locale: config.locale,
    unstyled: unstyled(),
    pt: passThroughMap()
});

/** What the person typed, put back where the application bound it. */
let writing = false;
const events: SpreadsheetOptions['on'] = {
    change(event) {
        writing = true;
        cells.value = event.cells;
        emit('update:modelValue', event.cells);
        emit('change', event);
        writing = false;
    },
    'selection-change': (event) => emit('selection-change', event),
    'column-resize': (event) => emit('column-resize', event),
    'row-resize': (event) => emit('row-resize', event)
};

onMounted(() => {
    sheet = createSpreadsheet(host.value!, { ...inputs(), id, nonce: config.csp.nonce, cssLayer: config.cssLayer, on: events });
});

// Deep, over the reactive prop rather than its raw object, so a change made in
// place is seen too — and never the change the sheet has just published.
watch(
    () => cells.value,
    () => {
        if (writing || !sheet || cells.value === undefined) return;
        sheet.update({ cells: toRaw(cells.value) });
    },
    { deep: true }
);

watch(
    () => [props.rows, props.columns, props.formats, props.columnWidths, props.rowHeights, props.formulaBar, props.readonly, props.ariaLabel],
    () => sheet?.update(inputs()),
    { deep: true }
);

watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.spreadsheet] as const,
    () => sheet?.update({ locale: config.locale, unstyled: unstyled(), pt: passThroughMap() }),
    { deep: true }
);

// The attributes the wrapper wears are read through a function: draw again
// when the component that holds them re-rendered.
onUpdated(() => sheet?.update({ pt: passThroughMap() }));

const stopTheme = theme?.subscribe(() => sheet?.refresh());

onBeforeUnmount(() => {
    stopTheme?.();
    sheet?.destroy();
    sheet = null;
});

defineExpose({
    /** Puts the keyboard on a cell or a rectangle: `select('B2')`, `select('A1:C9')`. */
    select: (target: string) => sheet?.select(target),
    focus: () => sheet?.focus(),
    /** Where the keyboard is, and the rectangle around it. */
    selection: () => sheet?.selection(),
    /** The document underneath: values, formats, undo — anything this component does not expose. */
    sheet: () => sheet?.sheet
});
</script>

<template>
    <div ref="host" />
</template>
