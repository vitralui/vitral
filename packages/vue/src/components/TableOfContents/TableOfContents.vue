<script setup lang="ts">
import { activeOutlineIndex, normalizeOutline, type OutlineItem } from '@vitral/core';
import { tableofcontentsStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { TableOfContentsEmits, TableOfContentsProps } from './types';

defineOptions({ name: 'VtTableOfContents' });

const props = withDefaults(defineProps<TableOfContentsProps>(), { unstyled: undefined, selector: 'h2, h3', offset: 80, title: undefined, smooth: true });
/** The id of the section being read. */
const active = defineModel<string | null>('active', { default: null });
const emit = defineEmits<TableOfContentsEmits>();

const { part, locale } = useComponent(tableofcontentsStyle, props);
const titleId = useId();

const read = shallowRef<OutlineItem[]>([]);
const outline = computed<OutlineItem[]>(() => normalizeOutline(props.items ? props.items.map((i) => ({ ...i, level: i.level ?? 1 })) : read.value));

function sourceElement(): ParentNode | null {
    if (typeof document === 'undefined') return null;
    if (!props.source) return document;
    return typeof props.source === 'string' ? document.querySelector(props.source) : props.source;
}

/** Headings with an id, from the page: the ones a link can go to. */
function readHeadings() {
    if (props.items) return;
    const root = sourceElement();
    if (!root) return;
    read.value = Array.from(root.querySelectorAll<HTMLElement>(props.selector))
        .filter((h) => h.id && (h.textContent ?? '').trim())
        .map((h) => ({ id: h.id, label: (h.textContent ?? '').trim(), level: Number(/^h(\d)$/i.exec(h.localName)?.[1] ?? 2) }));
}

let frame = 0;
function track() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
        const targets = outline.value.map((item) => document.getElementById(item.id));
        const tops = targets.map((el) => (el ? el.getBoundingClientRect().top : Infinity));
        // At the very end of a page that scrolls, the last section is the one being read, however short.
        const page = document.documentElement.scrollHeight;
        const bottom = page > window.innerHeight && window.innerHeight + window.scrollY >= page - 2;
        const index = activeOutlineIndex(tops, props.offset, bottom);
        const id = outline.value[index]?.id ?? null;
        if (id !== active.value) active.value = id;
    });
}

let observer: MutationObserver | null = null;
onMounted(() => {
    readHeadings();
    track();
    window.addEventListener('scroll', track, { passive: true, capture: true });
    window.addEventListener('resize', track, { passive: true });
    // A page that fills in later — a route that renders after this — is read again.
    const root = sourceElement();
    if (!props.items && root && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
            readHeadings();
            track();
        });
        observer.observe(root === document ? document.body : (root as Node), { childList: true, subtree: true });
    }
});
onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', track, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', track);
    observer?.disconnect();
});
watch(() => [props.items, props.source, props.selector], () => {
    readHeadings();
    track();
});

function go(event: MouseEvent, id: string) {
    const target = document.getElementById(id);
    if (!target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - props.offset + 1;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: props.smooth && !reduce ? 'smooth' : 'auto' });
    // The address says where the reader is, and the keyboard goes there too.
    history.replaceState(null, '', `#${id}`);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    active.value = id;
    emit('navigate', id);
}

const heading = computed(() => (props.title === false ? null : (props.title ?? locale.value.aria.onThisPage)));
</script>

<template>
    <nav v-bind="part('root')" :aria-labelledby="heading ? titleId : undefined" :aria-label="heading ? undefined : locale.aria.onThisPage">
        <p v-if="heading" :id="titleId" v-bind="part('title')">{{ heading }}</p>
        <ul v-bind="part('list')">
            <li v-for="item in outline" :key="item.id" v-bind="part('item')">
                <a
                    :href="`#${item.id}`"
                    :aria-current="item.id === active ? 'location' : undefined"
                    v-bind="part('link', { active: item.id === active, level: item.level })"
                    :style="{ '--_level': item.level }"
                    @click="go($event, item.id)"
                    >{{ item.label }}</a
                >
            </li>
        </ul>
    </nav>
</template>
