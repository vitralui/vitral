<script setup lang="ts">
import { globe } from '@vitral/icons';
import { Button, Checkbox, Divider, InputText, Message, InputPassword } from '@vitral/vue';
import { reactive, ref, useId } from 'vue';
import { useTemplate } from '../kit/context';

/**
 * Creating an account, which is the sign-in form plus the two things that make
 * it a different screen: a password the reader is choosing rather than
 * recalling, so the strength meter earns its place, and a consent that has to
 * be given rather than assumed.
 */
const { go } = useTemplate();
const id = useId();
const field = (name: string) => `${id}-${name}`;
const form = reactive({ name: '', email: '', password: '', terms: false });
const submitted = ref(false);

const missing = (value: unknown) => submitted.value && !value;

function submit() {
    submitted.value = true;
}
</script>

<template>
    <div class="tp-auth-centre">
        <section class="tp-auth-card" aria-labelledby="auth-signup-title">
            <h1 id="auth-signup-title" class="tp-auth-title">Create an account</h1>
            <p class="tp-auth-sub">Fourteen days, no card.</p>

            <form class="tp-auth-form" novalidate @submit.prevent="submit">
                <Message v-if="submitted && !form.terms" severity="warn" :closable="false">You have to accept the terms to continue.</Message>

                <div class="tp-field tp-span">
                    <label :for="field('name')" class="tp-label">Full name</label>
                    <InputText :id="field('name')" v-model="form.name" autocomplete="name" :invalid="missing(form.name)" fluid />
                </div>

                <div class="tp-field tp-span">
                    <label :for="field('email')" class="tp-label">Work email</label>
                    <InputText :id="field('email')" v-model="form.email" type="email" autocomplete="email" :invalid="missing(form.email)" fluid />
                </div>

                <div class="tp-field tp-span">
                    <label :for="field('password')" class="tp-label">Password</label>
                    <InputPassword :id="field('password')" v-model="form.password" toggle-mask autocomplete="new-password" :invalid="missing(form.password)" fluid>
                        <template #footer>
                            <ul class="tp-auth-rules">
                                <li>At least eight characters</li>
                                <li>A number and a capital</li>
                            </ul>
                        </template>
                    </InputPassword>
                </div>

                <div class="tp-field tp-span tp-auth-remember">
                    <Checkbox :input-id="field('terms')" v-model="form.terms" binary :invalid="submitted && !form.terms" />
                    <label :for="field('terms')">I accept the <a href="#">terms</a> and the <a href="#">privacy notice</a></label>
                </div>

                <Button type="submit" label="Create the account" fluid />

                <Divider align="center"><span class="tp-auth-or">or</span></Divider>

                <div class="tp-auth-providers">
                    <Button label="Sign up with Google" :icon="globe" severity="secondary" variant="outlined" fluid />
                    <Button label="Sign up with GitHub" icon="terminal" severity="secondary" variant="outlined" fluid />
                </div>

                <p class="tp-auth-alt">
                    Already have one?
                    <button type="button" class="tp-auth-link" @click="go('signin')">Sign in</button>
                </p>
            </form>
        </section>
    </div>
</template>
