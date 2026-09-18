<script setup lang="ts">
import { calendarPlus, creditCard, shieldCheck } from '@vitral/icons';
import { Avatar, Button, Card, Divider, Icon, InputOtp, Message, Tag, Timeline } from '@vitral/vue';
import { computed, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { cityOf, dateLabel, duration, eur, flight, grandTotal, passengers, total, trip } from './data';
import FlowSteps from './FlowSteps.vue';

const { go } = useTemplate();
const codeId = useId();
const code = ref('');
const paid = ref(false);

const legs = computed(() => {
    const out = [
        { time: flight.value.depart, place: `${cityOf(trip.from).name} (${trip.from})`, note: `${dateLabel(trip.depart)} · ${flight.value.number}` },
        {
            time: flight.value.arrive,
            place: `${cityOf(trip.to).name} (${trip.to})`,
            note: `${duration(flight.value.minutes)} · ${flight.value.stops ? `via ${flight.value.via}` : 'direct'}`
        }
    ];
    return out;
});

const people = computed(() =>
    ['Alex Morgan', 'Sam Morgan', 'Robin Morgan', 'Jo Morgan', 'Kit Morgan', 'Lee Morgan']
        .slice(0, passengers.value)
        .map((name, i) => ({ name, seat: trip.seats[i] ?? 'At check-in', kind: i < trip.adults ? 'Adult' : 'Child' }))
);

const lines = computed(() => [
    { label: `Fare × ${passengers.value}${trip.kind === 'return' ? ', return' : ''}`, value: total.value.fare },
    { label: 'Taxes and fees', value: total.value.taxes },
    { label: 'Seats', value: total.value.seats },
    { label: 'Bags', value: total.value.bags },
    { label: 'Travel cover', value: total.value.insurance }
]);
</script>

<template>
    <div class="tp-wrap tp-page">
        <FlowSteps>
            <h1 class="tp-h1">Review and pay</h1>

            <Message v-if="paid" severity="success" title="You're booked — reference SKX7Q2">
                A confirmation is on its way. Check-in opens 30 hours before departure.
                <template #action><Button :icon="calendarPlus" label="Add to calendar" variant="text" size="small" /></template>
            </Message>

            <div class="tp-split">
                <div class="tp-stack">
                    <Card>
                        <template #title>
                            <div class="tp-row tp-row-between">
                                <h2 class="tp-h3">{{ cityOf(trip.from).name }} to {{ cityOf(trip.to).name }}</h2>
                                <Tag :value="trip.kind === 'return' ? 'Return' : 'One way'" severity="secondary" />
                            </div>
                        </template>
                        <Timeline :value="legs" aria-label="Outbound flight" class="tp-timeline">
                            <template #opposite="{ item }">
                                <b class="tp-num">{{ (item as (typeof legs)[number]).time }}</b>
                            </template>
                            <template #content="{ item }">
                                <div class="tp-timeline-item">
                                    <b>{{ (item as (typeof legs)[number]).place }}</b>
                                    <p class="tp-muted">{{ (item as (typeof legs)[number]).note }}</p>
                                </div>
                            </template>
                        </Timeline>
                        <p v-if="trip.kind === 'return'" class="tp-muted tp-small">Return on {{ dateLabel(trip.back) }}, same flight times in reverse.</p>
                    </Card>

                    <Card title="Travellers">
                        <ul class="tp-rule-list">
                            <li v-for="person in people" :key="person.name" class="tp-row tp-row-between">
                                <span class="tp-person">
                                    <Avatar
                                        :label="
                                            person.name
                                                .split(' ')
                                                .map((part) => part[0])
                                                .join('')
                                        "
                                        shape="circle"
                                    />
                                    <span>
                                        <b>{{ person.name }}</b>
                                        <small>{{ person.kind }}</small>
                                    </span>
                                </span>
                                <Tag :value="`Seat ${person.seat}`" severity="secondary" />
                            </li>
                        </ul>
                        <template #footer>
                            <Button label="Change seats" variant="text" size="small" @click="go('seats')" />
                        </template>
                    </Card>
                </div>

                <aside class="tp-card tp-summary" aria-labelledby="pay-title">
                    <h2 id="pay-title" class="tp-h3">Price</h2>
                    <dl class="tp-totals">
                        <div v-for="line in lines" :key="line.label">
                            <dt>{{ line.label }}</dt>
                            <dd>{{ eur.format(line.value) }}</dd>
                        </div>
                    </dl>
                    <Divider />
                    <dl class="tp-totals tp-totals-strong">
                        <div>
                            <dt>Total</dt>
                            <dd>{{ eur.format(grandTotal) }}</dd>
                        </div>
                    </dl>
                    <div class="tp-field">
                        <span :id="codeId" class="tp-label">Enter the 6-digit code we texted you</span>
                        <InputOtp v-model="code" :length="6" integer-only :aria-labelledby="codeId" :disabled="paid" />
                        <small class="tp-muted">Any six digits will do in this demo.</small>
                    </div>
                    <Button :label="paid ? 'Paid' : `Pay ${eur.format(grandTotal)}`" :icon="creditCard" :disabled="code.length < 6 || paid" fluid @click="paid = true" />
                    <p class="tp-note"><Icon :icon="shieldCheck" /> Free cancellation for 24 hours.</p>
                </aside>
            </div>
        </FlowSteps>
    </div>
</template>
