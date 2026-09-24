<script setup lang="ts">
import { UniformGrid, useLocale } from '@vitral/vue';
import { computed } from 'vue';

const { locale } = useLocale();
const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const title = computed(() => `${locale.value.monthNames[today.getMonth()]} ${today.getFullYear()}`);
const firstDay = computed(() => locale.value.firstDayOfWeek);
const weekdays = computed(() => Array.from({ length: 7 }, (_, i) => locale.value.dayNamesMin[(i + firstDay.value) % 7]));
const offset = computed(() => (monthStart.getDay() - firstDay.value + 7) % 7);
</script>

<template>
    <div class="calendar">
        <strong>{{ title }}</strong>
        <UniformGrid :columns="7" :spacing="2" aria-hidden="true">
            <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
        </UniformGrid>
        <UniformGrid :columns="7" :first-column="offset" :spacing="2">
            <span v-for="day in daysInMonth" :key="day" class="day" :class="{ today: day === today.getDate() }">{{ day }}</span>
        </UniformGrid>
    </div>
</template>

<style scoped>
.calendar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 17rem;
    padding: 0.75rem;
    background: var(--vt-overlay-popover-background);
    border: 1px solid var(--vt-overlay-popover-border-color);
    border-radius: var(--vt-border-radius-lg);
}

.weekday {
    font-size: 0.75rem;
    text-align: center;
    color: var(--vt-text-muted-color);
}

.day {
    padding: 0.375rem 0;
    text-align: center;
    border-radius: var(--vt-border-radius-pill);
}

.day:hover {
    background: var(--vt-content-hover-background);
}

.today {
    color: var(--vt-primary-contrast-color);
    background: var(--vt-primary-color);
}

.today:hover {
    background: var(--vt-primary-hover-color);
}
</style>
