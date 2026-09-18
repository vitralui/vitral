<script setup lang="ts">
import { globe } from '@vitral/icons';
import { Button, Checkbox, Divider, InputText, Message, InputPassword } from '@vitral/vue';
import { reactive, ref, useId } from 'vue';

/**
 * The sign-in form itself, with no chrome of its own: three screens here show
 * the same form on a card, beside a panel and inside a dialog, and it would be
 * three forms drifting apart if each drew its own.
 */
const emit = defineEmits<{ signup: []; recover: [] }>();

const id = useId();
const field = (name: string) => `${id}-${name}`;
const form = reactive({ email: '', password: '', remember: true });
const state = ref<'idle' | 'working' | 'error'>('idle');

function submit() {
    // A template signs nobody in: it shows what each state looks like.
    if (!form.email || !form.password) {
        state.value = 'error';
        return;
    }
    state.value = 'working';
    setTimeout(() => (state.value = 'idle'), 1200);
}
</script>

<template>
    <form class="tp-auth-form" novalidate @submit.prevent="submit">
        <Message v-if="state === 'error'" severity="danger" :closable="false">Enter your email and your password.</Message>

        <div class="tp-field tp-span">
            <label :for="field('email')" class="tp-label">Email</label>
            <InputText :id="field('email')" v-model="form.email" type="email" autocomplete="username" placeholder="you@example.com" :invalid="state === 'error' && !form.email" fluid />
        </div>

        <div class="tp-field tp-span">
            <div class="tp-auth-label-row">
                <label :for="field('password')" class="tp-label">Password</label>
                <button type="button" class="tp-auth-link" @click="emit('recover')">Forgotten it?</button>
            </div>
            <InputPassword
                :id="field('password')"
                v-model="form.password"
                :feedback="false"
                toggle-mask
                autocomplete="current-password"
                :invalid="state === 'error' && !form.password"
                fluid
            />
        </div>

        <div class="tp-field tp-span tp-auth-remember">
            <Checkbox :input-id="field('remember')" v-model="form.remember" binary />
            <label :for="field('remember')">Keep me signed in</label>
        </div>

        <Button type="submit" label="Sign in" :loading="state === 'working'" fluid />

        <Divider align="center"><span class="tp-auth-or">or</span></Divider>

        <div class="tp-auth-providers">
            <Button label="Continue with Google" :icon="globe" severity="secondary" variant="outlined" fluid />
            <Button label="Continue with GitHub" icon="terminal" severity="secondary" variant="outlined" fluid />
        </div>

        <p class="tp-auth-alt">
            New here?
            <button type="button" class="tp-auth-link" @click="emit('signup')">Create an account</button>
        </p>
    </form>
</template>
