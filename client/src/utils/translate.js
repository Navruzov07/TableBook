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
  
  try {
    // Attempt to parse the string as JSON
    const parsed = JSON.parse(field);
    
    // If it's a valid object, extract the language
    if (parsed && typeof parsed === 'object') {
      return parsed[lang] || parsed['uz'] || Object.values(parsed)[0] || '';
    }
  } catch (err) {
    // If JSON parsing fails, it's legacy plain text, just return it
    return field;
  }
  
  return field;
}
