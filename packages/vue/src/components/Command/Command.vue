<script setup lang="ts">
import { commandScore, firstIndex, formatMessage, lastIndex, stepIndex } from '@vitral/core';
import { commandStyle } from '@vitral/styles';
import { computed, nextTick, provide, ref, shallowReactive, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { CommandKey, type CommandItemEntry } from './context';
import type { CommandEmits, CommandProps, CommandSlots } from './types';

// A command palette: a search box over a list of commands, as a WAI-ARIA
// combobox that is always expanded. Focus stays in the search box; Up and Down
// (and Home and End) move the active option, shown by aria-activedescendant,
// and Enter runs it. Typing scores the items (core's commandScore: accents and
// case do not matter), hides those that miss and the groups left empty, puts
// the best first — groups by their best item — and says how many results
// there are in a polite status. The ranking is applied with CSS `order`, so
// Vue keeps owning the DOM; the arrows follow the ranked order.

defineOptions({ name: 'VtCommand' });

const props = withDefaults(defineProps<CommandProps>(), { unstyled: undefined, shouldFilter: true });
const search = defineModel<string>('search', { default: '' });
const emit = defineEmits<CommandEmits>();
defineSlots<CommandSlots>();

const { part, locale } = useComponent(commandStyle, props);
const id = useId();
const listId = `${id}-list`;
const inputId = `${id}-input`;
const items = shallowReactive<CommandItemEntry[]>([]);
const activeId = ref<string | null>(null);
const rootRef = ref<HTMLElement | null>(null);

const normalizedSearch = computed(() => search.value.trim());

const ranking = computed(() => props.shouldFilter && !!normalizedSearch.value);

/** 0 hides the item; a force-mounted item is always shown, ranked last. */
function scoreOf(entry: CommandItemEntry): number {
    if (!ranking.value) return 1;
    const keywords = entry.keywords();
    const result = props.filter ? props.filter(entry.value(), normalizedSearch.value, keywords) : commandScore(entry.value(), normalizedSearch.value, keywords, locale.value.code);
    const score = typeof result === 'boolean' ? Number(result) : result;
    return entry.forceMount() ? Math.max(score, Number.MIN_VALUE) : score;
}

const scores = computed(() => new Map(items.map((entry) => [entry, scoreOf(entry)])));
const matches = (entry: CommandItemEntry) => (scores.value.get(entry) ?? scoreOf(entry)) > 0;
const inDocumentOrder = (a: CommandItemEntry, b: CommandItemEntry) =>
    a.el.value!.compareDocumentPosition(b.el.value!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

const ordered = computed(() => {
    const shown = items.filter((entry) => entry.el.value && matches(entry)).sort(inDocumentOrder);
    if (!ranking.value) return shown;
    // A group ranks by its best item; ungrouped items rank alone. Ties keep the document order.
    const best = new Map<string, number>();
    const bucket = (entry: CommandItemEntry) => entry.groupId ?? entry.id;
    for (const entry of shown) best.set(bucket(entry), Math.max(best.get(bucket(entry)) ?? 0, scores.value.get(entry)!));
    const position = new Map(shown.map((entry, i) => [entry, i]));
    const firstOf = new Map<string, number>();
    shown.forEach((entry, i) => firstOf.has(bucket(entry)) || firstOf.set(bucket(entry), i));
    return [...shown].sort(
        (a, b) =>
            best.get(bucket(b))! - best.get(bucket(a))! ||
            firstOf.get(bucket(a))! - firstOf.get(bucket(b))! ||
            scores.value.get(b)! - scores.value.get(a)! ||
            position.get(a)! - position.get(b)!
    );
});

// Written to the DOM after each update rather than bound in the parts'
// templates: the order depends on every item, and binding it would re-render
// each part whenever any of them changed.
watch(
    () => (ranking.value ? ordered.value.map((entry) => entry.id).join() : ''),
    () => {
        const rank = new Map((ranking.value ? ordered.value : []).map((entry, i) => [entry, i]));
        const groupRank = new Map<Element, number>();
        for (const entry of items) {
            const el = entry.el.value;
            if (!el) continue;
            const at = rank.get(entry);
            el.style.order = at === undefined ? '' : String(at);
            const group = el.closest('[data-vt-command-group]');
            if (group && at !== undefined) groupRank.set(group, Math.min(groupRank.get(group) ?? at, at));
        }
        rootRef.value?.querySelectorAll<HTMLElement>('[data-vt-command-group]').forEach((group) => {
            const at = groupRank.get(group);
            group.style.order = at === undefined ? '' : String(at);
        });
    },
    { flush: 'post' }
);
const isDisabledAt = (index: number) => ordered.value[index]?.disabled() ?? true;
const count = computed(() => ordered.value.length);

/** The first enabled match takes the highlight whenever the results change. */
function reset() {
    const first = firstIndex(ordered.value.length, isDisabledAt);
    activeId.value = ordered.value[first]?.id ?? null;
}
watch(normalizedSearch, () => nextTick(reset));
watch(
    () => ordered.value.map((e) => e.id).join(),
    () => {
        if (!ordered.value.some((e) => e.id === activeId.value)) reset();
    },
    { flush: 'post' }
);

function scrollToActive() {
    nextTick(() => {
        if (activeId.value) document.getElementById(activeId.value)?.scrollIntoView?.({ block: 'nearest' });
    });
}

function move(to: number) {
    const entry = ordered.value[to];
    if (!entry) return;
    activeId.value = entry.id;
    scrollToActive();
}

function select(entry: CommandItemEntry) {
    if (entry.disabled()) return;
    activeId.value = entry.id;
    entry.onSelect();
    emit('select', entry.value());
}

function onKeydown(event: KeyboardEvent) {
    const list = ordered.value;
    const from = list.findIndex((e) => e.id === activeId.value);
    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            move(from < 0 ? (step > 0 ? firstIndex(list.length, isDisabledAt) : lastIndex(list.length, isDisabledAt)) : stepIndex(list.length, from, step, isDisabledAt, props.loop));
            break;
        }
        case 'Home':
        case 'End':
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            move(event.key === 'Home' ? firstIndex(list.length, isDisabledAt) : lastIndex(list.length, isDisabledAt));
            break;
        case 'Enter': {
            const entry = list[from];
            if (!entry) return;
            event.preventDefault();
            select(entry);
            break;
        }
    }
}

provide(CommandKey, {
    unstyled: () => props.unstyled,
    search,
    listId,
    inputId,
    activeId,
    visible: matches,
    groupVisible: (groupId) => items.some((entry) => entry.groupId === groupId && matches(entry)),
    count,
    register(entry) {
        items.push(entry);
        nextTick(() => {
            if (!activeId.value) reset();
        });
        return () => {
            const index = items.indexOf(entry);
            if (index >= 0) items.splice(index, 1);
            if (activeId.value === entry.id) nextTick(reset);
        };
    },
    onKeydown,
    select,
    label: () => props.label ?? locale.value.aria.commandPalette
});

const status = computed(() => (normalizedSearch.value ? formatMessage(locale.value.searchMessage, { count: count.value }) : ''));
</script>

<template>
    <div ref="rootRef" v-bind="part('root')">
        <slot />
        <span role="status" aria-live="polite" v-bind="part('status')">{{ status }}</span>
    </div>
</template>
