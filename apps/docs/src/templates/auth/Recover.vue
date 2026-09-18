<script setup lang="ts">
import { Button, InputOtp, InputText, Message, InputPassword, Step, StepList, StepPanel, StepPanels, Stepper } from '@vitral/vue';
import { computed, onBeforeUnmount, reactive, ref, useId, watch } from 'vue';
import { useTemplate } from '../kit/context';

/**
 * Getting back in, as the three steps it actually is: say who you are, prove it
 * with the code that was sent, choose a new password. A stepper rather than
 * three pages, so the reader can see how much is left and nothing is lost by
 * going back one.
 */
const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;
const step = ref<string>('identify');
const form = reactive({ email: '', code: '', password: '' });
const done = ref(false);

// The resend is only offered once the wait is over, which is what the timer is for.
const seconds = ref(30);
let timer: ReturnType<typeof setInterval> | undefined;
watch(
    step,
    (value) => {
        clearInterval(timer);
        if (value !== 'verify') return;
        seconds.value = 30;
        timer = setInterval(() => {
            seconds.value -= 1;
            if (seconds.value <= 0) clearInterval(timer);
        }, 1000);
    },
    { immediate: true }
);
onBeforeUnmount(() => clearInterval(timer));

const sentTo = computed(() => form.email || 'your email');
</script>

<template>
    <div class="tp-auth-centre">
        <section class="tp-auth-card tp-auth-card-wide" aria-labelledby="auth-recover-title">
            <h1 id="auth-recover-title" class="tp-auth-title">Reset your password</h1>
            <p class="tp-auth-sub">Three steps, and you are back in.</p>

            <Stepper v-model:value="step" linear class="tp-auth-stepper">
                <StepList aria-label="Reset your password">
                    <Step value="identify">Your email</Step>
                    <Step value="verify">The code</Step>
                    <Step value="reset">A new password</Step>
                </StepList>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="identify">
                        <div class="tp-auth-form">
                            <div class="tp-field tp-span">
                                <label :for="field('email')" class="tp-label">Email</label>
                                <InputText :id="field('email')" v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" fluid />
                            </div>
                            <Button label="Send the code" :disabled="!form.email" fluid @click="activateCallback('verify')" />
                        </div>
                    </StepPanel>

                    <StepPanel v-slot="{ activateCallback }" value="verify">
                        <div class="tp-auth-form">
                            <p class="tp-auth-sent">A six-digit code is on its way to <b>{{ sentTo }}</b>.</p>
                            <div class="tp-field tp-span tp-auth-otp">
                                <span :id="field('code-label')" class="tp-label">Verification code</span>
                                <InputOtp v-model="form.code" :length="6" integer-only :aria-labelledby="field('code-label')" />
                            </div>
                            <p class="tp-auth-resend">
                                <template v-if="seconds > 0">You can ask for another in {{ seconds }}s.</template>
                                <button v-else type="button" class="tp-auth-link" @click="seconds = 30">Send another code</button>
                            </p>
                            <div class="tp-auth-steps-actions">
                                <Button label="Back" severity="secondary" variant="text" @click="activateCallback('identify')" />
                                <Button label="Verify" :disabled="form.code.length < 6" @click="activateCallback('reset')" />
                            </div>
                        </div>
                    </StepPanel>

                    <StepPanel value="reset">
                        <div class="tp-auth-form">
                            <Message v-if="done" severity="success" :closable="false">Your password has been changed. You can sign in with it now.</Message>
                            <div class="tp-field tp-span">
                                <label :for="field('new')" class="tp-label">New password</label>
                                <InputPassword :id="field('new')" v-model="form.password" toggle-mask autocomplete="new-password" fluid />
                            </div>
                            <Button v-if="!done" label="Change the password" :disabled="!form.password" fluid @click="done = true" />
                            <Button v-else label="Back to sign in" fluid @click="go('signin')" />
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>

            <p class="tp-auth-alt">
                Remembered it?
                <button type="button" class="tp-auth-link" @click="go('signin')">Sign in</button>
            </p>
        </section>
    </div>
</template>
