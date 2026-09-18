<script setup lang="ts">
import { coupon, shoppingBag } from '@vitral/icons';
import { Button, Divider, Icon, InputGroup, InputGroupAddon, InputNumber, InputText, Message } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo, usd } from '../kit/format';
import { productOf, shipping, shop, subtotal } from './data';

const { go } = useTemplate();
const couponId = useId();

const code = ref('');
const applied = ref<string | null>(null);
const couponError = ref(false);
const discount = computed(() => (applied.value ? Math.round(subtotal.value * 0.1 * 100) / 100 : 0));
const total = computed(() => subtotal.value - discount.value + shipping.value);

function apply() {
    const ok = code.value.trim().toUpperCase() === 'FERN10';
    couponError.value = !ok;
    applied.value = ok ? 'FERN10' : null;
}

function remove(index: number) {
    shop.cart.splice(index, 1);
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <div class="tp-head">
            <h1 class="tp-h1">Your cart</h1>
            <Button label="Keep shopping" icon="arrowLeft" variant="text" @click="go('home')" />
        </div>

        <div v-if="shop.cart.length === 0" class="tp-empty">
            <Icon :icon="shoppingBag" />
            <h2 class="tp-h2">Your cart is empty</h2>
            <p class="tp-muted">Everything you add shows up here.</p>
            <Button label="Browse the shop" @click="go('home')" />
        </div>

        <div v-else class="tp-split">
            <ul class="tp-lines" aria-label="Items in your cart">
                <li v-for="(line, index) in shop.cart" :key="`${line.productId}-${line.color}-${line.size}`" class="tp-line">
                    <img :src="photo(productOf(line.productId).photos[0]!, 200, 200)" alt="" />
                    <div class="tp-line-info">
                        <b>{{ productOf(line.productId).name }}</b>
                        <small class="tp-muted">{{ line.color }} · {{ line.size }}</small>
                        <span>{{ usd.format(productOf(line.productId).price) }}</span>
                    </div>
                    <InputNumber
                        v-model="line.quantity"
                        :min="1"
                        :max="10"
                        show-buttons
                        button-layout="horizontal"
                        :aria-label="`Quantity of ${productOf(line.productId).name}`"
                        class="tp-qty"
                        :allow-empty="false"
                    />
                    <strong class="tp-line-total">{{ usd.format(productOf(line.productId).price * line.quantity) }}</strong>
                    <Button icon="trash" variant="text" severity="secondary" :aria-label="`Remove ${productOf(line.productId).name}`" @click="remove(index)" />
                </li>
            </ul>

            <aside class="tp-card tp-summary" aria-labelledby="cart-summary">
                <h2 id="cart-summary" class="tp-h3">Order summary</h2>
                <div class="tp-field">
                    <label :for="couponId" class="tp-label">Coupon</label>
                    <InputGroup>
                        <InputGroupAddon><Icon :icon="coupon" /></InputGroupAddon>
                        <InputText :id="couponId" v-model="code" placeholder="Try FERN10" :invalid="couponError" />
                        <Button label="Apply" severity="secondary" @click="apply" />
                    </InputGroup>
                    <small v-if="couponError" class="tp-error">That code is not valid.</small>
                </div>
                <dl class="tp-totals">
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{{ usd.format(subtotal) }}</dd>
                    </div>
                    <div v-if="applied">
                        <dt>Discount ({{ applied }})</dt>
                        <dd>−{{ usd.format(discount) }}</dd>
                    </div>
                    <div>
                        <dt>Shipping</dt>
                        <dd>{{ shipping === 0 ? 'Free' : usd.format(shipping) }}</dd>
                    </div>
                </dl>
                <Divider />
                <dl class="tp-totals tp-totals-strong">
                    <div>
                        <dt>Total</dt>
                        <dd>{{ usd.format(total) }}</dd>
                    </div>
                </dl>
                <Message v-if="shipping > 0" severity="info" variant="subtle">Add {{ usd.format(150 - subtotal) }} more for free shipping.</Message>
                <Button label="Checkout" icon="arrowRight" icon-pos="right" size="large" fluid @click="go('checkout')" />
            </aside>
        </div>
    </div>
</template>
