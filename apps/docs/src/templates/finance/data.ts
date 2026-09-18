import { reactive } from 'vue';

/** Harborline: a made-up bank. Every account, payee and amount is invented. */
export interface Account {
    id: string;
    name: string;
    kind: 'Checking' | 'Savings' | 'Credit card' | 'Investments';
    number: string;
    balance: number;
    change: number;
}

export const accounts: Account[] = reactive([
    { id: 'chk', name: 'Everyday', kind: 'Checking', number: '•••• 4821', balance: 4285.12, change: -312.4 },
    { id: 'sav', name: 'Rainy day', kind: 'Savings', number: '•••• 9930', balance: 18450.0, change: 450 },
    { id: 'inv', name: 'Long term', kind: 'Investments', number: '•••• 1177', balance: 42310.55, change: 1284.2 },
    { id: 'crd', name: 'Harborline Card', kind: 'Credit card', number: '•••• 0064', balance: -1240.3, change: -198.9 }
]);

export const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
export const netWorth = [52.1, 53.0, 52.4, 54.2, 55.8, 56.1, 57.9, 58.6, 59.2, 60.8, 62.3, 63.8];
export const income = [5.2, 5.2, 6.1, 5.2, 5.2, 5.4, 5.4, 5.4, 5.4, 5.6, 5.6, 5.6];
export const spending = [4.1, 4.6, 5.9, 3.8, 3.9, 4.4, 4.0, 4.7, 4.9, 4.2, 4.5, 4.1];

export const categories = ['Groceries', 'Housing', 'Transport', 'Dining', 'Health', 'Shopping', 'Income', 'Transfer'];

export const budget = [
    { label: 'Housing', value: 1450, limit: 1500 },
    { label: 'Groceries', value: 520, limit: 600 },
    { label: 'Dining', value: 310, limit: 250 },
    { label: 'Transport', value: 180, limit: 220 }
];

export interface Transaction {
    id: number;
    date: Date;
    payee: string;
    category: string;
    account: string;
    amount: number;
    status: 'Posted' | 'Pending';
}

const payees: [string, string, number][] = [
    ['Greenleaf Market', 'Groceries', -84.2],
    ['Acme Payroll', 'Income', 2800],
    ['Harbour Rentals', 'Housing', -1450],
    ['Tidal Transit', 'Transport', -42.5],
    ['Café Lumen', 'Dining', -12.8],
    ['Northside Pharmacy', 'Health', -23.4],
    ['Paperlane Books', 'Shopping', -31.99],
    ['To Rainy day', 'Transfer', -450],
    ['Greenleaf Market', 'Groceries', -61.05],
    ['Osteria Nove', 'Dining', -58.0],
    ['City Bikes', 'Transport', -15.0],
    ['Brightline Energy', 'Housing', -96.3],
    ['Acme Payroll', 'Income', 2800],
    ['Kite Outdoor', 'Shopping', -129.0],
    ['Café Lumen', 'Dining', -9.6],
    ['Greenleaf Market', 'Groceries', -102.44],
    ['Tidal Transit', 'Transport', -42.5],
    ['Stream+ Subscription', 'Shopping', -11.99],
    ['Dr. Alves Dental', 'Health', -75.0],
    ['Refund · Kite Outdoor', 'Shopping', 129.0]
];

const today = new Date();
export const transactions: Transaction[] = reactive(
    payees.map(([payee, category, amount], i) => ({
        id: i + 1,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - Math.floor(i * 1.6)),
        payee,
        category,
        account: category === 'Dining' || category === 'Shopping' ? 'Harborline Card' : 'Everyday',
        amount,
        status: i < 2 ? ('Pending' as const) : ('Posted' as const)
    }))
);

export const payeeBook = [
    { name: 'Marta Oliveira', bank: 'Coastline Credit Union', account: '•••• 5512' },
    { name: 'Harbour Rentals', bank: 'Meridian Trust', account: '•••• 2080' },
    { name: 'Jonah Pike', bank: 'Harborline', account: '•••• 3391' },
    { name: 'Brightline Energy', bank: 'Pinecrest Bank', account: '•••• 7704' }
];

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${money.format(Math.abs(value))}`;
