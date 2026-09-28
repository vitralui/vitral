<script setup lang="ts">
import { Avatar, Button, Column, DataGrid, Skeleton } from '@vitral/vue';
import { onBeforeUnmount, ref } from 'vue';

const people = [
    { id: 1, name: 'Ximena Diallo', city: 'São Paulo', balance: 1520.4 },
    { id: 2, name: 'Noémie Nowak', city: 'Zürich', balance: -310 },
    { id: 3, name: 'Bruno Nowak', city: 'Kraków', balance: 84.25 },
    { id: 4, name: 'Quentin Gómez', city: 'Tōkyō', balance: 12040 }
];

const loading = ref(true);
const selection = ref([]);
let timer: ReturnType<typeof setTimeout> | undefined;

// A stand-in for a request that takes a moment.
function reload() {
    loading.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => (loading.value = false), 1500);
}

reload();
onBeforeUnmount(() => clearTimeout(timer));

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('');
</script>

<template>
    <div class="demo-skeleton">
        <Button label="Load again" size="small" :disabled="loading" @click="reload" />
        <DataGrid v-model:selection="selection" :value="people" data-key="id" :loading="loading" loading-mode="skeleton" aria-label="People" class="demo-table">
            <Column selection-mode="multiple" />
            <Column field="name" header="Name">
                <template #body="{ data }">
                    <span class="demo-person"><Avatar :label="initials(data.name)" shape="circle" />{{ data.name }}</span>
                </template>
                <template #skeleton>
                    <span class="demo-person"><Skeleton shape="circle" width="2rem" /><Skeleton width="8rem" /></span>
                </template>
            </Column>
            <Column field="city" header="City" />
            <Column field="balance" header="Balance" align="right" />
        </DataGrid>
    </div>
</template>

<style scoped>
.demo-skeleton {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
}

.demo-table {
    width: 100%;
}

.demo-person {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
