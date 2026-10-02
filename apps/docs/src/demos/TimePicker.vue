<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TimePicker',
    category: 'Form',
    description: 'A time of day, typed freely or picked from a list, and kept as minutes past midnight rather than a Date.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BoundedAndStepped from './TimePicker/BoundedAndStepped.vue';
import DefaultPicker from './TimePicker/DefaultPicker.vue';
import InlinePicker from './TimePicker/InlinePicker.vue';
import TwelveOrTwentyFour from './TimePicker/TwelveOrTwentyFour.vue';
import TypedNotChosen from './TimePicker/TypedNotChosen.vue';
import Masked from './TimePicker/Masked.vue';
</script>

<template>
    <DemoSection title="Default" description="Half-hourly by default. The box shows the time the way the locale writes it; the value underneath is a number."><DefaultPicker /></DemoSection>
    <DemoSection title="Typed, not chosen" description="A time box is a place people type. Try `9`, `930`, `9:30`, `9h30`, `21:30` or `9 pm` — then leave the box. Something that names no time empties it rather than guessing. The mask is off here, with `:mask=&quot;false&quot;`, so any of these can be typed."><TypedNotChosen /></DemoSection>
    <DemoSection title="In the shape of the time" description="On a twenty-four-hour clock the box types into `__:__` by default: digits only, the colon typed for you, and half a time put back when the box is left. A time pasted whole, as `930` or `9:30`, is read before the mask sees it. A twelve-hour time has an hour of no fixed width and is left free."><Masked /></DemoSection>
    <DemoSection title="Bounded, and stepped" description="`min-time` and `max-time` decide what the list offers and clamp what is typed; `step` decides how close together the times are. Page Up and Page Down move the value itself by an hour."><BoundedAndStepped /></DemoSection>
    <DemoSection title="Twelve or twenty-four" description="`hour12` overrides what the locale would have written. The list and the box always agree, because both are built from the same number."><TwelveOrTwentyFour /></DemoSection>
    <DemoSection title="Inline" description="Without the text box or the popup."><InlinePicker /></DemoSection>
</template>
