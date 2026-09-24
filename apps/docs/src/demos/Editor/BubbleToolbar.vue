<script setup lang="ts">
import { Editor } from '@vitral/vue';
import { ref } from 'vue';

const bubble = ref('<p>Select some of this text: a floating toolbar appears over it, with bold, italic, a link and a colour.</p>');
</script>

<template>
    <Editor v-model="bubble" :toolbar="false" bubble-menu aria-label="Bubble toolbar example" style="width: 100%" />
</template>
