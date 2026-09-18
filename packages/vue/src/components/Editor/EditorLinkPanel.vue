<script setup lang="ts">
import { editorLinkAt, editorSelectionRange, sanitizeUrl } from '@vitral/core';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import Checkbox from '../Checkbox/Checkbox.vue';
import InputText from '../InputText/InputText.vue';
import Popover from '../Popover/Popover.vue';
import { inheritRoot, useEditorContext } from './context';

// The link editor: a popover (a non-modal dialog) with the address, the text
// when there is no selection to link, a new-tab option, and — on an existing
// link — buttons to open or remove it. The root hosts one, so the toolbar,
// the floating toolbar and Ctrl/Cmd+K all open the same.

defineOptions({ name: 'VtEditorLinkPanel' });

const props = defineProps<{ unstyled?: boolean }>();
const ctx = useEditorContext('EditorLinkPanel');
const { part } = useComponent(editorStyle, inheritRoot({ unstyled: props.unstyled }, ctx));
const text = computed(() => ctx.locale.value.editor);
const id = useId();

const popover = ref<InstanceType<typeof Popover> | null>(null);
const url = ref('');
const label = ref('');
const newTab = ref(false);
const error = ref('');
const existing = ref<{ href: string; text: string } | null>(null);
const needsText = ref(false);

function open(anchor: HTMLElement | null) {
    const state = ctx.editor.state;
    const link = editorLinkAt(state);
    const { empty } = editorSelectionRange(state.selection);
    existing.value = link ? { href: link.href, text: link.text } : null;
    url.value = link?.href ?? '';
    label.value = link?.text ?? '';
    newTab.value = link?.target === '_blank';
    needsText.value = empty;
    error.value = '';
    popover.value?.show(undefined, anchor);
}

ctx.registerLinkPanel(open);
onBeforeUnmount(() => ctx.registerLinkPanel(null));

function close() {
    popover.value?.hide(false);
    nextTick(() => ctx.focus());
}

function apply() {
    let value = url.value.trim();
    // A bare domain is a web address.
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value) && !/^[\w.-]+@/.test(value)) value = `https://${value}`;
    if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) value = `mailto:${value}`;
    const safe = sanitizeUrl(value, 'link');
    if (!safe) {
        error.value = text.value.invalidUrl;
        return;
    }
    ctx.run('setLink', safe, { text: needsText.value ? label.value.trim() || undefined : undefined, target: newTab.value ? '_blank' : null });
    close();
}

function remove() {
    ctx.run('unsetLink');
    close();
}
</script>

<template>
    <Popover ref="popover" :aria-label="text.link" @show="ctx.popups.value++" @hide="ctx.popups.value--">
        <form novalidate :aria-label="text.link" @submit.prevent="apply">
            <div v-bind="part('panel')">
                <div v-bind="part('field')">
                    <label :for="`${id}-url`" v-bind="part('fieldLabel')">{{ text.linkUrl }}</label>
                    <InputText
                        :id="`${id}-url`"
                        v-model="url"
                        type="url"
                        size="small"
                        fluid
                        placeholder="https://"
                        autocomplete="url"
                        :invalid="!!error"
                        :aria-invalid="error ? 'true' : undefined"
                        :aria-describedby="error ? `${id}-error` : undefined"
                        @input="error = ''"
                    />
                    <span v-if="error" :id="`${id}-error`" v-bind="part('fieldError')">{{ error }}</span>
                </div>
                <div v-if="needsText" v-bind="part('field')">
                    <label :for="`${id}-text`" v-bind="part('fieldLabel')">{{ text.linkText }}</label>
                    <InputText :id="`${id}-text`" v-model="label" size="small" fluid />
                </div>
                <Checkbox v-model="newTab" binary size="small" :label="text.openInNewTab" />
                <div v-bind="part('actions')">
                    <template v-if="existing">
                        <Button as="a" :href="existing.href" target="_blank" rel="noopener noreferrer" :label="text.openLink" severity="secondary" variant="text" size="small" />
                        <Button type="button" :label="text.removeLink" severity="danger" variant="text" size="small" @click="remove" />
                    </template>
                    <Button type="submit" :label="text.apply" size="small" />
                </div>
            </div>
        </form>
    </Popover>
</template>
