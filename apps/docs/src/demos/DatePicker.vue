<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DatePicker',
    category: 'Form',
    description: "A date field you can type into or pick from a calendar, read in the locale's format."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './DatePicker/Basic.vue';
import Constraints from './DatePicker/Constraints.vue';
import Fluid from './DatePicker/Fluid.vue';
import FooterButtons from './DatePicker/FooterButtons.vue';
import Inline from './DatePicker/Inline.vue';
import MonthAndYear from './DatePicker/MonthAndYear.vue';
import SizesVariantsAndStates from './DatePicker/SizesVariantsAndStates.vue';
import TitleOptions from './DatePicker/TitleOptions.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection
        title="Month and year"
        description="The month and the year in the calendar's title are buttons. The year opens a page of twenty years, a year opens its months, and a month opens its days, so a date decades away is three presses rather than hundreds of months paged through. The arrow keys move through either grid, PageUp and PageDown turn the page, and Escape goes back to the days."
    >
        <MonthAndYear />
    </DemoSection>
    <DemoSection
        title="Without the month or the year grid"
        description="Both are on by default and each is a prop. `:year-picker=&quot;false&quot;` leaves the year as text, for dates that belong to one year; `:month-picker=&quot;false&quot;` leaves the month as text, and a year chosen from the grid keeps the month on show. With both off the title is only text and the calendar is paged a month at a time."
    >
        <TitleOptions />
    </DemoSection>
    <DemoSection title="Constraints" description="Only the next 30 days, no weekends, and two blocked days. Unselectable days are skipped by the keys and cannot be clicked or typed."><Constraints /></DemoSection>
    <DemoSection title="Footer buttons"><FooterButtons /></DemoSection>
    <DemoSection title="Inline" description="The calendar on its own, without the field."><Inline /></DemoSection>
    <DemoSection title="Sizes, variants and states"><SizesVariantsAndStates /></DemoSection>
    <DemoSection title="Fluid" class="stack"><Fluid /></DemoSection>
</template>
