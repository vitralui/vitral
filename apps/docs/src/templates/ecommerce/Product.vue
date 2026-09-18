<script setup lang="ts">
import { cartPlus, delivery } from '@vitral/icons';
import { Avatar, Breadcrumb, Button, Carousel, Galleria, Icon, InputNumber, Message, Rating, SelectButton, Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { useTemplate } from '../kit/context';
import { photo, usd, usd0 } from '../kit/format';
import { addToCart, categories, productOf, products, reviews, shop, type Product } from './data';

const { go, narrow } = useTemplate();
const ids = { color: useId(), size: useId(), quantity: useId() };

const product = computed(() => productOf(shop.productId));
const category = computed(() => categories.find((entry) => entry.id === product.value.category));

const active = ref(0);
const color = ref('');
const size = ref('');
const quantity = ref(1);
const added = ref(false);
const tab = ref('description');

watch(
    product,
    (current) => {
        active.value = 0;
        color.value = current.colors[0]!;
        size.value = current.sizes[0]!;
        quantity.value = 1;
        added.value = false;
    },
    { immediate: true }
);

const trail = computed(() => [{ label: 'Shop', command: () => go('home') }, { label: category.value?.name ?? 'All', command: () => go('home') }, { label: product.value.name }]);

const related = computed(() => products.filter((entry) => entry.id !== product.value.id));

function add() {
    addToCart({ productId: product.value.id, color: color.value, size: size.value, quantity: quantity.value ?? 1 });
    added.value = true;
}

function open(next: Product) {
    shop.productId = next.id;
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <Breadcrumb :model="trail" aria-label="You are here" />

        <section class="tp-split tp-split-even" aria-labelledby="product-name">
            <Galleria
                v-model:active-index="active"
                :value="product.photos"
                :num-visible="4"
                show-item-navigators
                circular
                :aria-label="`Photos of ${product.name}`"
                class="tp-gallery"
            >
                <template #item="{ item, index }">
                    <img :src="photo(item as number, 900, 900)" :alt="`${product.name}, photo ${index + 1}`" class="tp-gallery-image" />
                </template>
                <template #thumbnail="{ item }">
                    <img :src="photo(item as number, 160, 160)" alt="" class="tp-gallery-thumb" />
                </template>
            </Galleria>

            <div class="tp-stack">
                <div>
                    <Tag v-if="product.badge" :value="product.badge" :severity="product.badge === 'Sale' ? 'danger' : 'contrast'" />
                    <h1 id="product-name" class="tp-h1">{{ product.name }}</h1>
                    <div class="tp-rating">
                        <Rating :model-value="Math.round(product.rating)" readonly :aria-label="`Rated ${product.rating} out of 5`" />
                        <small>{{ product.rating }} · {{ product.reviews }} reviews</small>
                    </div>
                </div>
                <p class="tp-price tp-price-lg">
                    {{ usd0.format(product.price) }}
                    <s v-if="product.was">{{ usd0.format(product.was) }}</s>
                </p>
                <p class="tp-muted">{{ product.blurb }}</p>

                <div class="tp-field">
                    <span :id="ids.color" class="tp-label"
                        >Colour: <b>{{ color }}</b></span
                    >
                    <SelectButton v-model="color" :options="product.colors" :allow-empty="false" :aria-labelledby="ids.color" />
                </div>
                <div class="tp-field">
                    <span :id="ids.size" class="tp-label">Size</span>
                    <SelectButton v-model="size" :options="product.sizes" :allow-empty="false" :aria-labelledby="ids.size" />
                </div>
                <div class="tp-buy">
                    <div class="tp-field">
                        <label :for="ids.quantity" class="tp-label">Quantity</label>
                        <InputNumber v-model="quantity" :id="ids.quantity" :min="1" :max="10" show-buttons button-layout="horizontal" class="tp-qty" />
                    </div>
                    <Button :label="`Add to cart · ${usd.format(product.price * (quantity ?? 1))}`" :icon="cartPlus" size="large" @click="add" />
                </div>
                <Message v-if="added" severity="success" variant="subtle">
                    Added to your cart.
                    <template #action><Button label="View cart" variant="text" size="small" @click="go('cart')" /></template>
                </Message>
                <p class="tp-note"><Icon :icon="delivery" /> Ships in 2–4 days. Free over $150.</p>
            </div>
        </section>

        <Tabs v-model:value="tab" class="tp-tabs">
            <TabList aria-label="About this product">
                <Tab value="description">Description</Tab>
                <Tab value="details">Materials &amp; care</Tab>
                <Tab value="reviews">Reviews ({{ product.reviews }})</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="description">
                    <p class="tp-prose">
                        {{ product.blurb }} Each piece is made in a workshop we have visited, in runs of a few hundred, so colours can vary slightly from one batch to the next.
                    </p>
                </TabPanel>
                <TabPanel value="details">
                    <dl class="tp-specs">
                        <div>
                            <dt>Made in</dt>
                            <dd>Portugal</dd>
                        </div>
                        <div>
                            <dt>Colours</dt>
                            <dd>{{ product.colors.join(', ') }}</dd>
                        </div>
                        <div>
                            <dt>Sizes</dt>
                            <dd>{{ product.sizes.join(', ') }}</dd>
                        </div>
                        <div>
                            <dt>Care</dt>
                            <dd>Gentle wash, dry flat, no bleach.</dd>
                        </div>
                    </dl>
                </TabPanel>
                <TabPanel value="reviews">
                    <ul class="tp-reviews">
                        <li v-for="review in reviews" :key="review.name">
                            <Avatar :label="review.initials" shape="circle" />
                            <div>
                                <div class="tp-review-head">
                                    <b>{{ review.name }}</b>
                                    <Rating :model-value="review.rating" readonly :aria-label="`${review.rating} out of 5`" />
                                    <small class="tp-muted">{{ review.when }}</small>
                                </div>
                                <p>{{ review.text }}</p>
                            </div>
                        </li>
                    </ul>
                </TabPanel>
            </TabPanels>
        </Tabs>

        <section aria-labelledby="product-related">
            <h2 id="product-related" class="tp-h2">You may also like</h2>
            <Carousel :value="related" :num-visible="narrow ? 2 : 4" :num-scroll="1" :show-indicators="false" aria-label="Related products" class="tp-carousel">
                <template #item="{ data }">
                    <button type="button" class="tp-mini-product" @click="open(data as Product)">
                        <img :src="photo((data as Product).photos[0]!, 360, 360)" alt="" />
                        <b>{{ (data as Product).name }}</b>
                        <span>{{ usd0.format((data as Product).price) }}</span>
                    </button>
                </template>
            </Carousel>
        </section>
    </div>
</template>
