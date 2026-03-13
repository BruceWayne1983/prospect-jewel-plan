import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Retailer = Tables<"retailers">;

export function useRetailers() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRetailers = async () => {
    const { data } = await supabase
      .from("retailers")
      .select("*")
      .order("priority_score", { ascending: false });
    setRetailers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  return { retailers, loading, refetch: fetchRetailers };
}

// Safe JSON accessors for JSONB fields
export function getOutreach(r: Retailer) {
  const o = (r.outreach ?? {}) as Record<string, any>;
  return {
    contactName: o.contactName ?? '',
    contactRole: o.contactRole ?? '',
    contactEmail: o.contactEmail ?? '',
    contactPhone: o.contactPhone ?? '',
    bestContactMethod: o.bestContactMethod ?? 'email',
    outreachPriority: o.outreachPriority ?? 'low',
    bestOutreachAngle: o.bestOutreachAngle ?? '',
    whyAttractive: o.whyAttractive ?? '',
    whyGoodCandidate: o.whyGoodCandidate ?? '',
    productAngle: o.productAngle ?? '',
    aiOutreachSummary: o.aiOutreachSummary ?? '',
    suggestedFirstMessage: o.suggestedFirstMessage ?? '',
    callPrepNotes: o.callPrepNotes ?? '',
    visitPrepNotes: o.visitPrepNotes ?? '',
    objections: (o.objections ?? []) as { concern: string; response: string }[],
  };
}

export function getActivity(r: Retailer) {
  const a = (r.activity ?? {}) as Record<string, any>;
  return {
    firstContactDate: a.firstContactDate ?? '',
    lastContactDate: a.lastContactDate ?? '',
    nextActionDate: a.nextActionDate ?? '',
    followUpNumber: a.followUpNumber ?? 0,
    meetingScheduled: a.meetingScheduled ?? false,
    conversationNotes: (a.conversationNotes ?? []) as string[],
    outcomeStatus: a.outcomeStatus ?? '',
    suggestedNextStep: a.suggestedNextStep ?? '',
  };
}

export function getAIIntelligence(r: Retailer) {
  const ai = (r.ai_intelligence ?? {}) as Record<string, any>;
  return {
    summary: ai.summary ?? '',
    whyAttractive: ai.whyAttractive ?? '',
    whyGoodStockist: ai.whyGoodStockist ?? '',
    risksOrConcerns: ai.risksOrConcerns ?? '',
    likelyBuyingMotivation: ai.likelyBuyingMotivation ?? '',
    storePositioningAnalysis: ai.storePositioningAnalysis ?? '',
    customerDemographic: ai.customerDemographic ?? '',
    townProfile: ai.townProfile ?? '',
    giftingPotentialAnalysis: ai.giftingPotentialAnalysis ?? '',
    confidenceLevel: (ai.confidenceLevel ?? 'low') as string,
    lastAnalysed: ai.lastAnalysed ?? 'Not yet analysed',
  };
}

export function getPerformancePrediction(r: Retailer) {
  const p = (r.performance_prediction ?? {}) as Record<string, any>;
  return {
    predictedOpeningOrder: p.predictedOpeningOrder ?? '–',
    predictedAnnualValue: p.predictedAnnualValue ?? '–',
    reorderPotential: p.reorderPotential ?? 'low',
    productMixSuitability: p.productMixSuitability ?? 0,
    similarAccountsUsed: (p.similarAccountsUsed ?? []) as string[],
    predictionConfidence: (p.predictionConfidence ?? 'low') as string,
  };
}

export function getQualification(r: Retailer) {
  const q = (r.qualification ?? {}) as Record<string, any>;
  return {
    premiumEnvironment: q.premiumEnvironment ?? false,
    strongMerchandising: q.strongMerchandising ?? false,
    wellPresentedFloor: q.wellPresentedFloor ?? false,
    femaleGiftingAudience: q.femaleGiftingAudience ?? false,
    jewelleryBuyingCustomer: q.jewelleryBuyingCustomer ?? false,
    strongGiftingTrade: q.strongGiftingTrade ?? false,
    jewelleryPresent: q.jewelleryPresent ?? false,
    complementaryBrands: q.complementaryBrands ?? false,
    pricePositionCompatible: q.pricePositionCompatible ?? false,
    touristPotential: q.touristPotential ?? false,
    strongRetailTown: q.strongRetailTown ?? false,
    highFootfall: q.highFootfall ?? false,
    aestheticMatch: q.aestheticMatch ?? false,
    suitableForDisplay: q.suitableForDisplay ?? false,
    noConflictingPositioning: q.noConflictingPositioning ?? false,
  };
}

export function getCompetitorBrands(r: Retailer) {
  return ((r.competitor_brands ?? []) as any[]).map(b => ({
    name: b.name ?? '',
    priceTier: b.priceTier ?? 'mid',
    positioning: b.positioning ?? '',
    complementsNomination: b.complementsNomination ?? false,
  }));
}
