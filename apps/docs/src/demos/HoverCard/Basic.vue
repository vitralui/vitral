<script setup lang="ts">
import { Avatar, HoverCard } from '@vitral/vue';
</script>

<template>
    <p style="margin: 0">
        Built by
        <HoverCard>
            <template #trigger><a href="#">@vitral</a></template>
            <div style="display: flex; gap: 0.75rem">
                <Avatar label="V" shape="circle" />
                <div>
                    <strong>Vitral</strong>
                    <p style="margin: 0.25rem 0 0; font-size: 0.8125rem">One component set for Vue, themeable from tokens to pass-through.</p>
                </div>
            </div>
        </HoverCard>
        and friends.
    </p>
</template>
