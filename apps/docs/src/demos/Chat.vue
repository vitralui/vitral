<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Chat',
    category: 'Messages',
    description:
        'A conversation with no dependency, in five shapes from a plain thread to an agent with its tool calls, with answers that stream in place.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AgentTools from './Chat/AgentTools.vue';
import Captions from './Chat/Captions.vue';
import Copilot from './Chat/Copilot.vue';
import DefaultChat from './Chat/DefaultChat.vue';
import FailedAnswer from './Chat/FailedAnswer.vue';
import TwoPeople from './Chat/TwoPeople.vue';
import Widget from './Chat/Widget.vue';
</script>

<template>
    <DemoSection title="Default" description="Ask it something. The answer arrives a token at a time, with a caret after the last character, and is announced once it settles. Attach a file with the paperclip; Enter sends and Shift+Enter breaks the line."><DefaultChat /></DemoSection>
    <DemoSection title="Two people" description="`variant=&quot;messenger&quot;`: both sides get a bubble and an avatar, and a run of messages from one person is grouped under one name."><TwoPeople /></DemoSection>
    <DemoSection title="An agent and its tools" description="`variant=&quot;agent&quot;`: each tool the assistant reached for is a step that can be opened — what it was asked and what it answered — and one still running says so. That is the whole reason to show the steps at all."><AgentTools /></DemoSection>
    <DemoSection title="A copilot beside the work" description="`variant=&quot;copilot&quot;`: a narrow column, no bubbles and no avatars, for a panel that sits next to what is being written."><Copilot /></DemoSection>
    <DemoSection title="Captions" description="`variant=&quot;captions&quot;`: a running transcript rather than a conversation — no bubbles, no sides, the speaker's name in front, and the line still being recognised carrying the caret."><Captions /></DemoSection>
    <DemoSection title="A widget" description="`variant=&quot;widget&quot;`: a launcher, and the thread in a panel that opens over the page. The launcher says whether the panel is open, and names itself either way."><Widget /></DemoSection>
    <DemoSection title="When an answer fails" description="A message with an `error` takes its place in the thread, and `retryable` puts the ask-again button under it."><FailedAnswer /></DemoSection>
</template>
