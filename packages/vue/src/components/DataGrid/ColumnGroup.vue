<script setup lang="ts">
import type { ColumnGroupProps, ColumnGroupSlots } from './types';

// A group of columns renders nothing either. DataGrid reads its props and the
// `<Column>`s (or further groups) in its default slot from the vnodes, and
// draws its header over theirs.

defineOptions({ name: 'VtColumnGroup' });
defineProps<ColumnGroupProps>();
defineSlots<ColumnGroupSlots>();
</script>

<template>
    <template v-if="false" />
</template>
