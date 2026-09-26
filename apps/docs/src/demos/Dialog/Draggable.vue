<script setup lang="ts">
import { Button, Checkbox, Dialog } from '@vitral/vue';
import { ref } from 'vue';

const visible = ref(false);
const keepInViewport = ref(true);
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem">
        <Button label="Open a dialog to move" severity="secondary" @click="visible = true" />
        <Checkbox v-model="keepInViewport" label="Keep in viewport" binary />
    </div>
    <Dialog v-model:visible="visible" header="Drag me by the header" :keep-in-viewport="keepInViewport" style="width: 24rem">
        <p>Press the header and move the dialog. With “Keep in viewport” on, it stops at the edges of the screen, so its header can always be reached.</p>
    </Dialog>
</template>
