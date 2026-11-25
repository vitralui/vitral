<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

const orders = [
    { id: 1, customer: 'ليلى حداد', city: 'عمّان', items: 3, total: 128.5, status: 'تم الشحن' },
    { id: 2, customer: 'عمر الخطيب', city: 'بيروت', items: 1, total: 42, status: 'قيد التجهيز' },
    { id: 3, customer: 'سارة منصور', city: 'الدار البيضاء', items: 5, total: 310.75, status: 'تم التسليم' },
    { id: 4, customer: 'يوسف ناصر', city: 'تونس', items: 2, total: 86, status: 'تم الشحن' },
    { id: 5, customer: 'مريم سليمان', city: 'القاهرة', items: 4, total: 199.9, status: 'تم التسليم' },
    { id: 6, customer: 'خالد عيسى', city: 'دبي', items: 7, total: 512, status: 'قيد التجهيز' }
];
</script>

<template>
    <!-- The page's direction is the grid's: pinned columns, the scroll, the keys and the paginator all turn round. -->
    <div dir="rtl" lang="ar" style="width: 100%">
        <DataGrid :value="orders" data-key="id" aria-label="الطلبات" selection-mode="multiple" paginator :rows="4" scrollable class="demo-table">
            <Column selection-mode="multiple" pinned="left" />
            <Column field="customer" header="العميل" sortable pinned="left" :width="160" />
            <Column field="city" header="المدينة" sortable :width="160" />
            <Column field="items" header="القطع" align="right" sortable :width="120" />
            <Column field="total" header="المجموع" align="right" sortable :width="140" />
            <Column field="status" header="الحالة" :width="160" />
        </DataGrid>
    </div>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
