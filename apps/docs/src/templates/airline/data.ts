import { computed, reactive } from 'vue';

/** Skylark Air: a made-up airline flying between made-up cities. */
export interface City {
    code: string;
    name: string;
    country: string;
    photo: number;
    from?: number;
}

export const cities: City[] = [
    { code: 'BRW', name: 'Brightwater', country: 'Aldmark', photo: 1047 },
    { code: 'SOV', name: 'Solvik', country: 'Nordhavn', photo: 1015, from: 129 },
    { code: 'KLS', name: 'Kalossa', country: 'Thessia', photo: 49, from: 189 },
    { code: 'GRW', name: 'Grachtwyk', country: 'Lowmere', photo: 164, from: 79 },
    { code: 'PAU', name: 'Port Aurel', country: 'Cascadia', photo: 436, from: 349 },
    { code: 'VLM', name: 'Velmar Falls', country: 'Cascadia', photo: 1043, from: 299 },
    { code: 'MRN', name: 'Marenna', country: 'Isla Verde', photo: 645, from: 259 }
];

export const cityOf = (code: string) => cities.find((city) => city.code === code) ?? cities[0]!;

export interface Flight {
    id: string;
    number: string;
    depart: string;
    arrive: string;
    minutes: number;
    stops: number;
    via?: string;
    price: number;
    fare: 'Light' | 'Classic' | 'Flex';
    seatsLeft: number;
    aircraft: string;
}

export const flights: Flight[] = [
    { id: 'f1', number: 'SK 214', depart: '06:40', arrive: '09:05', minutes: 145, stops: 0, price: 129, fare: 'Light', seatsLeft: 4, aircraft: 'A320neo' },
    { id: 'f2', number: 'SK 218', depart: '09:15', arrive: '11:45', minutes: 150, stops: 0, price: 164, fare: 'Classic', seatsLeft: 12, aircraft: 'A320neo' },
    { id: 'f3', number: 'SK 402', depart: '10:30', arrive: '15:10', minutes: 280, stops: 1, via: 'GRW', price: 98, fare: 'Light', seatsLeft: 20, aircraft: 'E195' },
    { id: 'f4', number: 'SK 222', depart: '13:50', arrive: '16:20', minutes: 150, stops: 0, price: 149, fare: 'Classic', seatsLeft: 9, aircraft: 'A321' },
    { id: 'f5', number: 'SK 226', depart: '18:05', arrive: '20:30', minutes: 145, stops: 0, price: 212, fare: 'Flex', seatsLeft: 2, aircraft: 'A321' },
    { id: 'f6', number: 'SK 408', depart: '19:40', arrive: '01:15', minutes: 335, stops: 1, via: 'KLS', price: 87, fare: 'Light', seatsLeft: 31, aircraft: 'E195' }
];

export const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

const inDays = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

export const trip = reactive({
    kind: 'return' as 'return' | 'oneway',
    from: 'BRW',
    to: 'SOV',
    depart: inDays(14) as Date | null,
    back: inDays(21) as Date | null,
    adults: 2,
    children: 0,
    cabin: 'Economy',
    flightId: 'f2',
    seats: ['14C', '14D'] as string[],
    bags: 1,
    insurance: false
});

export const passengers = computed(() => trip.adults + trip.children);
export const flight = computed(() => flights.find((entry) => entry.id === trip.flightId) ?? flights[0]!);

export const extras = computed(() => {
    const seatFees = trip.seats.filter((seat) => Number.parseInt(seat, 10) <= 5).length * 24;
    return { bags: trip.bags * 35, seats: seatFees, insurance: trip.insurance ? 12 * passengers.value : 0 };
});

export const total = computed(() => {
    const fare = flight.value.price * passengers.value * (trip.kind === 'return' ? 2 : 1);
    return { fare, taxes: Math.round(fare * 0.18), ...extras.value };
});

export const grandTotal = computed(() => Object.values(total.value).reduce((sum, value) => sum + value, 0));

export const eur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const dateLabel = (date: Date | null) => (date ? date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—');
