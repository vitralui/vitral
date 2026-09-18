<script setup lang="ts">
import { mapPin } from '@vitral/icons';
import { Button, Icon, MultiSelect, Select } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { useTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { areas, filtered, homeTypes, listings, search, shortPrice, type Listing } from './data';
import HomeCard from './HomeCard.vue';

const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const areaOptions = areas;
const budgetOptions = [
    { label: 'Any price', value: 2000000 },
    { label: 'Up to $500K', value: 500000 },
    { label: 'Up to $1M', value: 1000000 },
    { label: 'Up to $1.5M', value: 1500000 }
];
const budget = ref(2000000);
const bedOptions = ['Any', '1+', '2+', '3+', '4+'];

watch(budget, (value) => (search.price = [300000, value]));
const results = computed(() => filtered());
const hovered = ref<number | null>(null);

function open(listing: Listing) {
    search.listingId = listing.id;
    go('property');
}

const neighbourhoods = [
    { name: 'Old Harbour', photo: 164, note: 'Canals, brick and bakeries' },
    { name: 'Midtown', photo: 369, note: 'Markets and good schools' },
    { name: 'Seaview', photo: 49, note: 'Terraces above the bay' },
    { name: 'Fernbrook', photo: 76, note: 'Space, trees and quiet' }
];

function explore(area: string) {
    search.area = area;
    go('listings');
}
</script>

<template>
    <section class="tp-hero tp-estate-hero" aria-labelledby="estate-title">
        <div class="tp-wrap tp-stack">
            <span class="tp-eyebrow">{{ listings.length }} homes for sale</span>
            <h1 id="estate-title" class="tp-h1 tp-headline-lg">Find a home that fits the way you live</h1>
            <p class="tp-lead">Search the harbour, the hills and the woods — every listing visited by one of our agents.</p>
            <form class="tp-search-panel" @submit.prevent="go('listings')">
                <div class="tp-field">
                    <span :id="field('area')" class="tp-label">Area</span>
                    <Select v-model="search.area" :options="areaOptions" placeholder="Anywhere" show-clear :aria-labelledby="field('area')" fluid />
                </div>
                <div class="tp-field">
                    <span :id="field('type')" class="tp-label">Type</span>
                    <MultiSelect v-model="search.types" :options="homeTypes" placeholder="Any type" :max-selected-labels="2" :aria-labelledby="field('type')" fluid />
                </div>
                <div class="tp-field">
                    <span :id="field('budget')" class="tp-label">Budget</span>
                    <Select v-model="budget" :options="budgetOptions" option-label="label" option-value="value" :aria-labelledby="field('budget')" fluid />
                </div>
                <div class="tp-field">
                    <span :id="field('beds')" class="tp-label">Bedrooms</span>
                    <Select v-model="search.beds" :options="bedOptions" :aria-labelledby="field('beds')" fluid />
                </div>
                <Button type="submit" :label="`Show ${results.length} homes`" icon="search" />
            </form>
        </div>
    </section>

    <section class="tp-section" aria-labelledby="estate-map">
        <div class="tp-wrap">
            <div class="tp-head">
                <h2 id="estate-map" class="tp-h2">On the map</h2>
                <Button label="List view" icon="arrowRight" icon-pos="right" variant="text" size="small" @click="go('listings')" />
            </div>
            <div class="tp-map-split">
                <div class="tp-map" role="group" aria-label="Map of the results">
                    <button
                        v-for="listing in results"
                        :key="listing.id"
                        type="button"
                        class="tp-map-pin"
                        :class="{ on: hovered === listing.id }"
                        :style="{ left: `${listing.x}%`, top: `${listing.y}%` }"
                        :aria-label="`${listing.title}, ${shortPrice(listing.price)}`"
                        @mouseenter="hovered = listing.id"
                        @mouseleave="hovered = null"
                        @focus="hovered = listing.id"
                        @blur="hovered = null"
                        @click="open(listing)"
                    >
                        {{ shortPrice(listing.price) }}
                    </button>
                    <span class="tp-map-label"><Icon :icon="mapPin" /> Northgate &amp; surroundings · illustrative map</span>
                </div>
                <ul class="tp-map-list">
                    <li v-for="listing in results.slice(0, 3)" :key="listing.id" @mouseenter="hovered = listing.id" @mouseleave="hovered = null">
                        <HomeCard :listing="listing" :active="hovered === listing.id" @open="open(listing)" />
                    </li>
                </ul>
            </div>
            <p v-if="!results.length" class="tp-muted">No homes match — try a wider budget.</p>
        </div>
    </section>

    <section class="tp-section tp-section-muted" aria-labelledby="estate-areas">
        <div class="tp-wrap">
            <h2 id="estate-areas" class="tp-h2">Neighbourhoods</h2>
            <ul class="tp-tiles">
                <li v-for="area in neighbourhoods" :key="area.name">
                    <button type="button" class="tp-tile" @click="explore(area.name)">
                        <img :src="photo(area.photo, 480, 360)" alt="" />
                        <span>
                            <b>{{ area.name }}</b>
                            <small>{{ area.note }}</small>
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    </section>
</template>
