<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Cropper',
    category: 'Media',
    description:
        'A crop rectangle over an image, with no dependency underneath. The rectangle is one tab stop: the arrows move it, Shift with an arrow resizes it, Home and End take it to the corners, and every change is announced. Lock it to a ratio, mask it to a circle for an avatar, turn the picture in quarters and flip it. v-model is the crop in the image’s own pixels, so it survives JSON and a server can do the cutting; crop() does it here, on a canvas, when the file is what you want.'
};
</script>

<script setup lang="ts">
import { Avatar, Button, Cropper, Dialog, type CropValue } from '@vitral/vue';
import { computed, ref, useTemplateRef } from 'vue';
import DemoSection from '../DemoSection.vue';
import CodeBlock from '../parts/CodeBlock.vue';

const photo = 'https://picsum.photos/id/1015/1600/900';
const portrait = 'https://picsum.photos/id/1027/900/1200';

const banner = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
const avatar = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
const free = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
const plain = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });

const aspects = [
    { label: 'Free', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' }
];

const rounded = (value: CropValue) => `{ x: ${Math.round(value.x)}, y: ${Math.round(value.y)}, width: ${Math.round(value.width)}, height: ${Math.round(value.height)}, rotate: ${value.rotate} }`;

// The file, when the file is what you want: a canvas, then a Blob to upload.
const cropper = useTemplateRef<InstanceType<typeof Cropper>>('avatarCropper');
const saved = ref<string | null>(null);
const savedSize = ref(0);

async function save() {
    const blob = await cropper.value?.toBlob('image/png', { width: 256 });
    if (!blob) return;
    if (saved.value) URL.revokeObjectURL(saved.value);
    saved.value = URL.createObjectURL(blob);
    savedSize.value = blob.size;
}

// ---- the whole flow, which is where a cropper usually lives: a picture is
// chosen, cropped in a dialog, and only then does the profile change.
const dialog = ref(false);
const pending = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
const profile = ref<string | null>(null);
const modalCropper = useTemplateRef<InstanceType<typeof Cropper>>('modalCropper');

async function apply() {
    const blob = await modalCropper.value?.toBlob('image/png', { width: 192 });
    dialog.value = false;
    if (!blob) return;
    if (profile.value) URL.revokeObjectURL(profile.value);
    profile.value = URL.createObjectURL(blob);
}

const modalSource = `<Dialog v-model:visible="open" modal header="Crop your photo" :style="{ width: 'min(30rem, 92vw)' }">
    <Cropper ref="cropper" v-model="crop" :src="file" shape="circle" height="16rem" />
    <template #footer>
        <Button label="Cancel" severity="secondary" variant="text" @click="open = false" />
        <Button label="Use this photo" @click="apply" />
    </template>
</Dialog>`;

const usage = `<Cropper v-model="crop" :src="src" shape="circle" :preview-size="96" />

<!-- the file, when you want the file rather than the numbers -->
const blob = await cropper.toBlob('image/png', { width: 256 });`;

const model = computed(() => `const crop = ref<CropValue>(${rounded(free.value)});`);
</script>

<template>
    <DemoSection
        title="Avatar"
        description="A circle locks the ratio to one and drops the handles: drag the crop, or zoom it. The preview beside it is the same picture under a smaller box, not a second render."
    >
        <div class="demo-stack demo-wide">
            <Cropper ref="avatarCropper" v-model="avatar" :src="portrait" shape="circle" alt="A portrait" height="18rem" :preview-size="96" />
            <div class="demo-row">
                <Button label="Crop to a 256px PNG" size="small" @click="save" />
                <span v-if="saved" class="demo-hint">{{ Math.round(savedSize / 1024) }} kB</span>
                <img v-if="saved" :src="saved" alt="The cropped avatar" width="48" height="48" style="border-radius: 50%" />
            </div>
        </div>
    </DemoSection>

    <DemoSection title="A ratio, with handles" description="Eight handles for the pointer, hidden from assistive technology: the rectangle itself is the one tab stop.">
        <Cropper v-model="banner" :src="photo" aspect="16:9" alt="A landscape" height="18rem" />
        <span class="demo-hint">{{ rounded(banner) }}</span>
    </DemoSection>

    <DemoSection title="Without the thirds" description="The guide is on for a rectangle and off for a circle, where a rule of thirds means nothing. `grid` overrules either way.">
        <Cropper v-model="plain" :src="photo" aspect="4:3" :grid="false" alt="A landscape" height="16rem" />
    </DemoSection>

    <DemoSection title="Free, with ratios and turns" description="A chooser locks the ratio; the quarter turns and the flips travel with the crop, so it keeps pointing at the same part of the picture.">
        <Cropper v-model="free" :src="photo" :aspects="aspects" rotatable alt="A landscape" height="20rem" />
        <CodeBlock :code="model" label="ts" lang="ts" />
    </DemoSection>

    <DemoSection
        title="In a dialog"
        description="Where a cropper usually lives: a photograph is chosen, cropped over the page, and the profile changes only once it is accepted. The dialog gives the stage its width, so the crop is measured against what it is actually shown at."
    >
        <div class="demo-row">
            <Avatar :image="profile ?? undefined" :label="profile ? undefined : 'AF'" shape="circle" size="large" :alt="profile ? 'Your photo' : undefined" />
            <Button :label="profile ? 'Change the photo' : 'Upload a photo'" severity="secondary" variant="outlined" size="small" @click="dialog = true" />
            <span v-if="profile" class="demo-hint">Cropped to a 192px PNG</span>
        </div>

        <Dialog v-model:visible="dialog" modal header="Crop your photo" :style="{ width: 'min(30rem, 92vw)' }">
            <Cropper ref="modalCropper" v-model="pending" :src="portrait" shape="circle" alt="The photograph being cropped" height="16rem" />
            <template #footer>
                <Button label="Cancel" severity="secondary" variant="text" @click="dialog = false" />
                <Button label="Use this photo" @click="apply" />
            </template>
        </Dialog>

        <CodeBlock :code="modalSource" label="template" lang="vue" />
    </DemoSection>

    <DemoSection title="The shape of it">
        <CodeBlock :code="usage" label="template" lang="vue" />
    </DemoSection>
</template>
