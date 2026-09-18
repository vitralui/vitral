<script setup lang="ts">
import { layoutGrid, layoutList } from '@vitral/icons';
import { Button, Checkbox, DataView, Icon, Select, SelectButton, Slider } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { areas, filtered, homeTypes, search, shortPrice, type Listing } from './data';
import HomeCard from './HomeCard.vue';

const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const areaOptions = areas;
const sort = ref('newest');
const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: low to high', value: 'low' },
    { label: 'Price: high to low', value: 'high' },
    { label: 'Largest', value: 'size' }
];
const layout = ref<'grid' | 'list'>('grid');
const layouts = [
    { value: 'grid', label: 'Grid', icon: layoutGrid },
    { value: 'list', label: 'List', icon: layoutList }
];

const results = computed(() => {
    const list = filtered();
    if (sort.value === 'low') return [...list].sort((a, b) => a.price - b.price);
    if (sort.value === 'high') return [...list].sort((a, b) => b.price - a.price);
    if (sort.value === 'size') return [...list].sort((a, b) => b.size - a.size);
    return list;
});

function reset() {
    search.area = null;
    search.types = [];
    search.price = [300000, 2000000];
    search.beds = 'Any';
}

function open(listing: Listing) {
    search.listingId = listing.id;
    go('property');
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <div class="tp-head">
            <div>
                <h1 class="tp-h1">Homes for sale</h1>
                <p class="tp-muted">{{ results.length }} results{{ search.area ? ` in ${search.area}` : '' }}</p>
            </div>
            <div class="tp-toolbar">
                <span :id="field('sort')" class="vt-sr-only">Sort by</span>
                <Select v-model="sort" :options="sortOptions" option-label="label" option-value="value" size="small" :aria-labelledby="field('sort')" />
                <SelectButton v-model="layout" :options="layouts" option-value="value" :allow-empty="false" label="Layout" size="small">
                    <template #option="{ option }">
                        <Icon :icon="(option as (typeof layouts)[number]).icon" />
                        <span class="vt-sr-only">{{ (option as (typeof layouts)[number]).label }}</span>
                    </template>
                </SelectButton>
            </div>
        </div>

        <div class="tp-split tp-split-filters">
            <aside class="tp-card tp-filters" aria-label="Filters">
                <div class="tp-field">
                    <span :id="field('area')" class="tp-label">Area</span>
                    <Select v-model="search.area" :options="areaOptions" placeholder="All areas" show-clear :aria-labelledby="field('area')" fluid />
                </div>
                <fieldset class="tp-fieldset tp-field">
                    <legend class="tp-label">Type</legend>
                    <Checkbox v-for="type in homeTypes" :key="type" v-model="search.types" :value="type" :label="type" />
                </fieldset>
                <div class="tp-field">
                    <span :id="field('price')" class="tp-label">Price: {{ shortPrice(search.price[0]!) }} – {{ shortPrice(search.price[1]!) }}</span>
                    <Slider v-model="search.price" range :min="300000" :max="2000000" :step="50000" :aria-label="['Minimum price', 'Maximum price']" :format-value="shortPrice" />
                </div>
                <div class="tp-field">
                    <span :id="field('beds')" class="tp-label">Bedrooms</span>
                    <SelectButton v-model="search.beds" :options="['Any', '2+', '3+', '4+']" :allow-empty="false" :aria-labelledby="field('beds')" size="small" fluid />
                </div>
                <Button label="Reset filters" variant="text" severity="secondary" size="small" @click="reset" />
            </aside>

            <section class="tp-results-wrap" aria-labelledby="listing-results">
                <h2 id="listing-results" class="vt-sr-only">Results</h2>
                <DataView :value="results" :layout="layout" data-key="id" paginator :rows="6" empty-message="No homes match these filters." class="tp-results">
                    <template #grid="{ items }">
                        <HomeCard v-for="listing in items as Listing[]" :key="listing.id" :listing="listing" @open="open(listing)" />
                    </template>
                    <template #list="{ items }">
                        <ul class="tp-rule-list">
                            <li v-for="listing in items as Listing[]" :key="listing.id">
                                <HomeCard :listing="listing" class="tp-listing-row" @open="open(listing)" />
                            </li>
                        </ul>
                    </template>
                </DataView>
            </section>
        </div>
    </div>
</template>
