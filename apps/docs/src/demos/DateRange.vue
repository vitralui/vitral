<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DateRange',
    category: 'Form',
    description: 'Two dates and the days between them, picked on two months side by side or one, with the span drawn before it is committed.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Inline from './DateRange/Inline.vue';
import MonthAndYear from './DateRange/MonthAndYear.vue';
import OneMonth from './DateRange/OneMonth.vue';
import OtherMonths from './DateRange/OtherMonths.vue';
import Presets from './DateRange/Presets.vue';
import ShapeOfIt from './DateRange/ShapeOfIt.vue';
import TitleOptions from './DateRange/TitleOptions.vue';
import TwoMonths from './DateRange/TwoMonths.vue';
import WithTimes from './DateRange/WithTimes.vue';
import Typing from './DateRange/Typing.vue';
</script>

<template>
    <DemoSection title="Two months" description="The default. Pick a start, then an end; the band between them follows the pointer before you commit. Each calendar stops at its own month — the days either side are left blank rather than repeating the month next door."><TwoMonths /></DemoSection>
    <DemoSection title="One month" description="The same range in a single calendar, for a form with no room for two. With no neighbour to repeat, the days either side of the month come back."><OneMonth /></DemoSection>
    <DemoSection
        title="Month and year"
        description="The month and the year in each calendar's title are buttons. The year opens a page of twenty years, a year opens its months, and the month chosen is put in the calendar whose title was pressed, so a range years away is reached without paging there. The range itself is not touched on the way, and Escape goes back to the days."
    >
        <MonthAndYear />
    </DemoSection>
    <DemoSection
        title="Without the month or the year grid"
        description="Both are on by default and each is a prop. `:year-picker=&quot;false&quot;` leaves the year as text, `:month-picker=&quot;false&quot;` the month, and with both off the titles are only text and the calendars are paged a month at a time."
    >
        <TitleOptions />
    </DemoSection>
    <DemoSection
        title="With times"
        description="`show-time` gives each end a time of day: a field for the start and one for the end, each waiting for its day. Closing the range leaves the calendars open for the times, and each end keeps its time when its day changes. `time-step` sets the minutes between the times listed, and `min-time` and `max-time` bound both ends, here from noon to ten at night. The range can also be typed, each end with its time."
    >
        <WithTimes />
    </DemoSection>
    <DemoSection
        title="Typing a range"
        description="The box takes a range typed into it: two dates with the separator between them, read on Enter or when the box is left, sorted if typed backwards. A `date-format` of fixed width gives the box its shape, `__/__/____ – __/__/____`. `:manual-input=&quot;false&quot;` leaves the box for showing the range, and a press on it opens the calendars; `:mask=&quot;false&quot;` keeps the typing and drops the shape."
    >
        <Typing />
    </DemoSection>
    <DemoSection title="With the spans people ask for by name" description="The footer is a slot: presets, a count of nights, whatever the form needs."><Presets /></DemoSection>
    <DemoSection title="Inline" description="Without the text box or the popup."><Inline /></DemoSection>
    <DemoSection title="Showing the neighbouring days anyway" description="`show-other-months` overrides what the number of calendars decided. Two months with their edges drawn: February’s last days appear again as March’s first, and a range spanning the boundary is painted twice."><OtherMonths /></DemoSection>
    <DemoSection title="The shape of it"><ShapeOfIt /></DemoSection>
</template>
