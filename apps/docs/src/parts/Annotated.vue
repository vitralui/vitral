<script setup lang="ts">
import { useTheme } from '@vitral/vue';
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { presetId, primary } from '../lib/theme';

/**
 * A spec sheet over live components: numbered pins on the components, and a
 * legend that names each token and its value, read from the rendered
 * elements, so the sheet changes with the theme. Pointing at a legend entry
 * lights its marks up and dims the rest. The marks are decoration (hidden from
 * assistive technology); the legend is the readable version of them.
 */
export interface Note {
    /** A selector inside the slot; the slot's first element when omitted. */
    target?: string;
    measure: 'radius' | 'padding' | 'fontSize' | 'primary' | 'gap' | 'height';
    /** The name in the legend; the token's usual name when omitted. */
    label?: string;
}

const props = defineProps<{ notes: Note[]; title?: string }>();

interface Mark {
    key: string;
    note: number;
    kind: 'radius' | 'content' | 'band' | 'baseline' | 'hatch' | 'span';
    style: Record<string, string>;
}
interface Entry {
    label: string;
    value: string;
    swatch?: string;
    pin: Record<string, string>;
}

const root = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const marks = shallowRef<Mark[]>([]);
const entries = shallowRef<Entry[]>([]);
const active = ref<number | null>(null);
const legendId = useId();

const names: Record<Note['measure'], string> = {
    radius: 'border radius',
    padding: 'padding',
    fontSize: 'font size',
    primary: 'primary',
    gap: 'gap',
    height: 'control height'
};

const rem = (px: number) => `${Math.round((px / 16) * 1000) / 1000}rem`;
const px = (n: number) => `${Math.round(n * 10) / 10}px`;

function hex(color: string): string {
    const m = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
    if (!m) return color;
    return `#${[m[1], m[2], m[3]].map((v) => Math.round(Number(v)).toString(16).padStart(2, '0')).join('')}`;
}

// Text is measured in the element's own font, so a mark ends where the text does.
let canvas: CanvasRenderingContext2D | null = null;
function textWidth(text: string, cs: CSSStyleDeclaration): number {
    canvas ??= document.createElement('canvas').getContext('2d');
    if (!canvas) return text.length * (parseFloat(cs.fontSize) || 14) * 0.55;
    canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return canvas.measureText(text).width;
}

function measure() {
    const host = root.value?.querySelector<HTMLElement>('.spec-stage');
    const inner = content.value;
    if (!host || !inner) return;
    const base = host.getBoundingClientRect();
    const nextMarks: Mark[] = [];
    const nextEntries: Entry[] = [];
    props.notes.forEach((note, i) => {
        const el = (note.target ? inner.querySelector<HTMLElement>(note.target) : (inner.firstElementChild as HTMLElement | null)) ?? null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const box = { left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, bottom: r.bottom - base.top, width: r.width, height: r.height };
        const cs = getComputedStyle(el);
        const num = (value: string) => parseFloat(value) || 0;
        const mark = (kind: Mark['kind'], style: Record<string, string>) => nextMarks.push({ key: `${i}-${nextMarks.length}`, note: i, kind, style });
        let value = '';
        let swatch: string | undefined;
        let pin = { left: px(box.left), top: px(box.top) };
        switch (note.measure) {
            case 'radius': {
                // A circle as wide as the corner's curve, inside the corner: it
                // touches both edges and traces the rounding.
                const radius = num(cs.borderTopLeftRadius);
                value = rem(radius);
                const size = Math.max(radius * 2, 6);
                mark('radius', { left: px(box.left), top: px(box.top), width: px(size), height: px(size) });
                // On the edge, just past the curve, clear of what the card holds.
                pin = { left: px(box.left + size + 10), top: px(box.top) };
                break;
            }
            case 'primary':
                swatch = cs.backgroundColor;
                value = hex(cs.backgroundColor);
                mark('span', { left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) });
                pin = { left: px(box.right - 10), top: px(box.top) };
                break;
            case 'fontSize': {
                const size = num(cs.fontSize);
                value = px(size);
                const padL = num(cs.paddingLeft);
                const text = el instanceof HTMLInputElement ? el.value || el.placeholder : el.textContent?.trim() ?? '';
                const width = Math.max(24, Math.min(box.width - padL * 2, textWidth(text, cs)));
                mark('baseline', { left: px(box.left + padL), top: px(box.top + box.height / 2 - size * 0.5), width: px(width), height: px(size) });
                pin = { left: px(box.left + padL + width + 14), top: px(box.top + box.height / 2) };
                break;
            }
            case 'padding': {
                const [t, rgt, b, l] = [num(cs.paddingTop), num(cs.paddingRight), num(cs.paddingBottom), num(cs.paddingLeft)];
                value = t === l ? rem(l) : `${rem(t)} ${rem(l)}`;
                mark('band', { left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height), borderRadius: cs.borderRadius, '--pt': px(t), '--pr': px(rgt), '--pb': px(b), '--pl': px(l) });
                mark('content', { left: px(box.left + l), top: px(box.top + t), width: px(box.width - l - rgt), height: px(box.height - t - b) });
                pin = { left: px(box.left + l / 2), top: px(box.top + box.height / 2) };
                break;
            }
            case 'gap': {
                const gap = num(cs.rowGap) || num(cs.columnGap);
                value = rem(gap);
                const kids = [...el.children].map((child) => child.getBoundingClientRect());
                const horizontal = cs.display.includes('flex') && cs.flexDirection.startsWith('row');
                kids.slice(0, -1).forEach((kid, k) => {
                    const next = kids[k + 1]!;
                    mark(
                        'hatch',
                        horizontal
                            ? { left: px(kid.right - base.left), top: px(box.top), width: px(next.left - kid.right), height: px(box.height) }
                            : { left: px(box.left), top: px(kid.bottom - base.top), width: px(box.width), height: px(next.top - kid.bottom) }
                    );
                });
                const first = kids[0];
                pin = first ? { left: px(box.right - 10), top: px(first.bottom - base.top + gap / 2) } : pin;
                break;
            }
            case 'height':
                value = rem(box.height);
                mark('span', { left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) });
                pin = { left: px(box.left - 2), top: px(box.top + box.height / 2) };
                break;
        }
        nextEntries.push({ label: note.label ?? names[note.measure], value, swatch, pin });
    });
    marks.value = nextMarks;
    entries.value = nextEntries;
}

let frame = 0;
function schedule() {
    cancelAnimationFrame(frame);
    // The theme is applied a frame after it changes; measure once it has landed.
    frame = requestAnimationFrame(() => requestAnimationFrame(measure));
}

const theme = useTheme();
watch([presetId, primary, () => theme.isDark.value], () => nextTick(schedule));

let observer: ResizeObserver | null = null;
onMounted(() => {
    schedule();
    if (typeof ResizeObserver !== 'undefined' && content.value) {
        observer = new ResizeObserver(schedule);
        observer.observe(content.value);
    }
    document.fonts?.ready.then(schedule).catch(() => {});
});
onBeforeUnmount(() => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
});
</script>

<template>
    <figure ref="root" class="spec" :class="{ 'has-active': active !== null }">
        <div class="spec-stage">
            <div ref="content" class="spec-content">
                <slot />
            </div>
            <div class="spec-layer" aria-hidden="true">
                <span v-for="mark in marks" :key="mark.key" :class="['spec-mark', `is-${mark.kind}`, { on: active === mark.note }]" :style="mark.style" />
                <span v-for="(entry, i) in entries" :key="`pin-${i}`" class="spec-pin" :class="{ on: active === i }" :style="entry.pin">{{ i + 1 }}</span>
            </div>
        </div>
        <figcaption :id="legendId" class="spec-legend">
            <span v-if="title" class="spec-title">{{ title }}</span>
            <ol :aria-labelledby="title ? legendId : undefined">
                <li
                    v-for="(entry, i) in entries"
                    :key="entry.label"
                    :class="{ on: active === i }"
                    tabindex="0"
                    @mouseenter="active = i"
                    @mouseleave="active = null"
                    @focus="active = i"
                    @blur="active = null"
                >
                    <span class="spec-num" aria-hidden="true">{{ i + 1 }}</span>
                    <span class="spec-label">{{ entry.label }}</span>
                    <span class="spec-value">
                        <i v-if="entry.swatch" class="spec-swatch" :style="{ background: entry.swatch }" aria-hidden="true" />
                        {{ entry.value }}
                    </span>
                </li>
            </ol>
        </figcaption>
    </figure>
</template>
