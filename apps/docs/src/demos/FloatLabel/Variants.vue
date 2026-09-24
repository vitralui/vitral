<script setup lang="ts">
import { FloatLabel, InputText } from '@vitral/vue';
import { ref } from 'vue';

const over = ref('');
const inside = ref('');
const on = ref('Ada');
</script>

<template>
    <FloatLabel>
        <InputText id="fl-over" v-model="over" placeholder=" " />
        <label for="fl-over">Over</label>
    </FloatLabel>
    <FloatLabel variant="in">
        <InputText id="fl-in" v-model="inside" placeholder=" " />
        <label for="fl-in">In</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText id="fl-on" v-model="on" placeholder=" " />
        <label for="fl-on">On</label>
    </FloatLabel>
</template>
