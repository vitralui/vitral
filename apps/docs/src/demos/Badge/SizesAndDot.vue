<script setup lang="ts">
import { Badge } from '@vitral/vue';
</script>

<template>
    <Badge value="8" size="small" />
    <Badge value="8" />
    <Badge value="8" size="large" />
    <Badge value="8" size="xlarge" />
    <Badge value="99+" severity="danger" />
    <Badge severity="success" />
    <Badge severity="danger" />
</template>
