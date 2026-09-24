<script setup lang="ts">
import { Skeleton } from '@vitral/vue';
</script>

<template>
    <Skeleton shape="circle" width="3rem" />
    <Skeleton width="3rem" height="3rem" />
    <Skeleton width="10rem" height="3rem" border-radius="1rem" />
    <Skeleton width="10rem" :animated="false" />
</template>
