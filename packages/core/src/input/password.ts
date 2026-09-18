/** How strong a password reads: nothing typed, or one of three grades. */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthOptions {
    /** Met by a medium password. The default: six characters mixing cases or digits. */
    mediumRegex?: RegExp | string;
    /** Met by a strong password. The default: eight characters with lower, upper and a digit. */
    strongRegex?: RegExp | string;
}

export const defaultMediumRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;
export const defaultStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

const toRegex = (value: RegExp | string | undefined, fallback: RegExp) => (value === undefined ? fallback : typeof value === 'string' ? new RegExp(value) : value);

/** The grade of `value`, or null for an empty one — a meter shows nothing until something is typed. */
export function passwordStrength(value: string | null | undefined, options: PasswordStrengthOptions = {}): PasswordStrength | null {
    if (!value) return null;
    if (toRegex(options.strongRegex, defaultStrongRegex).test(value)) return 'strong';
    if (toRegex(options.mediumRegex, defaultMediumRegex).test(value)) return 'medium';
    return 'weak';
}

/** A grade as a share of the meter: a third, two thirds, all of it. */
export function strengthRatio(strength: PasswordStrength | null): number {
    return strength === 'strong' ? 1 : strength === 'medium' ? 2 / 3 : strength === 'weak' ? 1 / 3 : 0;
}
