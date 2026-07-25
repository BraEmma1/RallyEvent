/**
 * Why two attendees are connecting — captured at connect time and stored on
 * `connection` and `sponsor_lead`. Powers organizer intelligence and sponsor
 * lead quality. (See CLAUDE.md architecture rule #5.)
 */
export const INTENTS = ['partnership', 'customer', 'investment', 'talent', 'general'] as const;

export type Intent = (typeof INTENTS)[number];
