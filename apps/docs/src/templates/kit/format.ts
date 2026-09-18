/** A picsum photo: stable ids, so a template looks the same on every load. */
export const photo = (id: number, width: number, height: number) => `https://picsum.photos/id/${id}/${width}/${height}`;

export const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
