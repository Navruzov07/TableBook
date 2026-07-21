/**
 * useAIAssistant — deterministic NLP query parser + restaurant ranking hook.
 * No external AI API. Pure client-side logic using existing restaurantAPI.
 */
import { useCallback, useRef } from 'react';
import { restaurantAPI } from '../../api/index.js';
import { getTranslatedField } from '../../utils/translate.js';

// ─── Off-topic detection ────────────────────────────────────────────────────
const RESTAURANT_KEYWORDS = [
  // English
  'restaurant', 'food', 'eat', 'dinner', 'lunch', 'breakfast', 'table', 'book', 'reserve',
  'meal', 'cuisine', 'menu', 'dish', 'hungry', 'people', 'guests', 'budget', 'price', 'cost',
  'romantic', 'family', 'business', 'quiet', 'cozy', 'outdoor', 'sushi', 'pizza', 'burger',
  'uzs', 'som', 'tashkent', 'rating', 'stars', 'best', 'top', 'available', 'tonight', 'today',
  // Uzbek
  'restoran', 'taom', 'ovqat', 'kechki', 'tushlik', 'nonushta', 'stol', 'bron', 'kishi',
  'mehmon', 'byudjet', 'narx', 'romantik', 'oilaviy', 'biznes', 'jim', 'menyu',
  // Russian
  'ресторан', 'еда', 'ужин', 'обед', 'завтрак', 'стол', 'бронь', 'кухня', 'меню',
  'романтик', 'семья', 'бизнес', 'тихий', 'гост', 'бюджет', 'цена', 'рейтинг',
];

function isOffTopic(text) {
  const lower = text.toLowerCase();
  return !RESTAURANT_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Budget parser ─────────────────────────────────────────────────────────
function parseBudget(text) {
  const lower = text.toLowerCase().replace(/,/g, '');
  // Patterns: "100000 uzs", "100k", "200 000", "under 150000", "до 150000"
  const patterns = [
    /(\d[\d\s]{2,})\s*(?:uzs|so['']?m|сум|sum)/i,
    /(?:under|less than|до|tagida|ichida|below)\s*(\d[\d\s]*)/i,
    /(\d+)\s*k(?:\s|$)/i, // 100k → 100000
    /(\d{4,})/,
  ];
  for (const pat of patterns) {
    const m = lower.match(pat);
    if (m) {
      let val = parseInt(m[1].replace(/\s/g, ''));
      if (lower.includes('k') && val < 1000) val *= 1000;
      if (val > 100 && val < 100_000_000) return val; // sanity check
    }
  }
  return null;
}

// ─── Party size parser ─────────────────────────────────────────────────────
function parseGuestCount(text) {
  const lower = text.toLowerCase();
  const patterns = [
    /(\d+)\s*(?:people|persons?|guests?|kishi|человек|гост)/i,
    /(?:for|uchun|для|на)\s*(\d+)/i,
    /table\s*(?:for|of)\s*(\d+)/i,
    /(\d+)\s*(?:ta|necha)/i,
  ];
  for (const pat of patterns) {
    const m = lower.match(pat);
    if (m) {
      const n = parseInt(m[1]);
      if (n > 0 && n <= 50) return n;
    }
  }
  return null;
}

// ─── Time parser ──────────────────────────────────────────────────────────
function parseTime(text) {
  const lower = text.toLowerCase();
  // "7pm", "19:00", "7:30pm"
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(?:pm|am)?/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (lower.includes('pm') && h < 12) h += 12;
    if (lower.includes('am') && h === 12) h = 0;
    // Dinner heuristic: plain numbers 1-6 without am/pm → treat as pm if looks like evening
    if (h >= 6 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  // Keywords
  if (/dinner|kechki|ужин|evening|kech/.test(lower)) return '19:00';
  if (/lunch|tushlik|обед|midday/.test(lower)) return '13:00';
  if (/breakfast|nonushta|завтрак|morning/.test(lower)) return '09:00';
  if (/tonight|bugun kech|сегодня вечером/.test(lower)) return '19:00';
  return null;
}

// ─── Cuisine keyword extractor ────────────────────────────────────────────
const CUISINE_KEYWORDS = [
  'burger', 'burgers', 'бургер',
  'pizza', 'пицца',
  'sushi', 'суши', 'sashimi',
  'italian', 'итальян',
  'uzbek', 'o\'zbek', 'узбек', 'national', 'milliy',
  'asian', 'азиат',
  'chinese', 'китайск',
  'european', 'европейск',
  'grill', 'bbq', 'барбекю', 'гриль',
  'seafood', 'рыба', 'baliq',
  'vegan', 'vegetarian', 'вегетар',
  'fast food', 'фастфуд',
  'cafe', 'кафе', 'coffee', 'кофе',
  'steakhouse', 'steak', 'стейк',
  'japanese', 'японск',
  'korean', 'корейск',
  'indian', 'индийск',
  'turkish', 'турецк',
  'georgian', 'грузинск',
];

function parseCuisine(text) {
  const lower = text.toLowerCase();
  return CUISINE_KEYWORDS.filter(kw => lower.includes(kw));
}

// ─── Atmosphere parser ─────────────────────────────────────────────────────
const ATMOSPHERE_MAP = {
  romantic:  ['romantic', 'romantik', 'романтик', 'couple', 'date', 'intimate', 'candlelight', 'juftlik'],
  family:    ['family', 'oilaviy', 'семейн', 'kids', 'children', 'casual', 'friendly', 'bolalar'],
  business:  ['business', 'biznes', 'деловой', 'professional', 'corporate', 'meeting', 'formal', 'ish'],
  quiet:     ['quiet', 'jim', 'тихий', 'peaceful', 'calm', 'serene', 'relax', 'tinch'],
  outdoor:   ['outdoor', 'ochiq', 'на улице', 'garden', 'terrace', 'terrassa'],
};

function parseAtmosphere(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [atm, keywords] of Object.entries(ATMOSPHERE_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(atm);
  }
  return found;
}

// ─── Restaurant scoring ────────────────────────────────────────────────────
function scoreRestaurant(restaurant, intent, lang) {
  let score = 0;
  const reasons = [];
  const name = getTranslatedField(restaurant.name, lang).toLowerCase();
  const desc = getTranslatedField(restaurant.description, lang).toLowerCase();
  const cuisine = (restaurant.cuisineType || '').toLowerCase();
  const combined = `${name} ${desc} ${cuisine}`;

  // Rating bonus (0–30 points)
  const ratingScore = Math.round((restaurant.rating / 10) * 30);
  score += ratingScore;

  // Cuisine match (25 points)
  if (intent.cuisineKeywords.length > 0) {
    const match = intent.cuisineKeywords.some(kw => combined.includes(kw));
    if (match) {
      score += 25;
      reasons.push({ key: 'cuisine', value: restaurant.cuisineType });
    }
  }

  // Atmosphere match (20 points each, max 40)
  let atmScore = 0;
  for (const atm of intent.atmospheres) {
    const keywords = ATMOSPHERE_MAP[atm] || [];
    if (keywords.some(kw => combined.includes(kw))) {
      atmScore += 20;
      reasons.push({ key: 'atmosphere', value: atm });
    }
  }
  score += Math.min(atmScore, 40);

  // Menu budget match (handled separately — added to score externally)

  // Guest count vs table seats
  if (intent.guestCount && restaurant.tables) {
    const hasTable = restaurant.tables.some(t => t.seatCount >= intent.guestCount);
    if (hasTable) {
      score += 10;
      reasons.push({ key: 'seats', value: intent.guestCount });
    }
  }

  return { score, reasons };
}

// ─── Menu budget check (lazy) ─────────────────────────────────────────────
async function checkMenuBudget(restaurantId, budget) {
  try {
    const res = await restaurantAPI.menu(restaurantId);
    const menu = res.data;
    // Flatten all items
    const allItems = Object.values(menu).flat();
    // Menu prices in USD (from DB); convert to UZS: 1 USD = 10,000 UZS (see currency.js)
    const affordable = allItems.filter(item => item.price * 10000 <= budget);
    return affordable.length;
  } catch {
    return null; // not fatal
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────
const cache = { restaurants: null, ts: 0, TTL: 30_000 };

async function fetchRestaurants() {
  const now = Date.now();
  if (cache.restaurants && now - cache.ts < cache.TTL) {
    return cache.restaurants;
  }
  const res = await restaurantAPI.list();
  const data = Array.isArray(res.data) ? res.data : [];
  cache.restaurants = data;
  cache.ts = now;
  return data;
}

// ─── Main hook ────────────────────────────────────────────────────────────
export function useAIAssistant() {
  const abortRef = useRef(null);

  const processQuery = useCallback(async (userText, lang, tFn) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current = true;
    const cancelled = { value: false };
    abortRef.current = cancelled;

    const text = userText.trim();

    // Off-topic guard
    if (isOffTopic(text)) {
      return { type: 'offTopic', text: tFn('ai.offTopic') };
    }

    // Parse intent
    const intent = {
      budget: parseBudget(text),
      guestCount: parseGuestCount(text),
      time: parseTime(text),
      cuisineKeywords: parseCuisine(text),
      atmospheres: parseAtmosphere(text),
    };

    let restaurants;
    try {
      restaurants = await fetchRestaurants();
    } catch {
      return { type: 'error', text: tFn('ai.errorFetch') };
    }

    if (cancelled.value) return null;

    // Score all restaurants
    let scored = restaurants.map(r => {
      const { score, reasons } = scoreRestaurant(r, intent, lang);
      return { restaurant: r, score, reasons };
    });

    // Availability check for top 3 if time was specified
    if (intent.time) {
      const today = new Date().toISOString().split('T')[0];
      const top3 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      for (const item of top3) {
        try {
          const avail = await restaurantAPI.availability(item.restaurant.id, today, intent.time);
          if (cancelled.value) return null;
          const freeCount = avail.data.filter(a => a.available).length;
          if (freeCount > 0) {
            item.score += 15;
            item.freeTablesCount = freeCount;
            item.reasons.push({ key: 'available', value: freeCount });
          }
        } catch { /* non-fatal */ }
      }
    }

    // Budget: fetch menu for top 5 if budget was specified
    if (intent.budget) {
      const top5 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      for (const item of top5) {
        const affordable = await checkMenuBudget(item.restaurant.id, intent.budget);
        if (cancelled.value) return null;
        if (affordable !== null && affordable > 0) {
          item.score += 20;
          item.affordableItems = affordable;
          item.reasons.push({ key: 'budget', value: intent.budget });
        }
      }
    }

    // Final sort, take top 3
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(r => r.score > 0);

    if (results.length === 0) {
      return { type: 'noResults', text: tFn('ai.noResults') };
    }

    return { type: 'results', results, intent };
  }, []);

  return { processQuery };
}
