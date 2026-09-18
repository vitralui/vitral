<script setup lang="ts">
import { formatMessage } from '@vitral/core';
import { formStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritRoot, useFormContext } from './context';
import type { FormSummaryItem, FormSummaryProps, FormSummarySlots } from './types';

// The error summary (the GOV.UK pattern): after a failed submit, a box at the
// top of the form lists every error as a link to its field and takes focus.
// Its content is an alert, so it is read out once; the fields' own messages
// stay quiet meanwhile.

defineOptions({ name: 'VtFormSummary' });

const props = withDefaults(defineProps<FormSummaryProps>(), { unstyled: undefined, headingLevel: 2, always: false, autofocus: true });
defineSlots<FormSummarySlots>();

const form = useFormContext('FormSummary');
const { part, locale } = useComponent(formStyle, inheritRoot(props, form));
const titleId = `${useId()}-title`;
let element: HTMLElement | null = null;

const items = computed<FormSummaryItem[]>(() => {
    const state = form.state.value;
    const listed = new Set<string>();
    const out: FormSummaryItem[] = [];
    const entries = form.entries.value.filter((entry) => entry.element()?.isConnected);
    entries.sort((a, b) => (a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    for (const entry of entries) {
        const name = entry.name();
        const message = state.errors[name]?.[0];
        if (!message || !state.validated[name] || listed.has(name)) continue;
        listed.add(name);
        out.push({ name, label: entry.label(), message, target: entry.controlId() });
    }
    for (const [name, messages] of Object.entries(state.errors)) {
        if (listed.has(name) || !messages[0]) continue;
        const label = form.form.labelOf(name);
        out.push({ name, label: label === name ? '' : label, message: messages[0] });
    }
    return out;
});

const visible = computed(() => items.value.length > 0 && (props.always || form.summaryVisible.value));

function setElement(el: unknown) {
    const next = (el as HTMLElement | null) ?? null;
    if (next === element) return;
    if (element) form.summaries.value = form.summaries.value.filter((item) => item !== element);
    element = next;
    if (element && props.autofocus) form.summaries.value = [...form.summaries.value, element];
}

onBeforeUnmount(() => setElement(null));

function lineOf(item: FormSummaryItem) {
    return item.label && item.label !== item.message ? formatMessage(locale.value.form.summaryItem, { label: item.label, message: item.message }) : item.message;
}

function go(event: MouseEvent, item: FormSummaryItem) {
    const entry = form.entries.value.find((candidate) => candidate.name() === item.name);
    if (!entry) return;
    event.preventDefault();
    entry.focus();
    entry.element()?.scrollIntoView?.({ block: 'nearest' });
}
</script>

<template>
    <div v-if="visible" :ref="setElement" tabindex="-1" v-bind="part('summary')">
        <div role="alert" v-bind="part('summaryBody')">
            <component :is="`h${headingLevel}`" :id="titleId" v-bind="part('summaryTitle')">
                <slot name="title" :count="items.length">{{ title ?? locale.form.summaryTitle }}</slot>
            </component>
            <slot :items="items" />
            <ul v-bind="part('summaryList')" :aria-labelledby="titleId">
                <li v-for="item in items" :key="item.name" v-bind="part('summaryItem')">
                    <a v-if="item.target" :href="`#${item.target}`" v-bind="part('summaryLink')" @click="go($event, item)">
                        <slot name="item" :item="item">{{ lineOf(item) }}</slot>
                    </a>
                    <span v-else><slot name="item" :item="item">{{ lineOf(item) }}</slot></span>
                </li>
            </ul>
        </div>
    </div>
</template>
