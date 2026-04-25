/**
 * Helper to safely extract the translated text from a database field.
 * Handles both legacy plain string data and new JSON stringified multilingual data.
 * 
 * @param {string} field - The field value from the DB (e.g., restaurant.name)
 * @param {string} lang - The current active language (uz, ru, en)
 * @returns {string} - The translated text
 */
export function getTranslatedField(field, lang) {
  if (!field) return '';
  
  if (typeof field === 'object') {
    return field[lang] || field['uz'] || Object.values(field)[0] || '';
  }

  try {
    const parsed = JSON.parse(field);
    if (parsed && typeof parsed === 'object') {
      return parsed[lang] || parsed['uz'] || Object.values(parsed)[0] || '';
    }
  } catch (err) {
    return field;
  }
  
  return field;
}
