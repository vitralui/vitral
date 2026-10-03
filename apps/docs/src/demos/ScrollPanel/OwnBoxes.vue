<script setup lang="ts">
import { Scrollbar as vScrollbar } from '@vitral/vue';

const rows = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Student ${i + 1}`, grade: (6 + ((i * 7) % 40) / 10).toFixed(1) }));
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1rem">
        <div v-scrollbar aria-label="Students" role="region" tabindex="0" style="width: 16rem; height: 12rem; overflow: auto; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <p v-for="row in rows" :key="row.id" style="margin: 0; padding: 0.375rem 1rem">{{ row.name }}</p>
        </div>
        <div v-scrollbar.always aria-label="Grades" role="region" tabindex="0" style="width: 16rem; height: 12rem; overflow: auto; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <table style="width: 100%; border-collapse: collapse">
                <tbody>
                    <tr v-for="row in rows" :key="row.id">
                        <td style="padding: 0.375rem 1rem">{{ row.name }}</td>
                        <td style="padding: 0.375rem 1rem; text-align: right">{{ row.grade }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-scrollbar.always.arrows aria-label="Term notes" role="region" tabindex="0" style="width: 16rem; height: 12rem; overflow: auto; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
            <div style="width: 26rem; padding: 0.5rem 1rem">
                <p v-for="row in rows" :key="row.id" style="margin: 0; padding: 0.25rem 0">{{ row.name }}: grade {{ row.grade }}, entered on the term's sheet</p>
            </div>
        </div>
    </div>
</template>
