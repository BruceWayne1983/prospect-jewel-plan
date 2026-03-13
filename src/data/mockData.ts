export type RetailerCategory = 'jeweller' | 'gift_shop' | 'fashion_boutique' | 'lifestyle_store' | 'premium_accessories';
export type PipelineStage = 'new' | 'researching' | 'high_potential' | 'contact_planned' | 'contacted' | 'meeting_needed' | 'under_review' | 'approved' | 'rejected';

export interface Retailer {
  id: string;
  name: string;
  town: string;
  county: string;
  postcode: string;
  category: RetailerCategory;
  rating: number;
  reviewCount: number;
  isIndependent: boolean;
  hasWebsite: boolean;
  hasSocial: boolean;
  estimatedSpendBand: string;
  fitScore: number;
  commercialHealthScore: number;
  priorityScore: number;
  pipelineStage: PipelineStage;
  phone?: string;
  email?: string;
  website?: string;
  lat: number;
  lng: number;
  positioning?: string;
  aiNotes?: string;
  riskFlags?: string[];
}

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-muted' },
  { key: 'researching', label: 'Researching', color: 'bg-info/20' },
  { key: 'high_potential', label: 'High Potential', color: 'bg-warning/20' },
  { key: 'contact_planned', label: 'Contact Planned', color: 'bg-champagne' },
  { key: 'contacted', label: 'Contacted', color: 'bg-primary/20' },
  { key: 'meeting_needed', label: 'Meeting Needed', color: 'bg-accent/20' },
  { key: 'under_review', label: 'Under Review', color: 'bg-secondary' },
  { key: 'approved', label: 'Approved Prospect', color: 'bg-success/20' },
  { key: 'rejected', label: 'Rejected', color: 'bg-destructive/20' },
];

export const COUNTIES = ['Somerset', 'Devon', 'Cornwall', 'Dorset', 'Wiltshire', 'Gloucestershire', 'Avon'];
export const CATEGORIES: { key: RetailerCategory; label: string }[] = [
  { key: 'jeweller', label: 'Jeweller' },
  { key: 'gift_shop', label: 'Gift Shop' },
  { key: 'fashion_boutique', label: 'Fashion Boutique' },
  { key: 'lifestyle_store', label: 'Lifestyle Store' },
  { key: 'premium_accessories', label: 'Premium Accessories' },
];

const gen = (id: string, name: string, town: string, county: string, postcode: string, category: RetailerCategory, rating: number, reviewCount: number, isIndependent: boolean, hasWebsite: boolean, hasSocial: boolean, spendBand: string, fitScore: number, healthScore: number, priorityScore: number, stage: PipelineStage, lat: number, lng: number, positioning: string, aiNotes: string, riskFlags: string[]): Retailer => ({
  id, name, town, county, postcode, category, rating, reviewCount, isIndependent, hasWebsite, hasSocial,
  estimatedSpendBand: spendBand, fitScore, commercialHealthScore: healthScore, priorityScore, pipelineStage: stage,
  lat, lng, positioning, aiNotes, riskFlags,
  phone: `01${Math.floor(100 + Math.random() * 900)} ${Math.floor(100000 + Math.random() * 900000)}`,
  email: `info@${name.toLowerCase().replace(/[^a-z]/g, '')}.co.uk`,
  website: hasWebsite ? `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.co.uk` : undefined,
});

export const mockRetailers: Retailer[] = [
  gen('r1', 'Clifton Fine Jewellers', 'Bristol', 'Avon', 'BS8 1AA', 'jeweller', 4.7, 234, true, true, true, '£8,000–£15,000', 92, 88, 95, 'high_potential', 51.4545, -2.6289, 'Premium independent jeweller in affluent Clifton Village. Strong bridal and designer collections.', 'Excellent fit for Nomination. Affluent catchment, strong footfall, complementary brand mix. No competing Italian charm brands currently stocked.', []),
  gen('r2', 'The Bath Gem Company', 'Bath', 'Somerset', 'BA1 1SX', 'jeweller', 4.8, 312, true, true, true, '£10,000–£20,000', 96, 91, 98, 'contact_planned', 51.3811, -2.3590, 'Established Bath jeweller known for contemporary designer pieces and tourist trade.', 'Top priority prospect. Bath\'s tourist footfall aligns perfectly with Nomination\'s gifting appeal. Strong online presence suggests marketing capability.', []),
  gen('r3', 'Montpellier Gems', 'Cheltenham', 'Gloucestershire', 'GL50 1SD', 'jeweller', 4.6, 189, true, true, true, '£6,000–£12,000', 85, 82, 87, 'researching', 51.8969, -2.0777, 'Cheltenham Montpellier jeweller catering to discerning clientele.', 'Good potential. Cheltenham demographics favour premium affordable jewellery. Nomination would complement existing stock.', ['Existing Nomination stockist 0.8 miles away']),
  gen('r4', 'Exeter Silver Studio', 'Exeter', 'Devon', 'EX1 1EE', 'jeweller', 4.5, 156, true, true, false, '£5,000–£10,000', 78, 75, 79, 'new', 50.7236, -3.5275, 'Independent silver specialist with growing fashion jewellery range.', 'Moderate fit. Strong silver focus could complement Nomination\'s steel and silver lines. Limited social media presence is a concern.', ['Limited social media presence']),
  gen('r5', 'Harbourside Gifts', 'Plymouth', 'Devon', 'PL1 2PD', 'gift_shop', 4.3, 98, true, true, true, '£3,000–£6,000', 68, 72, 70, 'new', 50.3685, -4.1427, 'Waterfront gift shop with premium lifestyle and jewellery selection.', 'Potential entry point for Plymouth market. Gift shop positioning suits Nomination\'s gifting appeal. Lower spend band but good brand exposure.', ['Gift shop positioning may dilute brand']),
  gen('r6', 'Lemon Street Gallery & Gifts', 'Truro', 'Cornwall', 'TR1 2PN', 'gift_shop', 4.9, 267, true, true, true, '£4,000–£8,000', 74, 85, 78, 'researching', 50.2632, -5.0510, 'Award-winning Truro gallery and gift shop. Strong tourist trade.', 'Cornwall presence is strategically valuable. High tourist footfall during summer months. Premium positioning aligns well.', []),
  gen('r7', 'Westbourne Boutique', 'Bournemouth', 'Dorset', 'BH4 8DT', 'fashion_boutique', 4.4, 145, true, true, true, '£5,000–£10,000', 82, 79, 83, 'high_potential', 50.7207, -1.8879, 'Fashion-forward boutique in affluent Westbourne area. Accessories and contemporary jewellery.', 'Strong prospect. Fashion boutique setting suits Nomination\'s contemporary positioning. Good social following suggests engaged customer base.', []),
  gen('r8', 'The Sandbanks Collection', 'Poole', 'Dorset', 'BH13 7PS', 'lifestyle_store', 4.6, 201, true, true, true, '£8,000–£15,000', 89, 86, 91, 'contact_planned', 50.6833, -1.9500, 'Premium lifestyle store in Sandbanks. Designer fashion, accessories and homeware.', 'Excellent location in one of UK\'s most affluent areas. Lifestyle store format perfect for Nomination. High-spending clientele.', []),
  gen('r9', 'Somerset Sparkle', 'Taunton', 'Somerset', 'TA1 3PF', 'jeweller', 4.2, 87, true, true, false, '£3,000–£6,000', 65, 68, 66, 'new', 51.0147, -3.1029, 'High street jeweller with traditional and contemporary ranges.', 'Decent prospect for Taunton market coverage. Lower priority due to limited digital presence and smaller catchment.', ['Limited digital presence', 'Smaller catchment area']),
  gen('r10', 'Cathedral Quarter Jewellery', 'Gloucester', 'Gloucestershire', 'GL1 2LR', 'jeweller', 4.4, 134, true, true, true, '£5,000–£10,000', 77, 74, 78, 'new', 51.8642, -2.2443, 'Independent jeweller near Gloucester Cathedral. Mix of traditional and modern.', 'Gloucester market lacks Nomination presence. Good independent with loyal customer base.', []),
  gen('r11', 'Fisherton Mill', 'Salisbury', 'Wiltshire', 'SP2 7QY', 'lifestyle_store', 4.7, 289, true, true, true, '£4,000–£8,000', 73, 88, 76, 'researching', 51.0688, -1.8003, 'Converted mill housing galleries, craft studios and lifestyle retail.', 'Unique venue with strong local following. Nomination could benefit from artisan/craft association. Tourist appeal.', ['Artisan positioning may not align']),
  gen('r12', 'The Designer Rooms', 'Swindon', 'Wiltshire', 'SN1 1BD', 'fashion_boutique', 4.1, 76, true, true, true, '£4,000–£7,000', 62, 65, 63, 'new', 51.5600, -1.7800, 'Designer fashion boutique with accessories department.', 'Lower priority. Swindon demographics less aligned with Nomination positioning, but could provide market coverage.', ['Market demographics less aligned']),
  gen('r13', 'Park Street Accessories', 'Bristol', 'Avon', 'BS1 5NT', 'premium_accessories', 4.5, 167, true, true, true, '£6,000–£12,000', 84, 81, 86, 'high_potential', 51.4555, -2.6030, 'Trendy accessories boutique on Bristol\'s Park Street. Strong millennial following.', 'Great brand fit. Younger demographic aligns with Nomination\'s core audience. Instagram-savvy store.', []),
  gen('r14', 'Milsom Place Jewellers', 'Bath', 'Somerset', 'BA1 1BZ', 'jeweller', 4.8, 278, true, true, true, '£12,000–£25,000', 94, 93, 97, 'contacted', 51.3825, -2.3580, 'Premium jeweller in Bath\'s Milsom Place shopping quarter.', 'Exceptional prospect. Prime Bath location, strong commercial health, perfect brand alignment. Highest priority in territory.', []),
  gen('r15', 'Fore Street Treasures', 'Exeter', 'Devon', 'EX4 3AT', 'gift_shop', 4.3, 112, true, true, true, '£3,000–£5,000', 60, 70, 62, 'new', 50.7230, -3.5340, 'Quirky independent gift shop with jewellery corner.', 'Lower priority but could provide Exeter high street presence. Gift shop format suits Nomination\'s price point.', ['Gift shop positioning']),
  gen('r16', 'The Promenade Collection', 'Cheltenham', 'Gloucestershire', 'GL50 1NW', 'lifestyle_store', 4.6, 198, true, true, true, '£7,000–£14,000', 88, 84, 90, 'meeting_needed', 51.8985, -2.0740, 'Upscale lifestyle store on Cheltenham\'s famous Promenade.', 'Strong prospect. Cheltenham Promenade is prime retail. Lifestyle format complements Nomination. Good commercial health.', []),
];

export const getRetailersByStage = (stage: PipelineStage) => mockRetailers.filter(r => r.pipelineStage === stage);
export const getRetailersByCounty = (county: string) => mockRetailers.filter(r => r.county === county);
export const getTotalPipelineValue = () => {
  let total = 0;
  mockRetailers.forEach(r => {
    const match = r.estimatedSpendBand.match(/£([\d,]+)/);
    if (match) total += parseInt(match[1].replace(',', ''));
  });
  return total;
};
