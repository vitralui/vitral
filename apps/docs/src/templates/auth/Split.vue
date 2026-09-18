<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { quote } from '@vitral/icons';
import { useTemplate } from '../kit/context';
import SignInForm from './SignInForm.vue';

/**
 * The same form beside a panel that carries the brand. The panel is the first
 * thing to go at phone width: it is decoration, and the form is the page.
 */
const { go, narrow } = useTemplate();
</script>

<template>
    <div class="tp-auth-split">
        <aside v-if="!narrow" class="tp-auth-aside">
            <div class="tp-auth-aside-body">
                <Icon :icon="quote" :size="32" />
                <blockquote>
                    <p>We replaced four dashboards and a spreadsheet with Meridian in a fortnight. The part I did not expect was how much quieter the week got.</p>
                    <footer>Ana Cardoso — Head of Operations, Vantage Freight</footer>
                </blockquote>
            </div>
            <ul class="tp-auth-aside-list">
                <li>SOC 2 Type II</li>
                <li>SSO and SCIM</li>
                <li>99.98% uptime</li>
            </ul>
        </aside>

        <section class="tp-auth-pane" aria-labelledby="auth-split-title">
            <h1 id="auth-split-title" class="tp-auth-title">Sign in</h1>
            <p class="tp-auth-sub">Use your work account.</p>
            <SignInForm @signup="go('signup')" @recover="go('recover')" />
        </section>
    </div>
</template>
