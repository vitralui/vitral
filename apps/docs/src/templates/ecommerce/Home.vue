<script setup lang="ts">
import { delivery, productReturn, shieldCheck } from '@vitral/icons';
import { Button, DataView, Icon, Rating, Select, SelectButton, Tag } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo, usd0 } from '../kit/format';
import { addToCart, categories, products, shop, type Product } from './data';

const { go } = useTemplate();
const ids = { products: useId(), sort: useId() };

const category = ref('all');
const categoryOptions = [{ label: 'All', value: 'all' }, ...categories.map((entry) => ({ label: entry.name, value: entry.id }))];

const sort = ref('featured');
const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: low to high', value: 'price-asc' },
    { label: 'Price: high to low', value: 'price-desc' },
    { label: 'Top rated', value: 'rating' }
];

const shown = computed(() => {
    const list = products.filter((product) => category.value === 'all' || product.category === category.value);
    if (sort.value === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort.value === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sort.value === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
    return list;
});

function open(product: Product) {
    shop.productId = product.id;
    go('product');
}

function quickAdd(product: Product) {
    addToCart({ productId: product.id, color: product.colors[0]!, size: product.sizes[0]!, quantity: 1 });
}

function browse(id: string) {
    category.value = id;
    document.getElementById(ids.products)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
}

const perks = [
    { icon: delivery, title: 'Free shipping over $150', body: 'Carbon-neutral delivery in 2–4 days.' },
    { icon: productReturn, title: '60-day returns', body: 'Changed your mind? Send it back, on us.' },
    { icon: shieldCheck, title: 'Made to last', body: 'Every piece carries a five-year guarantee.' }
];
</script>

<template>
    <section class="tp-hero" aria-labelledby="shop-hero">
        <div class="tp-wrap tp-hero-grid">
            <div class="tp-hero-copy">
                <span class="tp-eyebrow">Autumn collection</span>
                <h1 id="shop-hero">Well-made things for slower mornings</h1>
                <p class="tp-lead">Stoneware, leather and oak, made in small runs by the people whose names are on the label.</p>
                <div class="tp-actions">
                    <Button label="Shop the collection" icon="arrowRight" icon-pos="right" @click="browse('all')" />
                    <Button label="Featured: pour-over set" severity="secondary" variant="outlined" @click="open(products[0]!)" />
                </div>
            </div>
            <img class="tp-hero-media" :src="photo(625, 900, 675)" alt="A bright dining room with a wooden table and chairs" />
        </div>
    </section>

    <section class="tp-section" aria-labelledby="shop-categories">
        <div class="tp-wrap">
            <h2 id="shop-categories" class="tp-h2">Shop by room</h2>
            <ul class="tp-tiles">
                <li v-for="entry in categories" :key="entry.id">
                    <button type="button" class="tp-tile" @click="browse(entry.id)">
                        <img :src="photo(entry.photo, 480, 360)" alt="" />
                        <span>
                            <b>{{ entry.name }}</b>
                            <small>{{ entry.count }} products</small>
                        </span>
                    </button>
                </li>
            </ul>
        </div>
    </section>

    <section :id="ids.products" class="tp-section tp-section-muted" aria-labelledby="shop-products">
        <div class="tp-wrap">
            <div class="tp-head">
                <h2 id="shop-products" class="tp-h2">Bestsellers</h2>
                <div class="tp-toolbar">
                    <SelectButton v-model="category" :options="categoryOptions" option-label="label" option-value="value" :allow-empty="false" label="Category" size="small" />
                    <span :id="ids.sort" class="vt-sr-only">Sort by</span>
                    <Select v-model="sort" :options="sortOptions" option-label="label" option-value="value" size="small" :aria-labelledby="ids.sort" />
                </div>
            </div>
            <DataView :value="shown" layout="grid" data-key="id" empty-message="Nothing in this room yet.">
                <template #grid="{ items }">
                    <article v-for="product in items as Product[]" :key="product.id" class="tp-product">
                        <button type="button" class="tp-product-media" :aria-label="`View ${product.name}`" @click="open(product)">
                            <img :src="photo(product.photos[0]!, 480, 480)" alt="" />
                            <Tag v-if="product.badge" :value="product.badge" :severity="product.badge === 'Sale' ? 'danger' : 'contrast'" />
                        </button>
                        <div class="tp-product-body">
                            <h3 class="tp-h3">{{ product.name }}</h3>
                            <div class="tp-rating">
                                <Rating :model-value="Math.round(product.rating)" readonly :aria-label="`Rated ${product.rating} out of 5`" />
                                <small>{{ product.reviews }}</small>
                            </div>
                            <div class="tp-product-foot">
                                <span class="tp-price">
                                    {{ usd0.format(product.price) }}
                                    <s v-if="product.was">{{ usd0.format(product.was) }}</s>
                                </span>
                                <Button icon="plus" size="small" variant="outlined" :aria-label="`Add ${product.name} to cart`" @click="quickAdd(product)" />
                            </div>
                        </div>
                    </article>
                </template>
            </DataView>
        </div>
    </section>

    <section class="tp-section" aria-label="Why Fernhill">
        <ul class="tp-wrap tp-perks">
            <li v-for="perk in perks" :key="perk.title">
                <span class="tp-icon-badge"><Icon :icon="perk.icon" /></span>
                <span>
                    <b>{{ perk.title }}</b>
                    <small>{{ perk.body }}</small>
                </span>
            </li>
        </ul>
    </section>
</template>
