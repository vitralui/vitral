<script setup lang="ts">
import type { ColumnProps, ColumnSlots } from './types';

// A column renders nothing. DataTable reads each <Column>'s props and slots
// straight from the vnodes in its default slot; this component exists so that
// templates are typed and the vnodes can be recognised.

defineOptions({ name: 'VtColumn' });
defineProps<ColumnProps>();
defineSlots<ColumnSlots>();
</script>

<template>
    <template v-if="false" />
</template>
