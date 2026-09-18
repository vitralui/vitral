<script setup lang="ts">
import { sanitizeUrl } from '@vitral/core';
import { image } from '@vitral/icons';
import { editorStyle } from '@vitral/styles';
import { computed, nextTick, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import InputText from '../InputText/InputText.vue';
import Popover from '../Popover/Popover.vue';
import { inheritRoot, useEditorContext } from './context';
import type { EditorIconButtonProps } from './types';

// Inserts an image by address. The alternative text is required: an image
// without one is a hole for anyone who cannot see it.

defineOptions({ name: 'VtEditorImageButton' });

const props = withDefaults(defineProps<EditorIconButtonProps>(), { unstyled: undefined });
const ctx = useEditorContext('EditorImageButton');
const { part } = useComponent(editorStyle, inheritRoot(props, ctx));
const text = computed(() => ctx.locale.value.editor);
const name = computed(() => props.label ?? text.value.image);
const id = useId();

const popover = ref<InstanceType<typeof Popover> | null>(null);
const open = ref(false);
const src = ref('');
const alt = ref('');
const srcError = ref('');
const altError = ref('');

const disabled = computed(() => !ctx.can('insertImage', { src: 'https://example.com/x.png', alt: 'x' }));

function toggle(event: MouseEvent) {
    src.value = '';
    alt.value = '';
    srcError.value = '';
    altError.value = '';
    popover.value?.toggle(event);
}

function insert() {
    const safe = sanitizeUrl(src.value, 'image');
    srcError.value = safe ? '' : text.value.invalidImageUrl;
    altError.value = alt.value.trim() ? '' : text.value.altRequired;
    if (!safe || altError.value) {
        nextTick(() => document.getElementById(srcError.value ? `${id}-src` : `${id}-alt`)?.focus());
        return;
    }
    ctx.run('insertImage', { src: safe, alt: alt.value.trim() });
    popover.value?.hide(false);
    nextTick(() => ctx.focus());
}
</script>

<template>
    <button
        v-tooltip="{ value: name, showDelay: 400 }"
        type="button"
        :aria-label="name"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        :disabled="disabled"
        v-bind="part('button', { disabled })"
        @click="toggle"
    >
        <Icon :icon="icon ?? image" v-bind="part('buttonIcon')" />
    </button>
    <Popover ref="popover" :aria-label="name" @show="open = true; ctx.popups.value++" @hide="open = false; ctx.popups.value--">
        <form novalidate :aria-label="name" @submit.prevent="insert">
            <div v-bind="part('panel')">
                <div v-bind="part('field')">
                    <label :for="`${id}-src`" v-bind="part('fieldLabel')">{{ text.imageUrl }}</label>
                    <InputText
                        :id="`${id}-src`"
                        v-model="src"
                        type="url"
                        size="small"
                        fluid
                        placeholder="https://"
                        aria-required="true"
                        :invalid="!!srcError"
                        :aria-invalid="srcError ? 'true' : undefined"
                        :aria-describedby="srcError ? `${id}-src-error` : undefined"
                    />
                    <span v-if="srcError" :id="`${id}-src-error`" v-bind="part('fieldError')">{{ srcError }}</span>
                </div>
                <div v-bind="part('field')">
                    <label :for="`${id}-alt`" v-bind="part('fieldLabel')">{{ text.imageAlt }}</label>
                    <InputText
                        :id="`${id}-alt`"
                        v-model="alt"
                        size="small"
                        fluid
                        aria-required="true"
                        :invalid="!!altError"
                        :aria-invalid="altError ? 'true' : undefined"
                        :aria-describedby="altError ? `${id}-alt-error ${id}-alt-hint` : `${id}-alt-hint`"
                    />
                    <span :id="`${id}-alt-hint`" v-bind="part('fieldHint')">{{ text.imageAltHint }}</span>
                    <span v-if="altError" :id="`${id}-alt-error`" v-bind="part('fieldError')">{{ altError }}</span>
                </div>
                <div v-bind="part('actions')">
                    <Button type="submit" :label="text.insert" size="small" />
                </div>
            </div>
        </form>
    </Popover>
</template>
