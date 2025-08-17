/**
 * configValidator.js
 *
 * Provides a single place to define and check "required" fields
 * for each object type (enemy, tower, hero). If a required field
 * is missing, we throw an Error with a clear message.
 *
 * Also allows fallback for optional fields like images or sounds
 * (we won't throw an error if those are missing).
 */

const REQUIRED_FIELDS = {
  enemy: [
    "baseHp",       // number
    "damage",       // number
    "attackInterval", // number
    "baseSpeed"     // number
    // any other truly required fields can go here
  ],
  tower: [
    "name",         // string
    "towerType",    // "range" or "melee"
    "cost",         // array
    "attackRate",   // number
    "damage"        // array or number
    // add more if needed
  ],
  hero: [
    "name",         // string
    "maxHp",        // number
    "damage",       // number
    "speed",        // number
    "attackInterval"// number
    // add more if needed
  ]
};

/**
 * validateRequiredConfig(objectType, config, displayName)
 *
 * - objectType: "enemy" | "tower" | "hero" (keys in REQUIRED_FIELDS)
 * - config: the actual config object to check
 * - displayName: string used in error messages, e.g. the enemy type or hero name
 */
export function validateRequiredConfig(objectType, config, displayName="") {
  if (!config || typeof config !== "object") {
    throw new Error(`Missing or invalid config object for [${objectType}] "${displayName}"`);
  }
  const required = REQUIRED_FIELDS[objectType] || [];
  required.forEach((field) => {
    if (config[field] == null) {
      throw new Error(`Config error in [${objectType}] "${displayName}": missing required field "${field}".`);
    }
  });
}
