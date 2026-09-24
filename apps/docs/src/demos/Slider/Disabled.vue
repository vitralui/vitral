<script setup lang="ts">
import { Slider, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" class="slider-demo">
            <Slider :model-value="60" disabled aria-label="Disabled" />
        </StackPanel>
        <StackPanel spacing="0.375rem" class="slider-demo">
            <Slider :model-value="[25, 75]" range disabled :aria-label="['Disabled start', 'Disabled end']" />
        </StackPanel>
    </StackPanel>
</template>

<style scoped>
.slider-demo {
    width: 20rem;
}
</style>
