<script setup lang="ts">
import { IftaLabel, InputText } from '@vitral/vue';
import { ref } from 'vue';

const email = ref('');
const wrong = ref('not-an-email');
</script>

<template>
    <IftaLabel>
        <InputText id="ifta-email" v-model="email" placeholder="you@example.com" />
        <label for="ifta-email">Email</label>
    </IftaLabel>
    <IftaLabel invalid>
        <InputText id="ifta-wrong" v-model="wrong" invalid />
        <label for="ifta-wrong">Email</label>
    </IftaLabel>
</template>
