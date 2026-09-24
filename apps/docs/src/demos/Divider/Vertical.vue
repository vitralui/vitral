<script setup lang="ts">
import { Button, Divider } from '@vitral/vue';
</script>

<template>
    <div style="display: flex; align-items: center; width: 100%">
        <div style="flex: 1; text-align: center">
            <Button label="Sign in" />
        </div>
        <Divider layout="vertical" style="min-height: 6rem">or</Divider>
        <div style="flex: 1; text-align: center">
            <Button label="Create account" severity="secondary" />
        </div>
    </div>
</template>
