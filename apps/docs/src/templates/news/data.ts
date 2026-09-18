import { reactive } from 'vue';

/** The Lantern: a made-up daily paper. Every story, name and figure is invented. */
export interface Story {
    id: number;
    section: string;
    title: string;
    dek: string;
    author: string;
    photo: number;
    minutes: number;
    published: string;
    tags: string[];
}

export const sections = [
    { id: 'world', name: 'World' },
    { id: 'business', name: 'Business' },
    { id: 'science', name: 'Science' },
    { id: 'culture', name: 'Culture' },
    { id: 'sport', name: 'Sport' }
];

export const authors: Record<string, { initials: string; role: string }> = {
    'Helena Voss': { initials: 'HV', role: 'Europe correspondent' },
    'Marcus Adeyemi': { initials: 'MA', role: 'Business editor' },
    'June Park': { initials: 'JP', role: 'Science writer' },
    'Rafael Costa': { initials: 'RC', role: 'Culture critic' },
    'Ada Whitfield': { initials: 'AW', role: 'Sport reporter' }
};

const byline: Record<string, string> = { world: 'Helena Voss', business: 'Marcus Adeyemi', science: 'June Park', culture: 'Rafael Costa', sport: 'Ada Whitfield' };

const raw: [string, string, string, number][] = [
    [
        'world',
        'Northern ferry routes reopen as the fjord ice retreats early',
        'Coastal towns that spent winter cut off are counting on a longer season — and bracing for what it means.',
        1015
    ],
    ['world', 'A city of commuters learns to love the night train', 'Sleeper services between four capitals sold out their first month. Operators are adding carriages.', 1047],
    ['world', 'Airports trial a single queue for every passenger', 'Face-free boarding passes promise shorter lines. Privacy groups want the data rules first.', 364],
    [
        'world',
        'The square that votes: inside a town run by open assemblies',
        'Every Sunday, residents decide the budget line by line. It is slower — and nobody wants to stop.',
        342
    ],
    ['business', 'Mid-size lenders post their best quarter in a decade', 'Falling deposit costs and a quiet default rate lifted profits across the sector.', 1067],
    ['business', 'Remote teams are shrinking their offices, not closing them', 'A survey of 900 firms finds most keep one floor for the days that need a room.', 0],
    ['business', 'Warehouse robots move from pilot to payroll', 'The machines now handle a third of parcels at the region’s largest depot.', 1078],
    ['business', 'Why the tallest tower in town is half empty', 'Developers bet on trading floors. Tenants wanted terraces.', 1031],
    ['science', 'A quiet sun gives the north its brightest auroras in years', 'Researchers say a lull in solar storms made the displays easier to predict — and to catch.', 1022],
    ['science', 'Wind farms learn to pause for migrating birds', 'Radar that spots flocks miles out lets turbines idle for minutes instead of days.', 182],
    ['science', 'The telescope that fits in a shipping container', 'A cheap, portable array is mapping near-Earth objects from school playgrounds.', 967],
    ['science', 'Eagles return to valleys they left a century ago', 'Fourteen breeding pairs were counted this spring, up from none.', 1024],
    ['culture', 'The concert hall that sold every seat for a year of new music', 'An orchestra that dropped the classics for living composers found a younger crowd.', 452],
    ['culture', 'Secondhand bookshops are having a moment', 'Readers who came for the prices are staying for the pencil notes in the margins.', 1073],
    ['culture', 'A piano in every station, and who plays them', 'Commuters, students and one retired concert pianist, before the 7:42.', 39],
    ['sport', 'A promoted side tops the league after eight rounds', 'Nobody predicted it, least of all the manager, who still takes the bus to training.', 1058],
    ['sport', 'Cyclists reclaim the coast road for a weekend', 'Forty thousand riders, no cars, and a finish line on the harbour wall.', 839],
    ['sport', 'The open-water swim that crosses a border', 'Six kilometres, two countries and one very cold lake.', 841]
];

export const stories: Story[] = raw.map(([section, title, dek, photo], i) => ({
    id: i + 1,
    section,
    title,
    dek,
    photo,
    author: byline[section]!,
    minutes: 3 + ((i * 5) % 9),
    published: i < 4 ? `${i + 1} h ago` : `Sep ${14 - (i % 6)}`,
    tags: [sections.find((entry) => entry.id === section)!.name, i % 2 ? 'Analysis' : 'Report']
}));

export const paper = reactive({ storyId: 1, section: 'world' });

export const storyOf = (id: number) => stories.find((story) => story.id === id) ?? stories[0]!;
export const sectionName = (id: string) => sections.find((entry) => entry.id === id)?.name ?? id;
export const mostRead = [9, 13, 2, 16, 6].map(storyOf);
