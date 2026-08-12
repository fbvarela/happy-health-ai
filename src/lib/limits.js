/**
 * Free-tier limits for Happy Health AI.
 * Premium users (plan === 'premium' || plan === 'bundle') bypass all of these.
 * Draft values — validate with real caregivers (SPEC §9.13).
 */
export const FREE_LIMITS = {
  /** Maximum number of patients a user can own */
  MAX_PATIENTS: 1,
  /** Vitals history window kept for free tier (30 days) */
  HISTORY_DAYS: 30,
  /** AI chat messages per day */
  CHAT_MESSAGES_PER_DAY: 20,
  /** Photo uploads per patient */
  MAX_PHOTOS: 5,
  /** Video uploads are premium-only */
  VIDEO_UPLOADS: false,
};
