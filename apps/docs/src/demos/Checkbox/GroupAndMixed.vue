<script setup lang="ts">
import { Checkbox } from '@vitral/vue';
import { computed, ref } from 'vue';

const toppings = ref<string[]>(['cheese']);
const all = ['cheese', 'mushroom', 'olives'];
const allChecked = computed({
    get: () => toppings.value.length === all.length,
    set: (on: boolean) => (toppings.value = on ? [...all] : [])
});
const mixed = computed(() => toppings.value.length > 0 && toppings.value.length < all.length);
</script>

<template>
    <div role="group" aria-labelledby="cb-toppings" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem">
        <small id="cb-toppings" style="color: var(--vt-text-muted-color)">Toppings</small>
        <Checkbox v-model="allChecked" :indeterminate="mixed" label="All toppings" />
        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; padding-inline-start: 1.75rem">
            <Checkbox v-model="toppings" value="cheese" label="Cheese" name="topping" />
            <Checkbox v-model="toppings" value="mushroom" label="Mushroom" name="topping" />
            <Checkbox v-model="toppings" value="olives" label="Olives" name="topping" />
        </div>
        <small style="color: var(--vt-text-muted-color)">{{ toppings }}</small>
    </div>
</template>
