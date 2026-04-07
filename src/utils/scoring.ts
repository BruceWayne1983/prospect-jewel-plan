export interface FitScoreFactors {
  estimated_store_quality: number; // 40-95
  category_alignment: 'perfect' | 'strong' | 'moderate' | 'weak';
  price_positioning: 'premium' | 'mid_market' | 'budget';
  town_appeal: 'prime' | 'good' | 'average' | 'poor';
  has_social_media: boolean;
  is_independent: boolean;
  estimated_rating: number; // 1-5, 0 if unknown
  has_website: boolean;
}

export interface FitScoreBreakdown {
  total: number;
  store_quality: { score: number; max: 25 };
  category_alignment: { score: number; max: 20; value: string };
  location_appeal: { score: number; max: 15; value: string };
  online_presence: { score: number; max: 15; website: boolean; social: boolean };
  commercial_health: { score: number; max: 15; rating: number };
  independence: { score: number; max: 10; value: boolean };
}

const CAT_SCORES: Record<string, number> = { perfect: 20, strong: 16, moderate: 12, weak: 6 };
const LOC_SCORES: Record<string, number> = { prime: 15, good: 12, average: 9, poor: 5 };

export function calculateFitScore(factors: FitScoreFactors): FitScoreBreakdown {
  // Store Quality: 25%
  const storeQuality = Math.round((factors.estimated_store_quality / 95) * 25);

  // Category Alignment: 20%
  const catScore = CAT_SCORES[factors.category_alignment] ?? 10;

  // Location Appeal: 15%
  const locScore = LOC_SCORES[factors.town_appeal] ?? 9;

  // Online Presence: 15%
  let onlineScore = 0;
  if (factors.has_website) onlineScore += 8;
  if (factors.has_social_media) onlineScore += 7;

  // Commercial Health: 15%
  let commercialScore: number;
  if (factors.estimated_rating > 0) {
    commercialScore = Math.round((factors.estimated_rating / 5) * 15);
  } else {
    commercialScore = 8; // neutral if unknown
  }

  // Independence: 10%
  const indepScore = factors.is_independent ? 9 : 3;

  const total = Math.round(Math.min(100, Math.max(0, storeQuality + catScore + locScore + onlineScore + commercialScore + indepScore)));

  return {
    total,
    store_quality: { score: storeQuality, max: 25 },
    category_alignment: { score: catScore, max: 20, value: factors.category_alignment },
    location_appeal: { score: locScore, max: 15, value: factors.town_appeal },
    online_presence: { score: onlineScore, max: 15, website: factors.has_website, social: factors.has_social_media },
    commercial_health: { score: commercialScore, max: 15, rating: factors.estimated_rating },
    independence: { score: indepScore, max: 10, value: factors.is_independent },
  };
}

// Deno-compatible version (same logic, for use in edge functions)
export const CALCULATE_FIT_SCORE_SOURCE = `
function calculateFitScore(factors) {
  const CAT_SCORES = { perfect: 20, strong: 16, moderate: 12, weak: 6 };
  const LOC_SCORES = { prime: 15, good: 12, average: 9, poor: 5 };
  const storeQuality = Math.round((factors.estimated_store_quality / 95) * 25);
  const catScore = CAT_SCORES[factors.category_alignment] || 10;
  const locScore = LOC_SCORES[factors.town_appeal] || 9;
  let onlineScore = 0;
  if (factors.has_website) onlineScore += 8;
  if (factors.has_social_media) onlineScore += 7;
  let commercialScore;
  if (factors.estimated_rating > 0) {
    commercialScore = Math.round((factors.estimated_rating / 5) * 15);
  } else {
    commercialScore = 8;
  }
  const indepScore = factors.is_independent ? 9 : 3;
  const total = Math.round(Math.min(100, Math.max(0, storeQuality + catScore + locScore + onlineScore + commercialScore + indepScore)));
  return {
    total,
    store_quality: { score: storeQuality, max: 25 },
    category_alignment: { score: catScore, max: 20, value: factors.category_alignment },
    location_appeal: { score: locScore, max: 15, value: factors.town_appeal },
    online_presence: { score: onlineScore, max: 15, website: factors.has_website, social: factors.has_social_media },
    commercial_health: { score: commercialScore, max: 15, rating: factors.estimated_rating },
    independence: { score: indepScore, max: 10, value: factors.is_independent },
  };
}
`;
