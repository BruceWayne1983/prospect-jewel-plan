import { Retailer, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";

export type HealthStatus = "excellent" | "good" | "needs_attention" | "at_risk";

export interface AccountHealth {
  status: HealthStatus;
  score: number; // 0-100
  engagementLevel: "high" | "medium" | "low" | "none";
  daysSinceContact: number | null;
  reorderStatus: "on_track" | "due_soon" | "overdue" | "unknown";
  reorderPotential: string;
  lastOrderDate: string | null;
  nextActionDate: string | null;
  flags: string[];
}

export function getAccountHealth(r: Retailer): AccountHealth {
  const activity = getActivity(r);
  const pred = getPerformancePrediction(r);
  const ai = getAIIntelligence(r);
  const risks = r.risk_flags ?? [];

  // Days since last contact
  let daysSinceContact: number | null = null;
  if (activity.lastContactDate) {
    const last = new Date(activity.lastContactDate);
    if (!isNaN(last.getTime())) {
      daysSinceContact = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Engagement level based on contact recency and activity
  let engagementLevel: AccountHealth["engagementLevel"] = "none";
  if (daysSinceContact !== null) {
    if (daysSinceContact <= 14) engagementLevel = "high";
    else if (daysSinceContact <= 30) engagementLevel = "medium";
    else engagementLevel = "low";
  }
  if (activity.meetingScheduled) engagementLevel = "high";

  // Reorder status from prediction data
  const reorderPotential = pred.reorderPotential ?? "unknown";
  let reorderStatus: AccountHealth["reorderStatus"] = "unknown";
  if (reorderPotential === "high") reorderStatus = "on_track";
  else if (reorderPotential === "medium") reorderStatus = "due_soon";
  else if (reorderPotential === "low") reorderStatus = "overdue";

  // Health flags
  const flags: string[] = [];
  if (daysSinceContact !== null && daysSinceContact > 60) flags.push("No contact in 60+ days");
  else if (daysSinceContact !== null && daysSinceContact > 30) flags.push("No contact in 30+ days");
  if (engagementLevel === "none") flags.push("No engagement recorded");
  if (reorderStatus === "overdue") flags.push("Low reorder potential");
  if (risks.length > 0) flags.push(...risks.slice(0, 2));
  if (!ai.summary) flags.push("No AI analysis");

  // Health score (0-100)
  let score = 50;
  // Fit score contribution (0-25)
  score += Math.min(25, ((r.fit_score ?? 0) / 100) * 25);
  // Engagement contribution (0-25)
  if (engagementLevel === "high") score += 25;
  else if (engagementLevel === "medium") score += 15;
  else if (engagementLevel === "low") score += 5;
  // Reorder contribution (0-15)
  if (reorderStatus === "on_track") score += 15;
  else if (reorderStatus === "due_soon") score += 8;
  // Risk penalty
  score -= risks.length * 8;
  // No AI penalty
  if (!ai.summary) score -= 5;
  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Status
  let status: HealthStatus = "at_risk";
  if (score >= 80) status = "excellent";
  else if (score >= 60) status = "good";
  else if (score >= 40) status = "needs_attention";

  return {
    status,
    score,
    engagementLevel,
    daysSinceContact,
    reorderStatus,
    reorderPotential,
    lastOrderDate: activity.lastContactDate || null,
    nextActionDate: activity.nextActionDate || null,
    flags,
  };
}

export function getHealthColor(status: HealthStatus) {
  switch (status) {
    case "excellent": return "text-success";
    case "good": return "text-gold-dark";
    case "needs_attention": return "text-warning";
    case "at_risk": return "text-destructive";
  }
}

export function getHealthBg(status: HealthStatus) {
  switch (status) {
    case "excellent": return "bg-success/10";
    case "good": return "bg-gold/10";
    case "needs_attention": return "bg-warning/10";
    case "at_risk": return "bg-destructive/10";
  }
}

export function getHealthLabel(status: HealthStatus) {
  switch (status) {
    case "excellent": return "Excellent";
    case "good": return "Good";
    case "needs_attention": return "Needs Attention";
    case "at_risk": return "At Risk";
  }
}

export function getEngagementColor(level: AccountHealth["engagementLevel"]) {
  switch (level) {
    case "high": return "bg-success";
    case "medium": return "bg-gold";
    case "low": return "bg-warning";
    case "none": return "bg-muted-foreground/30";
  }
}

export function getReorderLabel(status: AccountHealth["reorderStatus"]) {
  switch (status) {
    case "on_track": return "On Track";
    case "due_soon": return "Due Soon";
    case "overdue": return "Overdue";
    case "unknown": return "Unknown";
  }
}

export function getReorderColor(status: AccountHealth["reorderStatus"]) {
  switch (status) {
    case "on_track": return "text-success";
    case "due_soon": return "text-warning";
    case "overdue": return "text-destructive";
    case "unknown": return "text-muted-foreground";
  }
}
