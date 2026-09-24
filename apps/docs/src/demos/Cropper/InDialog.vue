<script setup lang="ts">
import { Avatar, Button, Cropper, Dialog, StackPanel, type CropValue } from '@vitral/vue';
import { ref, useTemplateRef } from 'vue';

// The whole flow, which is where a cropper usually lives: a picture is
// chosen, cropped in a dialog, and only then does the profile change.
const portrait = 'https://picsum.photos/id/1027/900/1200';
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
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.625rem" align="center" wrap>
        <Avatar :image="profile ?? undefined" :label="profile ? undefined : 'AF'" shape="circle" size="large" :alt="profile ? 'Your photo' : undefined" />
        <Button :label="profile ? 'Change the photo' : 'Upload a photo'" severity="secondary" variant="outlined" size="small" @click="dialog = true" />
        <small v-if="profile" style="color: var(--vt-text-muted-color)">Cropped to a 192px PNG</small>
    </StackPanel>

    <Dialog v-model:visible="dialog" modal header="Crop your photo" :style="{ width: 'min(30rem, 92vw)' }">
        <Cropper ref="modalCropper" v-model="pending" :src="portrait" shape="circle" alt="The photograph being cropped" height="16rem" />
        <template #footer>
            <Button label="Cancel" severity="secondary" variant="text" @click="dialog = false" />
            <Button label="Use this photo" @click="apply" />
        </template>
    </Dialog>
</template>
