<script setup lang="ts">
import { bath, bed, ruler } from '@vitral/icons';
import { Icon, Tag } from '@vitral/vue';
import { photo } from '../kit/format';
import { price, type Listing } from './data';

// One home as a teaser: the headline's button covers the card.
defineProps<{ listing: Listing; active?: boolean }>();
defineEmits<{ open: [] }>();
</script>

<template>
    <article class="tp-listing tp-story" :class="{ 'tp-listing-on': active }">
        <div class="tp-listing-media">
            <img :src="photo(listing.photos[0]!, 600, 400)" alt="" />
            <Tag v-if="listing.badge" :value="listing.badge" :severity="listing.badge === 'Price cut' ? 'danger' : 'contrast'" />
        </div>
        <div class="tp-listing-body">
            <span class="tp-price tp-price-md">{{ price.format(listing.price) }}</span>
            <h3 class="tp-h3">
                <button type="button" class="tp-stretch" @click="$emit('open')">{{ listing.title }}</button>
            </h3>
            <span class="tp-muted tp-small">{{ listing.address }}, {{ listing.area }}</span>
            <ul class="tp-facts">
                <li><Icon :icon="bed" /> {{ listing.beds }} bd</li>
                <li><Icon :icon="bath" /> {{ listing.baths }} ba</li>
                <li><Icon :icon="ruler" /> {{ listing.size }} m²</li>
            </ul>
        </div>
    </article>
</template>
