<script setup lang="ts">
import { armchair, backpack, umbrella } from '@vitral/icons';
import { Button, Icon, InputNumber, Message, ToggleSwitch } from '@vitral/vue';
import { computed, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { eur, extras, flight, passengers, trip } from './data';
import FlowSteps from './FlowSteps.vue';

const { go } = useTemplate();
const bagsId = useId();

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
const rows = Array.from({ length: 18 }, (_, i) => i + 1);
// A fixed pattern of seats other travellers already hold.
const taken = new Set(['1A', '1B', '2F', '3C', '3D', '4A', '6B', '6C', '7E', '8A', '8F', '9D', '10B', '11C', '11D', '12A', '13F', '15B', '15E', '16A', '16C', '17D', '18F']);

const kind = (letter: string) => (letter === 'A' || letter === 'F' ? 'window' : letter === 'C' || letter === 'D' ? 'aisle' : 'middle');
const premium = (row: number) => row <= 5;

function toggle(seat: string) {
    if (trip.seats.includes(seat)) trip.seats = trip.seats.filter((entry) => entry !== seat);
    else trip.seats = [...trip.seats, seat].slice(-passengers.value);
}

const missing = computed(() => Math.max(0, passengers.value - trip.seats.length));
</script>

<template>
    <div class="tp-wrap tp-page">
        <FlowSteps>
            <header class="tp-head">
                <div>
                    <h1 class="tp-h1">Choose your seats</h1>
                    <p class="tp-muted">{{ flight.number }} · {{ flight.aircraft }} · pick {{ passengers }} seat{{ passengers === 1 ? '' : 's' }}</p>
                </div>
            </header>

            <div class="tp-split">
                <section class="tp-card tp-cabin" aria-labelledby="seat-map-title">
                    <h2 id="seat-map-title" class="vt-sr-only">Seat map</h2>
                    <ul class="tp-legend" aria-label="Legend">
                        <li><span class="tp-seat tp-seat-sample" aria-hidden="true" /> Free</li>
                        <li><span class="tp-seat tp-seat-sample is-premium" aria-hidden="true" /> Extra legroom +€24</li>
                        <li><span class="tp-seat tp-seat-sample is-on" aria-hidden="true" /> Yours</li>
                        <li><span class="tp-seat tp-seat-sample is-taken" aria-hidden="true" /> Taken</li>
                    </ul>
                    <div class="tp-seat-head" aria-hidden="true">
                        <span />
                        <span v-for="letter in letters" :key="letter">{{ letter }}</span>
                    </div>
                    <div class="tp-seat-map">
                        <div v-for="row in rows" :key="row" class="tp-seat-row" role="group" :aria-label="`Row ${row}`">
                            <span class="tp-seat-num" aria-hidden="true">{{ row }}</span>
                            <button
                                v-for="letter in letters"
                                :key="letter"
                                type="button"
                                class="tp-seat"
                                :class="{ 'is-premium': premium(row), 'is-on': trip.seats.includes(`${row}${letter}`), 'is-taken': taken.has(`${row}${letter}`) }"
                                :disabled="taken.has(`${row}${letter}`)"
                                :aria-pressed="trip.seats.includes(`${row}${letter}`)"
                                :aria-label="`Seat ${row}${letter}, ${kind(letter)}${premium(row) ? ', extra legroom' : ''}${taken.has(`${row}${letter}`) ? ', taken' : ''}`"
                                @click="toggle(`${row}${letter}`)"
                            >
                                {{ trip.seats.includes(`${row}${letter}`) ? letter : '' }}
                            </button>
                        </div>
                    </div>
                </section>

                <aside class="tp-stack tp-sticky" aria-label="Your selection">
                    <section class="tp-card tp-stack" aria-labelledby="seat-yours">
                        <h2 id="seat-yours" class="tp-h3"><Icon :icon="armchair" /> Your seats</h2>
                        <div class="tp-row">
                            <span v-for="seat in trip.seats" :key="seat" class="tp-seat-chip">{{ seat }}</span>
                            <span v-if="!trip.seats.length" class="tp-muted">None yet</span>
                        </div>
                        <Message v-if="missing" severity="info" variant="simple">Pick {{ missing }} more, or we’ll assign them at check-in.</Message>
                    </section>

                    <section class="tp-card tp-stack" aria-labelledby="seat-extras">
                        <h2 id="seat-extras" class="tp-h3">Extras</h2>
                        <div class="tp-row tp-row-between">
                            <label :for="bagsId" class="tp-row"><Icon :icon="backpack" /> Checked bags <small class="tp-muted">€35 each</small></label>
                            <InputNumber :id="bagsId" v-model="trip.bags" :min="0" :max="6" show-buttons button-layout="horizontal" :allow-empty="false" class="tp-qty tp-qty-sm" />
                        </div>
                        <div class="tp-row tp-row-between">
                            <span class="tp-row"><Icon :icon="umbrella" /> Travel cover</span>
                            <ToggleSwitch v-model="trip.insurance" aria-label="Add travel cover, €12 per person" />
                        </div>
                        <dl class="tp-totals">
                            <div>
                                <dt>Seats</dt>
                                <dd>{{ extras.seats ? eur.format(extras.seats) : 'Included' }}</dd>
                            </div>
                            <div>
                                <dt>Bags</dt>
                                <dd>{{ eur.format(extras.bags) }}</dd>
                            </div>
                            <div>
                                <dt>Cover</dt>
                                <dd>{{ eur.format(extras.insurance) }}</dd>
                            </div>
                        </dl>
                        <Button label="Continue to review" icon="arrowRight" icon-pos="right" fluid @click="go('summary')" />
                    </section>
                </aside>
            </div>
        </FlowSteps>
    </div>
</template>
