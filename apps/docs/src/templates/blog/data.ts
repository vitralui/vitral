import { reactive } from 'vue';

/** Field Notes: the made-up blog of a made-up designer who writes about making things. */
export const author = {
    name: 'Noor Aziz',
    initials: 'NA',
    photo: 1027,
    role: 'Designer and occasional photographer',
    bio: 'I design interfaces for a living and take photographs for the opposite reason. This is where I write down what I learn from both.'
};

export interface Post {
    id: number;
    title: string;
    excerpt: string;
    tags: string[];
    date: string;
    minutes: number;
    photo: number;
    featured?: boolean;
}

export const posts: Post[] = [
    {
        id: 1,
        title: 'Writing interfaces before drawing them',
        excerpt: 'Why every screen I design now starts as a paragraph, and what the paragraph catches that a wireframe never does.',
        tags: ['Design', 'Writing'],
        date: 'Sep 12, 2026',
        minutes: 7,
        photo: 403,
        featured: true
    },
    {
        id: 2,
        title: 'A year with a film camera',
        excerpt: 'Thirty-six frames at a time taught me more about editing than any app.',
        tags: ['Photography'],
        date: 'Aug 28, 2026',
        minutes: 9,
        photo: 250
    },
    {
        id: 3,
        title: 'The case for boring colour tokens',
        excerpt: 'Name colours by what they do, not how they look, and a rebrand becomes an afternoon.',
        tags: ['Design', 'Systems'],
        date: 'Aug 9, 2026',
        minutes: 6,
        photo: 20
    },
    {
        id: 4,
        title: 'Notes from a reading retreat',
        excerpt: 'Four days, eleven books, no screens — and the three ideas I brought home.',
        tags: ['Reading'],
        date: 'Jul 21, 2026',
        minutes: 5,
        photo: 1010
    },
    {
        id: 5,
        title: 'Keyboard first, mouse second',
        excerpt: 'Designing for the keyboard made our product faster for everyone, including people who never touch it.',
        tags: ['Accessibility', 'Design'],
        date: 'Jul 2, 2026',
        minutes: 8,
        photo: 366
    },
    {
        id: 6,
        title: 'The coffee shop office, reconsidered',
        excerpt: 'I worked from cafés for a month. Here is the ledger.',
        tags: ['Work'],
        date: 'Jun 15, 2026',
        minutes: 4,
        photo: 42
    },
    {
        id: 7,
        title: 'Small type, big decisions',
        excerpt: 'Captions, labels and footnotes carry more of a product than its headlines do.',
        tags: ['Writing', 'Systems'],
        date: 'May 30, 2026',
        minutes: 6,
        photo: 1073
    }
];

export const tags = [...new Set(posts.flatMap((post) => post.tags))].sort();

export const comments = [
    { name: 'Tomás Ruiz', initials: 'TR', when: '2 days ago', text: 'We tried this on our last project — the paragraph caught a missing empty state before anyone opened Figma.' },
    { name: 'Grace Liu', initials: 'GL', when: '3 days ago', text: 'Do you keep the paragraphs once the design exists? Curious whether they turn into documentation.' }
];

export const journal = reactive({ postId: 1, tag: null as string | null });

export const postOf = (id: number) => posts.find((post) => post.id === id) ?? posts[0]!;
