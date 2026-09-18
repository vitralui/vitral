<script setup lang="ts">
import { arrowRight, clock, backpack, plane } from '@vitral/icons';
import { Button, Checkbox, Icon, SelectButton, Slider, Tag, ToggleSwitch } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { cityOf, dateLabel, duration, eur, flights, passengers, trip, type Flight } from './data';
import FlowSteps from './FlowSteps.vue';

const { go } = useTemplate();
const id = useId();

const stops = ref<string[]>(['0', '1']);
const maxPrice = ref(250);
const morning = ref(false);
const sort = ref('Best');

// A week of prices around the chosen day.
const days = computed(() => {
    const base = trip.depart ?? new Date();
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
        const date = new Date(base);
        date.setDate(date.getDate() + offset);
        return { value: offset, date, price: 87 + (((offset + 3) * 29) % 90) };
    });
});
const day = ref(0);

function chooseDay(offset: number) {
    if (!trip.depart) return;
    const date = new Date(trip.depart);
    date.setDate(date.getDate() + offset);
    trip.depart = date;
    day.value = 0;
}

const shown = computed(() => {
    const list = flights.filter((flight) => stops.value.includes(String(flight.stops)) && flight.price <= maxPrice.value && (!morning.value || flight.depart < '12:00'));
    if (sort.value === 'Cheapest') return [...list].sort((a, b) => a.price - b.price);
    if (sort.value === 'Fastest') return [...list].sort((a, b) => a.minutes - b.minutes);
    return list;
});

const cheapest = computed(() => Math.min(...flights.map((flight) => flight.price)));

function choose(flight: Flight) {
    trip.flightId = flight.id;
    go('seats');
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <FlowSteps>
            <header class="tp-head">
                <div>
                    <h1 class="tp-h1 tp-row">{{ cityOf(trip.from).name }} <Icon :icon="arrowRight" class="tp-inline-icon" /> {{ cityOf(trip.to).name }}</h1>
                    <p class="tp-muted">
                        {{ dateLabel(trip.depart) }}<template v-if="trip.kind === 'return'"> – {{ dateLabel(trip.back) }}</template> · {{ passengers }} travellers ·
                        {{ trip.cabin }}
                    </p>
                </div>
                <Button label="Change search" icon="pencil" severity="secondary" variant="outlined" size="small" @click="go('search')" />
            </header>

            <div class="tp-dates" role="group" aria-label="Departure day">
                <button v-for="entry in days" :key="entry.value" type="button" class="tp-date" :aria-pressed="entry.value === day" @click="chooseDay(entry.value)">
                    <span>{{ dateLabel(entry.date) }}</span>
                    <b>{{ eur.format(entry.price) }}</b>
                </button>
            </div>

            <div class="tp-split tp-split-filters">
                <aside class="tp-card tp-filters" aria-label="Filters">
                    <fieldset class="tp-fieldset tp-field">
                        <legend class="tp-label">Stops</legend>
                        <Checkbox v-model="stops" value="0" label="Direct" />
                        <Checkbox v-model="stops" value="1" label="1 stop" />
                    </fieldset>
                    <div class="tp-field">
                        <span :id="`${id}-price`" class="tp-label">Up to {{ eur.format(maxPrice) }}</span>
                        <Slider v-model="maxPrice" :min="80" :max="250" :step="10" :aria-labelledby="`${id}-price`" />
                    </div>
                    <ToggleSwitch v-model="morning" label="Morning departures" />
                </aside>

                <section class="tp-stack" aria-label="Flights">
                    <div class="tp-row tp-row-between">
                        <span class="tp-muted tp-small">{{ shown.length }} flights · from {{ eur.format(cheapest) }}</span>
                        <SelectButton v-model="sort" :options="['Best', 'Cheapest', 'Fastest']" :allow-empty="false" label="Sort" size="small" />
                    </div>

                    <ul class="tp-flights">
                        <li v-for="item in shown" :key="item.id">
                            <article class="tp-card tp-flight" :aria-label="`${item.number}, ${item.depart} to ${item.arrive}`">
                                <div class="tp-flight-times">
                                    <div>
                                        <b>{{ item.depart }}</b>
                                        <small>{{ trip.from }}</small>
                                    </div>
                                    <div class="tp-flight-line">
                                        <small><Icon :icon="clock" /> {{ duration(item.minutes) }}</small>
                                        <span aria-hidden="true"><Icon :icon="plane" /></span>
                                        <small>{{ item.stops ? `1 stop · ${item.via}` : 'Direct' }}</small>
                                    </div>
                                    <div>
                                        <b>{{ item.arrive }}</b>
                                        <small>{{ trip.to }}</small>
                                    </div>
                                </div>
                                <div class="tp-flight-meta">
                                    <span class="tp-muted tp-small">{{ item.number }} · {{ item.aircraft }}</span>
                                    <div class="tp-row">
                                        <Tag :value="item.fare" severity="secondary" />
                                        <Tag v-if="item.price === cheapest" value="Cheapest" severity="success" />
                                        <Tag v-if="item.seatsLeft <= 4" :value="`${item.seatsLeft} seats left`" severity="warn" />
                                        <span v-if="item.fare !== 'Light'" class="tp-note"><Icon :icon="backpack" /> Bag included</span>
                                    </div>
                                </div>
                                <div class="tp-flight-price">
                                    <strong class="tp-price tp-price-lg">{{ eur.format(item.price) }}</strong>
                                    <small class="tp-muted">per person</small>
                                    <Button
                                        :label="trip.flightId === item.id ? 'Selected' : 'Select'"
                                        :variant="trip.flightId === item.id ? 'outlined' : undefined"
                                        size="small"
                                        @click="choose(item)"
                                    />
                                </div>
                            </article>
                        </li>
                    </ul>
                    <p v-if="!shown.length" class="tp-muted">No flights match these filters.</p>
                </section>
            </div>
        </FlowSteps>
    </div>
</template>
