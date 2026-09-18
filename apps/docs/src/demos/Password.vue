<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Password',
    category: 'Form',
    description:
        'A password box with a reveal button and a strength meter. The meter opens while the box has focus; its grade is a polite live region that describes the box, so it is heard as it changes. The reveal button is a real button whose name says what it will do. Exported twice, as `Password` and as `InputPassword` — the second is the name that lines up with `InputText`, `InputNumber` and `InputTag`, and they are the same component.'
};
</script>

<script setup lang="ts">
import { Password } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const basic = ref('');
const revealed = ref('');
const custom = ref('');
</script>

<template>
    <DemoSection title="Strength meter">
        <div class="demo-field">
            <label for="pw-basic">Password</label>
            <Password id="pw-basic" v-model="basic" autocomplete="new-password" />
        </div>
    </DemoSection>
    <DemoSection title="Reveal and clear">
        <div class="demo-field">
            <label for="pw-reveal">Password</label>
            <Password id="pw-reveal" v-model="revealed" toggle-mask clearable :feedback="false" autocomplete="current-password" />
        </div>
    </DemoSection>
    <DemoSection title="Rules in the footer">
        <div class="demo-field">
            <label for="pw-rules">New password</label>
            <Password id="pw-rules" v-model="custom" toggle-mask prompt-label="Choose a password" strong-regex="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{12,})">
                <template #footer>
                    <ul style="margin: 0; padding-inline-start: 1.25rem; font-size: 0.8125rem">
                        <li>One lowercase and one uppercase letter</li>
                        <li>At least one digit</li>
                        <li>Twelve characters for a strong password</li>
                    </ul>
                </template>
            </Password>
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <Password size="small" aria-label="Small" :feedback="false" />
        <Password variant="filled" aria-label="Filled" :feedback="false" />
        <Password invalid aria-label="Invalid" :feedback="false" />
        <Password disabled aria-label="Disabled" model-value="secret" />
    </DemoSection>
</template>
