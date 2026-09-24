<script setup lang="ts">
import { Button } from '@vitral/vue';
</script>

<template>
    <Button label="Small" size="small" />
    <Button label="Normal" />
    <Button label="Large" size="large" />
    <Button label="Rounded" rounded severity="help" />
    <Button label="Raised" raised severity="secondary" />
</template>
