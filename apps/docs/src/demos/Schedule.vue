<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Schedule',
    category: 'Data',
    description: 'A calendar with month, week, day, agenda and resource timeline views, drag to move and resize, recurring events and any time zone.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Agenda from './Schedule/Agenda.vue';
import CustomToolbar from './Schedule/CustomToolbar.vue';
import ExportIcs from './Schedule/ExportIcs.vue';
import Filtered from './Schedule/Filtered.vue';
import Month from './Schedule/Month.vue';
import TimeZones from './Schedule/TimeZones.vue';
import TimelineByResource from './Schedule/TimelineByResource.vue';
import Week from './Schedule/Week.vue';
</script>

<template>
    <DemoSection title="Week" description="Business hours are shaded; overlapping events share the column; the red line is now. The standup repeats every weekday, payroll on the first and last of the month."><Week /></DemoSection>
    <DemoSection title="Month" description="Events run across the days they cover; a busy day shows “+N more”, which opens the full list."><Month /></DemoSection>
    <DemoSection title="Agenda" description="The next two weeks as a list, day by day."><Agenda /></DemoSection>
    <DemoSection title="Timeline by resource" description="Rooms as rows and time across. Drag a booking to another room, or press Alt with Up and Down."><TimelineByResource /></DemoSection>
    <DemoSection
        title="The same instants, read somewhere else"
        description="Three fixed instants, drawn in whichever zone is chosen. Nothing about the events changes — only which hour and which day the grid puts them at, so the nightly build crosses into the day before or the day after depending on where you are standing. Click an event: what comes back is the instant it always was."
    ><TimeZones /></DemoSection>
    <DemoSection title="Export to a calendar" description="`exportICS()` hands the reader the events as an iCalendar file that Google Calendar, Outlook and Apple Calendar import: a recurring event keeps its rule and its exceptions rather than being written out day by day, and an all-day one stays a date. `toICalendar()` returns the text instead."><ExportIcs /></DemoSection>
    <DemoSection title="Custom toolbar, content and revert" description="The toolbar and the event content are slots. Hours run 08:00–18:00 in 15-minute slots, and a move onto a weekend is reverted."><CustomToolbar /></DemoSection>
    <DemoSection title="Filtered" description="`filter` shows only some events: words, looked for in the title, the description and the location with case and accents aside (“reuniao” finds Reunião), or a function that keeps an event. The events themselves are untouched, so clearing the filter brings them all back, and the iCalendar export still has every one."><Filtered /></DemoSection>
</template>
