<script setup lang="ts">
import { Button, Dialog } from '@vitral/vue';
import { ref } from 'vue';

type Position = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const positions: Position[] = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];
const visible = ref(false);
const position = ref<Position>('top');

function openAt(where: Position) {
    position.value = where;
    visible.value = true;
}
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(3, 8rem); gap: 0.5rem">
        <Button v-for="p in positions" :key="p" :label="p" severity="secondary" size="small" @click="openAt(p)" />
    </div>
    <Dialog v-model:visible="visible" :header="`Position: ${position}`" :position="position" style="width: 22rem" dismissable-mask>
        A press on the mask closes this one (<code>dismissable-mask</code>).
    </Dialog>
</template>
