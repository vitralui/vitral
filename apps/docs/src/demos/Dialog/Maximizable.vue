<script setup lang="ts">
import { Button, Dialog } from '@vitral/vue';
import { ref } from 'vue';

const visible = ref(false);
</script>

<template>
    <Button label="Terms of service" severity="secondary" @click="visible = true" />
    <Dialog v-model:visible="visible" header="Terms of service" maximizable style="width: 36rem; height: 24rem">
        <p v-for="n in 8" :key="n">
            {{ n }}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus
            auctor fringilla, maecenas faucibus mollis interdum.
        </p>
        <template #footer>
            <Button label="Decline" severity="secondary" @click="visible = false" />
            <Button label="Accept" autofocus @click="visible = false" />
        </template>
    </Dialog>
</template>
