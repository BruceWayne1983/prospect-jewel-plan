export type RetailerCategory = 'jeweller' | 'gift_shop' | 'fashion_boutique' | 'lifestyle_store' | 'premium_accessories';
export type PipelineStage = 'new_lead' | 'research_needed' | 'qualified' | 'priority_outreach' | 'contacted' | 'follow_up_needed' | 'meeting_booked' | 'under_review' | 'approved' | 'rejected';
export type StorePositioning = 'premium' | 'mid_market' | 'budget';
export type SpendPotential = 'small' | 'moderate' | 'strong' | 'high';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type OutreachPriority = 'low' | 'medium' | 'high';
export type ContactMethod = 'email' | 'phone' | 'visit';

export interface QualificationChecklist {
  // Store quality
  premiumEnvironment: boolean;
  strongMerchandising: boolean;
  wellPresentedFloor: boolean;
  // Customer alignment
  femaleGiftingAudience: boolean;
  jewelleryBuyingCustomer: boolean;
  strongGiftingTrade: boolean;
  // Product alignment
  jewelleryPresent: boolean;
  complementaryBrands: boolean;
  pricePositionCompatible: boolean;
  // Location suitability
  touristPotential: boolean;
  strongRetailTown: boolean;
  highFootfall: boolean;
  // Brand suitability
  aestheticMatch: boolean;
  suitableForDisplay: boolean;
  noConflictingPositioning: boolean;
}

export interface CompaniesHouseData {
  legalName?: string;
  companyNumber?: string;
  companyStatus?: string;
  accountsFilingStatus?: string;
  confirmationStatementStatus?: string;
  healthConfidence: ConfidenceLevel;
}

export interface OutreachStrategy {
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  bestContactMethod: ContactMethod;
  outreachPriority: OutreachPriority;
  bestOutreachAngle: string;
  whyAttractive: string;
  whyGoodCandidate: string;
  productAngle: string;
  aiOutreachSummary: string;
  suggestedFirstMessage: string;
  objections: { concern: string; response: string }[];
}

export interface ActivityTracking {
  lastContactDate?: string;
  nextActionDate?: string;
  followUpNumber: number;
  meetingScheduled: boolean;
  conversationNotes: string[];
  outcomeStatus?: string;
}

export interface Retailer {
  id: string;
  // Retail info
  name: string;
  address: string;
  town: string;
  county: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  // Classification
  category: RetailerCategory;
  isIndependent: boolean;
  locationCount: number;
  estimatedStoreSize: string;
  storePositioning: StorePositioning;
  // Public presence
  rating: number;
  reviewCount: number;
  websiteQuality: number; // 0-100
  socialPresence: number; // 0-100
  visualPresentation: number; // 0-100
  merchandisingQuality: number; // 0-100
  hasWebsite: boolean;
  hasSocial: boolean;
  // Brand environment
  jewelleryFocus: boolean;
  giftingFocus: boolean;
  fashionAccessoriesPresent: boolean;
  adjacentBrands: string[];
  storeAestheticQuality: number; // 0-100
  // Location intelligence
  highStreetQuality: number; // 0-100
  touristLocation: boolean;
  affluentArea: boolean;
  retailClusterStrength: number; // 0-100
  distanceToNearestStockist: string;
  // Companies House
  companiesHouse?: CompaniesHouseData;
  // Scores
  fitScore: number;
  commercialHealthScore: number;
  priorityScore: number;
  spendPotentialScore: number;
  // Qualification
  qualification: QualificationChecklist;
  qualificationStatus: 'unqualified' | 'in_progress' | 'qualified' | 'rejected';
  qualificationNotes?: string;
  // Commercial potential
  spendPotential: SpendPotential;
  estimatedSpendBand: string;
  estimatedOpeningOrder: string;
  spendConfidence: ConfidenceLevel;
  // Outreach
  outreach: OutreachStrategy;
  activity: ActivityTracking;
  // Pipeline
  pipelineStage: PipelineStage;
  // Content
  positioning?: string;
  aiNotes?: string;
  riskFlags?: string[];
  lat: number;
  lng: number;
}

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
];

function mkRetailer(base: Partial<Retailer> & { id: string; name: string; town: string; county: string; postcode: string; lat: number; lng: number }): Retailer {
  const defaults: Omit<Retailer, 'id' | 'name' | 'town' | 'county' | 'postcode' | 'lat' | 'lng'> = {
    address: `${Math.floor(1 + Math.random() * 80)} High Street`,
    category: 'jeweller',
    isIndependent: true,
    locationCount: 1,
    estimatedStoreSize: '800-1200 sq ft',
    storePositioning: 'premium',
    rating: 4.5,
    reviewCount: 150,
    websiteQuality: 70,
    socialPresence: 65,
    visualPresentation: 70,
    merchandisingQuality: 70,
    hasWebsite: true,
    hasSocial: true,
    jewelleryFocus: true,
    giftingFocus: false,
    fashionAccessoriesPresent: false,
    adjacentBrands: [],
    storeAestheticQuality: 70,
    highStreetQuality: 70,
    touristLocation: false,
    affluentArea: false,
    retailClusterStrength: 60,
    distanceToNearestStockist: '5+ miles',
    fitScore: 70,
    commercialHealthScore: 70,
    priorityScore: 70,
    spendPotentialScore: 70,
    qualification: {
      premiumEnvironment: true, strongMerchandising: true, wellPresentedFloor: true,
      femaleGiftingAudience: true, jewelleryBuyingCustomer: true, strongGiftingTrade: false,
      jewelleryPresent: true, complementaryBrands: false, pricePositionCompatible: true,
      touristPotential: false, strongRetailTown: true, highFootfall: true,
      aestheticMatch: true, suitableForDisplay: true, noConflictingPositioning: true,
    },
    qualificationStatus: 'unqualified',
    spendPotential: 'moderate',
    estimatedSpendBand: '£5,000–£10,000',
    estimatedOpeningOrder: '£2,000–£4,000',
    spendConfidence: 'medium',
    outreach: {
      bestContactMethod: 'phone',
      outreachPriority: 'medium',
      bestOutreachAngle: 'Italian charm jewellery for gifting customers',
      whyAttractive: 'Good location and customer base',
      whyGoodCandidate: 'Existing jewellery range with room for Nomination',
      productAngle: 'Composable collection as entry point',
      aiOutreachSummary: 'This retailer shows good potential for Nomination.',
      suggestedFirstMessage: 'Dear team, I\'d love to introduce you to Nomination...',
      objections: [
        { concern: 'Already carry enough jewellery brands', response: 'Nomination fills a unique niche in composable Italian charm jewellery — it complements rather than competes with existing ranges.' },
        { concern: 'Unsure about customer demand', response: 'Nomination is the UK\'s fastest growing charm brand with strong consumer awareness. We provide full marketing support.' },
      ],
    },
    activity: {
      followUpNumber: 0,
      meetingScheduled: false,
      conversationNotes: [],
    },
    pipelineStage: 'new_lead',
    phone: `01${Math.floor(100 + Math.random() * 900)} ${Math.floor(100000 + Math.random() * 900000)}`,
    email: undefined,
  };
  return { ...defaults, ...base } as Retailer;
}

export const mockRetailers: Retailer[] = [
  mkRetailer({
    id: 'r1', name: 'Clifton Fine Jewellers', town: 'Bristol', county: 'Avon', postcode: 'BS8 1AA', lat: 51.4545, lng: -2.6289,
    address: '42 Clifton Village, Princess Victoria Street',
    category: 'jeweller', storePositioning: 'premium', rating: 4.7, reviewCount: 234,
    websiteQuality: 88, socialPresence: 82, visualPresentation: 90, merchandisingQuality: 88,
    jewelleryFocus: true, giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Pandora', 'Thomas Sabo', 'Kit Heath', 'Swarovski'],
    storeAestheticQuality: 92, highStreetQuality: 90, affluentArea: true, retailClusterStrength: 85,
    distanceToNearestStockist: '3.2 miles',
    fitScore: 92, commercialHealthScore: 88, priorityScore: 95, spendPotentialScore: 85,
    qualification: {
      premiumEnvironment: true, strongMerchandising: true, wellPresentedFloor: true,
      femaleGiftingAudience: true, jewelleryBuyingCustomer: true, strongGiftingTrade: true,
      jewelleryPresent: true, complementaryBrands: true, pricePositionCompatible: true,
      touristPotential: true, strongRetailTown: true, highFootfall: true,
      aestheticMatch: true, suitableForDisplay: true, noConflictingPositioning: true,
    },
    qualificationStatus: 'qualified',
    qualificationNotes: 'Excellent all-round prospect. Clifton Village is premium retail with strong gifting trade.',
    spendPotential: 'high', estimatedSpendBand: '£8,000–£15,000', estimatedOpeningOrder: '£3,500–£5,000', spendConfidence: 'high',
    pipelineStage: 'priority_outreach',
    companiesHouse: { legalName: 'Clifton Fine Jewellers Ltd', companyNumber: '08234567', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'Sarah Whitfield', contactRole: 'Owner', contactEmail: 'sarah@cliftonfine.co.uk', contactPhone: '0117 973 4521',
      bestContactMethod: 'phone', outreachPriority: 'high',
      bestOutreachAngle: 'Premium Italian charm jewellery to complement their existing designer collections in affluent Clifton Village',
      whyAttractive: 'Premium independent in Bristol\'s most affluent retail quarter. Strong existing jewellery trade with complementary brand mix. High tourist and local affluent footfall.',
      whyGoodCandidate: 'Already stocks multiple designer jewellery brands suggesting openness to new collections. Gifting focus aligns perfectly with Nomination. Premium store environment ideal for branded display.',
      productAngle: 'Lead with Composable Classic collection — perfect gifting piece that complements their Pandora and Thomas Sabo offering without direct competition.',
      aiOutreachSummary: 'Clifton Fine Jewellers is a top-tier prospect. Located in Bristol\'s premier retail village with an affluent customer base and strong tourist trade, they already demonstrate a successful multi-brand jewellery strategy. Nomination\'s Italian charm positioning would add a unique European dimension to their collection. The gifting angle is particularly strong — their existing Pandora and Thomas Sabo customers are the ideal Nomination demographic.',
      suggestedFirstMessage: 'Dear Sarah,\n\nI hope this message finds you well. I\'m Emma-Louise Gregory, the Nomination brand representative for the South West, and I\'ve long admired what you\'ve built at Clifton Fine Jewellers.\n\nI\'d love to introduce you to Nomination — Italy\'s leading composable jewellery brand. We\'re seeing exceptional results with premium independents like yours, particularly around gifting. Our collections complement your existing brand mix beautifully without competing directly.\n\nWould you be open to a brief introductory call this week? I\'d love to share how Nomination is performing with similar retailers across the region.\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'We already carry several jewellery brands', response: 'Nomination occupies a unique niche — Italian composable charm jewellery. It sits alongside brands like Pandora and Thomas Sabo without direct competition, and our data shows it actually increases overall jewellery category spend.' },
        { concern: 'Unsure about allocating display space', response: 'We provide a compact, elegant branded display unit at no cost. Most retailers find it fits easily into existing jewellery areas and the visual impact drives enquiries from day one.' },
        { concern: 'What marketing support do you offer?', response: 'Full launch support including POS, digital assets, staff training, and ongoing seasonal campaign materials. We also drive local awareness through social media and influencer partnerships.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Identified as priority prospect — June 2025', 'Website and social reviewed — strong presentation'] },
    positioning: 'Premium independent jeweller in affluent Clifton Village. Strong bridal and designer collections with excellent gifting trade. Well-established with loyal customer base.',
    aiNotes: 'Excellent fit for Nomination. Affluent catchment, strong footfall, complementary brand mix. No competing Italian charm brands currently stocked. The store\'s visual merchandising is exceptional and would showcase Nomination beautifully.',
    riskFlags: [],
    email: 'info@cliftonfine.co.uk', website: 'https://cliftonfine.co.uk', instagram: '@cliftonfinejewellers',
  }),
  mkRetailer({
    id: 'r2', name: 'The Bath Gem Company', town: 'Bath', county: 'Somerset', postcode: 'BA1 1SX', lat: 51.3811, lng: -2.3590,
    address: '15 Milsom Street',
    category: 'jeweller', storePositioning: 'premium', rating: 4.8, reviewCount: 312,
    websiteQuality: 92, socialPresence: 88, visualPresentation: 94, merchandisingQuality: 91,
    jewelleryFocus: true, giftingFocus: true, fashionAccessoriesPresent: false,
    adjacentBrands: ['Georg Jensen', 'Monica Vinader', 'Astley Clarke'],
    storeAestheticQuality: 95, highStreetQuality: 95, touristLocation: true, affluentArea: true, retailClusterStrength: 92,
    distanceToNearestStockist: '8+ miles',
    fitScore: 96, commercialHealthScore: 91, priorityScore: 98, spendPotentialScore: 92,
    qualification: {
      premiumEnvironment: true, strongMerchandising: true, wellPresentedFloor: true,
      femaleGiftingAudience: true, jewelleryBuyingCustomer: true, strongGiftingTrade: true,
      jewelleryPresent: true, complementaryBrands: true, pricePositionCompatible: true,
      touristPotential: true, strongRetailTown: true, highFootfall: true,
      aestheticMatch: true, suitableForDisplay: true, noConflictingPositioning: true,
    },
    qualificationStatus: 'qualified',
    qualificationNotes: 'Exceptional prospect. Bath\'s premium jeweller with world-class tourist footfall.',
    spendPotential: 'high', estimatedSpendBand: '£10,000–£20,000', estimatedOpeningOrder: '£4,000–£7,000', spendConfidence: 'high',
    pipelineStage: 'contacted',
    companiesHouse: { legalName: 'The Bath Gem Company Ltd', companyNumber: '06789012', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'James Cartwright', contactRole: 'Managing Director', contactEmail: 'james@bathgem.co.uk', contactPhone: '01225 463 891',
      bestContactMethod: 'email', outreachPriority: 'high',
      bestOutreachAngle: 'Capitalise on Bath\'s exceptional tourist trade with Nomination\'s gifting-perfect Italian charm collections',
      whyAttractive: 'Bath\'s premier jeweller on the city\'s finest shopping street. UNESCO World Heritage tourist footfall combined with affluent local clientele.',
      whyGoodCandidate: 'Already curates a world-class contemporary jewellery selection. Nomination would be the only Italian charm brand, filling a clear gap. Their tourist trade is perfectly suited to Nomination\'s gifting appeal.',
      productAngle: 'Lead with the full Composable range plus seasonal limited editions — Bath tourists are gift buyers and the collectible nature of Nomination drives repeat visits.',
      aiOutreachSummary: 'The Bath Gem Company is the highest-priority prospect in the territory. Their Milsom Street location delivers Bath\'s premium tourist and local footfall. The store curates exceptional contemporary jewellery brands and Nomination would add a unique Italian charm dimension. Their gifting-heavy customer base is the ideal Nomination demographic. No competing charm brands in stock.',
      suggestedFirstMessage: 'Dear James,\n\nI\'m Emma-Louise Gregory from Nomination, and I wanted to reach out personally about an exciting opportunity for The Bath Gem Company.\n\nNomination is Italy\'s leading composable charm jewellery brand, and we\'re seeing remarkable results with premium jewellers in tourist destinations — the gifting appeal is extraordinary.\n\nGiven your beautiful store and Bath\'s incredible visitor footfall, I believe Nomination could be a significant addition to your collection. I\'d love to arrange a brief presentation at a time that suits you.\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'Our brand mix is carefully curated at a higher price point', response: 'Nomination\'s price point (£29–£169) actually complements premium brands beautifully — it captures the impulse gifting customer who might not buy Georg Jensen but still wants quality Italian jewellery. Many premium jewellers see it lift overall category performance.' },
        { concern: 'Concerned about brand perception alongside luxury names', response: 'Nomination is positioned as accessible Italian luxury. In European markets it sits comfortably alongside premium brands. The quality of our branded display ensures it elevates rather than dilutes your offer.' },
      ],
    },
    activity: { lastContactDate: '2025-06-02', followUpNumber: 1, meetingScheduled: false, conversationNotes: ['Initial email sent — James opened but no reply yet', 'Follow-up call planned for next week'], outcomeStatus: 'Awaiting response' },
    positioning: 'Established Bath jeweller known for contemporary designer pieces and tourist trade. Milsom Street location with world-class footfall.',
    aiNotes: 'Top priority prospect. Bath\'s tourist footfall aligns perfectly with Nomination\'s gifting appeal. Strong online presence suggests marketing capability. No competing Italian charm brands.',
    riskFlags: [],
    email: 'info@bathgem.co.uk', website: 'https://bathgem.co.uk', instagram: '@bathgemcompany',
  }),
  mkRetailer({
    id: 'r3', name: 'Montpellier Gems', town: 'Cheltenham', county: 'Gloucestershire', postcode: 'GL50 1SD', lat: 51.8969, lng: -2.0777,
    address: '8 Montpellier Walk',
    rating: 4.6, reviewCount: 189, websiteQuality: 78, socialPresence: 72, visualPresentation: 80, merchandisingQuality: 76,
    adjacentBrands: ['Clogau', 'Coeur de Lion', 'Nomination (nearby)'],
    storeAestheticQuality: 78, highStreetQuality: 88, affluentArea: true, retailClusterStrength: 82,
    distanceToNearestStockist: '0.8 miles',
    fitScore: 85, commercialHealthScore: 82, priorityScore: 87, spendPotentialScore: 75,
    qualificationStatus: 'in_progress',
    spendPotential: 'moderate', estimatedSpendBand: '£6,000–£12,000', estimatedOpeningOrder: '£2,500–£4,000', spendConfidence: 'medium',
    pipelineStage: 'research_needed',
    outreach: {
      bestContactMethod: 'phone', outreachPriority: 'medium',
      bestOutreachAngle: 'Cheltenham\'s affluent Montpellier demographic with strong gifting and racing season trade',
      whyAttractive: 'Prime Montpellier location in one of the UK\'s most affluent spa towns',
      whyGoodCandidate: 'Established jeweller with complementary brand range, though existing Nomination stockist nearby is a consideration',
      productAngle: 'Focus on exclusive or limited collections not available at the nearby stockist to create differentiation',
      aiOutreachSummary: 'Montpellier Gems occupies a prime position in Cheltenham\'s most prestigious retail quarter. The affluent demographics and racing season trade make it attractive, but the existing Nomination stockist 0.8 miles away requires careful territory management.',
      suggestedFirstMessage: 'Dear Montpellier Gems team,\n\nI\'m Emma-Louise from Nomination. Your beautiful Montpellier Walk store caught our attention, and I\'d love to explore whether Nomination could complement your collections.\n\nWould you be open to a brief conversation?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'There\'s already a Nomination stockist nearby', response: 'We carefully manage territory to avoid cannibalisation. We could explore an exclusive or complementary range approach that differentiates your offer.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Flagged during territory mapping — proximity to existing stockist needs assessment'] },
    positioning: 'Cheltenham Montpellier jeweller catering to discerning clientele. Strong racing season trade.',
    aiNotes: 'Good potential. Cheltenham demographics favour premium affordable jewellery. Nomination would complement existing stock.',
    riskFlags: ['Existing Nomination stockist 0.8 miles away'],
    email: 'hello@montpelliergems.co.uk', website: 'https://montpelliergems.co.uk', instagram: '@montpelliergems',
  }),
  mkRetailer({
    id: 'r4', name: 'Exeter Silver Studio', town: 'Exeter', county: 'Devon', postcode: 'EX1 1EE', lat: 50.7236, lng: -3.5275,
    address: '23 Gandy Street',
    rating: 4.5, reviewCount: 156, websiteQuality: 62, socialPresence: 40, visualPresentation: 68, merchandisingQuality: 65,
    hasSocial: false, giftingFocus: false,
    adjacentBrands: ['Kit Heath', 'Gecko'],
    storeAestheticQuality: 65, highStreetQuality: 72,
    distanceToNearestStockist: '12+ miles',
    fitScore: 78, commercialHealthScore: 75, priorityScore: 79, spendPotentialScore: 65,
    spendPotential: 'moderate', estimatedSpendBand: '£5,000–£10,000', estimatedOpeningOrder: '£2,000–£3,500', spendConfidence: 'medium',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'medium',
      bestOutreachAngle: 'Expand from silver into Italian charm jewellery to capture gifting trade on popular Gandy Street',
      whyAttractive: 'Established Exeter presence on the city\'s best independent retail street',
      whyGoodCandidate: 'Silver specialist looking to diversify — Nomination\'s steel and silver lines bridge nicely',
      productAngle: 'Lead with Composable Sterling Silver collection to bridge their existing silver focus',
      aiOutreachSummary: 'Exeter Silver Studio offers a solid entry point into the Exeter market. Their silver focus creates a natural bridge to Nomination\'s collections. Limited social media presence is a development area but the Gandy Street location provides good footfall.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination, and I\'ve been admiring your silver collections. I think Nomination\'s Italian charm jewellery — particularly our sterling silver range — could be a wonderful complement.\n\nCould I pop in for a brief chat when I\'m next in Exeter?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We focus on silver, not fashion jewellery', response: 'Nomination\'s Composable Sterling Silver collection bridges both worlds beautifully. It\'s genuine sterling silver with Italian craftsmanship — many silver specialists find it a natural addition.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Independent silver specialist with growing fashion jewellery range on Exeter\'s popular Gandy Street.',
    aiNotes: 'Moderate fit. Strong silver focus could complement Nomination\'s steel and silver lines. Limited social media presence is a concern.',
    riskFlags: ['Limited social media presence'],
  }),
  mkRetailer({
    id: 'r5', name: 'Harbourside Gifts', town: 'Plymouth', county: 'Devon', postcode: 'PL1 2PD', lat: 50.3685, lng: -4.1427,
    category: 'gift_shop', storePositioning: 'mid_market', rating: 4.3, reviewCount: 98,
    websiteQuality: 58, socialPresence: 55, visualPresentation: 60, merchandisingQuality: 55,
    jewelleryFocus: false, giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Joma Jewellery', 'Estella Bartlett'],
    storeAestheticQuality: 58, highStreetQuality: 65, touristLocation: true,
    distanceToNearestStockist: '15+ miles',
    fitScore: 68, commercialHealthScore: 72, priorityScore: 70, spendPotentialScore: 55,
    spendPotential: 'small', estimatedSpendBand: '£3,000–£6,000', estimatedOpeningOrder: '£1,500–£2,500', spendConfidence: 'medium',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Nomination as a premium upgrade from Joma — gifting customers ready for the next step',
      whyAttractive: 'Plymouth waterfront location with tourist trade and gifting focus',
      whyGoodCandidate: 'Already sells entry-level jewellery brands — Nomination is a natural step up',
      productAngle: 'Start with a compact Composable Classic starter kit range for gift buyers',
      aiOutreachSummary: 'Harbourside Gifts provides a potential entry point into the Plymouth market through its tourist trade and gifting focus. As a gift shop, brand positioning requires careful consideration, but their existing jewellery offering shows customer appetite.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your lovely harbourside shop has a great gifting focus, and I think our Italian charm jewellery could be a wonderful addition — particularly for tourists looking for meaningful gifts.\n\nCould I arrange a brief introduction?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We\'re a gift shop, not a jeweller', response: 'Many of our most successful stockists are premium gift retailers. Nomination\'s gifting appeal is extraordinary — the composable concept makes it the ultimate personalised gift.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Waterfront gift shop with premium lifestyle and jewellery selection. Strong tourist trade.',
    aiNotes: 'Potential entry point for Plymouth market. Gift shop positioning suits Nomination\'s gifting appeal. Lower spend band but good brand exposure.',
    riskFlags: ['Gift shop positioning may dilute brand'],
  }),
  mkRetailer({
    id: 'r6', name: 'Lemon Street Gallery & Gifts', town: 'Truro', county: 'Cornwall', postcode: 'TR1 2PN', lat: 50.2632, lng: -5.0510,
    category: 'gift_shop', storePositioning: 'premium', rating: 4.9, reviewCount: 267,
    websiteQuality: 82, socialPresence: 78, visualPresentation: 85, merchandisingQuality: 80,
    jewelleryFocus: false, giftingFocus: true, touristLocation: true,
    adjacentBrands: ['Alex Monroe', 'Posh Totty Designs'],
    storeAestheticQuality: 85, highStreetQuality: 80, retailClusterStrength: 75,
    distanceToNearestStockist: '20+ miles',
    fitScore: 74, commercialHealthScore: 85, priorityScore: 78, spendPotentialScore: 68,
    spendPotential: 'moderate', estimatedSpendBand: '£4,000–£8,000', estimatedOpeningOrder: '£2,000–£3,000', spendConfidence: 'medium',
    pipelineStage: 'research_needed',
    outreach: {
      bestContactMethod: 'email', outreachPriority: 'medium',
      bestOutreachAngle: 'Cornwall\'s tourist gifting market — Nomination as the perfect holiday memento purchase',
      whyAttractive: 'Award-winning Truro gallery with exceptional tourist trade and premium gifting focus',
      whyGoodCandidate: 'Already curates designer jewellery alongside art and gifts — premium positioning suits Nomination',
      productAngle: 'Seasonal and Cornwall-themed composable charms for tourist gift buyers',
      aiOutreachSummary: 'Lemon Street Gallery offers strategic Cornwall presence. Their premium gift curation and award-winning reputation make them an excellent brand ambassador. Summer tourist trade could deliver strong seasonal performance.',
      suggestedFirstMessage: 'Dear team,\n\nYour gallery is truly special — I love how you blend art, craft and design. I\'m Emma-Louise from Nomination, Italy\'s leading charm jewellery brand.\n\nI think our composable collections would sit beautifully in your space, especially for your gift-buying visitors. Could I send over some information?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'We prefer artisan/craft brands over commercial jewellery', response: 'Nomination is handcrafted in Italy with a strong design heritage. Many gallery retailers find it bridges the gap between artisan and accessible — customers love the Italian craftsmanship story.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Identified via Cornwall tourist retail mapping'] },
    positioning: 'Award-winning Truro gallery and gift shop. Strong tourist trade with premium curation.',
    aiNotes: 'Cornwall presence is strategically valuable. High tourist footfall during summer months. Premium positioning aligns well.',
    riskFlags: [],
    email: 'info@lemonstreetgallery.co.uk', website: 'https://lemonstreetgallery.co.uk', instagram: '@lemonstreetgallery',
  }),
  mkRetailer({
    id: 'r7', name: 'Westbourne Boutique', town: 'Bournemouth', county: 'Dorset', postcode: 'BH4 8DT', lat: 50.7207, lng: -1.8879,
    category: 'fashion_boutique', rating: 4.4, reviewCount: 145,
    websiteQuality: 75, socialPresence: 80, visualPresentation: 78, merchandisingQuality: 74,
    jewelleryFocus: false, fashionAccessoriesPresent: true,
    adjacentBrands: ['Tutti & Co', 'Envy Jewellery', 'Nali'],
    storeAestheticQuality: 76, highStreetQuality: 78, affluentArea: true,
    distanceToNearestStockist: '4 miles',
    fitScore: 82, commercialHealthScore: 79, priorityScore: 83, spendPotentialScore: 72,
    spendPotential: 'moderate', estimatedSpendBand: '£5,000–£10,000', estimatedOpeningOrder: '£2,000–£3,500', spendConfidence: 'medium',
    pipelineStage: 'qualified',
    qualificationStatus: 'qualified',
    outreach: {
      contactName: 'Louise Chen', contactRole: 'Buyer', contactEmail: 'louise@westbourneboutique.co.uk',
      bestContactMethod: 'email', outreachPriority: 'high',
      bestOutreachAngle: 'Fashion-forward Italian charm jewellery for style-conscious Westbourne customers',
      whyAttractive: 'Fashion boutique in affluent Westbourne with strong Instagram following and accessories trade',
      whyGoodCandidate: 'Already buying fashion jewellery and accessories — Nomination is a premium upgrade',
      productAngle: 'Lead with Nomination\'s fashion-forward collections and Instagram-worthy styling',
      aiOutreachSummary: 'Westbourne Boutique\'s fashion-forward positioning and strong social media presence make it an excellent Nomination partner. Their existing accessories trade and Instagram audience align perfectly with Nomination\'s demographic.',
      suggestedFirstMessage: 'Dear Louise,\n\nI\'m Emma-Louise from Nomination — I\'ve been following your boutique on Instagram and love your curation.\n\nNomination\'s Italian charm jewellery has a huge social following, and I think it would resonate brilliantly with your customers. Could we have a quick chat about a potential partnership?\n\nBest,\nEmma-Louise',
      objections: [
        { concern: 'We\'re a fashion boutique, not a jeweller', response: 'That\'s exactly why Nomination works so well — fashion boutiques are our fastest-growing channel. Customers expect to find statement accessories alongside clothing.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Qualified via social media research — strong Instagram engagement'] },
    positioning: 'Fashion-forward boutique in affluent Westbourne area. Accessories and contemporary jewellery.',
    aiNotes: 'Strong prospect. Fashion boutique setting suits Nomination\'s contemporary positioning. Good social following suggests engaged customer base.',
    riskFlags: [],
    email: 'info@westbourneboutique.co.uk', website: 'https://westbourneboutique.co.uk', instagram: '@westbourneboutique',
  }),
  mkRetailer({
    id: 'r8', name: 'The Sandbanks Collection', town: 'Poole', county: 'Dorset', postcode: 'BH13 7PS', lat: 50.6833, lng: -1.9500,
    category: 'lifestyle_store', rating: 4.6, reviewCount: 201,
    websiteQuality: 85, socialPresence: 82, visualPresentation: 88, merchandisingQuality: 85,
    giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Links of London', 'Olivia Burton', 'Annie Haak'],
    storeAestheticQuality: 88, highStreetQuality: 85, affluentArea: true, retailClusterStrength: 70,
    distanceToNearestStockist: '6 miles',
    fitScore: 89, commercialHealthScore: 86, priorityScore: 91, spendPotentialScore: 84,
    spendPotential: 'strong', estimatedSpendBand: '£8,000–£15,000', estimatedOpeningOrder: '£3,000–£5,000', spendConfidence: 'high',
    pipelineStage: 'priority_outreach',
    qualificationStatus: 'qualified',
    companiesHouse: { legalName: 'Sandbanks Collection Ltd', companyNumber: '10456789', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'Rebecca Marsh', contactRole: 'Owner', contactEmail: 'rebecca@sandbankscollection.co.uk', contactPhone: '01202 708 432',
      bestContactMethod: 'phone', outreachPriority: 'high',
      bestOutreachAngle: 'Premium Italian charm jewellery for Sandbanks\' affluent lifestyle clientele',
      whyAttractive: 'Premium lifestyle store in one of the UK\'s wealthiest areas with strong gifting and accessories trade',
      whyGoodCandidate: 'Lifestyle format is ideal for Nomination. Affluent customer base with high disposable income. Already stocks premium jewellery brands.',
      productAngle: 'Full Composable collection with premium sterling silver and gold editions for the luxury customer',
      aiOutreachSummary: 'The Sandbanks Collection represents exceptional commercial potential. Located in one of the UK\'s most affluent postcodes, their lifestyle store format is perfect for Nomination. Their existing premium jewellery brands demonstrate customer appetite, and the gifting focus aligns beautifully.',
      suggestedFirstMessage: 'Dear Rebecca,\n\nI\'m Emma-Louise Gregory, representing Nomination in the South West. Your Sandbanks store is exactly the kind of premium lifestyle destination where Nomination thrives.\n\nOur Italian charm jewellery has a devoted following and I believe your clientele would absolutely love it. Might you be free for a brief call this week?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'Our customers expect luxury brands', response: 'Nomination is positioned as accessible Italian luxury — the Italian heritage and craftsmanship story resonates strongly with affluent customers. Many see it as their everyday jewellery alongside higher-end pieces.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Priority prospect identified — Sandbanks location is exceptional'] },
    positioning: 'Premium lifestyle store in Sandbanks. Designer fashion, accessories and homeware for affluent clientele.',
    aiNotes: 'Excellent location in one of UK\'s most affluent areas. Lifestyle store format perfect for Nomination. High-spending clientele.',
    riskFlags: [],
    email: 'info@sandbankscollection.co.uk', website: 'https://sandbankscollection.co.uk', instagram: '@sandbankscollection',
  }),
  mkRetailer({
    id: 'r9', name: 'Somerset Sparkle', town: 'Taunton', county: 'Somerset', postcode: 'TA1 3PF', lat: 51.0147, lng: -3.1029,
    rating: 4.2, reviewCount: 87, websiteQuality: 48, socialPresence: 35, visualPresentation: 55, merchandisingQuality: 50,
    hasSocial: false, storeAestheticQuality: 52, highStreetQuality: 60,
    adjacentBrands: ['Gecko', 'Fiorelli'],
    distanceToNearestStockist: '18+ miles',
    fitScore: 65, commercialHealthScore: 68, priorityScore: 66, spendPotentialScore: 50,
    spendPotential: 'small', estimatedSpendBand: '£3,000–£6,000', estimatedOpeningOrder: '£1,500–£2,500', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Taunton market coverage with Nomination as an aspirational brand addition',
      whyAttractive: 'Only established jeweller in Taunton town centre — territory coverage opportunity',
      whyGoodCandidate: 'Could benefit from Nomination\'s brand pull and marketing support to elevate their offer',
      productAngle: 'Compact starter range with strong POS support to elevate store presentation',
      aiOutreachSummary: 'Somerset Sparkle is a lower-priority prospect but offers Taunton market coverage where no Nomination presence exists. The store needs development support but the territory gap makes it worth monitoring.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. I\'d love to chat about bringing Italy\'s favourite charm jewellery brand to Taunton. We offer great marketing support to help drive footfall.\n\nCould I pop in when I\'m next in the area?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We\'re not sure our customers would buy Italian charm jewellery', response: 'Nomination has universal appeal — from market towns to city centres. We provide full launch support including staff training and marketing materials to build awareness quickly.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'High street jeweller with traditional and contemporary ranges. Taunton town centre.',
    aiNotes: 'Decent prospect for Taunton market coverage. Lower priority due to limited digital presence and smaller catchment.',
    riskFlags: ['Limited digital presence', 'Smaller catchment area'],
  }),
  mkRetailer({
    id: 'r10', name: 'Cathedral Quarter Jewellery', town: 'Gloucester', county: 'Gloucestershire', postcode: 'GL1 2LR', lat: 51.8642, lng: -2.2443,
    rating: 4.4, reviewCount: 134, websiteQuality: 70, socialPresence: 62, visualPresentation: 72, merchandisingQuality: 68,
    adjacentBrands: ['Clogau', 'D for Diamond'],
    storeAestheticQuality: 70, highStreetQuality: 72,
    distanceToNearestStockist: '8 miles',
    fitScore: 77, commercialHealthScore: 74, priorityScore: 78, spendPotentialScore: 65,
    spendPotential: 'moderate', estimatedSpendBand: '£5,000–£10,000', estimatedOpeningOrder: '£2,000–£3,500', spendConfidence: 'medium',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'phone', outreachPriority: 'medium',
      bestOutreachAngle: 'Cathedral Quarter heritage setting meets modern Italian charm jewellery',
      whyAttractive: 'Independent jeweller near Gloucester Cathedral with loyal customer base',
      whyGoodCandidate: 'Gloucester lacks Nomination presence and this store has the right customer base',
      productAngle: 'Classic Composable collection with heritage and traditional styling emphasis',
      aiOutreachSummary: 'Cathedral Quarter Jewellery provides Gloucester market coverage with a well-established independent in a heritage setting. Solid rather than exceptional potential.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your lovely shop in the Cathedral Quarter caught my eye, and I think our Italian charm jewellery could be a wonderful addition to your collection.\n\nCould we arrange a brief chat?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'Gloucester doesn\'t have the same footfall as Cheltenham', response: 'The Cathedral and Quays are driving significant footfall growth. Nomination\'s price point works well in market towns — it\'s accessible luxury.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Independent jeweller near Gloucester Cathedral. Mix of traditional and modern.',
    aiNotes: 'Gloucester market lacks Nomination presence. Good independent with loyal customer base.',
    riskFlags: [],
    email: 'info@cathedralquarterjewellery.co.uk',
  }),
  mkRetailer({
    id: 'r11', name: 'Fisherton Mill', town: 'Salisbury', county: 'Wiltshire', postcode: 'SP2 7QY', lat: 51.0688, lng: -1.8003,
    category: 'lifestyle_store', rating: 4.7, reviewCount: 289,
    websiteQuality: 80, socialPresence: 75, visualPresentation: 82, merchandisingQuality: 78,
    jewelleryFocus: false, giftingFocus: true, touristLocation: true,
    adjacentBrands: ['Local artisan jewellers', 'Studio pieces'],
    storeAestheticQuality: 82, highStreetQuality: 75, retailClusterStrength: 65,
    distanceToNearestStockist: '15+ miles',
    fitScore: 73, commercialHealthScore: 88, priorityScore: 76, spendPotentialScore: 62,
    spendPotential: 'moderate', estimatedSpendBand: '£4,000–£8,000', estimatedOpeningOrder: '£2,000–£3,000', spendConfidence: 'medium',
    pipelineStage: 'research_needed',
    outreach: {
      bestContactMethod: 'email', outreachPriority: 'medium',
      bestOutreachAngle: 'Italian craftsmanship story aligns with Fisherton Mill\'s artisan heritage positioning',
      whyAttractive: 'Award-winning arts venue with strong tourist footfall and premium gifting trade',
      whyGoodCandidate: 'Unique venue where Italian craftsmanship story resonates with art-appreciating customers',
      productAngle: 'Emphasise Italian heritage and craftsmanship — position Nomination as wearable Italian design',
      aiOutreachSummary: 'Fisherton Mill is a unique prospect. The converted mill\'s artisan positioning could work for or against Nomination — the Italian craftsmanship angle is key. Strong tourist trade and commercially healthy business.',
      suggestedFirstMessage: 'Dear Fisherton Mill team,\n\nI\'m Emma-Louise from Nomination — Italy\'s leading composable charm jewellery brand. I love what you\'ve created at the Mill.\n\nOur pieces are handcrafted in Italy with real design heritage, and I think they\'d sit beautifully alongside your artisan collections. Could I send some information?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'We focus on artisan and craft — commercial brands don\'t fit', response: 'Nomination is genuinely handcrafted in Brescia, Italy. Each piece tells a story. Many artisan-focused retailers find it a perfect bridge between craft jewellery and accessible luxury.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Converted mill housing galleries, craft studios and lifestyle retail. Strong local following.',
    aiNotes: 'Unique venue with strong local following. Nomination could benefit from artisan/craft association. Tourist appeal.',
    riskFlags: ['Artisan positioning may not align'],
    email: 'info@fishertonmill.co.uk', website: 'https://fishertonmill.co.uk', instagram: '@fishertonmill',
  }),
  mkRetailer({
    id: 'r12', name: 'The Designer Rooms', town: 'Swindon', county: 'Wiltshire', postcode: 'SN1 1BD', lat: 51.5600, lng: -1.7800,
    category: 'fashion_boutique', storePositioning: 'mid_market', rating: 4.1, reviewCount: 76,
    websiteQuality: 55, socialPresence: 50, visualPresentation: 58, merchandisingQuality: 52,
    fashionAccessoriesPresent: true,
    adjacentBrands: ['Fiorelli', 'Buckley London'],
    storeAestheticQuality: 55, highStreetQuality: 55,
    distanceToNearestStockist: '20+ miles',
    fitScore: 62, commercialHealthScore: 65, priorityScore: 63, spendPotentialScore: 48,
    spendPotential: 'small', estimatedSpendBand: '£4,000–£7,000', estimatedOpeningOrder: '£1,500–£2,500', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Elevate the accessories offering with a recognised Italian brand',
      whyAttractive: 'Swindon territory coverage — no Nomination presence in the area',
      whyGoodCandidate: 'Fashion boutique with accessories department could benefit from Nomination\'s brand pull',
      productAngle: 'Entry-level Composable range with strong brand marketing support',
      aiOutreachSummary: 'The Designer Rooms is lower priority. Swindon demographics are less aligned with Nomination\'s core positioning, but the territory gap and fashion boutique format offer some potential.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. I think our Italian charm jewellery could bring something fresh and exciting to your accessories range.\n\nWould you be interested in learning more?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'Our customers are more price-conscious', response: 'Nomination\'s price point starts at just £29, making it accessible. The composable concept drives repeat purchases which builds great average transaction values over time.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Designer fashion boutique with accessories department in Swindon town centre.',
    aiNotes: 'Lower priority. Swindon demographics less aligned with Nomination positioning, but could provide market coverage.',
    riskFlags: ['Market demographics less aligned'],
  }),
  mkRetailer({
    id: 'r13', name: 'Park Street Accessories', town: 'Bristol', county: 'Avon', postcode: 'BS1 5NT', lat: 51.4555, lng: -2.6030,
    category: 'premium_accessories', rating: 4.5, reviewCount: 167,
    websiteQuality: 80, socialPresence: 85, visualPresentation: 82, merchandisingQuality: 78,
    jewelleryFocus: false, fashionAccessoriesPresent: true,
    adjacentBrands: ['Tutti & Co', 'Pilgrim', 'Dansk'],
    storeAestheticQuality: 80, highStreetQuality: 82, affluentArea: true,
    distanceToNearestStockist: '2 miles',
    fitScore: 84, commercialHealthScore: 81, priorityScore: 86, spendPotentialScore: 75,
    spendPotential: 'moderate', estimatedSpendBand: '£6,000–£12,000', estimatedOpeningOrder: '£2,500–£4,000', spendConfidence: 'medium',
    pipelineStage: 'qualified',
    qualificationStatus: 'qualified',
    outreach: {
      contactName: 'Megan Torres', contactRole: 'Manager', contactEmail: 'megan@parkstaccessories.co.uk',
      bestContactMethod: 'email', outreachPriority: 'high',
      bestOutreachAngle: 'Instagram-ready Italian charm jewellery for Park Street\'s style-conscious millennial customers',
      whyAttractive: 'Trendy Bristol location with strong millennial footfall and excellent social media game',
      whyGoodCandidate: 'Accessories-focused store with fashion-forward curation — Nomination\'s contemporary collections fit perfectly',
      productAngle: 'Nomination\'s trendiest collections, Instagram styling stories, and influencer-friendly brand partnership',
      aiOutreachSummary: 'Park Street Accessories is a strong prospect. Their millennial customer base and social media savvy make them ideal for Nomination\'s contemporary range. Bristol\'s Park Street delivers excellent footfall and the store\'s Instagram presence could amplify brand awareness significantly.',
      suggestedFirstMessage: 'Hi Megan,\n\nI\'m Emma-Louise from Nomination — I\'ve been loving your Instagram feed! Your curation is spot on.\n\nNomination\'s Italian charm jewellery has a massive social following, and I think it would absolutely fly with your customers. Our Instagram assets and styling content are ready to go.\n\nFancy a quick chat?\n\nEmma-Louise ✨',
      objections: [
        { concern: 'We focus on Scandinavian and British brands', response: 'Adding an Italian brand diversifies your offer beautifully. Nomination\'s aesthetic is clean and contemporary — it sits perfectly alongside Scandi design.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Strong social media presence — 12k Instagram followers'] },
    positioning: 'Trendy accessories boutique on Bristol\'s Park Street. Strong millennial following and Instagram presence.',
    aiNotes: 'Great brand fit. Younger demographic aligns with Nomination\'s core audience. Instagram-savvy store.',
    riskFlags: [],
    email: 'hello@parkstaccessories.co.uk', website: 'https://parkstaccessories.co.uk', instagram: '@parkstaccessories',
  }),
  mkRetailer({
    id: 'r14', name: 'Milsom Place Jewellers', town: 'Bath', county: 'Somerset', postcode: 'BA1 1BZ', lat: 51.3825, lng: -2.3580,
    rating: 4.8, reviewCount: 278, websiteQuality: 90, socialPresence: 85, visualPresentation: 92, merchandisingQuality: 90,
    adjacentBrands: ['Roberto Coin', 'Marco Bicego', 'Fope'],
    storeAestheticQuality: 94, highStreetQuality: 95, touristLocation: true, affluentArea: true, retailClusterStrength: 95,
    distanceToNearestStockist: '0.3 miles',
    fitScore: 94, commercialHealthScore: 93, priorityScore: 97, spendPotentialScore: 94,
    spendPotential: 'high', estimatedSpendBand: '£12,000–£25,000', estimatedOpeningOrder: '£5,000–£8,000', spendConfidence: 'high',
    pipelineStage: 'follow_up_needed',
    qualificationStatus: 'qualified',
    qualificationNotes: 'Exceptional prospect — Bath\'s finest jeweller. Already stocks Italian brands so Nomination heritage resonates.',
    companiesHouse: { legalName: 'Milsom Place Jewellers Ltd', companyNumber: '05678901', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'David Ashworth', contactRole: 'Director', contactEmail: 'david@milsomplacejewellers.co.uk', contactPhone: '01225 460 127',
      bestContactMethod: 'phone', outreachPriority: 'high',
      bestOutreachAngle: 'Premium Italian jewellery portfolio expansion — Nomination alongside their existing Roberto Coin and Marco Bicego',
      whyAttractive: 'Bath\'s premier fine jeweller in the city\'s most exclusive shopping quarter. Already stocks Italian luxury brands.',
      whyGoodCandidate: 'Italian jewellery expertise, affluent clientele, world-class location. Nomination adds an accessible Italian charm dimension to complement their fine jewellery.',
      productAngle: 'Premium Composable collection including 18ct gold and gemstone pieces — position at the luxury end of the Nomination range',
      aiOutreachSummary: 'Milsom Place Jewellers is the territory\'s highest-value prospect. Their existing Italian brand expertise (Roberto Coin, Marco Bicego, Fope) makes the Nomination conversation natural. The accessible price point captures customers who admire their fine jewellery but seek everyday Italian pieces. Bath\'s tourist trade amplifies the opportunity significantly.',
      suggestedFirstMessage: 'Dear David,\n\nFollowing our recent conversation, I wanted to follow up on the Nomination opportunity.\n\nGiven your wonderful Italian jewellery portfolio, I\'m confident Nomination would be a natural fit — capturing the everyday and gifting customer who already loves your store but is looking for accessible Italian pieces.\n\nI\'d love to arrange a presentation at your convenience. Would next week work?\n\nBest regards,\nEmma-Louise',
      objections: [
        { concern: 'Nomination\'s price point is below our usual range', response: 'That\'s exactly the opportunity — your customers will buy Nomination as their everyday/gifting piece alongside fine jewellery. It increases store visit frequency and introduces new customers to your brand.' },
        { concern: 'Could it dilute our luxury positioning?', response: 'Not at all. Nomination\'s Italian heritage and elegant display presentation maintain a premium feel. Many fine jewellers find it actually increases overall footfall.' },
      ],
    },
    activity: { lastContactDate: '2025-05-28', nextActionDate: '2025-06-09', followUpNumber: 2, meetingScheduled: false, conversationNotes: ['Initial call — David interested but wants to discuss with partner', 'Follow-up email sent with catalogue and brand pack', 'Need to call again next week'], outcomeStatus: 'Interested — follow up needed' },
    positioning: 'Premium jeweller in Bath\'s Milsom Place shopping quarter. Fine Italian jewellery specialist.',
    aiNotes: 'Exceptional prospect. Prime Bath location, strong commercial health, perfect brand alignment. Highest priority in territory.',
    riskFlags: [],
    email: 'info@milsomplacejewellers.co.uk', website: 'https://milsomplacejewellers.co.uk', instagram: '@milsomplacejewellers',
  }),
  mkRetailer({
    id: 'r15', name: 'Fore Street Treasures', town: 'Exeter', county: 'Devon', postcode: 'EX4 3AT', lat: 50.7230, lng: -3.5340,
    category: 'gift_shop', storePositioning: 'mid_market', rating: 4.3, reviewCount: 112,
    websiteQuality: 55, socialPresence: 50, visualPresentation: 58, merchandisingQuality: 52,
    jewelleryFocus: false, giftingFocus: true,
    adjacentBrands: ['Equilibrium', 'Joe Davies'],
    storeAestheticQuality: 55, highStreetQuality: 68,
    distanceToNearestStockist: '0.5 miles',
    fitScore: 60, commercialHealthScore: 70, priorityScore: 62, spendPotentialScore: 45,
    spendPotential: 'small', estimatedSpendBand: '£3,000–£5,000', estimatedOpeningOrder: '£1,200–£2,000', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Affordable Italian charm jewellery for the gift-buying customer',
      whyAttractive: 'Exeter high street presence for territory coverage',
      whyGoodCandidate: 'Gift shop with jewellery corner — Nomination\'s gifting appeal suits the format',
      productAngle: 'Compact gifting-focused range at accessible price points',
      aiOutreachSummary: 'Lower priority — existing stockist very nearby and mid-market positioning. Only worth pursuing if Exeter Silver Studio doesn\'t convert.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your gift shop looks wonderful and I think our Italian charm jewellery could be a great gifting option for your customers.\n\nCould I pop in for a quick chat?\n\nBest wishes,\nEmma-Louise',
      objections: [],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [] },
    positioning: 'Quirky independent gift shop with jewellery corner on Exeter high street.',
    aiNotes: 'Lower priority but could provide Exeter high street presence. Gift shop format suits Nomination\'s price point.',
    riskFlags: ['Gift shop positioning', 'Existing stockist nearby'],
  }),
  mkRetailer({
    id: 'r16', name: 'The Promenade Collection', town: 'Cheltenham', county: 'Gloucestershire', postcode: 'GL50 1NW', lat: 51.8985, lng: -2.0740,
    category: 'lifestyle_store', rating: 4.6, reviewCount: 198,
    websiteQuality: 82, socialPresence: 78, visualPresentation: 85, merchandisingQuality: 82,
    giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Estella Bartlett', 'Katie Loxton', 'Olivia Burton'],
    storeAestheticQuality: 85, highStreetQuality: 92, affluentArea: true, retailClusterStrength: 88,
    distanceToNearestStockist: '0.8 miles',
    fitScore: 88, commercialHealthScore: 84, priorityScore: 90, spendPotentialScore: 80,
    spendPotential: 'strong', estimatedSpendBand: '£7,000–£14,000', estimatedOpeningOrder: '£3,000–£5,000', spendConfidence: 'high',
    pipelineStage: 'meeting_booked',
    qualificationStatus: 'qualified',
    companiesHouse: { legalName: 'The Promenade Collection Ltd', companyNumber: '09123456', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'Claire Davidson', contactRole: 'Owner', contactEmail: 'claire@promenadecollection.co.uk', contactPhone: '01242 522 187',
      bestContactMethod: 'visit', outreachPriority: 'high',
      bestOutreachAngle: 'Italian charm jewellery for Cheltenham\'s gifting-savvy Promenade shoppers',
      whyAttractive: 'Prime Promenade location in Cheltenham\'s finest retail stretch. Strong gifting and lifestyle focus.',
      whyGoodCandidate: 'Already stocks similar-tier brands and the lifestyle format is ideal for Nomination. Cheltenham demographics are perfect.',
      productAngle: 'Full Composable range plus seasonal collections — Cheltenham\'s racing season and events drive exceptional gifting trade',
      aiOutreachSummary: 'The Promenade Collection is an excellent prospect on Cheltenham\'s premier retail street. The lifestyle format, gifting focus and affluent demographics are ideal. Meeting booked — this is a strong conversion opportunity.',
      suggestedFirstMessage: 'Dear Claire,\n\nLooking forward to our meeting! I\'ll bring a full range of samples and some exciting data on how Nomination is performing with similar lifestyle stores.\n\nSee you soon,\nEmma-Louise',
      objections: [
        { concern: 'Nearby stockist already carries Nomination', response: 'We\'ve carefully assessed the territory — your Promenade location serves a different customer profile and footfall pattern. We can tailor your range to minimise overlap.' },
      ],
    },
    activity: { lastContactDate: '2025-06-04', nextActionDate: '2025-06-12', followUpNumber: 3, meetingScheduled: true, conversationNotes: ['Initial call — Claire very interested', 'Email sent with brand pack', 'Meeting confirmed for June 12th — in-store presentation'], outcomeStatus: 'Meeting booked' },
    positioning: 'Upscale lifestyle store on Cheltenham\'s famous Promenade. Gifting, fashion and accessories.',
    aiNotes: 'Strong prospect. Cheltenham Promenade is prime retail. Lifestyle format complements Nomination. Good commercial health.',
    riskFlags: ['Existing stockist nearby — territory overlap consideration'],
    email: 'info@promenadecollection.co.uk', website: 'https://promenadecollection.co.uk', instagram: '@promenadecollection',
  }),
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
