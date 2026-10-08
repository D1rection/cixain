import { decodeHTML } from 'entities/decode'

/**
 * Decode a heading's stripped HTML text once, for plain-text display only.
 * Callers must strip actual tags first and keep legacy text for anchor IDs.
 * @param {string} text
 * @returns {string}
 */
export function decodeHeadingEntities(text) {
  return decodeHTML(text)
}
