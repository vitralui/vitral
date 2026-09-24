<script setup lang="ts">
import { Skeleton } from '@vitral/vue';
</script>

<template>
    <div aria-busy="true" style="display: grid; gap: 0.75rem; width: 100%; max-width: 24rem">
        <div style="display: flex; gap: 0.75rem; align-items: center">
            <Skeleton shape="circle" width="3rem" />
            <div style="display: grid; gap: 0.5rem; flex: 1">
                <Skeleton width="60%" />
                <Skeleton width="40%" />
            </div>
        </div>
        <Skeleton height="8rem" />
        <div style="display: flex; justify-content: space-between">
            <Skeleton width="5rem" height="2rem" />
            <Skeleton width="5rem" height="2rem" />
        </div>
    </div>
</template>
