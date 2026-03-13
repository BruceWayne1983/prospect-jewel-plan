// Types
export type RetailerCategory = 'jeweller' | 'gift_shop' | 'fashion_boutique' | 'lifestyle_store' | 'premium_accessories' | 'concept_store';
export type PipelineStage = 'new_lead' | 'research_needed' | 'qualified' | 'priority_outreach' | 'contacted' | 'follow_up_needed' | 'meeting_booked' | 'under_review' | 'approved' | 'rejected';
export type StorePositioning = 'premium' | 'mid_market' | 'budget';

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'research_needed', label: 'Research Needed' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'priority_outreach', label: 'Priority Outreach' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow_up_needed', label: 'Follow Up Needed' },
  { key: 'meeting_booked', label: 'Meeting Booked' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved Prospect' },
  { key: 'rejected', label: 'Rejected' },
];

export const COUNTIES = ['Somerset', 'Devon', 'Cornwall', 'Dorset', 'Wiltshire', 'Gloucestershire', 'Avon'];

export const CATEGORIES: { key: RetailerCategory; label: string }[] = [
  { key: 'jeweller', label: 'Jeweller' },
  { key: 'gift_shop', label: 'Gift Shop' },
  { key: 'fashion_boutique', label: 'Fashion Boutique' },
  { key: 'lifestyle_store', label: 'Lifestyle Store' },
  { key: 'premium_accessories', label: 'Premium Accessories' },
  { key: 'concept_store', label: 'Concept Store' },
];

// Static reference data (industry benchmarks, not user-specific)
export const performanceBenchmarks = {
  topPerformingTypes: [
    { type: 'Premium jeweller', avgAnnual: '£18,000', reorderRate: '4.2x/year' },
    { type: 'Lifestyle store', avgAnnual: '£12,000', reorderRate: '3.8x/year' },
    { type: 'Fashion boutique', avgAnnual: '£9,000', reorderRate: '3.5x/year' },
    { type: 'Gift shop (premium)', avgAnnual: '£7,000', reorderRate: '3.0x/year' },
  ],
  topPerformingCharacteristics: [
    'Tourist location with gifting trade',
    'Affluent area with female demographic',
    'Existing charm/collectible jewellery range',
    'Strong social media presence',
    'Premium visual merchandising',
  ],
  bestPerformingTownTypes: ['Cathedral/heritage cities', 'Affluent spa towns', 'Premium coastal resorts', 'University cities with premium retail'],
  averageOpeningOrder: '£3,200',
  averageAnnualValue: '£11,500',
  braceletToCharmRatio: '1:3.8',
  bestSeason: 'Christmas (38% of annual)',
  secondBestSeason: "Mother's Day (15% of annual)",
};

export const territoryOpportunities = [
  { town: 'Bath', county: 'Somerset', opportunityScore: 98, currentProspects: 2, predictedValue: '£38,000–£60,000', characteristics: 'UNESCO heritage, 6M+ tourists, affluent locals, premium retail', similarTo: ['York', 'Edinburgh', 'Canterbury'] },
  { town: 'Cheltenham', county: 'Gloucestershire', opportunityScore: 92, currentProspects: 2, predictedValue: '£20,000–£32,000', characteristics: 'Affluent spa town, racing season, premium retail, festivals', similarTo: ['Harrogate', 'Tunbridge Wells'] },
  { town: 'Bristol', county: 'Avon', opportunityScore: 90, currentProspects: 2, predictedValue: '£20,000–£32,000', characteristics: 'Major city, affluent suburbs, young professional, strong independent retail', similarTo: ['Brighton', 'Edinburgh'] },
  { town: 'Bournemouth', county: 'Dorset', opportunityScore: 85, currentProspects: 1, predictedValue: '£12,000–£18,000', characteristics: 'Coastal resort, affluent Westbourne, growing professional demographic', similarTo: ['Brighton', 'Worthing'] },
  { town: 'Poole', county: 'Dorset', opportunityScore: 88, currentProspects: 1, predictedValue: '£14,000–£22,000', characteristics: 'Sandbanks affluence, harbour lifestyle, premium retail', similarTo: ['Salcombe', 'Aldeburgh'] },
  { town: 'Truro', county: 'Cornwall', opportunityScore: 75, currentProspects: 1, predictedValue: '£5,000–£9,000', characteristics: 'Cornwall capital, cathedral city, seasonal tourist trade', similarTo: ['Canterbury (smaller)'] },
  { town: 'Exeter', county: 'Devon', opportunityScore: 72, currentProspects: 2, predictedValue: '£9,000–£15,000', characteristics: 'University city, cathedral, regional hub', similarTo: ['Norwich'] },
  { town: 'Salisbury', county: 'Wiltshire', opportunityScore: 70, currentProspects: 1, predictedValue: '£5,000–£9,000', characteristics: 'Cathedral city, Stonehenge tourism, artisan retail', similarTo: ['Wells', 'Chichester'] },
  { town: 'Stow-on-the-Wold', county: 'Gloucestershire', opportunityScore: 78, currentProspects: 0, predictedValue: '£6,000–£12,000', characteristics: 'Premium Cotswolds destination, exceptional tourist trade, affluent demographics', similarTo: ['Broadway', 'Burford'] },
  { town: 'Dartmouth', county: 'Devon', opportunityScore: 74, currentProspects: 0, predictedValue: '£5,000–£10,000', characteristics: 'Premium harbour town, sailing community, seasonal tourist peak', similarTo: ['Salcombe', 'Fowey'] },
  { town: 'Marlborough', county: 'Wiltshire', opportunityScore: 76, currentProspects: 0, predictedValue: '£5,000–£10,000', characteristics: 'Affluent market town, wide high street, premium independent retail', similarTo: ['Hungerford', 'Tetbury'] },
];

export const salesForecast = [
  { month: 'Jul', existingAccounts: 8500, prospectPipeline: 2200, total: 10700 },
  { month: 'Aug', existingAccounts: 7800, prospectPipeline: 3500, total: 11300 },
  { month: 'Sep', existingAccounts: 9200, prospectPipeline: 4800, total: 14000 },
  { month: 'Oct', existingAccounts: 11500, prospectPipeline: 5500, total: 17000 },
  { month: 'Nov', existingAccounts: 14200, prospectPipeline: 6800, total: 21000 },
  { month: 'Dec', existingAccounts: 22000, prospectPipeline: 8500, total: 30500 },
  { month: 'Jan', existingAccounts: 6500, prospectPipeline: 3200, total: 9700 },
  { month: 'Feb', existingAccounts: 12000, prospectPipeline: 4500, total: 16500 },
  { month: 'Mar', existingAccounts: 9800, prospectPipeline: 4000, total: 13800 },
  { month: 'Apr', existingAccounts: 8200, prospectPipeline: 3800, total: 12000 },
  { month: 'May', existingAccounts: 7500, prospectPipeline: 3500, total: 11000 },
  { month: 'Jun', existingAccounts: 8000, prospectPipeline: 4200, total: 12200 },
];

export const promotionalCampaigns = [
  { id: 'pc1', name: "Valentine's Day Collection", season: 'Spring', startDate: '2025-01-15', endDate: '2025-02-14', description: 'Heart-themed composable charms and bracelet sets. Peak gifting period.', targetRetailerCount: 12, estimatedImpact: '£35,000–£52,000', status: 'completed' as const, topRetailers: ['The Bath Gem Company', 'Clifton Fine Jewellers', 'The Promenade Collection'] },
  { id: 'pc2', name: "Mother's Day Push", season: 'Spring', startDate: '2025-02-20', endDate: '2025-03-30', description: 'Family-themed charms and personalisation campaign. Second biggest season.', targetRetailerCount: 14, estimatedImpact: '£22,000–£38,000', status: 'completed' as const, topRetailers: ['Lemon Street Gallery & Gifts', 'The Bath Gem Company', 'The Promenade Collection'] },
  { id: 'pc3', name: 'Summer Coastal Collection', season: 'Summer', startDate: '2025-05-01', endDate: '2025-08-31', description: 'Sea-inspired charms. Target coastal and tourist retailers.', targetRetailerCount: 10, estimatedImpact: '£28,000–£45,000', status: 'active' as const, topRetailers: ['The Sandbanks Collection', 'Harbourside Gifts', 'Lemon Street Gallery & Gifts'] },
  { id: 'pc4', name: 'Christmas Gift Campaign', season: 'Winter', startDate: '2025-10-01', endDate: '2025-12-24', description: 'Full gifting push. Biggest revenue period of the year (38% of annual).', targetRetailerCount: 16, estimatedImpact: '£55,000–£85,000', status: 'upcoming' as const, topRetailers: ['The Bath Gem Company', 'Clifton Fine Jewellers', 'The Promenade Collection', 'Milsom Place Jewellers'] },
];
