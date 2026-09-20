<script setup lang="ts">
import { bank, receipt, transfer, wallet } from '@vitral/icons';
import { Button, Icon, InputText } from '@vitral/vue';
import { ref } from 'vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'accounts' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

const icons = { accounts: wallet, transactions: receipt, transfer };
const query = ref('');
</script>

<template>
    <AppShell
        brand="Harborline"
        :brand-icon="bank"
        :icons="icons"
        header="site"
        :groups="[{ label: 'Money out', screens: ['transfer'] }]"
        :user="{ name: 'Daniel Rocha', role: 'Personal banking', initials: 'DR' }"
    >
        <!-- A bank's search is for a payment you half remember, so it sits with
             the accounts rather than in the bar with the notifications. -->
        <template #aside="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside tp-aside-search">
                <InputText v-model="query" placeholder="Find a payment" aria-label="Find a payment" size="small" fluid>
                    <template #prefix><Icon icon="search" /></template>
                </InputText>
            </div>
        </template>
        <template #asideFooter="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside-note">
                Available to spend
                <b>£4,182.60</b>
                across 3 accounts
            </div>
        </template>
        <template #actions="{ narrow }">
            <Button
                v-if="screen !== 'transfer'"
                :icon="transfer"
                :label="narrow ? undefined : 'Move money'"
                :aria-label="narrow ? 'Move money' : undefined"
                size="small"
                @click="go('transfer')"
            />
        </template>
        <component :is="current.component" />
    </AppShell>
</template>
