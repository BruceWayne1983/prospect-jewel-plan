// Helpers for the per-field contact_provenance JSONB column on retailers and discovered_prospects.

export type ContactProvenanceSource =
  | 'website'
  | 'google_maps'
  | 'companies_house'
  | 'manual'
  | 'ai_inferred'
  | 'unknown';

export type ContactProvenance = {
  source: ContactProvenanceSource;
  verified_at: string | null;
  verified_by: string | null;
  needs_review: boolean;
};

export type ContactProvenanceField = 'phone' | 'email' | 'address' | 'postcode' | 'instagram';

export type ContactProvenanceMap = Partial<Record<ContactProvenanceField, ContactProvenance>>;

const TRUSTED_SOURCES: ContactProvenanceSource[] = ['website', 'google_maps', 'companies_house', 'manual'];

function coerce(value: unknown): ContactProvenance | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.source !== 'string') return null;
  return {
    source: v.source as ContactProvenanceSource,
    verified_at: typeof v.verified_at === 'string' ? v.verified_at : null,
    verified_by: typeof v.verified_by === 'string' ? v.verified_by : null,
    needs_review: v.needs_review === true,
  };
}

export function getProvenance(
  provenanceData: unknown,
  field: ContactProvenanceField,
): ContactProvenance | null {
  if (!provenanceData || typeof provenanceData !== 'object') return null;
  return coerce((provenanceData as Record<string, unknown>)[field]);
}

export function isVerified(provenance: ContactProvenance | null | undefined): boolean {
  if (!provenance) return false;
  return TRUSTED_SOURCES.includes(provenance.source) && provenance.needs_review === false;
}

export function provenanceLabel(provenance: ContactProvenance | null | undefined): string {
  if (!provenance) return 'No source';
  if (provenance.needs_review) {
    return provenance.source === 'unknown' ? 'Unverified — review required' : 'Needs review';
  }
  switch (provenance.source) {
    case 'website': return 'Verified — official website';
    case 'google_maps': return 'Verified — Google Maps';
    case 'companies_house': return 'Verified — Companies House';
    case 'manual': return 'Verified — manually entered';
    case 'ai_inferred': return 'AI suggestion (unverified)';
    case 'unknown': return 'Unverified';
    default: return 'Unverified';
  }
}

export function provenanceBadgeColor(
  provenance: ContactProvenance | null | undefined,
): 'green' | 'amber' | 'red' | 'grey' {
  if (!provenance) return 'grey';
  if (isVerified(provenance)) return 'green';
  if (provenance.source === 'ai_inferred') return 'red';
  if (provenance.needs_review) return 'amber';
  return 'grey';
}
