<script setup lang="ts">
import { creditCard, lock } from '@vitral/icons';
import { Button, Checkbox, Icon, InputMask, InputText, Message, RadioButton, Select, Step, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { computed, reactive, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { photo, usd } from '../kit/format';
import { productOf, shipping, shop, subtotal } from './data';

const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const step = ref('shipping');
const placed = ref(false);

const form = reactive({
    name: 'Rowan Ellery',
    email: 'rowan@example.com',
    address: '14 Alder Lane',
    city: 'Brookhaven',
    zip: '04102',
    country: 'US',
    method: 'standard',
    card: '',
    expiry: '',
    cvc: '',
    save: true
});

const countries = [
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' },
    { label: 'Portugal', value: 'PT' },
    { label: 'Brazil', value: 'BR' }
];

const methods = [
    { value: 'standard', label: 'Standard', note: '2–4 business days', price: 0 },
    { value: 'express', label: 'Express', note: 'Next business day', price: 18 }
];

const delivery = computed(() => (form.method === 'express' ? 18 : shipping.value));
const total = computed(() => subtotal.value + delivery.value);
const shippingValid = computed(() => !!(form.name && form.email.includes('@') && form.address && form.city && form.zip));
const paymentValid = computed(() => form.card.replace(/\D/g, '').length === 16 && form.expiry.replace(/\D/g, '').length === 4 && form.cvc.replace(/\D/g, '').length === 3);

function place() {
    placed.value = true;
}
</script>

<template>
    <div class="tp-wrap tp-page">
        <h1 class="tp-h1">Checkout</h1>

        <div v-if="placed" class="tp-empty">
            <Message severity="success" title="Order FH-20418 is confirmed">We sent a receipt to {{ form.email }}. It ships in 2–4 days.</Message>
            <Button label="Back to the shop" @click="go('home')" />
        </div>

        <div v-else class="tp-split">
            <Stepper v-model:value="step" linear class="tp-card">
                <StepList aria-label="Checkout steps">
                    <Step value="shipping">Shipping</Step>
                    <Step value="payment" :disabled="!shippingValid">Payment</Step>
                    <Step value="review" :disabled="!shippingValid || !paymentValid">Review</Step>
                </StepList>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="shipping">
                        <div class="tp-form">
                            <div class="tp-field tp-span">
                                <label :for="field('name')" class="tp-label">Full name</label>
                                <InputText :id="field('name')" v-model="form.name" autocomplete="name" fluid />
                            </div>
                            <div class="tp-field tp-span">
                                <label :for="field('email')" class="tp-label">Email</label>
                                <InputText :id="field('email')" v-model="form.email" type="email" autocomplete="email" fluid />
                            </div>
                            <div class="tp-field tp-span">
                                <label :for="field('address')" class="tp-label">Address</label>
                                <InputText :id="field('address')" v-model="form.address" autocomplete="street-address" fluid />
                            </div>
                            <div class="tp-field">
                                <label :for="field('city')" class="tp-label">City</label>
                                <InputText :id="field('city')" v-model="form.city" fluid />
                            </div>
                            <div class="tp-field">
                                <label :for="field('zip')" class="tp-label">Postal code</label>
                                <InputText :id="field('zip')" v-model="form.zip" fluid />
                            </div>
                            <div class="tp-field tp-span">
                                <span :id="field('country')" class="tp-label">Country</span>
                                <Select v-model="form.country" :options="countries" option-label="label" option-value="value" :aria-labelledby="field('country')" fluid />
                            </div>
                            <fieldset class="tp-field tp-span tp-fieldset">
                                <legend class="tp-label">Delivery</legend>
                                <label v-for="method in methods" :key="method.value" class="tp-choice" :class="{ on: form.method === method.value }">
                                    <RadioButton v-model="form.method" :value="method.value" :name="field('method')" />
                                    <span>
                                        <b>{{ method.label }}</b>
                                        <small class="tp-muted">{{ method.note }}</small>
                                    </span>
                                    <strong>{{ method.price ? usd.format(method.price) : 'Free' }}</strong>
                                </label>
                            </fieldset>
                        </div>
                        <div class="tp-step-actions">
                            <Button label="Back to cart" severity="secondary" variant="text" @click="go('cart')" />
                            <Button label="Continue to payment" icon="arrowRight" icon-pos="right" :disabled="!shippingValid" @click="activateCallback('payment')" />
                        </div>
                    </StepPanel>

                    <StepPanel v-slot="{ activateCallback }" value="payment">
                        <div class="tp-form">
                            <div class="tp-field tp-span">
                                <label :for="field('card')" class="tp-label">Card number</label>
                                <InputMask :id="field('card')" v-model="form.card" mask="9999 9999 9999 9999" placeholder="4242 4242 4242 4242" autocomplete="cc-number" fluid />
                            </div>
                            <div class="tp-field">
                                <label :for="field('expiry')" class="tp-label">Expiry</label>
                                <InputMask :id="field('expiry')" v-model="form.expiry" mask="99/99" placeholder="MM/YY" autocomplete="cc-exp" fluid />
                            </div>
                            <div class="tp-field">
                                <label :for="field('cvc')" class="tp-label">CVC</label>
                                <InputMask :id="field('cvc')" v-model="form.cvc" mask="999" placeholder="123" autocomplete="cc-csc" fluid />
                            </div>
                            <Checkbox v-model="form.save" binary label="Save this card for next time" class="tp-span" />
                        </div>
                        <p class="tp-note"><Icon :icon="lock" /> Payments are encrypted. This is a demo — nothing is charged.</p>
                        <div class="tp-step-actions">
                            <Button label="Back" severity="secondary" variant="text" @click="activateCallback('shipping')" />
                            <Button label="Review order" icon="arrowRight" icon-pos="right" :disabled="!paymentValid" @click="activateCallback('review')" />
                        </div>
                    </StepPanel>

                    <StepPanel v-slot="{ activateCallback }" value="review">
                        <dl class="tp-specs">
                            <div>
                                <dt>Ship to</dt>
                                <dd>{{ form.name }}, {{ form.address }}, {{ form.city }} {{ form.zip }}</dd>
                            </div>
                            <div>
                                <dt>Delivery</dt>
                                <dd>{{ methods.find((m) => m.value === form.method)?.label }}</dd>
                            </div>
                            <div>
                                <dt>Payment</dt>
                                <dd><Icon :icon="creditCard" /> Card ending {{ form.card.slice(-4) }}</dd>
                            </div>
                        </dl>
                        <div class="tp-step-actions">
                            <Button label="Back" severity="secondary" variant="text" @click="activateCallback('payment')" />
                            <Button :label="`Place order · ${usd.format(total)}`" icon="check" @click="place" />
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>

            <aside class="tp-card tp-summary" aria-labelledby="checkout-summary">
                <h2 id="checkout-summary" class="tp-h3">In your order</h2>
                <ul class="tp-mini-lines">
                    <li v-for="line in shop.cart" :key="`${line.productId}-${line.color}-${line.size}`">
                        <img :src="photo(productOf(line.productId).photos[0]!, 120, 120)" alt="" />
                        <span>
                            <b>{{ productOf(line.productId).name }}</b>
                            <small class="tp-muted">{{ line.quantity }} × {{ usd.format(productOf(line.productId).price) }}</small>
                        </span>
                    </li>
                </ul>
                <dl class="tp-totals">
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{{ usd.format(subtotal) }}</dd>
                    </div>
                    <div>
                        <dt>Delivery</dt>
                        <dd>{{ delivery ? usd.format(delivery) : 'Free' }}</dd>
                    </div>
                </dl>
                <dl class="tp-totals tp-totals-strong">
                    <div>
                        <dt>Total</dt>
                        <dd>{{ usd.format(total) }}</dd>
                    </div>
                </dl>
            </aside>
        </div>
    </div>
</template>
