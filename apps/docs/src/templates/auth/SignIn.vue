<script setup lang="ts">
import { useTemplate } from '../kit/context';
import SignInForm from './SignInForm.vue';

// The plainest of the three: one card, centred, nothing else on the page. It is
// the shape to reach for when the sign-in is a door rather than a landing page.
const { go } = useTemplate();
</script>

<template>
    <div class="tp-auth-centre">
        <section class="tp-auth-card" aria-labelledby="auth-signin-title">
            <h1 id="auth-signin-title" class="tp-auth-title">Sign in</h1>
            <p class="tp-auth-sub">Welcome back to Meridian.</p>
            <SignInForm @signup="go('signup')" @recover="go('recover')" />
        </section>
    </div>
</template>
