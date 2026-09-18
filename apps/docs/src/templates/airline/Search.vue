<script setup lang="ts">
import { arrowLeftRight, planeLanding, planeTakeoff, users } from '@vitral/icons';
import { Button, Carousel, DatePicker, Icon, InputNumber, Popover, Select, SelectButton } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { cities, eur, passengers, trip, type City } from './data';

const { go, narrow } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const kinds = [
    { label: 'Return', value: 'return' },
    { label: 'One way', value: 'oneway' }
];
const cityOptions = cities.map((city) => ({ label: `${city.name} ${city.code}`, value: city.code }));
const cabins = ['Economy', 'Premium', 'Business'];
const today = new Date();

const popover = ref<InstanceType<typeof Popover> | null>(null);
const travellers = computed(() => `${passengers.value} · ${trip.cabin}`);

function swap() {
    [trip.from, trip.to] = [trip.to, trip.from];
}

function pick(city: City) {
    trip.to = city.code;
    go('results');
}

const deals = cities.filter((city) => city.from);
const valid = computed(() => trip.from !== trip.to && trip.depart && (trip.kind === 'oneway' || trip.back));
</script>

<template>
    <section class="tp-hero tp-air-hero" aria-labelledby="air-title">
        <div class="tp-wrap tp-stack">
            <h1 id="air-title" class="tp-h1 tp-headline-lg">Where to next?</h1>
            <p class="tp-lead">Fares include a seat, a snack and the view. Bags from €35.</p>

            <form class="tp-card tp-air-search" @submit.prevent="go('results')">
                <SelectButton v-model="trip.kind" :options="kinds" option-label="label" option-value="value" :allow-empty="false" label="Trip type" size="small" />
                <div class="tp-air-fields">
                    <div class="tp-field">
                        <span :id="field('from')" class="tp-label"><Icon :icon="planeTakeoff" /> From</span>
                        <Select v-model="trip.from" :options="cityOptions" option-label="label" option-value="value" filter :aria-labelledby="field('from')" fluid />
                    </div>
                    <Button :icon="arrowLeftRight" variant="outlined" severity="secondary" rounded aria-label="Swap origin and destination" class="tp-air-swap" @click="swap" />
                    <div class="tp-field">
                        <span :id="field('to')" class="tp-label"><Icon :icon="planeLanding" /> To</span>
                        <Select
                            v-model="trip.to"
                            :options="cityOptions"
                            option-label="label"
                            option-value="value"
                            filter
                            :aria-labelledby="field('to')"
                            :invalid="trip.from === trip.to"
                            fluid
                        />
                    </div>
                    <div class="tp-field">
                        <label :for="field('depart')" class="tp-label">Depart</label>
                        <DatePicker :id="field('depart')" v-model="trip.depart" :min-date="today" date-format="d MMM yyyy" fluid />
                    </div>
                    <div class="tp-field">
                        <label :for="field('back')" class="tp-label">Return</label>
                        <DatePicker :id="field('back')" v-model="trip.back" :min-date="trip.depart ?? today" :disabled="trip.kind === 'oneway'" date-format="d MMM yyyy" fluid />
                    </div>
                    <div class="tp-field">
                        <span :id="field('who')" class="tp-label">Travellers</span>
                        <Button
                            :label="travellers"
                            :icon="users"
                            severity="secondary"
                            variant="outlined"
                            class="tp-air-who"
                            :id="field('who-button')"
                            :aria-labelledby="`${field('who')} ${field('who-button')}`"
                            aria-haspopup="dialog"
                            @click="popover?.toggle($event)"
                        />
                    </div>
                    <Button type="submit" label="Search flights" icon="search" :disabled="!valid" class="tp-air-go" />
                </div>
            </form>

            <Popover ref="popover" aria-label="Travellers and cabin">
                <div class="tp-stack tp-air-popover">
                    <div class="tp-field">
                        <label :for="field('adults')" class="tp-label">Adults <small class="tp-muted">12+</small></label>
                        <InputNumber :id="field('adults')" v-model="trip.adults" :min="1" :max="9" show-buttons button-layout="horizontal" :allow-empty="false" class="tp-qty" />
                    </div>
                    <div class="tp-field">
                        <label :for="field('children')" class="tp-label">Children <small class="tp-muted">2–11</small></label>
                        <InputNumber
                            :id="field('children')"
                            v-model="trip.children"
                            :min="0"
                            :max="6"
                            show-buttons
                            button-layout="horizontal"
                            :allow-empty="false"
                            class="tp-qty"
                        />
                    </div>
                    <div class="tp-field">
                        <span :id="field('cabin')" class="tp-label">Cabin</span>
                        <SelectButton v-model="trip.cabin" :options="cabins" :allow-empty="false" :aria-labelledby="field('cabin')" size="small" />
                    </div>
                    <Button label="Done" size="small" @click="popover?.hide()" />
                </div>
            </Popover>
        </div>
    </section>

    <section class="tp-section" aria-labelledby="air-deals">
        <div class="tp-wrap">
            <div class="tp-head">
                <h2 id="air-deals" class="tp-h2">Fares from Brightwater</h2>
                <span class="tp-muted tp-small">Return, per person, this autumn</span>
            </div>
            <Carousel :value="deals" :num-visible="narrow ? 1 : 3" :num-scroll="1" circular aria-label="Destination deals" class="tp-carousel">
                <template #item="{ data }">
                    <article class="tp-story tp-deal">
                        <img :src="photo((data as City).photo, 600, 400)" alt="" />
                        <div class="tp-deal-text">
                            <h3 class="tp-h3">
                                <button type="button" class="tp-stretch" @click="pick(data as City)">{{ (data as City).name }}</button>
                            </h3>
                            <span>{{ (data as City).country }}</span>
                            <b>from {{ eur.format((data as City).from!) }}</b>
                        </div>
                    </article>
                </template>
            </Carousel>
        </div>
    </section>
</template>
