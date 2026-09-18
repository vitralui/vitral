import { computed, reactive } from 'vue';

/** Fernhill Supply: a made-up shop for slow, well-made everyday things. */
export interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    was?: number;
    rating: number;
    reviews: number;
    photos: number[];
    colors: string[];
    sizes: string[];
    badge?: string;
    blurb: string;
}

export const categories = [
    { id: 'kitchen', name: 'Kitchen', photo: 1060, count: 48 },
    { id: 'living', name: 'Living', photo: 1008, count: 36 },
    { id: 'desk', name: 'Desk', photo: 445, count: 22 },
    { id: 'outdoor', name: 'Outdoor', photo: 1011, count: 30 }
];

export const products: Product[] = [
    {
        id: 1,
        name: 'Stoneware pour-over set',
        category: 'kitchen',
        price: 64,
        was: 80,
        rating: 4.9,
        reviews: 214,
        photos: [431, 63, 1060, 425],
        colors: ['Chalk', 'Charcoal'],
        sizes: ['2 cups', '4 cups'],
        badge: 'Sale',
        blurb: 'A hand-thrown dripper and carafe, glazed inside so nothing lingers.'
    },
    {
        id: 2,
        name: 'Rangefinder film camera',
        category: 'outdoor',
        price: 349,
        rating: 4.7,
        reviews: 58,
        photos: [250, 454, 628, 823],
        colors: ['Silver', 'Black'],
        sizes: ['Body only', 'With 35mm lens'],
        badge: 'New',
        blurb: 'A restored 1970s rangefinder, serviced and tested with a roll of film.'
    },
    {
        id: 3,
        name: 'Porcelain tea set',
        category: 'kitchen',
        price: 89,
        rating: 4.8,
        reviews: 131,
        photos: [225, 326, 312, 755],
        colors: ['White', 'Celadon'],
        sizes: ['For two', 'For four'],
        blurb: 'A pot, a strainer and cups thin enough to glow when you hold them up.'
    },
    {
        id: 4,
        name: 'Leather desk organiser',
        category: 'desk',
        price: 72,
        rating: 4.5,
        reviews: 47,
        photos: [526, 20, 36, 26],
        colors: ['Tan', 'Espresso'],
        sizes: ['Standard'],
        blurb: 'Vegetable-tanned leather that darkens with use. Holds pens, cards and a phone.'
    },
    {
        id: 5,
        name: 'Single-origin coffee',
        category: 'kitchen',
        price: 18,
        rating: 4.6,
        reviews: 402,
        photos: [766, 425, 431, 1060],
        colors: ['Light roast', 'Dark roast'],
        sizes: ['250 g', '1 kg'],
        badge: 'Bestseller',
        blurb: 'Washed beans from one farm, roasted on Tuesdays, shipped on Wednesdays.'
    },
    {
        id: 6,
        name: 'Knit cushion cover',
        category: 'living',
        price: 38,
        was: 48,
        rating: 4.3,
        reviews: 44,
        photos: [755, 691, 1010, 1008],
        colors: ['Oat', 'Grey'],
        sizes: ['45 cm', '60 cm'],
        badge: 'Sale',
        blurb: 'A chunky wool knit over a zipped cotton lining.'
    },
    {
        id: 7,
        name: 'Enamel camp mug',
        category: 'outdoor',
        price: 16,
        rating: 4.4,
        reviews: 318,
        photos: [30, 63, 431, 691],
        colors: ['Red', 'Cream'],
        sizes: ['12 oz'],
        blurb: 'Steel under glass enamel: goes on the fire, goes in the dishwasher.'
    },
    {
        id: 8,
        name: 'Writing desk set',
        category: 'desk',
        price: 129,
        rating: 4.9,
        reviews: 76,
        photos: [445, 180, 370, 20],
        colors: ['Walnut', 'Oak'],
        sizes: ['Small', 'Large'],
        blurb: 'A pen tray, a monitor riser and a mat, cut from the same board.'
    }
];

export const reviews = [
    { name: 'Marisol Pena', initials: 'MP', rating: 5, when: '2 weeks ago', text: 'Heavier than I expected, in a good way. The colour is exactly as pictured.' },
    { name: 'Theo Lindqvist', initials: 'TL', rating: 4, when: '1 month ago', text: 'Lovely quality. Shipping took a day longer than promised, but it was worth it.' },
    { name: 'Aiko Brandt', initials: 'AB', rating: 5, when: '2 months ago', text: 'Bought a second one as a gift. Packaging was plastic-free, which I appreciated.' }
];

export interface CartLine {
    productId: number;
    color: string;
    size: string;
    quantity: number;
}

/** The shop's state, shared by its screens. */
export const shop = reactive({
    productId: 1,
    cart: [
        { productId: 1, color: 'Chalk', size: '2 cups', quantity: 1 },
        { productId: 5, color: 'Light roast', size: '250 g', quantity: 2 }
    ] as CartLine[]
});

export const productOf = (id: number) => products.find((product) => product.id === id) ?? products[0]!;

export const cartCount = computed(() => shop.cart.reduce((total, line) => total + line.quantity, 0));
export const subtotal = computed(() => shop.cart.reduce((total, line) => total + productOf(line.productId).price * line.quantity, 0));
export const shipping = computed(() => (subtotal.value === 0 || subtotal.value >= 150 ? 0 : 9));

export function addToCart(line: CartLine) {
    const same = shop.cart.find((entry) => entry.productId === line.productId && entry.color === line.color && entry.size === line.size);
    if (same) same.quantity += line.quantity;
    else shop.cart.push({ ...line });
}
