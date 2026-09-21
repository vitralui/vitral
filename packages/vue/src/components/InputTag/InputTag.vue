<script setup lang="ts">
import { addTags, removeTag, tagKeyTarget, typeTags, type TagOptions } from '@vitral/core';
import { inputtagStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { InputTagEmits, InputTagProps, InputTagSlots } from './types';

// A field whose value is a list of short strings. The text box is the only tab
// stop; the tags are read by the box's description and walked with the arrow
// keys, so a tag can be removed without a mouse and without adding a tab stop
// per tag. Enter or a separator commits, Backspace in an empty box takes the
// last tag off, and a paste of "one, two" becomes two tags.

defineOptions({ name: 'VtInputTag', inheritAttrs: false });

const props = withDefaults(defineProps<InputTagProps>(), { unstyled: undefined, variant: undefined, separator: ',', addOnBlur: true });
const model = defineModel<string[] | null>();
const emit = defineEmits<InputTagEmits>();
defineSlots<InputTagSlots>();

const { part, config, locale } = useComponent(inputtagStyle, props);
const attrs = useAttrs();
const autoId = useId();
const inputRef = ref<HTMLInputElement | null>(null);
const text = ref('');
/** The tag the keyboard is on; `-1` is the text box. */
const focused = ref(-1);

const tags = computed(() => model.value ?? []);
const editable = computed(() => !props.disabled && !props.readonly);
const full = computed(() => props.max !== undefined && tags.value.length >= props.max);
const listId = `${autoId}-list`;
const inputId = computed(() => (attrs.id as string | undefined) ?? `${autoId}-input`);

const options = computed<TagOptions>(() => ({
    separator: props.separator,
    max: props.max,
    allowDuplicate: props.allowDuplicate,
    validate: props.validate
}));

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    full: full.value
}));

// The root carries the attributes that name the field; the box keeps the id a
// <label for> points at.
const rootAttrs = computed(() => {
    const { id: _id, class: _class, style: _style, ...rest } = attrs;
    return { class: _class, style: _style, ...Object.fromEntries(Object.entries(rest).filter(([key]) => !key.startsWith('aria-'))) };
});
const ariaAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('aria-'))));

function commit(value: string, event: Event) {
    const edit = addTags(tags.value, value, options.value);
    text.value = edit.text;
    for (const refusal of edit.rejected) emit('reject', { originalEvent: event, value: refusal.tag, reason: refusal.reason });
    const added = edit.tags.slice(tags.value.length);
    if (!added.length) return;
    model.value = edit.tags;
    for (const tag of added) emit('add', { originalEvent: event, value: tag, tags: edit.tags });
}

function take(index: number, event: Event) {
    const value = tags.value[index];
    if (value === undefined) return;
    const next = removeTag(tags.value, index);
    model.value = next;
    emit('remove', { originalEvent: event, value, index, tags: next });
    // Focus cannot stay on a tag that is gone: it moves to the one that took
    // its place, or back to the box when that was the last of them.
    focused.value = next.length ? Math.min(index, next.length - 1) : -1;
    if (focused.value === -1) nextTick(() => inputRef.value?.focus());
}

function onInput(event: Event) {
    const el = event.target as HTMLInputElement;
    text.value = el.value;
    if (!editable.value) return;
    const edit = typeTags(tags.value, el.value, options.value);
    if (!edit) return;
    text.value = edit.text;
    for (const refusal of edit.rejected) emit('reject', { originalEvent: event, value: refusal.tag, reason: refusal.reason });
    const added = edit.tags.slice(tags.value.length);
    if (added.length) {
        model.value = edit.tags;
        for (const tag of added) emit('add', { originalEvent: event, value: tag, tags: edit.tags });
    }
    nextTick(() => {
        if (inputRef.value) inputRef.value.value = text.value;
    });
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && text.value) {
        // Enter commits a tag rather than submitting the form it is in.
        event.preventDefault();
        if (editable.value) commit(text.value, event);
        focused.value = -1;
        return;
    }
    if (event.key === 'Backspace' && !text.value && tags.value.length && editable.value) {
        event.preventDefault();
        take(focused.value === -1 ? tags.value.length - 1 : focused.value, event);
        return;
    }
    if ((event.key === 'Delete' || event.key === ' ') && focused.value >= 0 && editable.value) {
        event.preventDefault();
        take(focused.value, event);
        return;
    }
    if (event.key === 'Escape' && focused.value >= 0) {
        focused.value = -1;
        return;
    }
    // The arrows only walk the tags while the box is empty; inside text they
    // move the caret, which is what they are for.
    if (text.value && event.key !== 'Home' && event.key !== 'End') return;
    if ((event.key === 'Home' || event.key === 'End') && text.value) return;
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const target = tagKeyTarget(event.key, focused.value, tags.value.length, rtl);
    if (target === null) return;
    event.preventDefault();
    focused.value = target;
}

function onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!editable.value || !pasted) return;
    event.preventDefault();
    commit(text.value + pasted, event);
    if (inputRef.value) inputRef.value.value = text.value;
}

function onBlur(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    // Focus moving to the remove button of a tag is still inside the field.
    if (next && (event.currentTarget as HTMLElement).parentElement?.contains(next)) return;
    focused.value = -1;
    if (props.addOnBlur && editable.value && text.value) {
        commit(text.value, event);
        if (inputRef.value) inputRef.value.value = text.value;
    }
    emit('blur', event);
}

defineExpose({ focus: () => inputRef.value?.focus(), add: (value: string) => commit(value, new Event('add')) });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))" @click="inputRef?.focus()">
        <ul :id="listId" v-bind="part('list')">
            <li v-for="(tag, index) in tags" :key="`${tag}-${index}`" v-bind="part('tag', { focused: focused === index })">
                <slot name="tag" :value="tag" :index="index" :remove="(event: Event) => take(index, event)">
                    <span v-bind="part('tagLabel')">{{ tag }}</span>
                    <button
                        v-if="!disabled && !readonly"
                        type="button"
                        tabindex="-1"
                        :aria-label="`${locale.aria.removeItem} ${tag}`"
                        v-bind="part('remove')"
                        @click.stop="take(index, $event)"
                    >
                        <slot name="removeicon" :value="tag" :index="index">
                            <Icon :icon="removeIcon ?? 'close'" />
                        </slot>
                    </button>
                </slot>
            </li>
        </ul>
        <input
            :id="inputId"
            ref="inputRef"
            v-bind="mergeProps(ariaAttrs, part('input'))"
            type="text"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-describedby="tags.length ? listId : undefined"
            autocomplete="off"
            @input="onInput"
            @keydown="onKeydown"
            @paste="onPaste"
            @focus="emit('focus', $event)"
            @blur="onBlur"
        />
        <input v-for="(tag, index) in name ? tags : []" :key="`${name}-${index}`" type="hidden" :name="name" :value="tag" />
    </div>
</template>
