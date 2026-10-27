<script setup lang="ts">
import { InputColor } from '@vitral/vue';
import { ref } from 'vue';

const color = ref<string | null>('#2f5597');
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 18rem">
        <label for="ci-basic">Class colour</label>
        <InputColor id="ci-basic" v-model="color" clearable placeholder="Uses the course's colour" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ color === null ? 'null' : color }}</small>
    </div>
</template>
