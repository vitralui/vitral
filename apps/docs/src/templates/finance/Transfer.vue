<script setup lang="ts">
import { lockKeyhole, transfer as transferIcon } from '@vitral/icons';
import { Button, Checkbox, DatePicker, Icon, InputNumber, InputOtp, InputText, Listbox, Message, Select, Step, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { computed, reactive, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';
import { accounts, money, payeeBook, transactions } from './data';

const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;

const step = ref('details');
const done = ref(false);
const code = ref('');

const form = reactive({
    from: 'chk',
    to: payeeBook[0]!.name,
    amount: 250 as number | null,
    date: new Date() as Date | null,
    memo: 'Dinner, thanks!',
    repeat: false
});

const fromOptions = computed(() =>
    accounts
        .filter((account) => account.kind !== 'Credit card')
        .map((account) => ({ label: `${account.name} ${account.number} · ${money.format(account.balance)}`, value: account.id }))
);
const source = computed(() => accounts.find((account) => account.id === form.from)!);
const payee = computed(() => payeeBook.find((entry) => entry.name === form.to)!);
const tooMuch = computed(() => (form.amount ?? 0) > source.value.balance);
const valid = computed(() => !!form.amount && form.amount > 0 && !tooMuch.value && !!form.date);

function send() {
    source.value.balance -= form.amount ?? 0;
    transactions.unshift({
        id: Date.now(),
        date: form.date ?? new Date(),
        payee: `To ${payee.value.name}`,
        category: 'Transfer',
        account: source.value.name,
        amount: -(form.amount ?? 0),
        status: 'Pending'
    });
    done.value = true;
}

function again() {
    done.value = false;
    code.value = '';
    step.value = 'details';
}
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Move money</h1>
            <p class="tp-muted">Between your accounts or to someone you pay.</p>
        </div>
    </div>

    <div class="tp-transfer">
        <div v-if="done" class="tp-card tp-stack tp-transfer-done">
            <Message severity="success" :title="`${money.format(form.amount ?? 0)} is on its way to ${payee.name}`">
                It will arrive
                {{
                    form.date?.toDateString() === new Date().toDateString() ? 'within minutes' : `on ${form.date?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                }}. Reference HB-{{ String(form.amount).padStart(4, '0') }}-77.
            </Message>
            <div class="tp-row">
                <Button label="View transactions" @click="go('transactions')" />
                <Button label="Make another transfer" severity="secondary" variant="outlined" @click="again" />
            </div>
        </div>

        <Stepper v-else v-model:value="step" linear class="tp-card">
            <StepList aria-label="Transfer steps">
                <Step value="details">Details</Step>
                <Step value="review" :disabled="!valid">Review</Step>
                <Step value="confirm" :disabled="!valid">Confirm</Step>
            </StepList>
            <StepPanels>
                <StepPanel v-slot="{ activateCallback }" value="details">
                    <div class="tp-form">
                        <div class="tp-field tp-span">
                            <span :id="field('from')" class="tp-label">From</span>
                            <Select v-model="form.from" :options="fromOptions" option-label="label" option-value="value" :aria-labelledby="field('from')" fluid />
                        </div>
                        <div class="tp-field tp-span">
                            <span :id="field('to')" class="tp-label">To</span>
                            <Listbox v-model="form.to" :options="payeeBook" option-label="name" option-value="name" :aria-labelledby="field('to')" class="tp-payees">
                                <template #option="{ option }">
                                    <span class="tp-person">
                                        <span>
                                            <b>{{ (option as (typeof payeeBook)[number]).name }}</b>
                                            <small>{{ (option as (typeof payeeBook)[number]).bank }} · {{ (option as (typeof payeeBook)[number]).account }}</small>
                                        </span>
                                    </span>
                                </template>
                            </Listbox>
                        </div>
                        <div class="tp-field">
                            <label :for="field('amount')" class="tp-label">Amount</label>
                            <InputNumber :id="field('amount')" v-model="form.amount" mode="currency" currency="USD" locale="en-US" :min="0" :invalid="tooMuch" fluid />
                            <small v-if="tooMuch" class="tp-error">More than the {{ money.format(source.balance) }} available.</small>
                        </div>
                        <div class="tp-field">
                            <label :for="field('date')" class="tp-label">Send on</label>
                            <DatePicker :id="field('date')" v-model="form.date" :min-date="new Date()" fluid />
                        </div>
                        <div class="tp-field tp-span">
                            <label :for="field('memo')" class="tp-label">Note for the recipient</label>
                            <InputText :id="field('memo')" v-model="form.memo" maxlength="60" fluid />
                        </div>
                        <Checkbox v-model="form.repeat" binary label="Repeat every month" class="tp-span" />
                    </div>
                    <div class="tp-step-actions">
                        <span />
                        <Button label="Review" icon="arrowRight" icon-pos="right" :disabled="!valid" @click="activateCallback('review')" />
                    </div>
                </StepPanel>

                <StepPanel v-slot="{ activateCallback }" value="review">
                    <div class="tp-transfer-amount">
                        <Icon :icon="transferIcon" />
                        <strong>{{ money.format(form.amount ?? 0) }}</strong>
                    </div>
                    <dl class="tp-specs">
                        <div>
                            <dt>From</dt>
                            <dd>{{ source.name }} {{ source.number }}</dd>
                        </div>
                        <div>
                            <dt>To</dt>
                            <dd>{{ payee.name }} · {{ payee.bank }} {{ payee.account }}</dd>
                        </div>
                        <div>
                            <dt>When</dt>
                            <dd>{{ form.date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}{{ form.repeat ? ', then monthly' : '' }}</dd>
                        </div>
                        <div>
                            <dt>Note</dt>
                            <dd>{{ form.memo || '—' }}</dd>
                        </div>
                        <div>
                            <dt>Fee</dt>
                            <dd>Free</dd>
                        </div>
                    </dl>
                    <div class="tp-step-actions">
                        <Button label="Edit" severity="secondary" variant="text" @click="activateCallback('details')" />
                        <Button label="Continue" icon="arrowRight" icon-pos="right" @click="activateCallback('confirm')" />
                    </div>
                </StepPanel>

                <StepPanel v-slot="{ activateCallback }" value="confirm">
                    <div class="tp-stack tp-otp">
                        <span class="tp-icon-badge"><Icon :icon="lockKeyhole" /></span>
                        <span :id="field('code')" class="tp-label">Enter the code we sent to your phone ending 21</span>
                        <InputOtp v-model="code" :length="6" integer-only mask :aria-labelledby="field('code')" />
                        <small class="tp-muted">Any six digits work in this demo.</small>
                    </div>
                    <div class="tp-step-actions">
                        <Button label="Back" severity="secondary" variant="text" @click="activateCallback('review')" />
                        <Button :label="`Send ${money.format(form.amount ?? 0)}`" icon="check" :disabled="code.length < 6" @click="send" />
                    </div>
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>
</template>
