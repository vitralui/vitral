/**
 * The categories the built-in set is filed under, in the order a catalogue
 * shows them. Each has a file of its own in `./icons`.
 */
export const iconCategories = [
    { id: 'arrows', label: 'Arrows & navigation' },
    { id: 'actions', label: 'Interface & actions' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'files', label: 'Files & folders' },
    { id: 'text', label: 'Text & formatting' },
    { id: 'media', label: 'Media' },
    { id: 'communication', label: 'Communication' },
    { id: 'people', label: 'People & accounts' },
    { id: 'devices', label: 'Devices & hardware' },
    { id: 'development', label: 'Development' },
    { id: 'charts', label: 'Charts & data' },
    { id: 'maps', label: 'Maps & location' },
    { id: 'transport', label: 'Transport' },
    { id: 'time', label: 'Time & calendar' },
    { id: 'weather', label: 'Weather & nature' },
    { id: 'brands', label: 'Brands & social' },
    { id: 'security', label: 'Security' },
    { id: 'health', label: 'Health & medical' },
    { id: 'buildings', label: 'Home & buildings' },
    { id: 'food', label: 'Food & drink' },
    { id: 'education', label: 'School & education' },
    { id: 'commerce', label: 'E-commerce' },
    { id: 'finance', label: 'Finance' },
    { id: 'games', label: 'Games' },
    { id: 'sports', label: 'Sports' }
] as const;

export type IconCategoryId = (typeof iconCategories)[number]['id'];
