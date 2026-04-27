# Plan: Cross-Validated Contact Verification

Make sure every prospect's **name + website + phone + email + address** all belong to the **same business** — not a coincidental match, not a directory listing, not a different shop with a similar name.

---

## The problem with what we have today

`enrich-contact-details` already scrapes phone/email/address from the official site, but it does **not prove** they belong to the named business. Failure cases that slip through:

- Site found is a **different shop with the same name** in a different town
- Phone number scraped is a **supplier/partner** mentioned on the page, not the shop
- Email is a generic Wix/Squarespace **template placeholder**
- Address is from a **footer of a sister site** or a wholesale partner
- Google Maps listing scraped is the **wrong branch** of a chain

We need a **cross-validation layer** that scores each field against multiple independent sources and refuses to mark a prospect verified unless they corroborate.

---

## New verification pipeline

```text
        ┌────────────────────────┐
        │  enrich-contact-details │  (existing — scrapes raw values)
        └───────────┬─────────────┘
                    │ raw candidates
                    ▼
        ┌────────────────────────┐
        │  cross-validate-contact │  (NEW — proves they belong together)
        └───────────┬─────────────┘
                    │
   ┌────────────────┼────────────────┐
   ▼                ▼                ▼
Name match      Location        Cross-source
 on site        match           agreement
   │                │                │
   └────────────────┼────────────────┘
                    ▼
            Identity score 0–100
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
      ≥80         50–79         <50
   web_verified  needs_review  rejected
```

---

## The 8 cross-validation checks (all run, all logged)

For each candidate field, the new function runs every check that applies and stores the result in `verification_data.cross_checks`:

### 1. **Business name appears on the website**
Fetch the official site's homepage + `/contact`. Confirm the business name (case-insensitive, fuzzy ≥85%) appears in `<title>`, `<h1>`, or page body. **Fails if** the site title is for a different business.

### 2. **Town/postcode appears on the website**
The prospect's town must appear on the contact page or in a postcode within 10 miles. **Fails if** the address on the site is in a different region.

### 3. **Email domain matches website domain**
`info@brightonjewels.co.uk` on `brightonjewels.co.uk` = ✅ high confidence. Generic Gmail/Hotmail = medium. Mismatch with another business's domain = ❌ rejected.

### 4. **Phone reverse lookup**
Search the scraped phone in Google (`"01273 123456" jewellery`) and confirm at least one result links it to the business name. Catches phone numbers that actually belong to a different listed business.

### 5. **Google Maps name + address agreement**
Pull the Maps listing for `name + town`. Confirm the Maps name fuzzy-matches the prospect name AND the Maps address is within 200m of the website's stated address (or postcodes match).

### 6. **Companies House lineage** (UK only)
For limited companies, check the trading address on file matches the scraped address. Flag if the company is dissolved.

### 7. **Postcode validity**
Use the free **postcodes.io** API (no key needed) to confirm the scraped UK postcode is real and resolves to the stated town/county.

### 8. **Social handle ownership**
If we have an Instagram/Facebook handle, confirm the bio on that page mentions the same town or website domain.

---

## Identity Score (0–100)

Weighted sum of passed checks:

| Check | Weight | Required for "web_verified"? |
|---|---|---|
| Name on website | 25 | **Yes** (hard gate) |
| Town/postcode on website | 15 | **Yes** (hard gate) |
| Email domain matches | 15 | No |
| Phone reverse lookup | 15 | No |
| Maps name + address agree | 15 | No |
| Companies House match | 5 | No |
| Postcode valid via postcodes.io | 5 | No |
| Social handle owns the business | 5 | No |

**Outcomes:**
- **≥ 80** → `verification_status = 'web_verified'`, badge: "✓ Cross-checked"
- **50–79** → `verification_status = 'needs_review'` (NEW), shown in amber with the failed checks listed
- **< 50** → `verification_status = 'verified_fake'`, hidden from main list

If either hard gate (name or town on website) fails, the prospect is **automatically downgraded** regardless of other scores.

---

## What gets shown in the UI

On every prospect card and profile page, a new **"Identity Confidence"** panel:

```text
✓ Identity Confidence: 92/100
  ✓ Name "Brighton Jewels" found on brightonjewels.co.uk
  ✓ Town "Brighton" matches contact page address
  ✓ Email info@brightonjewels.co.uk matches website domain
  ✓ Phone 01273 ... reverse-lookup confirms business
  ✓ Google Maps listing matches (BN1 1AA)
  ✗ Not registered at Companies House (sole trader — OK)
```

Each check links to the source URL it was verified against (provenance preserved).

---

## Files & changes

### New
- `supabase/functions/cross-validate-contact/index.ts` — runs the 8 checks, computes identity score, writes to `verification_data.identity_check`
- `supabase/config.toml` — register the new function with `verify_jwt = false`

### Modified
- `supabase/functions/enrich-contact-details/index.ts` — at the end, invoke `cross-validate-contact` automatically and let it set the final `verification_status`
- `supabase/functions/discover-prospects/index.ts`, `discover-web/index.ts`, `discover-by-brand/index.ts` — chain the new validator after insert so every newly discovered prospect is scored on creation
- `src/pages/ProspectProfile.tsx` — add `IdentityConfidencePanel` showing the 8 checks with pass/fail icons + source links
- `src/pages/ProspectDiscovery.tsx` — add a "Confidence" column with the score, sort by it, and a filter "Hide < 80"

### Database (no schema change)
All cross-check results store inside the existing `verification_data` jsonb column under a new key:

```json
{
  "identity_check": {
    "score": 92,
    "ran_at": "2026-04-27T...",
    "checks": {
      "name_on_site": { "pass": true, "source_url": "..." },
      "town_on_site": { "pass": true, "source_url": "..." },
      "email_domain_matches": { "pass": true },
      "phone_reverse_lookup": { "pass": true, "source_url": "..." },
      "maps_agreement": { "pass": true, "source_url": "..." },
      "companies_house_match": { "pass": false, "reason": "not_registered" },
      "postcode_valid": { "pass": true, "source": "postcodes.io" },
      "social_ownership": { "pass": null, "reason": "no_handle_provided" }
    }
  }
}
```

A new enum value `needs_review` is added to `verification_status` via migration.

---

## External APIs used

- **Firecrawl** — already wired (search + scrape)
- **postcodes.io** — `https://api.postcodes.io/postcodes/{pc}` — free, no key, validates UK postcodes
- **Google Maps via Firecrawl** — already wired
- **Companies House** — already wired via existing `companies-house` function

No new secrets required.

---

## What this prevents

- ❌ "Smith Jewellers, Bristol" being verified using `smith-jewellers-london.co.uk`
- ❌ Phone numbers belonging to a competitor cited on the page
- ❌ Generic `hello@wixsite.com` placeholders being treated as real emails
- ❌ A dissolved limited company appearing as an active prospect
- ❌ Wrong-branch Google Maps listings polluting addresses

Every "web_verified" prospect from now on will have **provable, cross-referenced evidence** that name, address, phone, email and website all belong to the same physical business.
