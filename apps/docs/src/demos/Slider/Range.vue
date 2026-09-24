<script setup lang="ts">
import { Slider, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const price = ref([200, 750]);
</script>

<template>
    <StackPanel spacing="0.375rem" class="slider-demo">
        <span id="sl-price">Price</span>
        <Slider v-model="price" range :min="0" :max="1000" :step="10" aria-labelledby="sl-price" :format-value="(v: number) => `R$ ${v}`" />
        <small style="color: var(--vt-text-muted-color)">R$ {{ price[0] }} – R$ {{ price[1] }}</small>
    </StackPanel>
</template>

<style scoped>
.slider-demo {
    width: 20rem;
}
</style>
