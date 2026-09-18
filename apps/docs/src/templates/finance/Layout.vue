<script setup lang="ts">
import { bank, receipt, transfer, wallet } from '@vitral/icons';
import { Button } from '@vitral/vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'accounts' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

const icons = { accounts: wallet, transactions: receipt, transfer };
</script>

<template>
    <AppShell brand="Harborline" :brand-icon="bank" :icons="icons" :user="{ name: 'Daniel Rocha', role: 'Personal banking', initials: 'DR' }">
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
