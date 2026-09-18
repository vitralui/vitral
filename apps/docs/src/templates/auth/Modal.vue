<script setup lang="ts">
import { Button, Dialog, Icon, Tag } from '@vitral/vue';
import { shieldCheck, zap } from '@vitral/icons';
import { ref } from 'vue';
import { useTemplate } from '../kit/context';
import SignInForm from './SignInForm.vue';

/**
 * Signing in without leaving the page. The dialog is the same form the other
 * screens use, so what the reader types survives being interrupted and the page
 * behind keeps its scroll position — the reason to do it this way rather than
 * routing to a sign-in page and back.
 */
const { go } = useTemplate();
// Open on arrival: the dialog is what this screen is, and a reader who lands on
// a landing page has to guess which button to press to see it. Closing it
// leaves the page behind, and every call to action opens it again.
const open = ref(true);

const plans = [
    { name: 'Starter', price: '$0', note: 'One project, community support', cta: 'Start free' },
    { name: 'Team', price: '$24', note: 'Per seat. Unlimited projects, SSO', cta: 'Choose Team', featured: true },
    { name: 'Enterprise', price: 'Talk to us', note: 'Audit logs, SLA, a named engineer', cta: 'Contact sales' }
];
</script>

<template>
    <div class="tp-auth-page">
        <header class="tp-auth-hero">
            <Tag value="New: audit logs" severity="info" />
            <h1 class="tp-auth-hero-title">The operations layer your spreadsheets were standing in for</h1>
            <p>Meridian keeps the work, the numbers and the people who need them in one place. Sign in to pick up where you left off.</p>
            <div class="tp-auth-hero-actions">
                <Button label="Sign in" @click="open = true" />
                <Button label="Create an account" severity="secondary" variant="outlined" @click="go('signup')" />
            </div>
            <ul class="tp-auth-hero-points">
                <li><Icon :icon="zap" /> Set up in an afternoon</li>
                <li><Icon :icon="shieldCheck" /> SOC 2 Type II</li>
            </ul>
        </header>

        <section class="tp-auth-plans" aria-label="Plans">
            <article v-for="plan in plans" :key="plan.name" class="tp-auth-plan" :class="{ 'tp-auth-plan-on': plan.featured }">
                <h2>{{ plan.name }}</h2>
                <p class="tp-auth-plan-price">{{ plan.price }}</p>
                <p class="tp-auth-plan-note">{{ plan.note }}</p>
                <Button :label="plan.cta" :severity="plan.featured ? 'primary' : 'secondary'" :variant="plan.featured ? undefined : 'outlined'" fluid @click="open = true" />
            </article>
        </section>

        <!--
            The form is the same component the other two screens render. A dialog
            that reimplemented it would be a second form to keep in step, and the
            one that gets forgotten is always the one behind the button.
        -->
        <Dialog v-model:visible="open" modal header="Sign in" :style="{ width: '26rem' }">
            <SignInForm @signup="((open = false), go('signup'))" @recover="((open = false), go('recover'))" />
        </Dialog>
    </div>
</template>
