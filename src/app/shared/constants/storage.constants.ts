/**
 * Storage keys for localStorage persistence
 * Versioned to handle migrations if needed
 */
export const STORAGE_KEYS = {
  /**
   * Key for storing the currently overseen user ID
   * Versioned to support future migrations
   */
  OVERSEE_USER_ID: 'oversee_user_id_v1',

  /**
   * Key for storing the user's view preference (list or calendar)
   * Versioned to support future migrations
   */
  PREFERRED_VIEW: 'preferred_view_v1',

  /**
   * Key for storing generated connection code (for Comum users)
   * Should be cleared on logout
   */
  GENERATED_CODE: 'gerado_codigo'
} as const;

/**
 * Storage key type for type-safe access
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
