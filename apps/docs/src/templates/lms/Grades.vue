<script setup lang="ts">
import { Card, Chart, Column, DataGrid, Knob, MeterGroup, ProgressBar, Tag, type ChartOptions } from '@vitral/vue';
import { computed } from 'vue';
import { grades } from './data';

type Grade = (typeof grades)[number];

const graded = grades.filter((grade) => grade.score !== null);
const average = computed(() => Math.round(graded.reduce((sum, grade) => sum + grade.score! * grade.weight, 0) / graded.reduce((sum, grade) => sum + grade.weight, 0)));

const byCourse = computed(() => {
    const map = new Map<string, number[]>();
    for (const grade of graded) map.set(grade.course, [...(map.get(grade.course) ?? []), grade.score!]);
    return [...map].map(([course, scores]) => ({
        course: course.split(':')[0]!.replace(' fundamentals', ''),
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));
});

const series = computed(() => [{ name: 'Average score', data: byCourse.value.map((entry) => entry.score) }]);
const options = computed<ChartOptions>(() => ({
    chart: { toolbar: { show: false }, height: 240 },
    xaxis: { categories: byCourse.value.map((entry) => entry.course) },
    yaxis: { min: 0, max: 100 },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%', horizontal: true } },
    dataLabels: { enabled: true, formatter: '{value}' },
    legend: { show: false }
}));

const time = [
    { label: 'Design', value: 38 },
    { label: 'Photography', value: 24 },
    { label: 'Writing', value: 18 },
    { label: 'Music', value: 12 }
];

const severity = (status: string) => (status === 'Graded' ? 'success' : status === 'Submitted' ? 'info' : 'secondary');
const letter = (score: number) => (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D');
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Grades</h1>
            <p class="tp-muted">Autumn term · weighted by assignment</p>
        </div>
    </div>

    <div class="tp-dash-grid tp-grades-top">
        <div class="tp-kpis tp-kpis-3">
            <div class="tp-kpi tp-kpi-knob">
                <Knob :model-value="average" readonly :size="96" value-template="{value}" aria-label="Weighted average" />
                <div>
                    <b>Weighted average</b>
                    <small>Grade {{ letter(average) }} · top 15% of your cohort</small>
                </div>
            </div>
            <dl class="tp-kpi">
                <dt>Credits earned</dt>
                <dd>18 <small>of 30</small></dd>
            </dl>
            <dl class="tp-kpi">
                <dt>Assignments due</dt>
                <dd>2</dd>
            </dl>
        </div>
        <Card title="Study time by subject" subtitle="Hours this term">
            <MeterGroup :value="time" :max="100" aria-label="Study time by subject" value-template="{value} h" />
        </Card>
    </div>

    <Card title="Average by course">
        <Chart type="bar" :series="series" :options="options" />
    </Card>

    <div class="tp-card tp-card-flush">
        <DataGrid :value="grades" data-key="id" sort-field="due" :sort-order="1" caption="Gradebook" class="tp-table">
            <template #header><h2 class="tp-h3">Gradebook</h2></template>
            <Column field="item" header="Assignment" sortable>
                <template #body="{ data }">
                    <span class="tp-person">
                        <span>
                            <b>{{ (data as Grade).item }}</b>
                            <small>{{ (data as Grade).course }}</small>
                        </span>
                    </span>
                </template>
            </Column>
            <Column field="due" header="Due" sortable />
            <Column field="weight" header="Weight" sortable>
                <template #body="{ data }"
                    ><span class="tp-num">{{ (data as Grade).weight }}%</span></template
                >
            </Column>
            <Column field="score" header="Score" sortable>
                <template #body="{ data }">
                    <div v-if="(data as Grade).score !== null" class="tp-score">
                        <ProgressBar :value="(data as Grade).score!" :show-value="false" :aria-label="`Score for ${(data as Grade).item}`" />
                        <b class="tp-num">{{ (data as Grade).score }}</b>
                    </div>
                    <span v-else class="tp-muted">—</span>
                </template>
            </Column>
            <Column field="status" header="Status">
                <template #body="{ data }"><Tag :value="(data as Grade).status" :severity="severity((data as Grade).status)" /></template>
            </Column>
        </DataGrid>
    </div>
</template>
