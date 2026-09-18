/** Lumen Metrics — a made-up subscription analytics product, looking at its own numbers. */
export const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

export const revenue = {
    mrr: [38.2, 40.1, 41.8, 43.0, 45.6, 47.9, 49.2, 52.4, 55.1, 57.8, 60.3, 64.7],
    expansion: [4.1, 4.4, 4.2, 5.0, 5.3, 5.9, 6.1, 6.6, 7.2, 7.0, 7.8, 8.4]
};

export const signups = [
    { name: 'Trials', data: [320, 356, 298, 410, 452, 488, 470, 530, 562, 590, 612, 655] },
    { name: 'Converted', data: [58, 64, 51, 79, 88, 97, 92, 108, 117, 124, 131, 142] }
];

export const plans = { labels: ['Starter', 'Growth', 'Scale', 'Enterprise'], values: [412, 286, 118, 34] };

export type Plan = 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
export type Health = 'Healthy' | 'At risk' | 'Churned' | 'Trial';

export interface Customer {
    id: number;
    company: string;
    contact: string;
    email: string;
    plan: Plan;
    seats: number;
    mrr: number;
    health: Health;
    since: string;
    country: string;
}

const companies = [
    ['Quillfeather', 'Ines Moreau', 'FR'],
    ['Bramble & Co', 'Tobias Reyes', 'US'],
    ['Halcyon Labs', 'Mei Tanaka', 'JP'],
    ['Oxbow Freight', 'Samuel Okafor', 'NG'],
    ['Juniper Health', 'Clara Novak', 'CZ'],
    ['Kestrel Studio', 'Diego Almeida', 'BR'],
    ['Northwind Mills', 'Hanna Berg', 'SE'],
    ['Pebble Finance', 'Arjun Mehta', 'IN'],
    ['Saltmarsh Media', 'Olivia Grant', 'UK'],
    ['Tidewater Energy', 'Lucas Ferreira', 'PT'],
    ['Umber Coffee', 'Nora Lindahl', 'NO'],
    ['Vantage Robotics', 'Felix Wagner', 'DE'],
    ['Willow Legal', 'Amara Diallo', 'SN'],
    ['Yarrow Foods', 'Chloe Martin', 'CA'],
    ['Zephyr Air', 'Kai Nakamura', 'US'],
    ['Aster Schools', 'Leila Haddad', 'AE']
] as const;

const planOf: Plan[] = [
    'Growth',
    'Starter',
    'Scale',
    'Enterprise',
    'Growth',
    'Starter',
    'Scale',
    'Growth',
    'Starter',
    'Enterprise',
    'Starter',
    'Scale',
    'Growth',
    'Starter',
    'Growth',
    'Scale'
];
const healthOf: Health[] = [
    'Healthy',
    'Healthy',
    'At risk',
    'Healthy',
    'Trial',
    'Healthy',
    'Healthy',
    'At risk',
    'Churned',
    'Healthy',
    'Trial',
    'Healthy',
    'Healthy',
    'At risk',
    'Healthy',
    'Healthy'
];
const price: Record<Plan, number> = { Starter: 29, Growth: 99, Scale: 299, Enterprise: 1200 };

export const customers: Customer[] = companies.map(([company, contact, country], i) => {
    const plan = planOf[i]!;
    const seats = plan === 'Enterprise' ? 120 + i * 7 : plan === 'Scale' ? 25 + i : 3 + (i % 9);
    return {
        id: i + 1,
        company,
        contact,
        email: `${contact.split(' ')[0]!.toLowerCase()}@${company
            .split(' ')[0]!
            .toLowerCase()
            .replace(/[^a-z]/g, '')}.example`,
        plan,
        seats,
        mrr: healthOf[i] === 'Trial' || healthOf[i] === 'Churned' ? 0 : price[plan] + seats * (plan === 'Starter' ? 0 : 4),
        health: healthOf[i]!,
        since: `${months[i % 12]} ${i % 3 === 0 ? 2024 : 2025}`,
        country
    };
});

export const activity = [
    { who: 'Halcyon Labs', what: 'upgraded to Scale', when: '12 min ago', kind: 'success' as const },
    { who: 'Pebble Finance', what: 'opened a billing ticket', when: '48 min ago', kind: 'warn' as const },
    { who: 'Juniper Health', what: 'started a trial', when: '2 h ago', kind: 'info' as const },
    { who: 'Saltmarsh Media', what: 'cancelled their plan', when: '5 h ago', kind: 'danger' as const },
    { who: 'Zephyr Air', what: 'added 12 seats', when: 'Yesterday', kind: 'success' as const }
];

export const initials = (name: string) =>
    name
        .split(' ')
        .filter((part) => /^\p{L}/u.test(part))
        .map((part) => part[0])
        .join('')
        .slice(0, 2);

export const healthSeverity = (health: Health) => (health === 'Healthy' ? 'success' : health === 'At risk' ? 'warn' : health === 'Trial' ? 'info' : 'danger');
