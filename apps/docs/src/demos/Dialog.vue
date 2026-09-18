<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Dialog',
    category: 'Overlay',
    description:
        'A window over the page. It is the WAI-ARIA modal dialog: focus moves in (to an `autofocus` element, else the first field), Tab stays inside, Escape closes, and focus returns to what opened it. Size it with `style`; `modal: false` leaves the page usable.'
};
</script>

<script setup lang="ts">
import { Button, Dialog, InputText, Select } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

type Position = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const profile = ref(false);
const positioned = ref(false);
const position = ref<Position>('top');
const long = ref(false);
const modeless = ref(false);
const nested = ref(false);
const name = ref('Ana Souza');
const email = ref('ana@example.com');
const role = ref<string | null>(null);
const roles = [{ name: 'Viewer' }, { name: 'Editor' }, { name: 'Owner' }];
const positions: Position[] = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];

function openAt(where: Position) {
    position.value = where;
    positioned.value = true;
}
</script>

<template>
    <DemoSection title="Basic" description="The header names the dialog; the footer is the button band.">
        <Button label="Edit profile" icon="pencil" @click="profile = true" />
        <Dialog v-model:visible="profile" header="Edit profile" style="width: 28rem">
            <div class="demo-stack" style="display: flex; flex-direction: column; gap: 0.875rem">
                <span class="demo-hint" style="font-size: 0.875rem">Update how others see you.</span>
                <div class="demo-field">
                    <label for="dlg-name">Name</label>
                    <InputText id="dlg-name" v-model="name" fluid />
                </div>
                <div class="demo-field">
                    <label for="dlg-email">Email</label>
                    <InputText id="dlg-email" v-model="email" type="email" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" severity="secondary" @click="profile = false" />
                <Button label="Save" @click="profile = false" />
            </template>
        </Dialog>
    </DemoSection>

    <DemoSection title="Position" description="The dialog sits in the centre, along an edge or in a corner, and slides in from there.">
        <div style="display: grid; grid-template-columns: repeat(3, 8rem); gap: 0.5rem">
            <Button v-for="p in positions" :key="p" :label="p" severity="secondary" size="small" @click="openAt(p)" />
        </div>
        <Dialog v-model:visible="positioned" :header="`Position: ${position}`" :position="position" style="width: 22rem" dismissable-mask>
            A press on the mask closes this one (<code>dismissable-mask</code>).
        </Dialog>
    </DemoSection>

    <DemoSection title="Maximizable" description="A button fills the viewport with the dialog; its name switches between Maximize and Restore.">
        <Button label="Terms of service" severity="secondary" @click="long = true" />
        <Dialog v-model:visible="long" header="Terms of service" maximizable style="width: 36rem; height: 24rem">
            <p v-for="n in 8" :key="n">
                {{ n }}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus
                auctor fringilla, maecenas faucibus mollis interdum.
            </p>
            <template #footer>
                <Button label="Decline" severity="secondary" @click="long = false" />
                <Button label="Accept" autofocus @click="long = false" />
            </template>
        </Dialog>
    </DemoSection>

    <DemoSection title="Modeless" description="`modal: false` keeps the page usable: no mask, no focus trap, no scroll lock. Escape still closes it.">
        <Button label="Open a modeless dialog" severity="secondary" @click="modeless = true" />
        <Dialog v-model:visible="modeless" header="Find" :modal="false" position="bottom-right" style="width: 20rem">
            <InputText aria-label="Find text" placeholder="Search the page…" fluid />
        </Dialog>
    </DemoSection>

    <DemoSection title="Overlays inside" description="Open the select, then press Escape: the select closes first, the dialog stays.">
        <Button label="Invite someone" severity="secondary" icon="user" @click="nested = true" />
        <Dialog v-model:visible="nested" header="Invite" style="width: 24rem">
            <div class="demo-field">
                <label for="dlg-role">Role</label>
                <Select id="dlg-role" v-model="role" :options="roles" option-label="name" option-value="name" placeholder="Choose a role" fluid />
            </div>
            <template #footer>
                <Button label="Send invite" :disabled="!role" @click="nested = false" />
            </template>
        </Dialog>
    </DemoSection>
</template>
