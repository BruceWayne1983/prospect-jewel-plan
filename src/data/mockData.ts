export type RetailerCategory = 'jeweller' | 'gift_shop' | 'fashion_boutique' | 'lifestyle_store' | 'premium_accessories' | 'concept_store';
export type PipelineStage = 'new_lead' | 'research_needed' | 'qualified' | 'priority_outreach' | 'contacted' | 'follow_up_needed' | 'meeting_booked' | 'under_review' | 'approved' | 'rejected';
export type StorePositioning = 'premium' | 'mid_market' | 'budget';
export type SpendPotential = 'small' | 'moderate' | 'strong' | 'high';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type OutreachPriority = 'low' | 'medium' | 'high';
export type ContactMethod = 'email' | 'phone' | 'visit';

export interface QualificationChecklist {
  premiumEnvironment: boolean;
  strongMerchandising: boolean;
  wellPresentedFloor: boolean;
  femaleGiftingAudience: boolean;
  jewelleryBuyingCustomer: boolean;
  strongGiftingTrade: boolean;
  jewelleryPresent: boolean;
  complementaryBrands: boolean;
  pricePositionCompatible: boolean;
  touristPotential: boolean;
  strongRetailTown: boolean;
  highFootfall: boolean;
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

export interface CompetitorBrand {
  name: string;
  priceTier: 'budget' | 'mid' | 'premium' | 'luxury';
  positioning: string;
  complementsNomination: boolean;
}

export interface AIIntelligence {
  summary: string;
  whyAttractive: string;
  whyGoodStockist: string;
  risksOrConcerns: string;
  likelyBuyingMotivation: string;
  storePositioningAnalysis: string;
  customerDemographic: string;
  townProfile: string;
  giftingPotentialAnalysis: string;
  confidenceLevel: ConfidenceLevel;
  lastAnalysed: string;
}

export interface PerformancePrediction {
  predictedOpeningOrder: string;
  predictedAnnualValue: string;
  reorderPotential: 'low' | 'moderate' | 'strong' | 'excellent';
  productMixSuitability: number; // 0-100
  similarAccountsUsed: string[];
  predictionConfidence: ConfidenceLevel;
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
  callPrepNotes?: string;
  visitPrepNotes?: string;
  objections: { concern: string; response: string }[];
}

export interface ActivityTracking {
  firstContactDate?: string;
  lastContactDate?: string;
  nextActionDate?: string;
  followUpNumber: number;
  meetingScheduled: boolean;
  conversationNotes: string[];
  outcomeStatus?: string;
  suggestedNextStep?: string;
}

export interface Retailer {
  id: string;
  name: string;
  address: string;
  town: string;
  county: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  category: RetailerCategory;
  isIndependent: boolean;
  locationCount: number;
  estimatedStoreSize: string;
  storePositioning: StorePositioning;
  rating: number;
  reviewCount: number;
  websiteQuality: number;
  socialPresence: number;
  visualPresentation: number;
  merchandisingQuality: number;
  hasWebsite: boolean;
  hasSocial: boolean;
  jewelleryFocus: boolean;
  giftingFocus: boolean;
  fashionAccessoriesPresent: boolean;
  adjacentBrands: string[];
  competitorBrands: CompetitorBrand[];
  storeAestheticQuality: number;
  highStreetQuality: number;
  touristLocation: boolean;
  affluentArea: boolean;
  retailClusterStrength: number;
  distanceToNearestStockist: string;
  companiesHouse?: CompaniesHouseData;
  fitScore: number;
  commercialHealthScore: number;
  priorityScore: number;
  spendPotentialScore: number;
  qualification: QualificationChecklist;
  qualificationStatus: 'unqualified' | 'in_progress' | 'qualified' | 'rejected';
  qualificationNotes?: string;
  spendPotential: SpendPotential;
  estimatedSpendBand: string;
  estimatedOpeningOrder: string;
  spendConfidence: ConfidenceLevel;
  outreach: OutreachStrategy;
  activity: ActivityTracking;
  pipelineStage: PipelineStage;
  positioning?: string;
  aiNotes?: string;
  riskFlags?: string[];
  lat: number;
  lng: number;
  // New AI fields
  aiIntelligence: AIIntelligence;
  performancePrediction: PerformancePrediction;
  competitorInsight?: string;
}

export interface DiscoveredProspect {
  id: string;
  name: string;
  town: string;
  county: string;
  category: RetailerCategory;
  rating: number;
  reviewCount: number;
  estimatedStoreQuality: number;
  estimatedPricePositioning: StorePositioning;
  predictedFitScore: number;
  discoverySource: string;
  discoveredDate: string;
  status: 'new' | 'reviewing' | 'accepted' | 'dismissed';
  aiReason: string;
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
  { key: 'concept_store', label: 'Concept Store' },
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
    competitorBrands: [],
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
      suggestedNextStep: 'Research retailer online presence and prepare initial outreach',
    },
    pipelineStage: 'new_lead',
    phone: `01${Math.floor(100 + Math.random() * 900)} ${Math.floor(100000 + Math.random() * 900000)}`,
    email: undefined,
    aiIntelligence: {
      summary: 'Standard independent retailer with moderate potential for Nomination.',
      whyAttractive: 'Established retail presence with relevant customer base.',
      whyGoodStockist: 'Existing jewellery range suggests customer appetite for affordable Italian charm jewellery.',
      risksOrConcerns: 'Limited data available for comprehensive assessment.',
      likelyBuyingMotivation: 'Looking to expand jewellery offering with recognised brands.',
      storePositioningAnalysis: 'Mid-premium positioning with traditional retail approach.',
      customerDemographic: 'Broad female demographic, 25-55, gift-buying occasions.',
      townProfile: 'Regional market town with moderate footfall.',
      giftingPotentialAnalysis: 'Moderate gifting potential based on store format and location.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-08',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,500',
      predictedAnnualValue: '£5,000–£10,000',
      reorderPotential: 'moderate',
      productMixSuitability: 65,
      similarAccountsUsed: ['Generic comparison'],
      predictionConfidence: 'medium',
    },
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
    competitorBrands: [
      { name: 'Pandora', priceTier: 'mid', positioning: 'Mass-market charm jewellery', complementsNomination: true },
      { name: 'Thomas Sabo', priceTier: 'mid', positioning: 'German charm and fashion jewellery', complementsNomination: true },
      { name: 'Swarovski', priceTier: 'premium', positioning: 'Crystal jewellery and accessories', complementsNomination: true },
    ],
    competitorInsight: 'Stocks mid-premium jewellery brands that align well with Nomination positioning. Pandora and Thomas Sabo demonstrate strong charm jewellery demand — Nomination would add a unique Italian dimension without direct competition.',
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
      whyAttractive: 'Premium independent in Bristol\'s most affluent retail quarter. Strong existing jewellery trade with complementary brand mix.',
      whyGoodCandidate: 'Already stocks multiple designer jewellery brands suggesting openness to new collections. Gifting focus aligns perfectly with Nomination.',
      productAngle: 'Lead with Composable Classic collection — perfect gifting piece that complements their Pandora and Thomas Sabo offering.',
      aiOutreachSummary: 'Clifton Fine Jewellers is a top-tier prospect. Located in Bristol\'s premier retail village with an affluent customer base and strong tourist trade.',
      suggestedFirstMessage: 'Dear Sarah,\n\nI hope this message finds you well. I\'m Emma-Louise Gregory, the Nomination brand representative for the South West, and I\'ve long admired what you\'ve built at Clifton Fine Jewellers.\n\nI\'d love to introduce you to Nomination — Italy\'s leading composable jewellery brand. We\'re seeing exceptional results with premium independents like yours, particularly around gifting. Our collections complement your existing brand mix beautifully without competing directly.\n\nWould you be open to a brief introductory call this week? I\'d love to share how Nomination is performing with similar retailers across the region.\n\nWarm regards,\nEmma-Louise',
      callPrepNotes: '• Sarah is the owner — decision maker\n• Reference their Pandora/Thomas Sabo success — Nomination complements\n• Ask about gifting trade — likely strong given Clifton demographic\n• Mention local Nomination awareness from Bath/Cheltenham stockists\n• Prepare: What percentage of sales come from charm/collectible jewellery?',
      visitPrepNotes: '• Beautiful store — compliment the visual merchandising\n• Take branded display unit mockup photos showing how it fits\n• Bring full Composable Classic range plus limited editions\n• Note their window display approach — Nomination display would work well\n• Plan: arrive mid-morning when Sarah is likely available',
      objections: [
        { concern: 'We already carry several jewellery brands', response: 'Nomination occupies a unique niche — Italian composable charm jewellery. It sits alongside brands like Pandora and Thomas Sabo without direct competition, and our data shows it actually increases overall jewellery category spend.' },
        { concern: 'Unsure about allocating display space', response: 'We provide a compact, elegant branded display unit at no cost. Most retailers find it fits easily into existing jewellery areas and the visual impact drives enquiries from day one.' },
        { concern: 'What marketing support do you offer?', response: 'Full launch support including POS, digital assets, staff training, and ongoing seasonal campaign materials. We also drive local awareness through social media and influencer partnerships.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Identified as priority prospect — June 2025', 'Website and social reviewed — strong presentation'], suggestedNextStep: 'Call Sarah Whitfield to introduce Nomination and request an in-store meeting' },
    positioning: 'Premium independent jeweller in affluent Clifton Village. Strong bridal and designer collections with excellent gifting trade.',
    aiNotes: 'Excellent fit for Nomination. Affluent catchment, strong footfall, complementary brand mix. No competing Italian charm brands currently stocked.',
    riskFlags: [],
    email: 'info@cliftonfine.co.uk', website: 'https://cliftonfine.co.uk', instagram: '@cliftonfinejewellers',
    aiIntelligence: {
      summary: 'Clifton Fine Jewellers is a premium independent jeweller in Bristol\'s most prestigious retail village. The store demonstrates exceptional visual merchandising, a carefully curated multi-brand jewellery strategy, and a loyal affluent customer base. Their existing charm jewellery success with Pandora and Thomas Sabo validates strong demand for Nomination\'s Italian composable concept.',
      whyAttractive: 'Premium Clifton Village location delivers Bristol\'s wealthiest demographics. The store\'s multi-brand jewellery approach, strong gifting trade, and tourist footfall create an ideal environment for Nomination.',
      whyGoodStockist: 'Proven track record with charm jewellery brands (Pandora, Thomas Sabo), premium store environment suitable for branded display, established gift-buying customer base, and strong online/social presence to amplify brand.',
      risksOrConcerns: 'Minimal risks. Slight concern about brand saturation if too many charm-style brands are stocked, but Nomination\'s Italian positioning differentiates clearly.',
      likelyBuyingMotivation: 'Looking to add a premium European jewellery brand that captures the "Italian craftsmanship" positioning gap. The composable concept drives repeat visits which benefits their overall footfall.',
      storePositioningAnalysis: 'Premium positioning with accessible luxury price points. The store successfully bridges designer jewellery with more accessible brands, which is exactly where Nomination sits.',
      customerDemographic: 'Affluent females aged 25-65. Strong representation of gift buyers (partners, mothers, friends). Professional demographic with high disposable income.',
      townProfile: 'Bristol is the South West\'s largest city with a vibrant retail scene. Clifton Village specifically serves the city\'s most affluent residents and attracts significant tourist footfall.',
      giftingPotentialAnalysis: 'Exceptional gifting potential. Clifton Village\'s demographic profile and the store\'s existing gifting focus make it one of the strongest gifting opportunities in the territory.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-10',
    },
    performancePrediction: {
      predictedOpeningOrder: '£3,500–£5,000',
      predictedAnnualValue: '£12,000–£18,000',
      reorderPotential: 'excellent',
      productMixSuitability: 92,
      similarAccountsUsed: ['Premium jeweller in Bath — £14k annual', 'Clifton boutique comparison — £11k annual'],
      predictionConfidence: 'high',
    },
  }),
  mkRetailer({
    id: 'r2', name: 'The Bath Gem Company', town: 'Bath', county: 'Somerset', postcode: 'BA1 1SX', lat: 51.3811, lng: -2.3590,
    address: '15 Milsom Street',
    category: 'jeweller', storePositioning: 'premium', rating: 4.8, reviewCount: 312,
    websiteQuality: 92, socialPresence: 88, visualPresentation: 94, merchandisingQuality: 91,
    jewelleryFocus: true, giftingFocus: true, fashionAccessoriesPresent: false,
    adjacentBrands: ['Georg Jensen', 'Monica Vinader', 'Astley Clarke'],
    competitorBrands: [
      { name: 'Georg Jensen', priceTier: 'luxury', positioning: 'Scandinavian luxury silver and gold', complementsNomination: true },
      { name: 'Monica Vinader', priceTier: 'premium', positioning: 'Contemporary semi-fine jewellery', complementsNomination: true },
      { name: 'Astley Clarke', priceTier: 'premium', positioning: 'British fine jewellery with demi-fine range', complementsNomination: true },
    ],
    competitorInsight: 'Stocks premium-to-luxury jewellery brands. Nomination fills a clear gap at the accessible end — the "everyday Italian charm" piece alongside their investment jewellery.',
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
      whyGoodCandidate: 'Already curates a world-class contemporary jewellery selection. Nomination would be the only Italian charm brand, filling a clear gap.',
      productAngle: 'Lead with the full Composable range plus seasonal limited editions — Bath tourists are gift buyers.',
      aiOutreachSummary: 'The Bath Gem Company is the highest-priority prospect in the territory. Their Milsom Street location delivers Bath\'s premium tourist and local footfall.',
      suggestedFirstMessage: 'Dear James,\n\nI\'m Emma-Louise Gregory from Nomination, and I wanted to reach out personally about an exciting opportunity for The Bath Gem Company.\n\nNomination is Italy\'s leading composable charm jewellery brand, and we\'re seeing remarkable results with premium jewellers in tourist destinations — the gifting appeal is extraordinary.\n\nGiven your beautiful store and Bath\'s incredible visitor footfall, I believe Nomination could be a significant addition to your collection. I\'d love to arrange a brief presentation at a time that suits you.\n\nBest wishes,\nEmma-Louise',
      callPrepNotes: '• James is MD — key decision maker\n• Reference their Georg Jensen and Monica Vinader success\n• Bath tourist numbers: 6 million visitors/year — enormous gifting opportunity\n• Mention how Nomination performs in other UNESCO heritage cities\n• Ask about seasonal peaks — Christmas and summer will be key',
      visitPrepNotes: '• Milsom Street is Bath\'s premium retail street — dress accordingly\n• The store is beautifully presented — bring high-quality display materials\n• Take premium Composable samples including gold and gemstone pieces\n• Note their lighting and cabinet style for display unit discussion\n• Allow time to browse the store first — shows genuine interest',
      objections: [
        { concern: 'Our brand mix is carefully curated at a higher price point', response: 'Nomination\'s price point (£29–£169) actually complements premium brands beautifully — it captures the impulse gifting customer who might not buy Georg Jensen but still wants quality Italian jewellery.' },
        { concern: 'Concerned about brand perception alongside luxury names', response: 'Nomination is positioned as accessible Italian luxury. In European markets it sits comfortably alongside premium brands. The quality of our branded display ensures it elevates rather than dilutes your offer.' },
      ],
    },
    activity: { lastContactDate: '2025-06-02', followUpNumber: 1, meetingScheduled: false, conversationNotes: ['Initial email sent — James opened but no reply yet', 'Follow-up call planned for next week'], outcomeStatus: 'Awaiting response', suggestedNextStep: 'Follow up with a phone call — reference the email and offer a brief in-store meeting' },
    positioning: 'Established Bath jeweller known for contemporary designer pieces and tourist trade.',
    aiNotes: 'Top priority prospect. Bath\'s tourist footfall aligns perfectly with Nomination\'s gifting appeal.',
    riskFlags: [],
    email: 'info@bathgem.co.uk', website: 'https://bathgem.co.uk', instagram: '@bathgemcompany',
    aiIntelligence: {
      summary: 'The Bath Gem Company is the territory\'s standout prospect. Positioned on Bath\'s finest shopping street with world-class tourist footfall, the store curates an exceptional contemporary jewellery collection. Their existing premium brand portfolio, gifting focus, and commercially healthy business make them the ideal Nomination partner.',
      whyAttractive: 'UNESCO World Heritage city with 6 million annual visitors. Milsom Street delivers the highest-quality footfall in the territory. The store\'s reputation and online presence amplify any brand they stock.',
      whyGoodStockist: 'World-class jewellery curation, exceptional commercial health, perfect gifting customer base, and no competing Italian charm brands. This is the strongest prospect in the territory by every measure.',
      risksOrConcerns: 'Price point perception — James may view Nomination as below his usual brand threshold. The Italian craftsmanship and design heritage story needs to be compelling.',
      likelyBuyingMotivation: 'Capturing the tourist gift buyer who currently browses but doesn\'t buy due to high price points. Nomination fills the "accessible Italian gift" gap.',
      storePositioningAnalysis: 'Ultra-premium positioning. The store is aspirational but successful retailers at this level often benefit most from an accessible entry-point brand.',
      customerDemographic: 'Affluent locals aged 30-65 plus high-volume tourist traffic (international and domestic). Strong gifting occasions including birthdays, anniversaries, and holiday souvenirs.',
      townProfile: 'Bath is a premier UK tourist destination with exceptional retail infrastructure. The city\'s UNESCO status and Georgian architecture attract 6 million+ visitors annually.',
      giftingPotentialAnalysis: 'Exceptional. Bath\'s tourist trade is inherently gift-driven. Nomination\'s composable concept is the perfect "meaningful souvenir" purchase.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-10',
    },
    performancePrediction: {
      predictedOpeningOrder: '£5,000–£7,000',
      predictedAnnualValue: '£18,000–£28,000',
      reorderPotential: 'excellent',
      productMixSuitability: 95,
      similarAccountsUsed: ['Premium jeweller in York — £22k annual', 'Bath comparable — £25k annual'],
      predictionConfidence: 'high',
    },
  }),
  mkRetailer({
    id: 'r3', name: 'Montpellier Gems', town: 'Cheltenham', county: 'Gloucestershire', postcode: 'GL50 1SD', lat: 51.8969, lng: -2.0777,
    address: '8 Montpellier Walk',
    rating: 4.6, reviewCount: 189, websiteQuality: 78, socialPresence: 72, visualPresentation: 80, merchandisingQuality: 76,
    adjacentBrands: ['Clogau', 'Coeur de Lion', 'Nomination (nearby)'],
    competitorBrands: [
      { name: 'Clogau', priceTier: 'mid', positioning: 'Welsh gold heritage jewellery', complementsNomination: true },
      { name: 'Coeur de Lion', priceTier: 'mid', positioning: 'German handcrafted colour jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Stocks mid-range heritage and fashion jewellery. Nomination would add Italian flair. Proximity to existing stockist is the main strategic consideration.',
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
      whyGoodCandidate: 'Established jeweller with complementary brand range',
      productAngle: 'Focus on exclusive or limited collections not available at the nearby stockist',
      aiOutreachSummary: 'Montpellier Gems occupies a prime position in Cheltenham\'s most prestigious retail quarter. Territory management needed due to existing stockist.',
      suggestedFirstMessage: 'Dear Montpellier Gems team,\n\nI\'m Emma-Louise from Nomination. Your beautiful Montpellier Walk store caught our attention, and I\'d love to explore whether Nomination could complement your collections.\n\nWould you be open to a brief conversation?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'There\'s already a Nomination stockist nearby', response: 'We carefully manage territory to avoid cannibalisation. We could explore an exclusive or complementary range approach.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Flagged during territory mapping — proximity to existing stockist needs assessment'], suggestedNextStep: 'Assess territory overlap before pursuing' },
    positioning: 'Cheltenham Montpellier jeweller catering to discerning clientele.',
    aiNotes: 'Good potential. Cheltenham demographics favour premium affordable jewellery.',
    riskFlags: ['Existing Nomination stockist 0.8 miles away'],
    email: 'hello@montpelliergems.co.uk', website: 'https://montpelliergems.co.uk', instagram: '@montpelliergems',
    aiIntelligence: {
      summary: 'Montpellier Gems is a solid mid-premium jeweller in Cheltenham\'s most prestigious retail quarter. The affluent demographic and racing season trade are attractive, but territory management is critical due to an existing Nomination stockist just 0.8 miles away.',
      whyAttractive: 'Prime Montpellier Walk location in one of the UK\'s wealthiest spa towns. Strong racing season trade and affluent local clientele.',
      whyGoodStockist: 'Established jeweller with proven ability to sell mid-premium brands. Complementary range with no direct Italian charm competitors.',
      risksOrConcerns: 'Existing Nomination stockist 0.8 miles away is the primary concern. Territory cannibalisation risk must be assessed before pursuing.',
      likelyBuyingMotivation: 'Would likely be motivated by exclusivity — offering lines not available at the nearby stockist.',
      storePositioningAnalysis: 'Mid-premium positioning with heritage jewellery focus. Cheltenham\'s spa town image elevates all retailers.',
      customerDemographic: 'Affluent females aged 35-65. Strong gift-buying occasions. Racing season brings exceptional footfall.',
      townProfile: 'Cheltenham is one of England\'s most affluent spa towns. The Montpellier area is its most prestigious retail quarter.',
      giftingPotentialAnalysis: 'Strong gifting potential, especially during racing season (March) and Christmas.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-08',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,500–£4,000',
      predictedAnnualValue: '£8,000–£14,000',
      reorderPotential: 'strong',
      productMixSuitability: 78,
      similarAccountsUsed: ['Cheltenham comparable — £10k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r4', name: 'Exeter Silver Studio', town: 'Exeter', county: 'Devon', postcode: 'EX1 1EE', lat: 50.7236, lng: -3.5275,
    address: '23 Gandy Street',
    rating: 4.5, reviewCount: 156, websiteQuality: 62, socialPresence: 40, visualPresentation: 68, merchandisingQuality: 65,
    hasSocial: false, giftingFocus: false,
    adjacentBrands: ['Kit Heath', 'Gecko'],
    competitorBrands: [
      { name: 'Kit Heath', priceTier: 'mid', positioning: 'British contemporary silver jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Focused on silver jewellery. Nomination\'s sterling silver composable range bridges their speciality into charm jewellery territory.',
    storeAestheticQuality: 65, highStreetQuality: 72,
    distanceToNearestStockist: '12+ miles',
    fitScore: 78, commercialHealthScore: 75, priorityScore: 79, spendPotentialScore: 65,
    spendPotential: 'moderate', estimatedSpendBand: '£5,000–£10,000', estimatedOpeningOrder: '£2,000–£3,500', spendConfidence: 'medium',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'medium',
      bestOutreachAngle: 'Expand from silver into Italian charm jewellery to capture gifting trade',
      whyAttractive: 'Established Exeter presence on the city\'s best independent retail street',
      whyGoodCandidate: 'Silver specialist looking to diversify — Nomination\'s steel and silver lines bridge nicely',
      productAngle: 'Lead with Composable Sterling Silver collection',
      aiOutreachSummary: 'Exeter Silver Studio offers a solid entry point into the Exeter market. Their silver focus creates a natural bridge to Nomination.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination, and I\'ve been admiring your silver collections. I think Nomination\'s Italian charm jewellery — particularly our sterling silver range — could be a wonderful complement.\n\nCould I pop in for a brief chat when I\'m next in Exeter?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We focus on silver, not fashion jewellery', response: 'Nomination\'s Composable Sterling Silver collection bridges both worlds beautifully. It\'s genuine sterling silver with Italian craftsmanship.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Plan an in-store visit when next in Exeter' },
    positioning: 'Independent silver specialist with growing fashion jewellery range on Exeter\'s popular Gandy Street.',
    aiNotes: 'Moderate fit. Strong silver focus could complement Nomination\'s steel and silver lines.',
    riskFlags: ['Limited social media presence'],
    aiIntelligence: {
      summary: 'A specialist silver jeweller on Exeter\'s characterful Gandy Street. The store has a loyal following but limited digital presence. The silver speciality creates a natural product bridge to Nomination but the store needs modernisation support.',
      whyAttractive: 'Gandy Street is Exeter\'s independent shopping destination. The store has an established reputation for quality silver pieces.',
      whyGoodStockist: 'Silver speciality creates a natural bridge to Nomination\'s sterling silver composable range. Exeter territory has no existing Nomination presence.',
      risksOrConcerns: 'Limited social media presence and lower website quality suggest a more traditional approach to retail. May need convincing on brand marketing support.',
      likelyBuyingMotivation: 'Diversifying product range to attract younger customers while maintaining silver heritage.',
      storePositioningAnalysis: 'Niche premium positioning within silver jewellery. The store is respected but may be somewhat dated.',
      customerDemographic: 'Female jewellery enthusiasts 30-60. Mix of local regulars and Gandy Street browsers.',
      townProfile: 'Exeter is Devon\'s county city with a university and cathedral-driven footfall. Good regional hub.',
      giftingPotentialAnalysis: 'Moderate. Less gift-focused than other prospects but Exeter\'s student population could drive younger gifting trade.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-07',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,000',
      predictedAnnualValue: '£6,000–£10,000',
      reorderPotential: 'moderate',
      productMixSuitability: 68,
      similarAccountsUsed: ['Silver specialist in Guildford — £7k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r5', name: 'Harbourside Gifts', town: 'Plymouth', county: 'Devon', postcode: 'PL1 2PD', lat: 50.3685, lng: -4.1427,
    category: 'gift_shop', storePositioning: 'mid_market', rating: 4.3, reviewCount: 98,
    websiteQuality: 58, socialPresence: 55, visualPresentation: 60, merchandisingQuality: 55,
    jewelleryFocus: false, giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Joma Jewellery', 'Estella Bartlett'],
    competitorBrands: [
      { name: 'Joma Jewellery', priceTier: 'budget', positioning: 'Affordable sentiment jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Stocks budget-to-mid gifting jewellery. Nomination would be a premium step-up for customers ready to trade up from Joma.',
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
      aiOutreachSummary: 'Harbourside Gifts provides a potential entry point into the Plymouth market through its tourist trade and gifting focus.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your lovely harbourside shop has a great gifting focus, and I think our Italian charm jewellery could be a wonderful addition — particularly for tourists looking for meaningful gifts.\n\nCould I arrange a brief introduction?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We\'re a gift shop, not a jeweller', response: 'Many of our most successful stockists are premium gift retailers. Nomination\'s gifting appeal is extraordinary — the composable concept makes it the ultimate personalised gift.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Low priority — consider after higher priority Exeter and Plymouth prospects' },
    positioning: 'Waterfront gift shop with premium lifestyle and jewellery selection. Strong tourist trade.',
    aiNotes: 'Potential entry point for Plymouth market. Gift shop positioning suits Nomination\'s gifting appeal.',
    riskFlags: ['Gift shop positioning may dilute brand'],
    aiIntelligence: {
      summary: 'A harbour-front gift shop with decent tourist footfall and an established jewellery corner. Mid-market positioning with strong gifting orientation. Lower priority but useful for Plymouth market coverage.',
      whyAttractive: 'Plymouth Barbican waterfront location provides steady tourist footfall. The gifting focus aligns with Nomination\'s core appeal.',
      whyGoodStockist: 'Existing Joma Jewellery sales prove customer appetite for charm-style jewellery. Nomination represents a premium trade-up opportunity.',
      risksOrConcerns: 'Gift shop environment may not showcase Nomination optimally. Mid-market positioning could affect brand perception.',
      likelyBuyingMotivation: 'Looking for higher-margin products to upgrade their jewellery offering from budget brands.',
      storePositioningAnalysis: 'Mid-market gift shop. Functional rather than aspirational retail environment.',
      customerDemographic: 'Tourists and day-trippers (55%), local gift buyers (45%). Predominantly female, 25-55.',
      townProfile: 'Plymouth is Devon\'s largest city with growing waterfront regeneration. Good but not premium retail environment.',
      giftingPotentialAnalysis: 'Good gifting potential through tourist trade. The composable concept works well as a "souvenir with meaning" purchase.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-06',
    },
    performancePrediction: {
      predictedOpeningOrder: '£1,500–£2,500',
      predictedAnnualValue: '£4,000–£7,000',
      reorderPotential: 'moderate',
      productMixSuitability: 55,
      similarAccountsUsed: ['Harbourside gift shop in Torquay — £5k annual'],
      predictionConfidence: 'low',
    },
  }),
  mkRetailer({
    id: 'r6', name: 'Lemon Street Gallery & Gifts', town: 'Truro', county: 'Cornwall', postcode: 'TR1 2PN', lat: 50.2632, lng: -5.0510,
    category: 'gift_shop', storePositioning: 'premium', rating: 4.9, reviewCount: 267,
    websiteQuality: 82, socialPresence: 78, visualPresentation: 85, merchandisingQuality: 80,
    jewelleryFocus: false, giftingFocus: true, touristLocation: true,
    adjacentBrands: ['Alex Monroe', 'Posh Totty Designs'],
    competitorBrands: [
      { name: 'Alex Monroe', priceTier: 'premium', positioning: 'British nature-inspired fine jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Premium artisan jewellery positioning. Nomination\'s Italian craftsmanship story fits the gallery environment.',
    storeAestheticQuality: 85, highStreetQuality: 80, retailClusterStrength: 75,
    distanceToNearestStockist: '20+ miles',
    fitScore: 74, commercialHealthScore: 85, priorityScore: 78, spendPotentialScore: 68,
    spendPotential: 'moderate', estimatedSpendBand: '£4,000–£8,000', estimatedOpeningOrder: '£2,000–£3,000', spendConfidence: 'medium',
    pipelineStage: 'research_needed',
    outreach: {
      bestContactMethod: 'email', outreachPriority: 'medium',
      bestOutreachAngle: 'Cornwall\'s tourist gifting market — Nomination as the perfect holiday memento purchase',
      whyAttractive: 'Award-winning Truro gallery with exceptional tourist trade and premium gifting focus',
      whyGoodCandidate: 'Already curates designer jewellery alongside art and gifts',
      productAngle: 'Seasonal and Cornwall-themed composable charms for tourist gift buyers',
      aiOutreachSummary: 'Lemon Street Gallery offers strategic Cornwall presence. Premium gift curation and award-winning reputation.',
      suggestedFirstMessage: 'Dear team,\n\nYour gallery is truly special — I love how you blend art, craft and design. I\'m Emma-Louise from Nomination, Italy\'s leading charm jewellery brand.\n\nI think our composable collections would sit beautifully in your space, especially for your gift-buying visitors. Could I send over some information?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'We prefer artisan/craft brands over commercial jewellery', response: 'Nomination is handcrafted in Italy with a strong design heritage. Many gallery retailers find it bridges the gap between artisan and accessible.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Identified via Cornwall tourist retail mapping'], suggestedNextStep: 'Send introductory email with Italian heritage angle' },
    positioning: 'Award-winning Truro gallery and gift shop. Strong tourist trade with premium curation.',
    aiNotes: 'Cornwall presence is strategically valuable. High tourist footfall during summer months.',
    riskFlags: [],
    email: 'info@lemonstreetgallery.co.uk', website: 'https://lemonstreetgallery.co.uk', instagram: '@lemonstreetgallery',
    aiIntelligence: {
      summary: 'An award-winning gallery-gift hybrid in Cornwall\'s capital. Exceptional curation and reputation. Strong summer tourist trade with premium gifting focus. Strategic for Cornwall territory coverage.',
      whyAttractive: 'Cornwall\'s best curated gift destination with 4.9★ rating. Tourist footfall peaks dramatically in summer, creating a concentrated selling season.',
      whyGoodStockist: 'Premium curation elevates any brand they stock. Their Alex Monroe success shows appetite for quality jewellery within a gallery context.',
      risksOrConcerns: 'Seasonal trade — Cornwall\'s tourist season is May-September. Winter sales may be significantly lower.',
      likelyBuyingMotivation: 'Adding an Italian brand with strong gifting appeal to complement their existing British designer jewellery.',
      storePositioningAnalysis: 'Premium gallery-retail hybrid. Beautifully curated space that showcases products exceptionally well.',
      customerDemographic: 'Tourists (65% summer), affluent locals (35%). Art and design-conscious demographic. Strong female bias.',
      townProfile: 'Truro is Cornwall\'s only city and retail hub. Cathedral and independent shopping draw significant visitor footfall.',
      giftingPotentialAnalysis: 'Excellent during summer. The gallery environment and tourist profile create perfect "meaningful gift" purchasing moments.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-09',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,000',
      predictedAnnualValue: '£5,000–£9,000',
      reorderPotential: 'moderate',
      productMixSuitability: 72,
      similarAccountsUsed: ['Gallery gift shop in St Ives — £7k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r7', name: 'Westbourne Boutique', town: 'Bournemouth', county: 'Dorset', postcode: 'BH4 8DT', lat: 50.7207, lng: -1.8879,
    category: 'fashion_boutique', rating: 4.4, reviewCount: 145,
    websiteQuality: 75, socialPresence: 80, visualPresentation: 78, merchandisingQuality: 74,
    jewelleryFocus: false, fashionAccessoriesPresent: true,
    adjacentBrands: ['Tutti & Co', 'Envy Jewellery', 'Nali'],
    competitorBrands: [
      { name: 'Tutti & Co', priceTier: 'mid', positioning: 'British fashion accessories and jewellery', complementsNomination: true },
      { name: 'Envy Jewellery', priceTier: 'budget', positioning: 'Fashion-forward costume jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Fashion-forward accessory brands — Nomination adds Italian prestige to the mix and a clear step up in quality.',
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
      whyAttractive: 'Fashion boutique in affluent Westbourne with strong Instagram following',
      whyGoodCandidate: 'Already buying fashion jewellery and accessories',
      productAngle: 'Lead with Nomination\'s fashion-forward collections and Instagram-worthy styling',
      aiOutreachSummary: 'Westbourne Boutique\'s fashion-forward positioning and strong social media presence make it an excellent Nomination partner.',
      suggestedFirstMessage: 'Dear Louise,\n\nI\'m Emma-Louise from Nomination — I\'ve been following your boutique on Instagram and love your curation.\n\nNomination\'s Italian charm jewellery has a huge social following, and I think it would resonate brilliantly with your customers. Could we have a quick chat about a potential partnership?\n\nBest,\nEmma-Louise',
      objections: [
        { concern: 'We\'re a fashion boutique, not a jeweller', response: 'That\'s exactly why Nomination works so well — fashion boutiques are our fastest-growing channel.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Qualified via social media research'], suggestedNextStep: 'Email Louise Chen with Instagram engagement data and brand deck' },
    positioning: 'Fashion-forward boutique in affluent Westbourne area. Accessories and contemporary jewellery.',
    aiNotes: 'Strong prospect. Fashion boutique setting suits Nomination\'s contemporary positioning.',
    riskFlags: [],
    email: 'info@westbourneboutique.co.uk', website: 'https://westbourneboutique.co.uk', instagram: '@westbourneboutique',
    aiIntelligence: {
      summary: 'A fashion-forward boutique in Bournemouth\'s affluent Westbourne district. Strong Instagram presence (8k+ followers) with engaged fashion-conscious following. The accessories trade and social media savvy make this an excellent fit for Nomination\'s contemporary positioning.',
      whyAttractive: 'Westbourne is Bournemouth\'s most affluent shopping area. The boutique\'s Instagram engagement suggests a digitally-savvy approach that could amplify Nomination.',
      whyGoodStockist: 'Fashion boutique format is Nomination\'s fastest-growing channel. Their social media presence means built-in marketing amplification.',
      risksOrConcerns: 'Not a traditional jewellery retailer — may need guidance on jewellery merchandising. Lower commitment to jewellery as a category.',
      likelyBuyingMotivation: 'Adding statement Italian accessories that drive social media engagement and attract new customers.',
      storePositioningAnalysis: 'Fashion-forward mid-to-premium positioning. The boutique prioritises Instagram-worthy aesthetics.',
      customerDemographic: 'Style-conscious women aged 22-45. Strong social media following suggests engaged, trend-aware customer base.',
      townProfile: 'Bournemouth is a major South Coast resort with growing professional demographic. Westbourne is its premium independent retail area.',
      giftingPotentialAnalysis: 'Good. Fashion-forward gifting for friends and self-purchase. The Instagram factor drives "treat yourself" buying.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-09',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,500',
      predictedAnnualValue: '£7,000–£12,000',
      reorderPotential: 'strong',
      productMixSuitability: 76,
      similarAccountsUsed: ['Fashion boutique in Brighton — £9k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r8', name: 'The Sandbanks Collection', town: 'Poole', county: 'Dorset', postcode: 'BH13 7PS', lat: 50.6833, lng: -1.9500,
    category: 'lifestyle_store', rating: 4.6, reviewCount: 201,
    websiteQuality: 85, socialPresence: 82, visualPresentation: 88, merchandisingQuality: 85,
    giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Links of London', 'Olivia Burton', 'Annie Haak'],
    competitorBrands: [
      { name: 'Links of London', priceTier: 'premium', positioning: 'British luxury silver jewellery', complementsNomination: true },
      { name: 'Olivia Burton', priceTier: 'mid', positioning: 'Fashion watches and jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Premium lifestyle brand mix including jewellery. Nomination adds the Italian composable dimension that\'s currently missing from their range.',
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
      whyAttractive: 'Premium lifestyle store in one of the UK\'s wealthiest areas',
      whyGoodCandidate: 'Lifestyle format is ideal for Nomination. Affluent customer base. Already stocks premium jewellery brands.',
      productAngle: 'Full Composable collection with premium sterling silver and gold editions',
      aiOutreachSummary: 'The Sandbanks Collection represents exceptional commercial potential. Located in one of the UK\'s most affluent postcodes.',
      suggestedFirstMessage: 'Dear Rebecca,\n\nI\'m Emma-Louise Gregory, representing Nomination in the South West. Your Sandbanks store is exactly the kind of premium lifestyle destination where Nomination thrives.\n\nOur Italian charm jewellery has a devoted following and I believe your clientele would absolutely love it. Might you be free for a brief call this week?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'Our customers expect luxury brands', response: 'Nomination is positioned as accessible Italian luxury — the Italian heritage and craftsmanship story resonates strongly with affluent customers.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Priority prospect identified — Sandbanks location is exceptional'], suggestedNextStep: 'Call Rebecca Marsh — the Sandbanks clientele is ideal for Nomination' },
    positioning: 'Premium lifestyle store in Sandbanks. Designer fashion, accessories and homeware.',
    aiNotes: 'Excellent location in one of UK\'s most affluent areas. Lifestyle store format perfect for Nomination.',
    riskFlags: [],
    email: 'info@sandbankscollection.co.uk', website: 'https://sandbankscollection.co.uk', instagram: '@sandbankscollection',
    aiIntelligence: {
      summary: 'A premium lifestyle destination in one of Britain\'s most affluent postcodes. The Sandbanks Collection curates designer fashion, accessories, and homeware for a clientele with very high disposable income. Their existing jewellery offering and gifting focus make this an exceptional Nomination prospect.',
      whyAttractive: 'Sandbanks is the UK\'s most expensive peninsula. The customer base has exceptional spending power and an appetite for premium lifestyle brands.',
      whyGoodStockist: 'Lifestyle store format is proven for Nomination. The affluent clientele treats jewellery as an everyday accessory purchase, not a considered investment — perfect for composable charm collecting.',
      risksOrConcerns: 'Minimal. The only consideration is whether Rebecca views Nomination\'s price point as sufficiently premium for her clientele — the Italian heritage story should resolve this.',
      likelyBuyingMotivation: 'Adding a collectible Italian jewellery brand that drives repeat visits from her affluent clientele.',
      storePositioningAnalysis: 'Premium lifestyle positioning. The store is aspirational and beautifully merchandised.',
      customerDemographic: 'Affluent women aged 30-65. High disposable income. Strong self-purchase and gift-buying behaviour.',
      townProfile: 'Poole\'s Sandbanks peninsula is one of the UK\'s most exclusive areas. Very high-net-worth clientele.',
      giftingPotentialAnalysis: 'Exceptional. The affluent demographic drives high-value gifting. Composable charms are perfect "add another" gifts.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-10',
    },
    performancePrediction: {
      predictedOpeningOrder: '£3,500–£5,000',
      predictedAnnualValue: '£14,000–£22,000',
      reorderPotential: 'excellent',
      productMixSuitability: 88,
      similarAccountsUsed: ['Premium lifestyle store in Solihull — £16k annual', 'Sandbanks area benchmark'],
      predictionConfidence: 'high',
    },
  }),
  mkRetailer({
    id: 'r9', name: 'Somerset Sparkle', town: 'Taunton', county: 'Somerset', postcode: 'TA1 3PF', lat: 51.0147, lng: -3.1029,
    rating: 4.2, reviewCount: 87, websiteQuality: 48, socialPresence: 35, visualPresentation: 55, merchandisingQuality: 50,
    hasSocial: false, storeAestheticQuality: 52, highStreetQuality: 60,
    adjacentBrands: ['Gecko', 'Fiorelli'],
    competitorBrands: [
      { name: 'Fiorelli', priceTier: 'budget', positioning: 'Affordable fashion accessories and jewellery', complementsNomination: false },
    ],
    competitorInsight: 'Budget-to-mid jewellery brands. Nomination would be the premium offering but the store may not present it optimally.',
    distanceToNearestStockist: '18+ miles',
    fitScore: 65, commercialHealthScore: 68, priorityScore: 66, spendPotentialScore: 50,
    spendPotential: 'small', estimatedSpendBand: '£3,000–£6,000', estimatedOpeningOrder: '£1,500–£2,500', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Taunton market coverage with Nomination as an aspirational brand addition',
      whyAttractive: 'Only established jeweller in Taunton town centre',
      whyGoodCandidate: 'Could benefit from Nomination\'s brand pull',
      productAngle: 'Compact starter range with strong POS support',
      aiOutreachSummary: 'Somerset Sparkle is lower-priority but offers Taunton market coverage.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. I\'d love to chat about bringing Italy\'s favourite charm jewellery brand to Taunton. We offer great marketing support to help drive footfall.\n\nCould I pop in when I\'m next in the area?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'We\'re not sure our customers would buy Italian charm jewellery', response: 'Nomination has universal appeal. We provide full launch support including staff training and marketing materials.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Low priority — monitor for improvements or revisit if Taunton becomes strategic' },
    positioning: 'High street jeweller with traditional and contemporary ranges. Taunton town centre.',
    aiNotes: 'Decent prospect for Taunton market coverage. Lower priority due to limited digital presence.',
    riskFlags: ['Limited digital presence', 'Smaller catchment area'],
    aiIntelligence: {
      summary: 'A traditional high street jeweller in Taunton with limited digital presence. The store fills a Taunton territory gap but doesn\'t strongly match Nomination\'s ideal retailer profile. Would need significant support to succeed.',
      whyAttractive: 'Taunton territory coverage — no other credible jewellery option in the town.',
      whyGoodStockist: 'Provides market coverage in an underserved area of Somerset.',
      risksOrConcerns: 'Limited digital presence, smaller catchment, and budget-adjacent brand mix suggest lower customer spending power. The store environment may need improvement to showcase Nomination effectively.',
      likelyBuyingMotivation: 'Looking for a recognised brand to drive footfall and elevate their offering.',
      storePositioningAnalysis: 'Traditional mid-market high street jeweller. Functional rather than aspirational.',
      customerDemographic: 'Broad female demographic. More price-sensitive than urban counterparts.',
      townProfile: 'Taunton is Somerset\'s county town. Moderate retail footfall with a traditional market town feel.',
      giftingPotentialAnalysis: 'Moderate. Christmas and Mother\'s Day peaks. Limited tourist trade.',
      confidenceLevel: 'low',
      lastAnalysed: '2025-06-05',
    },
    performancePrediction: {
      predictedOpeningOrder: '£1,500–£2,000',
      predictedAnnualValue: '£3,500–£6,000',
      reorderPotential: 'low',
      productMixSuitability: 45,
      similarAccountsUsed: ['Market town jeweller benchmark'],
      predictionConfidence: 'low',
    },
  }),
  mkRetailer({
    id: 'r10', name: 'Cathedral Quarter Jewellery', town: 'Gloucester', county: 'Gloucestershire', postcode: 'GL1 2LR', lat: 51.8642, lng: -2.2443,
    rating: 4.4, reviewCount: 134, websiteQuality: 70, socialPresence: 62, visualPresentation: 72, merchandisingQuality: 68,
    adjacentBrands: ['Clogau', 'D for Diamond'],
    competitorBrands: [
      { name: 'Clogau', priceTier: 'mid', positioning: 'Welsh gold heritage jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Heritage jewellery focus. Nomination adds a modern Italian dimension. Clogau customers often appreciate craftsmanship stories.',
    storeAestheticQuality: 70, highStreetQuality: 72,
    distanceToNearestStockist: '8 miles',
    fitScore: 77, commercialHealthScore: 74, priorityScore: 78, spendPotentialScore: 65,
    spendPotential: 'moderate', estimatedSpendBand: '£5,000–£10,000', estimatedOpeningOrder: '£2,000–£3,500', spendConfidence: 'medium',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'phone', outreachPriority: 'medium',
      bestOutreachAngle: 'Cathedral Quarter heritage setting meets modern Italian charm jewellery',
      whyAttractive: 'Independent jeweller near Gloucester Cathedral with loyal customer base',
      whyGoodCandidate: 'Gloucester lacks Nomination presence',
      productAngle: 'Classic Composable collection with heritage emphasis',
      aiOutreachSummary: 'Cathedral Quarter Jewellery provides Gloucester market coverage. Solid rather than exceptional potential.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your lovely shop in the Cathedral Quarter caught my eye, and I think our Italian charm jewellery could be a wonderful addition.\n\nCould we arrange a brief chat?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'Gloucester doesn\'t have the same footfall as Cheltenham', response: 'The Cathedral and Quays are driving significant footfall growth. Nomination\'s price point works well in market towns.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Phone introduction — ask about their customer demographic and jewellery bestsellers' },
    positioning: 'Independent jeweller near Gloucester Cathedral. Mix of traditional and modern.',
    aiNotes: 'Gloucester market lacks Nomination presence. Good independent with loyal customer base.',
    riskFlags: [],
    email: 'info@cathedralquarterjewellery.co.uk',
    aiIntelligence: {
      summary: 'A well-established independent jeweller in Gloucester\'s historic Cathedral Quarter. The store benefits from cathedral visitor footfall and a loyal local customer base. Solid rather than exceptional prospect, providing Gloucester market coverage.',
      whyAttractive: 'Gloucester Cathedral draws 300k+ visitors annually. The heritage setting adds charm.',
      whyGoodStockist: 'Gloucester territory gap needs filling. The store has a proven customer base and heritage selling environment.',
      risksOrConcerns: 'Gloucester\'s retail environment is less premium than nearby Cheltenham. May struggle to achieve top-tier sales volumes.',
      likelyBuyingMotivation: 'Looking for a recognisable brand to compete with Cheltenham retailers.',
      storePositioningAnalysis: 'Traditional independent jeweller with heritage positioning. Reliable but not cutting-edge.',
      customerDemographic: 'Local female customers 30-65. Cathedral tourists provide seasonal boost.',
      townProfile: 'Gloucester is a cathedral city with regeneration. Retail improving but not premium.',
      giftingPotentialAnalysis: 'Moderate. Cathedral tourist trade adds gifting opportunity, especially religious occasions.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-07',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,000',
      predictedAnnualValue: '£6,000–£10,000',
      reorderPotential: 'moderate',
      productMixSuitability: 65,
      similarAccountsUsed: ['Cathedral city jeweller — £7k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r11', name: 'Fisherton Mill', town: 'Salisbury', county: 'Wiltshire', postcode: 'SP2 7QY', lat: 51.0688, lng: -1.8003,
    category: 'lifestyle_store', rating: 4.7, reviewCount: 289,
    websiteQuality: 80, socialPresence: 75, visualPresentation: 82, merchandisingQuality: 78,
    jewelleryFocus: false, giftingFocus: true, touristLocation: true,
    adjacentBrands: ['Local artisan jewellers', 'Studio pieces'],
    competitorBrands: [],
    competitorInsight: 'No direct jewellery brand competitors — all artisan pieces. Nomination would be the first recognisable brand, which could be an advantage or a concern depending on positioning.',
    storeAestheticQuality: 82, highStreetQuality: 75, retailClusterStrength: 65,
    distanceToNearestStockist: '15+ miles',
    fitScore: 73, commercialHealthScore: 88, priorityScore: 76, spendPotentialScore: 62,
    spendPotential: 'moderate', estimatedSpendBand: '£4,000–£8,000', estimatedOpeningOrder: '£2,000–£3,000', spendConfidence: 'medium',
    pipelineStage: 'research_needed',
    outreach: {
      bestContactMethod: 'email', outreachPriority: 'medium',
      bestOutreachAngle: 'Italian craftsmanship story aligns with Fisherton Mill\'s artisan heritage',
      whyAttractive: 'Award-winning arts venue with strong tourist footfall',
      whyGoodCandidate: 'Unique venue where Italian craftsmanship story resonates',
      productAngle: 'Emphasise Italian heritage and craftsmanship — position as wearable Italian design',
      aiOutreachSummary: 'Fisherton Mill is a unique prospect. The converted mill\'s artisan positioning could work for or against Nomination.',
      suggestedFirstMessage: 'Dear Fisherton Mill team,\n\nI\'m Emma-Louise from Nomination — Italy\'s leading composable charm jewellery brand. I love what you\'ve created at the Mill.\n\nOur pieces are handcrafted in Italy with real design heritage, and I think they\'d sit beautifully alongside your artisan collections. Could I send some information?\n\nWarm regards,\nEmma-Louise',
      objections: [
        { concern: 'We focus on artisan and craft — commercial brands don\'t fit', response: 'Nomination is genuinely handcrafted in Brescia, Italy. Each piece tells a story. Many artisan-focused retailers find it a perfect bridge.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Send Italian heritage-focused email introduction' },
    positioning: 'Converted mill housing galleries, craft studios and lifestyle retail.',
    aiNotes: 'Unique venue with strong local following. Nomination could benefit from artisan association.',
    riskFlags: ['Artisan positioning may not align'],
    email: 'info@fishertonmill.co.uk', website: 'https://fishertonmill.co.uk', instagram: '@fishertonmill',
    aiIntelligence: {
      summary: 'A unique arts and lifestyle venue in a converted Salisbury mill. Award-winning gallery and retail space with strong tourist and local following. The artisan positioning requires careful brand alignment but the venue\'s commercial health is excellent.',
      whyAttractive: 'Award-winning venue with loyal following and strong commercial health. Salisbury\'s tourist trade is significant.',
      whyGoodStockist: 'The Italian craftsmanship story aligns with their artisan ethos. The venue\'s reputation could elevate Nomination\'s brand perception locally.',
      risksOrConcerns: 'The venue\'s artisan positioning may create resistance to a "branded" jewellery product. Careful pitch required emphasising Italian craft heritage.',
      likelyBuyingMotivation: 'Adding a commercially strong product that maintains their artisan brand values.',
      storePositioningAnalysis: 'Artisan-premium. A curated environment that values craftsmanship and story above brand names.',
      customerDemographic: 'Art and design-conscious, predominantly female, 30-65. Higher education and income levels.',
      townProfile: 'Salisbury is a historic cathedral city with strong tourist trade. Stonehenge nearby drives significant visitor numbers.',
      giftingPotentialAnalysis: 'Good. The venue attracts gift buyers seeking "something special." Italian craftsmanship story adds gifting appeal.',
      confidenceLevel: 'medium',
      lastAnalysed: '2025-06-06',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,000–£3,000',
      predictedAnnualValue: '£5,000–£9,000',
      reorderPotential: 'moderate',
      productMixSuitability: 62,
      similarAccountsUsed: ['Gallery-retail venue in Winchester — £6k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r12', name: 'The Designer Rooms', town: 'Swindon', county: 'Wiltshire', postcode: 'SN1 1BD', lat: 51.5600, lng: -1.7800,
    category: 'fashion_boutique', storePositioning: 'mid_market', rating: 4.1, reviewCount: 76,
    websiteQuality: 55, socialPresence: 50, visualPresentation: 58, merchandisingQuality: 52,
    fashionAccessoriesPresent: true,
    adjacentBrands: ['Fiorelli', 'Buckley London'],
    competitorBrands: [
      { name: 'Fiorelli', priceTier: 'budget', positioning: 'Affordable fashion accessories', complementsNomination: false },
      { name: 'Buckley London', priceTier: 'budget', positioning: 'Budget fashion jewellery', complementsNomination: false },
    ],
    competitorInsight: 'Budget fashion jewellery brands. Nomination would be a significant premium step-up, which may or may not work with their customer base.',
    storeAestheticQuality: 55, highStreetQuality: 55,
    distanceToNearestStockist: '20+ miles',
    fitScore: 62, commercialHealthScore: 65, priorityScore: 63, spendPotentialScore: 48,
    spendPotential: 'small', estimatedSpendBand: '£4,000–£7,000', estimatedOpeningOrder: '£1,500–£2,500', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Elevate the accessories offering with a recognised Italian brand',
      whyAttractive: 'Swindon territory coverage',
      whyGoodCandidate: 'Fashion boutique with accessories department',
      productAngle: 'Entry-level Composable range with strong brand marketing support',
      aiOutreachSummary: 'The Designer Rooms is lower priority. Swindon demographics are less aligned with Nomination\'s core positioning.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. I think our Italian charm jewellery could bring something fresh to your accessories range.\n\nWould you be interested in learning more?\n\nBest wishes,\nEmma-Louise',
      objections: [
        { concern: 'Our customers are more price-conscious', response: 'Nomination\'s price point starts at just £29, making it accessible. The composable concept drives repeat purchases.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Low priority — only pursue if Swindon becomes strategic' },
    positioning: 'Designer fashion boutique with accessories department in Swindon.',
    aiNotes: 'Lower priority. Swindon demographics less aligned with Nomination positioning.',
    riskFlags: ['Market demographics less aligned'],
    aiIntelligence: {
      summary: 'A mid-market fashion boutique in Swindon town centre. The store stocks budget fashion jewellery brands which suggests a more price-sensitive customer base. Territory coverage opportunity but not a strong brand fit.',
      whyAttractive: 'Swindon has no Nomination presence — territory gap.',
      whyGoodStockist: 'Provides Wiltshire market coverage alongside Fisherton Mill in Salisbury.',
      risksOrConcerns: 'Budget brand mix and Swindon\'s less affluent demographics suggest Nomination may underperform here.',
      likelyBuyingMotivation: 'Looking for a more premium brand to elevate their accessories range and margins.',
      storePositioningAnalysis: 'Mid-market fashion retail. Functional environment without premium finishing.',
      customerDemographic: 'Price-conscious female shoppers, 20-45. Looking for fashion-forward but affordable options.',
      townProfile: 'Swindon is a large town with strong employment but mid-market retail environment.',
      giftingPotentialAnalysis: 'Low-moderate. Price sensitivity may limit gifting spend.',
      confidenceLevel: 'low',
      lastAnalysed: '2025-06-04',
    },
    performancePrediction: {
      predictedOpeningOrder: '£1,500–£2,000',
      predictedAnnualValue: '£3,000–£5,500',
      reorderPotential: 'low',
      productMixSuitability: 40,
      similarAccountsUsed: ['Mid-market boutique benchmark'],
      predictionConfidence: 'low',
    },
  }),
  mkRetailer({
    id: 'r13', name: 'Park Street Accessories', town: 'Bristol', county: 'Avon', postcode: 'BS1 5NT', lat: 51.4555, lng: -2.6030,
    category: 'premium_accessories', rating: 4.5, reviewCount: 167,
    websiteQuality: 80, socialPresence: 85, visualPresentation: 82, merchandisingQuality: 78,
    jewelleryFocus: false, fashionAccessoriesPresent: true,
    adjacentBrands: ['Tutti & Co', 'Pilgrim', 'Dansk'],
    competitorBrands: [
      { name: 'Pilgrim', priceTier: 'mid', positioning: 'Danish fashion jewellery', complementsNomination: true },
      { name: 'Dansk', priceTier: 'mid', positioning: 'Scandinavian design accessories', complementsNomination: true },
    ],
    competitorInsight: 'Scandinavian-focused accessory range. Adding Italian Nomination creates a European multi-origin story that appeals to their design-conscious customers.',
    storeAestheticQuality: 80, highStreetQuality: 82, affluentArea: true,
    distanceToNearestStockist: '2 miles',
    fitScore: 84, commercialHealthScore: 81, priorityScore: 86, spendPotentialScore: 75,
    spendPotential: 'moderate', estimatedSpendBand: '£6,000–£12,000', estimatedOpeningOrder: '£2,500–£4,000', spendConfidence: 'medium',
    pipelineStage: 'qualified',
    qualificationStatus: 'qualified',
    outreach: {
      contactName: 'Megan Torres', contactRole: 'Manager', contactEmail: 'megan@parkstaccessories.co.uk',
      bestContactMethod: 'email', outreachPriority: 'high',
      bestOutreachAngle: 'Instagram-ready Italian charm jewellery for Park Street\'s style-conscious customers',
      whyAttractive: 'Trendy Bristol location with strong millennial footfall',
      whyGoodCandidate: 'Accessories-focused store with fashion-forward curation',
      productAngle: 'Nomination\'s trendiest collections and Instagram-worthy styling',
      aiOutreachSummary: 'Park Street Accessories is a strong prospect. Their millennial customer base and social media savvy make them ideal.',
      suggestedFirstMessage: 'Hi Megan,\n\nI\'m Emma-Louise from Nomination — I\'ve been loving your Instagram feed! Your curation is spot on.\n\nNomination\'s Italian charm jewellery has a massive social following, and I think it would absolutely fly with your customers.\n\nFancy a quick chat?\n\nEmma-Louise ✨',
      objections: [
        { concern: 'We focus on Scandinavian and British brands', response: 'Adding an Italian brand diversifies your offer beautifully. Nomination\'s aesthetic is clean and contemporary — it sits perfectly alongside Scandi design.' },
      ],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: ['Strong social media presence — 12k Instagram followers'], suggestedNextStep: 'Email Megan with Instagram collaboration proposal' },
    positioning: 'Trendy accessories boutique on Bristol\'s Park Street. Strong millennial following.',
    aiNotes: 'Great brand fit. Younger demographic aligns with Nomination\'s core audience.',
    riskFlags: [],
    email: 'hello@parkstaccessories.co.uk', website: 'https://parkstaccessories.co.uk', instagram: '@parkstaccessories',
    aiIntelligence: {
      summary: 'A trendy accessories boutique on Bristol\'s iconic Park Street. Strong millennial following and excellent Instagram presence (12k followers). The store\'s design-conscious curation and social media savvy make it an excellent fit for Nomination\'s contemporary positioning.',
      whyAttractive: 'Park Street is Bristol\'s premier independent shopping street. Strong millennial and Gen-Z footfall from the nearby university.',
      whyGoodStockist: 'Social media amplification, design-conscious curation, and the millennial/Gen-Z demographic that is Nomination\'s fastest-growing customer segment.',
      risksOrConcerns: 'Proximity to Clifton Fine Jewellers (2 miles) — need to differentiate the offer. Different demographic profile should help.',
      likelyBuyingMotivation: 'Adding an Instagram-worthy Italian brand that drives engagement and attracts new followers/customers.',
      storePositioningAnalysis: 'Trendy mid-to-premium accessories retail. Instagram-first approach to curation.',
      customerDemographic: 'Style-conscious women 18-35. Strong social media engagement. Mix of students and young professionals.',
      townProfile: 'Bristol\'s Park Street connects the university area with the city centre. High footfall of young, design-aware shoppers.',
      giftingPotentialAnalysis: 'Strong in the "friend gifting" and "self-purchase" categories. Less traditional gifting, more social-media-driven buying.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-09',
    },
    performancePrediction: {
      predictedOpeningOrder: '£2,500–£4,000',
      predictedAnnualValue: '£8,000–£14,000',
      reorderPotential: 'strong',
      productMixSuitability: 80,
      similarAccountsUsed: ['Trendy accessories store in Brighton — £11k annual'],
      predictionConfidence: 'medium',
    },
  }),
  mkRetailer({
    id: 'r14', name: 'Milsom Place Jewellers', town: 'Bath', county: 'Somerset', postcode: 'BA1 1BZ', lat: 51.3825, lng: -2.3580,
    rating: 4.8, reviewCount: 278, websiteQuality: 90, socialPresence: 85, visualPresentation: 92, merchandisingQuality: 90,
    adjacentBrands: ['Roberto Coin', 'Marco Bicego', 'Fope'],
    competitorBrands: [
      { name: 'Roberto Coin', priceTier: 'luxury', positioning: 'Italian luxury gold jewellery', complementsNomination: true },
      { name: 'Marco Bicego', priceTier: 'luxury', positioning: 'Italian artisan luxury jewellery', complementsNomination: true },
      { name: 'Fope', priceTier: 'luxury', positioning: 'Italian luxury chain jewellery', complementsNomination: true },
    ],
    competitorInsight: 'Already stocks Italian luxury jewellery brands — Nomination conversation is natural. Accessible Italian charm jewellery fills the gifting gap below their fine jewellery range.',
    storeAestheticQuality: 94, highStreetQuality: 95, touristLocation: true, affluentArea: true, retailClusterStrength: 95,
    distanceToNearestStockist: '0.3 miles',
    fitScore: 94, commercialHealthScore: 93, priorityScore: 97, spendPotentialScore: 94,
    spendPotential: 'high', estimatedSpendBand: '£12,000–£25,000', estimatedOpeningOrder: '£5,000–£8,000', spendConfidence: 'high',
    pipelineStage: 'follow_up_needed',
    qualificationStatus: 'qualified',
    qualificationNotes: 'Exceptional prospect — Bath\'s finest jeweller. Already stocks Italian brands.',
    companiesHouse: { legalName: 'Milsom Place Jewellers Ltd', companyNumber: '05678901', companyStatus: 'Active', accountsFilingStatus: 'Up to date', confirmationStatementStatus: 'Up to date', healthConfidence: 'high' },
    outreach: {
      contactName: 'David Ashworth', contactRole: 'Director', contactEmail: 'david@milsomplacejewellers.co.uk', contactPhone: '01225 460 127',
      bestContactMethod: 'phone', outreachPriority: 'high',
      bestOutreachAngle: 'Premium Italian jewellery portfolio expansion — Nomination alongside Roberto Coin and Marco Bicego',
      whyAttractive: 'Bath\'s premier fine jeweller in the city\'s most exclusive shopping quarter. Already stocks Italian luxury brands.',
      whyGoodCandidate: 'Italian jewellery expertise, affluent clientele, world-class location.',
      productAngle: 'Premium Composable collection including 18ct gold and gemstone pieces',
      aiOutreachSummary: 'Milsom Place Jewellers is the territory\'s highest-value prospect. Their existing Italian brand expertise makes the Nomination conversation natural.',
      suggestedFirstMessage: 'Dear David,\n\nFollowing our recent conversation, I wanted to follow up on the Nomination opportunity.\n\nGiven your wonderful Italian jewellery portfolio, I\'m confident Nomination would be a natural fit — capturing the everyday and gifting customer who already loves your store.\n\nI\'d love to arrange a presentation at your convenience. Would next week work?\n\nBest regards,\nEmma-Louise',
      callPrepNotes: '• David is Director — key decision maker, makes with his partner\n• Reference their Roberto Coin, Marco Bicego and Fope — Nomination completes the Italian story\n• Emphasise: captures the customer who loves their store but can\'t always buy fine jewellery\n• Prepare: How Nomination performs alongside fine jewellery in other Bath/premium stores\n• Key objection prep: price point perception vs Italian luxury brands',
      visitPrepNotes: '• Milsom Place is Bath\'s most premium location — bring your best materials\n• Take premium gold and gemstone Composable samples only — match their level\n• Study their display cases — suggest a complementary Nomination placement\n• This is a key meeting — prepare a formal presentation deck\n• Allow time to understand their customer journey and buying patterns',
      objections: [
        { concern: 'Nomination\'s price point is below our usual range', response: 'That\'s exactly the opportunity — your customers will buy Nomination as their everyday piece alongside fine jewellery. It increases store visit frequency.' },
        { concern: 'Could it dilute our luxury positioning?', response: 'Not at all. Nomination\'s Italian heritage and elegant display maintain a premium feel. Many fine jewellers find it increases overall footfall.' },
      ],
    },
    activity: { lastContactDate: '2025-05-28', nextActionDate: '2025-06-09', followUpNumber: 2, meetingScheduled: false, conversationNotes: ['Initial call — David interested but wants to discuss with partner', 'Follow-up email sent with catalogue and brand pack', 'Need to call again next week'], outcomeStatus: 'Interested — follow up needed', suggestedNextStep: 'Call David early next week — he\'s had time to review the catalogue with his partner' },
    positioning: 'Premium jeweller in Bath\'s Milsom Place shopping quarter. Fine Italian jewellery specialist.',
    aiNotes: 'Exceptional prospect. Prime Bath location, strong commercial health, perfect brand alignment.',
    riskFlags: [],
    email: 'info@milsomplacejewellers.co.uk', website: 'https://milsomplacejewellers.co.uk', instagram: '@milsomplacejewellers',
    aiIntelligence: {
      summary: 'The territory\'s highest-value prospect. Milsom Place Jewellers is Bath\'s premier fine jeweller, already stocking Italian luxury brands Roberto Coin, Marco Bicego, and Fope. Nomination completes their Italian jewellery story by capturing the accessible everyday and gifting customer. The store\'s exceptional commercial health, world-class location, and Italian expertise make this the strongest potential account in the South West.',
      whyAttractive: 'Ultimate location + ultimate retailer. Bath\'s finest shopping address with the territory\'s most commercially successful jeweller. Italian brand expertise means the Nomination pitch is natural.',
      whyGoodStockist: 'Already proven with Italian jewellery. World-class location and customer base. Nomination captures the customer who currently browses but can\'t justify fine jewellery prices.',
      risksOrConcerns: 'Price point perception is the only risk. David needs to see Nomination as complementary, not diluting. The Italian heritage angle is key.',
      likelyBuyingMotivation: 'Completing the Italian jewellery journey — from luxury to accessible. Capturing the gifting and everyday customer who loves the store.',
      storePositioningAnalysis: 'Ultra-premium fine jewellery. Nomination sits as the accessible Italian entry point within their portfolio.',
      customerDemographic: 'Affluent females 30-70. International tourists. Gift buyers. Fine jewellery collectors.',
      townProfile: 'Bath — arguably the finest retail destination in the South West. UNESCO World Heritage, 6M+ annual visitors.',
      giftingPotentialAnalysis: 'Exceptional. The accessibility of Nomination versus their fine jewellery makes it the perfect "gifting for someone who loves this store" option.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-10',
    },
    performancePrediction: {
      predictedOpeningOrder: '£5,000–£8,000',
      predictedAnnualValue: '£20,000–£32,000',
      reorderPotential: 'excellent',
      productMixSuitability: 94,
      similarAccountsUsed: ['Fine jeweller in Harrogate — £28k annual', 'Italian jeweller in Edinburgh — £25k annual'],
      predictionConfidence: 'high',
    },
  }),
  mkRetailer({
    id: 'r15', name: 'Fore Street Treasures', town: 'Exeter', county: 'Devon', postcode: 'EX4 3AT', lat: 50.7230, lng: -3.5340,
    category: 'gift_shop', storePositioning: 'mid_market', rating: 4.3, reviewCount: 112,
    websiteQuality: 55, socialPresence: 50, visualPresentation: 58, merchandisingQuality: 52,
    jewelleryFocus: false, giftingFocus: true,
    adjacentBrands: ['Equilibrium', 'Joe Davies'],
    competitorBrands: [
      { name: 'Equilibrium', priceTier: 'budget', positioning: 'Budget sentiment jewellery', complementsNomination: false },
    ],
    competitorInsight: 'Budget jewellery only. Nomination would be a significant step-up that may not match the store\'s customer spending pattern.',
    storeAestheticQuality: 55, highStreetQuality: 68,
    distanceToNearestStockist: '0.5 miles',
    fitScore: 60, commercialHealthScore: 70, priorityScore: 62, spendPotentialScore: 45,
    spendPotential: 'small', estimatedSpendBand: '£3,000–£5,000', estimatedOpeningOrder: '£1,200–£2,000', spendConfidence: 'low',
    pipelineStage: 'new_lead',
    outreach: {
      bestContactMethod: 'visit', outreachPriority: 'low',
      bestOutreachAngle: 'Affordable Italian charm jewellery for the gift-buying customer',
      whyAttractive: 'Exeter high street presence',
      whyGoodCandidate: 'Gift shop with jewellery corner',
      productAngle: 'Compact gifting-focused range at accessible price points',
      aiOutreachSummary: 'Lower priority — existing stockist very nearby and mid-market positioning.',
      suggestedFirstMessage: 'Dear team,\n\nI\'m Emma-Louise from Nomination. Your gift shop looks wonderful and I think our Italian charm jewellery could be a great gifting option.\n\nCould I pop in for a quick chat?\n\nBest wishes,\nEmma-Louise',
      objections: [],
    },
    activity: { followUpNumber: 0, meetingScheduled: false, conversationNotes: [], suggestedNextStep: 'Do not pursue unless Exeter Silver Studio declines' },
    positioning: 'Quirky independent gift shop with jewellery corner on Exeter high street.',
    aiNotes: 'Lower priority but could provide Exeter high street presence.',
    riskFlags: ['Gift shop positioning', 'Existing stockist nearby'],
    aiIntelligence: {
      summary: 'A mid-market gift shop on Exeter\'s historic Fore Street. Budget jewellery offering and proximity to an existing stockist make this a low-priority prospect. Only worth pursuing if Exeter Silver Studio doesn\'t convert.',
      whyAttractive: 'Exeter Fore Street provides good footfall. The gift-buying customer base aligns with Nomination\'s concept.',
      whyGoodStockist: 'Provides additional Exeter coverage if primary prospect declines.',
      risksOrConcerns: 'Budget brand environment, existing stockist 0.5 miles away, and mid-market positioning are significant concerns.',
      likelyBuyingMotivation: 'Looking for a premium product to increase average transaction value.',
      storePositioningAnalysis: 'Budget-to-mid gift retail. Not an ideal brand environment for Nomination.',
      customerDemographic: 'Broad gift-buying public. More price-sensitive than ideal.',
      townProfile: 'Exeter is Devon\'s county city — good retail infrastructure but this store is not in the premium segment.',
      giftingPotentialAnalysis: 'Moderate. Gift-focused but at lower price points than ideal for Nomination.',
      confidenceLevel: 'low',
      lastAnalysed: '2025-06-04',
    },
    performancePrediction: {
      predictedOpeningOrder: '£1,200–£1,800',
      predictedAnnualValue: '£3,000–£5,000',
      reorderPotential: 'low',
      productMixSuitability: 38,
      similarAccountsUsed: ['Budget gift shop benchmark'],
      predictionConfidence: 'low',
    },
  }),
  mkRetailer({
    id: 'r16', name: 'The Promenade Collection', town: 'Cheltenham', county: 'Gloucestershire', postcode: 'GL50 1NW', lat: 51.8985, lng: -2.0740,
    category: 'lifestyle_store', rating: 4.6, reviewCount: 198,
    websiteQuality: 82, socialPresence: 78, visualPresentation: 85, merchandisingQuality: 82,
    giftingFocus: true, fashionAccessoriesPresent: true,
    adjacentBrands: ['Estella Bartlett', 'Katie Loxton', 'Olivia Burton'],
    competitorBrands: [
      { name: 'Katie Loxton', priceTier: 'mid', positioning: 'Aspirational gifting brand', complementsNomination: true },
      { name: 'Olivia Burton', priceTier: 'mid', positioning: 'Fashion watches and accessories', complementsNomination: true },
    ],
    competitorInsight: 'Aspirational gifting brand mix — Nomination fits perfectly as the premium Italian jewellery addition. Katie Loxton customers are ideal Nomination buyers.',
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
      whyAttractive: 'Prime Promenade location in Cheltenham\'s finest retail stretch.',
      whyGoodCandidate: 'Already stocks similar-tier brands and lifestyle format is ideal.',
      productAngle: 'Full Composable range plus seasonal collections',
      aiOutreachSummary: 'The Promenade Collection is an excellent prospect on Cheltenham\'s premier retail street. Meeting booked — strong conversion opportunity.',
      suggestedFirstMessage: 'Dear Claire,\n\nLooking forward to our meeting! I\'ll bring a full range of samples and some exciting data on how Nomination is performing with similar lifestyle stores.\n\nSee you soon,\nEmma-Louise',
      callPrepNotes: '• Claire is the owner — final decision maker\n• Reference their Katie Loxton and Olivia Burton success — Nomination is the Italian premium addition\n• Mention Cheltenham racing season opportunity\n• Prepare: competitor range differentiation vs nearby Nomination stockist\n• Key: show how Nomination doesn\'t cannibalise but complements their existing gifting brands',
      visitPrepNotes: '• Meeting confirmed June 12th — prepare full in-store presentation\n• Bring complete Composable range and seasonal limited editions\n• Take display unit mockup and POS materials\n• Study their current window display style\n• Prepare territory data showing how nearby stockist serves different customer',
      objections: [
        { concern: 'Nearby stockist already carries Nomination', response: 'We\'ve assessed the territory — your Promenade location serves a different customer profile. We can tailor your range to minimise overlap.' },
      ],
    },
    activity: { lastContactDate: '2025-06-04', nextActionDate: '2025-06-12', followUpNumber: 3, meetingScheduled: true, conversationNotes: ['Initial call — Claire very interested', 'Email sent with brand pack', 'Meeting confirmed for June 12th — in-store presentation'], outcomeStatus: 'Meeting booked', suggestedNextStep: 'Prepare for June 12th meeting — bring full sample range and territory data' },
    positioning: 'Upscale lifestyle store on Cheltenham\'s famous Promenade. Gifting, fashion and accessories.',
    aiNotes: 'Strong prospect. Cheltenham Promenade is prime retail. Lifestyle format complements Nomination.',
    riskFlags: ['Existing stockist nearby — territory overlap consideration'],
    email: 'info@promenadecollection.co.uk', website: 'https://promenadecollection.co.uk', instagram: '@promenadecollection',
    aiIntelligence: {
      summary: 'A premium lifestyle store on Cheltenham\'s famous Promenade — one of England\'s finest high streets. The store\'s gifting focus, aspirational brand mix, and affluent clientele make it an excellent Nomination prospect. Meeting booked for June 12th represents a strong conversion opportunity.',
      whyAttractive: 'The Promenade is Cheltenham\'s crown jewel. Premium footfall year-round with exceptional peaks during the racing season and festivals.',
      whyGoodStockist: 'Lifestyle format proven for Nomination success. Aspirational gifting brand mix creates natural cross-selling. Owner-managed with quick decision-making.',
      risksOrConcerns: 'Existing Nomination stockist 0.8 miles away requires territory management. Need to differentiate the range and customer profile.',
      likelyBuyingMotivation: 'Adding a premium Italian brand to elevate their gifting range beyond Katie Loxton and Olivia Burton price points.',
      storePositioningAnalysis: 'Aspirational premium lifestyle. Beautiful store that showcases products to their best advantage.',
      customerDemographic: 'Affluent Cheltenham women 28-60. Strong racing season and festival visitors. Gift buyers and self-purchasers.',
      townProfile: 'Cheltenham is one of England\'s premier spa towns with world-class retail, dining, and cultural events. The Promenade is its finest street.',
      giftingPotentialAnalysis: 'Excellent. Racing season, festivals, and the affluent demographic drive exceptional gifting trade. Christmas season is also very strong.',
      confidenceLevel: 'high',
      lastAnalysed: '2025-06-10',
    },
    performancePrediction: {
      predictedOpeningOrder: '£3,000–£5,000',
      predictedAnnualValue: '£12,000–£18,000',
      reorderPotential: 'strong',
      productMixSuitability: 85,
      similarAccountsUsed: ['Lifestyle store in Harrogate — £14k annual', 'Cheltenham comparable — £13k annual'],
      predictionConfidence: 'high',
    },
  }),
];

// Discovered Prospects — AI-generated suggestions
export const discoveredProspects: DiscoveredProspect[] = [
  { id: 'dp1', name: 'The Cotswold Gift Company', town: 'Stow-on-the-Wold', county: 'Gloucestershire', category: 'gift_shop', rating: 4.7, reviewCount: 312, estimatedStoreQuality: 82, estimatedPricePositioning: 'premium', predictedFitScore: 79, discoverySource: 'Google Maps Analysis', discoveredDate: '2025-06-10', status: 'new', aiReason: 'High-rated gift shop in premium Cotswolds tourist destination. Strong review volume suggests significant footfall. Tourist gifting potential aligns perfectly with Nomination.' },
  { id: 'dp2', name: 'Whiteladies Jewellery', town: 'Bristol', county: 'Avon', category: 'jeweller', rating: 4.6, reviewCount: 189, estimatedStoreQuality: 80, estimatedPricePositioning: 'premium', predictedFitScore: 84, discoverySource: 'Competitor Analysis', discoveredDate: '2025-06-09', status: 'new', aiReason: 'Independent jeweller on Bristol\'s Whiteladies Road. Affluent Clifton demographic. Stocks contemporary jewellery brands — strong Nomination fit.' },
  { id: 'dp3', name: 'Dartmouth Artisan', town: 'Dartmouth', county: 'Devon', category: 'lifestyle_store', rating: 4.8, reviewCount: 245, estimatedStoreQuality: 85, estimatedPricePositioning: 'premium', predictedFitScore: 76, discoverySource: 'Tourist Town Mapping', discoveredDate: '2025-06-08', status: 'reviewing', aiReason: 'Premium lifestyle store in beautiful Devon harbour town. Strong summer tourist trade. The artisan positioning and premium demographics make it a strategic Cornwall/Devon prospect.' },
  { id: 'dp4', name: 'Regency Accessories', town: 'Cheltenham', county: 'Gloucestershire', category: 'premium_accessories', rating: 4.4, reviewCount: 134, estimatedStoreQuality: 75, estimatedPricePositioning: 'mid_market', predictedFitScore: 72, discoverySource: 'Social Media Scan', discoveredDate: '2025-06-07', status: 'new', aiReason: 'Cheltenham accessories store with growing Instagram presence. Fashion-forward curation could suit Nomination\'s contemporary collections.' },
  { id: 'dp5', name: 'Padstow Jewellers', town: 'Padstow', county: 'Cornwall', category: 'jeweller', rating: 4.5, reviewCount: 178, estimatedStoreQuality: 78, estimatedPricePositioning: 'premium', predictedFitScore: 81, discoverySource: 'Territory Gap Analysis', discoveredDate: '2025-06-06', status: 'reviewing', aiReason: 'Cornwall tourist hotspot with Rick Stein-driven footfall. Premium jeweller in a town with exceptional summer visitor numbers. Strategic for Cornwall expansion.' },
  { id: 'dp6', name: 'The Wiltshire Barn', town: 'Marlborough', county: 'Wiltshire', category: 'concept_store', rating: 4.9, reviewCount: 298, estimatedStoreQuality: 90, estimatedPricePositioning: 'premium', predictedFitScore: 77, discoverySource: 'Premium Retail Mapping', discoveredDate: '2025-06-05', status: 'new', aiReason: 'Exceptional concept store in affluent Marlborough. 4.9★ rating with nearly 300 reviews suggests outstanding customer experience. Premium positioning suits Nomination.' },
  { id: 'dp7', name: 'Sidmouth Gems', town: 'Sidmouth', county: 'Devon', category: 'jeweller', rating: 4.3, reviewCount: 92, estimatedStoreQuality: 68, estimatedPricePositioning: 'mid_market', predictedFitScore: 65, discoverySource: 'Coastal Town Scan', discoveredDate: '2025-06-04', status: 'dismissed', aiReason: 'Small-town jeweller in Devon coastal resort. Seasonal tourist trade but limited year-round footfall. Lower priority.' },
  { id: 'dp8', name: 'Totnes Lifestyle Co', town: 'Totnes', county: 'Devon', category: 'lifestyle_store', rating: 4.7, reviewCount: 223, estimatedStoreQuality: 82, estimatedPricePositioning: 'premium', predictedFitScore: 74, discoverySource: 'Independent Retail Analysis', discoveredDate: '2025-06-03', status: 'new', aiReason: 'Totnes is known as one of the UK\'s most vibrant independent retail towns. Premium lifestyle store with strong local following and growing tourist trade.' },
];

// Territory opportunity data
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

// Performance benchmark data (simulates uploaded account data)
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
  secondBestSeason: 'Mother\'s Day (15% of annual)',
};

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
