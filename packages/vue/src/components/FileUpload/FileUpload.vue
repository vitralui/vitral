<script setup lang="ts">
import { formatFileSize, formatMessage, isClient, takeWithinLimit, validateFile } from '@vitral/core';
import { buttonStyle, fileuploadStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, ref, shallowRef, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import Message from '../Message/Message.vue';
import ProgressBar from '../ProgressBar/ProgressBar.vue';
import Tag from '../Tag/Tag.vue';
import type { FileUploadEmits, FileUploadProps, FileUploadSlots } from './types';

// A native file input, kept in the page and focused (so the keyboard and
// screen readers get the platform's own picker), drawn as a button through its
// label. Chosen files are checked for type, size and count by core's rules, and
// refusals are shown as alerts. The advanced mode adds a drop zone, the queue
// with each file's size and a named remove button, and a progress bar while
// uploading. The upload itself is an XMLHttpRequest, one for the queue or one
// per file with its own bar, or `uploader` for the app.

defineOptions({ name: 'VtFileUpload' });

const props = withDefaults(defineProps<FileUploadProps>(), {
    unstyled: undefined,
    mode: 'advanced',
    name: 'files[]',
    showUploadButton: true,
    showCancelButton: true
});
const emit = defineEmits<FileUploadEmits>();
defineSlots<FileUploadSlots>();

const { part, locale } = useComponent(fileuploadStyle, props);
// The choose label is drawn as a button; make sure the button's stylesheet is there.
useComponent(buttonStyle, props);
const id = useId();
const inputRef = ref<HTMLInputElement | null>(null);

const files = shallowRef<File[]>([]);
const uploaded = shallowRef<File[]>([]);
const messages = ref<string[]>([]);
const progress = ref(0);
/** Per file, while `requestPerFile` requests are running. */
const fileProgress = shallowRef(new Map<File, number>());
const pending = ref(0);
const uploading = computed(() => pending.value > 0);
const dragging = ref(false);
const previews = new Map<File, string>();

const basic = computed(() => props.mode === 'basic');
const code = computed(() => locale.value.code);
const chooseText = computed(() => props.chooseLabel ?? locale.value.choose);
const limitLeft = computed(() => (props.fileLimit === undefined ? Infinity : props.fileLimit - uploaded.value.length - files.value.length));
const chooseDisabled = computed(() => props.disabled || (!props.multiple && files.value.length > 0 && !basic.value) || limitLeft.value <= 0);

function previewOf(file: File): string | undefined {
    if (!file.type.startsWith('image/') || !isClient || typeof URL.createObjectURL !== 'function') return undefined;
    if (!previews.has(file)) previews.set(file, URL.createObjectURL(file));
    return previews.get(file);
}

function release(list: readonly File[]) {
    for (const file of list) {
        const url = previews.get(file);
        if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
        previews.delete(file);
    }
}
onBeforeUnmount(() => release([...previews.keys()]));

function addFiles(incoming: File[], event: Event) {
    if (props.disabled) return;
    messages.value = [];
    const valid: File[] = [];
    for (const file of incoming) {
        if (files.value.some((f) => f.name === file.name && f.size === file.size)) continue;
        const problem = validateFile(file, { accept: props.accept, maxFileSize: props.maxFileSize });
        if (problem === 'type') messages.value.push(formatMessage(props.invalidFileTypeMessage ?? locale.value.invalidFileType, { name: file.name, types: props.accept ?? '' }));
        else if (problem === 'size')
            messages.value.push(formatMessage(props.invalidFileSizeMessage ?? locale.value.invalidFileSize, { name: file.name, size: formatFileSize(props.maxFileSize ?? 0, code.value) }));
        else valid.push(file);
    }
    const single = !props.multiple;
    const candidates = single ? valid.slice(0, 1) : valid;
    const existing = uploaded.value.length + (single ? 0 : files.value.length);
    const { accepted, refused } = takeWithinLimit(candidates, existing, props.fileLimit);
    if (refused.length) messages.value.push(formatMessage(props.invalidFileLimitMessage ?? locale.value.invalidFileLimit, { limit: props.fileLimit ?? 0 }));
    if (!accepted.length) return;
    if (single) release(files.value);
    files.value = single ? accepted : [...files.value, ...accepted];
    emit('select', { originalEvent: event, files: files.value });
    if (props.auto) upload();
}

function onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    addFiles(Array.from(input.files ?? []), event);
    // Choosing the same file again should fire `change` again.
    input.value = '';
}

function choose() {
    inputRef.value?.click();
}

function remove(index: number) {
    const file = files.value[index];
    if (!file) return;
    files.value = files.value.filter((_, i) => i !== index);
    release([file]);
    emit('remove', { file, files: files.value });
}

function clear() {
    release(files.value);
    files.value = [];
    messages.value = [];
    progress.value = 0;
    emit('clear');
}

function upload() {
    const queue = files.value;
    if (!queue.length || uploading.value) return;
    if (props.customUpload) {
        emit('uploader', { files: queue });
        return;
    }
    if (!props.url) return;
    if (!props.requestPerFile) {
        send(queue, (value, event) => {
            progress.value = value;
            emit('progress', { originalEvent: event, progress: value });
        });
        return;
    }
    fileProgress.value = new Map(queue.map((file) => [file, 0]));
    for (const file of queue) {
        send([file], (value, event) => {
            fileProgress.value = new Map(fileProgress.value).set(file, value);
            const all = [...fileProgress.value.values()];
            progress.value = Math.round(all.reduce((sum, n) => sum + n, 0) / all.length);
            emit('progress', { originalEvent: event, progress: progress.value, file, fileProgress: value });
        });
    }
}

function send(batch: File[], onProgress: (value: number, event: ProgressEvent) => void) {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    emit('before-upload', { xhr, formData });
    for (const file of batch) formData.append(props.name, file, file.name);
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded * 100) / event.total), event);
    });
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        pending.value--;
        if (xhr.status >= 200 && xhr.status < 300) {
            uploaded.value = [...uploaded.value, ...batch];
            emit('upload', { xhr, files: batch });
            release(batch);
            files.value = files.value.filter((f) => !batch.includes(f));
        } else {
            emit('error', { xhr, files: batch });
        }
        if (!pending.value) {
            progress.value = 0;
            fileProgress.value = new Map();
        }
    };
    xhr.open('POST', props.url!, true);
    xhr.withCredentials = !!props.withCredentials;
    pending.value++;
    xhr.send(formData);
}

// ---- dropping ----------------------------------------------------------------------

function onDragover(event: DragEvent) {
    if (props.disabled) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    dragging.value = true;
}

function onDragleave(event: DragEvent) {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) dragging.value = false;
}

function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging.value = false;
    if (props.disabled) return;
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    addFiles(props.multiple ? dropped : dropped.slice(0, 1), event);
}

defineExpose({ upload, clear, choose, files, uploadedFiles: uploaded });
</script>

<template>
    <div v-bind="part('root', { basic, dragging })" @dragover="basic || onDragover($event)" @dragleave="basic || onDragleave($event)" @drop="basic || onDrop($event)">
        <div v-if="!basic" v-bind="part('header')">
            <label v-bind="part('choose', { disabled: chooseDisabled })">
                <input
                    :id="`${id}-input`"
                    ref="inputRef"
                    type="file"
                    :name="name"
                    :accept="accept"
                    :multiple="multiple"
                    :disabled="chooseDisabled"
                    v-bind="part('input')"
                    @change="onInputChange"
                />
                <Icon icon="plus" v-bind="part('chooseIcon')" />
                <span v-bind="part('chooseLabel')">{{ chooseText }}</span>
            </label>
            <Button
                v-if="showUploadButton && !auto"
                :label="uploadLabel ?? locale.upload"
                icon="upload"
                severity="secondary"
                :disabled="disabled || !files.length || uploading"
                :loading="uploading"
                :unstyled="unstyled"
                @click="upload"
            />
            <Button
                v-if="showCancelButton && !auto"
                :label="cancelLabel ?? locale.cancel"
                icon="close"
                severity="secondary"
                :disabled="disabled || !files.length || uploading"
                :unstyled="unstyled"
                @click="clear"
            />
            <slot name="header" :files="files" :choose-callback="choose" :upload-callback="upload" :clear-callback="clear" />
        </div>
        <label v-else v-bind="part('choose', { disabled })">
            <input
                :id="`${id}-input`"
                ref="inputRef"
                type="file"
                :name="name"
                :accept="accept"
                :multiple="multiple"
                :disabled="disabled"
                v-bind="part('input')"
                @change="onInputChange"
            />
            <Icon icon="upload" v-bind="part('chooseIcon')" />
            <span v-bind="part('chooseLabel')">{{ chooseText }}</span>
        </label>
        <span v-if="basic && files.length" aria-live="polite" v-bind="part('filename')">{{ files.map((f) => f.name).join(', ') }}</span>
        <div v-if="basic && messages.length" v-bind="part('messages')">
            <Message v-for="(message, i) in messages" :key="i" severity="danger" :unstyled="unstyled">{{ message }}</Message>
        </div>

        <div v-if="!basic" v-bind="part('content')">
            <div v-if="messages.length" v-bind="part('messages')">
                <Message v-for="(message, i) in messages" :key="i" severity="danger" closable :unstyled="unstyled" @close="messages.splice(i, 1)">{{ message }}</Message>
            </div>
            <ProgressBar v-if="uploading && !requestPerFile" :value="progress" :aria-label="locale.upload" :unstyled="unstyled" v-bind="part('progress')" />
            <slot name="content" :files="files" :uploaded-files="uploaded" :remove-file-callback="remove" :progress="progress" :messages="messages">
                <ul v-if="files.length || uploaded.length" v-bind="part('files')">
                    <li v-for="(file, i) in files" :key="`${file.name}-${file.size}`" v-bind="part('file')">
                        <img v-if="previewOf(file)" :src="previewOf(file)" alt="" v-bind="part('thumbnail')" />
                        <div v-bind="part('fileInfo')">
                            <span :id="`${id}-file-${i}`" v-bind="part('fileName')">{{ file.name }}</span>
                            <span v-bind="part('fileSize')">{{ formatFileSize(file.size, code) }}</span>
                        </div>
                        <ProgressBar
                            v-if="requestPerFile && fileProgress.has(file)"
                            :value="fileProgress.get(file)"
                            :aria-labelledby="`${id}-file-${i}`"
                            :unstyled="unstyled"
                            v-bind="part('fileProgress')"
                        />
                        <Tag v-else :value="locale.pending" severity="warn" :unstyled="unstyled" />
                        <Button
                            :id="`${id}-remove-${i}`"
                            icon="close"
                            variant="text"
                            severity="danger"
                            :aria-label="locale.aria.removeItem"
                            :aria-labelledby="`${id}-remove-${i} ${id}-file-${i}`"
                            :disabled="uploading"
                            :unstyled="unstyled"
                            v-bind="part('removeButton')"
                            @click="remove(i)"
                        />
                    </li>
                    <li v-for="file in uploaded" :key="`done-${file.name}-${file.size}`" v-bind="part('file')">
                        <div v-bind="part('fileInfo')">
                            <span v-bind="part('fileName')">{{ file.name }}</span>
                            <span v-bind="part('fileSize')">{{ formatFileSize(file.size, code) }}</span>
                        </div>
                        <Tag :value="locale.completed" severity="success" :unstyled="unstyled" />
                    </li>
                </ul>
                <div v-else v-bind="part('empty')">
                    <slot name="empty">
                        <Icon icon="upload" />
                        <span>{{ locale.dragDrop }}</span>
                    </slot>
                </div>
            </slot>
        </div>
    </div>
</template>
