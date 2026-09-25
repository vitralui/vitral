// Every file of this language, as one chunk: the site fetches it when a page
// in this language is opened, and a reader in English never does. A new
// language is a folder beside this one, with a copy of this file in it.
export default import.meta.glob<Record<string, unknown>>('./**/*.json', { eager: true, import: 'default' });
