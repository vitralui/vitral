<script setup lang="ts">
import { Editor, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const bio = ref('<p>Keep it short.</p>');
</script>

<template>
    <StackPanel spacing="0.375rem" style="width: 100%">
        <Label for="ed-bio">Bio</Label>
        <Editor id="ed-bio" v-model="bio" :max-length="140" :toolbar="[['bold', 'italic', 'link']]" />
    </StackPanel>
</template>
