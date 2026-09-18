import Password from './Password.vue';

/**
 * `InputPassword` is the name that matches the other fields — `InputText`,
 * `InputNumber`, `InputOtp`, `InputTag` — and `Password` is the name the API
 * this one follows uses. Both are exported and both are registered globally;
 * they are the same component.
 */
const InputPassword = Password;

export { InputPassword, Password };
export type * from './types';
