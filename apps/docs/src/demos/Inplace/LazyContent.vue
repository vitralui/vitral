<script setup lang="ts">
import { Inplace } from '@vitral/vue';
</script>

<template>
    <Inplace closable>
        <template #display>View photo</template>
        <template #content="{ closeCallback }">
            <img src="https://picsum.photos/id/1015/320/200" alt="A river running through a valley" style="display: block; border-radius: 6px; cursor: zoom-out" @click="closeCallback()" />
        </template>
    </Inplace>
</template>
