# WorkMe Manage Console - Architecture & Roadmap

**Last Updated**: 2025-01-XX  
**Status**: 🚧 In Development  
**Purpose**: Admin console for managing companies and enriching company data for WorkMe platform

---

## 🎯 **OVERVIEW**

The WorkMe Manage Console is a Next.js 14 application that serves as the administrative interface for:
1. **Company Data Management**: Search, add, and enrich company information
2. **Data Enrichment**: Integrate with external APIs (Apollo.io, etc.) to enrich company profiles
3. **User Management**: Manage admin users who can add/enrich companies
4. **Data Source for WorkMe**: Companies added/enriched here become available for selection in the main WorkMe application (`workme-nextapp`)

### ⚠️ **SHARED DATABASE ARCHITECTURE**

**Critical**: The manage console shares the **same PostgreSQL database** as `workme-nextapp`. This means:

- ✅ **Company model already exists** - Do NOT create a new Company model
- ✅ **Use existing Prisma schema** - Reference the Company model from workme-nextapp
- ✅ **Direct data access** - Companies enriched here are immediately available in workme-nextapp
- ✅ **No API sync needed** - Both apps read/write to the same database

**Database Connection**:
- Both apps use the same `DATABASE_URL` environment variable
- Both apps use the same Prisma schema (or reference the same schema)
- Company data is shared in real-time

### Key User Flow

```
User (WorkMe Admin) → Sign In → Management Console → Add/Enrich Company → 
Company Available in WorkMe App → Users Can Associate with Company
```

**Technical Flow**:
1. Admin adds/enriches company in manage console
2. Company saved to shared database (Company model)
3. User in workme-nextapp searches/selects company via `/api/workme/company`
4. Company association happens in workme-nextapp (via Workplace or companyUnit)

---

## 📋 **CURRENT PRIORITIES (4 Tasks)**

### ✅ **Task 1: Nail the Splash Page**

**Goal**: Create a polished, professional splash page that sets the tone for the management console.

**Requirements**:
- Professional branding with WorkMe logo/branding
- Smooth loading animation/transition
- Clear value proposition: "WorkMe Management Console"
- Brief loading state (2-3 seconds) before redirect
- Responsive design

**Implementation**:
- Update `/app/splash/page.tsx` with:
  - WorkMe branding/logo
  - Professional loading animation (spinner or progress bar)
  - Smooth fade-in transition
  - Better typography and spacing

**Status**: 🚧 To Do

---

### ✅ **Task 2: Standardize Google Sign-In**

**Goal**: Ensure Google sign-in matches the pattern used in other WorkMe repos for consistency.

**Current State**:
- Google sign-in is already implemented in `/app/signin/page.tsx`
- Uses `signInWithGoogle()` from `lib/firebase/client.ts`
- Pattern matches `workme-nextapp` implementation

**Requirements**:
- Verify consistency with `workme-nextapp` sign-in flow
- Ensure error handling matches
- Verify redirect flow after sign-in
- Ensure token handling is consistent

**Implementation Checklist**:
- [ ] Compare with `workme-nextapp/lib/firebase.ts` implementation
- [ ] Ensure error messages are user-friendly
- [ ] Verify popup handling (blocked, closed, etc.)
- [ ] Test redirect flow to `/welcome` → `/home` (management console)

**Status**: 🚧 To Do

---

### ✅ **Task 3: Drive to Management Console**

**Goal**: Create a proper management console/dashboard that serves as the main landing page after authentication.

**Requirements**:
- Dashboard at `/app/home/page.tsx` (or `/app/dashboard/page.tsx`)
- Overview of:
  - Total companies in system
  - Recently added companies
  - Companies pending enrichment
  - Quick actions (Add Company, Search Companies)
- Navigation to:
  - Company management (`/company`)
  - Profile settings (`/profile`)
  - Admin panel (`/admin`)

**Implementation**:
- Create `/app/home/page.tsx` (or update welcome flow to redirect here)
- Build dashboard component with:
  - Stats cards (total companies, enriched companies, etc.)
  - Recent companies list
  - Quick action buttons
  - Search bar for quick company lookup
- Update `/app/welcome/page.tsx` to redirect to `/home` instead of `/profile`

**Status**: 🚧 To Do

---

### ✅ **Task 4: Company Enrich/Add UX**

**Goal**: Create a comprehensive company management interface where admins can:
1. Search for existing companies
2. Add new companies
3. Enrich company data (trigger Apollo.io or other enrichment services)
4. View company details and enrichment status

**Requirements**:

#### **4a. Database Schema Updates**
- Add `Company` model to Prisma schema
- Fields needed:
  - `id`, `name`, `domain`, `website`
  - `apolloId` (for Apollo.io integration)
  - `industry`, `size`, `location`
  - `logoUrl`, `description`
  - `enrichedAt` (timestamp of last enrichment)
  - `enrichmentStatus` (pending, enriched, failed)
  - `createdAt`, `updatedAt`

#### **4b. API Routes**
- `POST /api/company/search` - Search companies by name/domain
- `POST /api/company/create` - Create new company
- `GET /api/company/[id]` - Get company details
- `POST /api/company/[id]/enrich` - Trigger enrichment
- `GET /api/company/list` - List all companies (with pagination)

#### **4c. Company Management Page**
- Create `/app/company/page.tsx` with:
  - Search bar (real-time search as user types)
  - "Add New Company" button/modal
  - Company list/grid view
  - Each company card shows:
    - Name, domain, industry
    - Enrichment status badge
    - "Enrich" button if not enriched
    - "View Details" link

#### **4d. Add/Enrich Company Flow**
- **Add Company Modal/Page**:
  - Form fields: Name (required), Domain (optional)
  - "Save" button → Creates company
  - Auto-trigger enrichment option (checkbox)
  - Success message with option to "Enrich Now"

- **Enrich Company Flow**:
  - Click "Enrich" button on company card
  - Show loading state
  - Call `/api/company/[id]/enrich`
  - Display enriched data (industry, size, logo, etc.)
  - Update company card with new data

#### **4e. Company Details Page** (Optional)
- `/app/company/[id]/page.tsx`
- Show full company information
- Enrichment history
- Edit company details
- Delete company (with confirmation)

**Status**: 🚧 To Do

---

## 🛠 **TECH STACK**

### Core Framework
- **Next.js 14.0.0** - App Router architecture
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type safety

### Authentication
- **Firebase 12.6.0** - Client SDK for authentication
- **Firebase Admin 13.6.0** - Server SDK for token verification

### Database
- **Prisma 5.14.0** - ORM and database toolkit
- **PostgreSQL** - Primary database (via `DATABASE_URL`)

### UI & Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **Lucide React 0.554.0** - Icon library

### Utilities
- **Axios 1.13.2** - HTTP client with interceptors
- **Zod 3.25.76** - Schema validation

---

## 📁 **DIRECTORY STRUCTURE**

```
workme-manageconsole/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── company/
│   │   │   ├── create/route.ts   # Create company
│   │   │   ├── enrich/route.ts   # Trigger enrichment
│   │   │   ├── search/route.ts   # Search companies
│   │   │   ├── list/route.ts     # List all companies
│   │   │   └── [id]/
│   │   │       ├── route.ts      # Get company by ID
│   │   │       └── enrich/route.ts  # Enrich specific company
│   │   └── user/
│   │       ├── get/route.ts      # Get current user
│   │       ├── update/route.ts   # Update user profile
│   │       └── upsert/route.ts   # Create/update user
│   ├── company/
│   │   ├── page.tsx              # Company management (list/search)
│   │   └── [id]/
│   │       └── page.tsx          # Company details page
│   ├── home/
│   │   └── page.tsx              # Management console dashboard
│   ├── splash/page.tsx           # Initial splash/loading
│   ├── signin/page.tsx           # Sign in page
│   ├── signup/page.tsx           # Sign up page
│   ├── welcome/page.tsx          # Post-auth hydration
│   ├── profile/page.tsx          # User profile
│   ├── settings/page.tsx         # Account settings
│   ├── admin/page.tsx            # Admin panel
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Root redirect to /splash
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── AuthProvider.tsx          # Session management
│   ├── Protected.tsx            # Route protection wrapper
│   ├── UserProfileForm.tsx      # Profile editing form
│   ├── CompanyCard.tsx          # Company card component
│   ├── CompanySearch.tsx        # Company search component
│   ├── AddCompanyModal.tsx      # Add company modal
│   └── EnrichCompanyButton.tsx  # Enrich company button
├── lib/                          # Shared utilities
│   ├── api.ts                    # Axios client with token interceptor
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth/
│   │   ├── getServerSession.ts   # Server-side session verification
│   │   └── useAuth.ts           # Client auth hook (re-export)
│   ├── firebase/
│   │   ├── client.ts            # Firebase client SDK utilities
│   │   ├── firebaseClient.ts    # Firebase app initialization
│   │   ├── getIdToken.ts        # Token retrieval utility
│   │   └── server.ts            # Firebase Admin SDK
│   └── services/
│       └── companyEnrichment.ts  # Company enrichment service (Apollo.io)
├── prisma/
│   └── schema.prisma             # Database schema
└── docs/
    └── WORKMEMANAGE-ARCHITECTURE.md  # This file
```

---

## 🗄️ **DATA MODELS**

### User Model (Current)

```prisma
model User {
  id              String   @id @default(cuid())
  firebaseId      String   @unique
  email           String   @unique
  name            String?
  photoUrl        String?
  title           String?
  companyUnit     String?
  companyDivision String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([firebaseId])
  @@index([email])
}
```

### Company Model (Shared with workme-nextapp)

**⚠️ IMPORTANT**: The manage console shares the **same database** as `workme-nextapp`. The `Company` model already exists in the shared schema and should be used as-is.

```prisma
model Company {
  id           String        @id @default(uuid())
  name         String        @unique // Company name (unique globally)
  industry     String?
  website      String?
  city         String?
  state        String?
  description  String?
  headcount    Int?
  companyType  CompanyType?
  revenueRange RevenueRange?
  createdAt    DateTime      @default(now())

  // Identity (Apollo Enrichment)
  missionStatement    String?
  vision              String?
  values              String? // CSV string
  brandTagline        String?
  brandLogoUrl        String?
  brandColorPrimary   String?
  brandColorSecondary String?

  // Leadership (Apollo Enrichment)
  ceoName      String?
  ceoTitle     String?
  deputyName   String?
  deputyTitle  String?
  chiefOfStaff String?

  // Organization (Apollo Enrichment)
  directorates String[] @default([]) // e.g., ["SEA 02", "SEA 05", "SEA 10"]

  // Social / Public (Apollo Enrichment)
  linkedinUrl String?
  twitterUrl  String?
  facebookUrl String?
  phone       String?

  // Address (Apollo Enrichment)
  country String?

  // Note: Work models now use companyUnit instead of Company relations
  // Company model remains as an independent entity for enterprise-level metadata
  // No direct relation to WorkMe - users are scoped by companyUnit strings

  @@index([name]) // Index for directory lookups
}

enum CompanyType {
  NON_PROFIT
  GOVERNMENT
  PRIVATELY_HELD_FIRM
  SMALL_BUSINESS
  STARTUP
  PUBLICLY_TRADED
}

enum RevenueRange {
  UNDER_10M
  M10_50
  M50_200
  M200_1000
  ABOVE_1000M
}
```

**Key Points**:
- ✅ **Already exists** in shared database schema - do NOT create a new Company model
- ✅ **Globally unique by name** - no duplicates allowed
- ✅ **Independent entity** - not directly linked to users
- ✅ **Apollo enrichment ready** - fields already defined for enrichment
- ✅ **Used by workme-nextapp** - users can select companies via `/api/workme/company` endpoint

**Enrichment Tracking** (Optional Enhancement):
- Consider adding `enrichedAt DateTime?` and `enrichmentStatus String?` fields if needed for tracking enrichment state
- Or track enrichment status in application logic/memory

---

### WorkMe Model (Reference - from workme-nextapp)

**Note**: This model exists in the shared database but is managed by `workme-nextapp`, not the manage console. Included here for reference.

```prisma
model WorkMe {
  id              String         @id @default(uuid())
  firebaseId      String?        @unique
  email           String         @unique
  firstName       String?
  lastName        String?
  photoUrl        String?
  companyUnit     String?        // required for WorkContext, collected AFTER signup
  companyDivision String?        // optional grouping layer
  workMeCompanyId String?        // ⚠️ DEPRECATED - may be removed/merged
  workMeCompany   WorkMeCompany? @relation(fields: [workMeCompanyId], references: [id])
  
  jobTitle    String?
  specialty   String?
  industry    String?
  jobRole     JobRole?
  salaryRange SalaryRange?
  createdAt   DateTime     @default(now())
  
  // Relations
  workplaces             Workplace[]
  companyUnitMemberships CompanyUnitMembers[]
  // ... many other relations
}
```

**Key Fields for Manage Console Context**:
- `companyUnit` - String field used for multi-tenant scoping in workme-nextapp
- `companyDivision` - Optional grouping layer
- `workMeCompanyId` - ⚠️ **Deprecated** - may need to be merged/fixed (see notes below)

---

### WorkMeCompany Model (Reference - from workme-nextapp)

```prisma
model WorkMeCompany {
  id          String   @id @default(uuid())
  name        String   // WorkMe platform name
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employees WorkMe[]
  // NO companies relation - Company is independent

  @@map("workme_company")
}
```

**Note**: This is a container/tenant model, separate from the `Company` model. The `workMeCompanyId` field on `WorkMe` links to this, but it's deprecated.

---

## 🔄 **COMPANY MODEL NAMING & DEPRECATION NOTES**

### Current State

1. **`Company` model** - ✅ Active, independent entity
   - Used for enterprise-level company metadata
   - Globally unique by name
   - Enriched via Apollo.io
   - Users in workme-nextapp can select companies via `/api/workme/company`

2. **`WorkMeCompany` model** - Container/tenant model
   - Separate from `Company`
   - Used for multi-tenant platform organization

3. **`workMeCompanyId` field on WorkMe** - ⚠️ Deprecated
   - Currently optional field linking WorkMe to WorkMeCompany
   - May need to be merged/fixed with Company model
   - Consider migration path if consolidating

### Recommendations

1. **Keep Company model as-is** - It's the primary company entity for enrichment
2. **Clarify workMeCompanyId usage** - Determine if it should:
   - Be removed entirely
   - Be migrated to reference `Company` instead of `WorkMeCompany`
   - Remain as-is for backward compatibility
3. **Manage Console Focus** - Focus on enriching the `Company` model, not `WorkMeCompany`

---

## 🔐 **AUTHENTICATION FLOW**

### Current Flow

```
/splash → Check Firebase token
  ├─ No token → /signin
  └─ Has token → /welcome → /profile
```

### Target Flow (After Tasks 1-3)

```
/splash → Check Firebase token
  ├─ No token → /signin
  └─ Has token → /welcome → /home (Management Console)
                    ├─ Profile incomplete → /profile
                    └─ Profile complete → /home (dashboard)
```

### Sign-In Flow

1. User lands on `/splash`
2. If not authenticated → redirect to `/signin`
3. User clicks "Sign in with Google"
4. Firebase popup opens
5. User authenticates with Google
6. Redirect to `/welcome`
7. AuthProvider hydrates user session
8. Redirect to `/home` (management console)

---

## 🛣️ **API ROUTES (To Be Implemented)**

### Company Routes

#### `POST /api/company/search`
**Purpose**: Search companies by name or domain

**Request**:
```typescript
{
  query: string  // Minimum 2 characters
  limit?: number // Default: 20
}
```

**Response**:
```typescript
{
  success: true
  companies: Array<{
    id: string
    name: string
    website: string | null
    industry: string | null
    city: string | null
    state: string | null
    headcount: number | null
    companyType: string | null
    revenueRange: string | null
    brandLogoUrl: string | null
    description: string | null
  }>
}
```

**Note**: Uses existing Company model fields from workme-nextapp schema.

---

#### `POST /api/company/create`
**Purpose**: Create new company (uses existing Company model)

**Request**:
```typescript
{
  name: string  // Required, globally unique
  website?: string | null
  city?: string | null
  state?: string | null
  industry?: string | null
  description?: string | null
  autoEnrich?: boolean  // Default: false
}
```

**Response**:
```typescript
{
  success: true
  company: {
    id: string
    name: string
    website: string | null
    city: string | null
    state: string | null
    industry: string | null
    headcount: number | null
    companyType: string | null
    revenueRange: string | null
    brandLogoUrl: string | null
    description: string | null
    // ... all other Company model fields
  }
  alreadyExists: boolean  // true if company with same name exists
}
```

**Note**: 
- Company name must be globally unique (enforced by schema)
- If `autoEnrich` is true, triggers Apollo enrichment after creation
- Uses existing Company model from shared database

---

#### `GET /api/company/list`
**Purpose**: List all companies with pagination

**Query Params**:
- `page?: number` (default: 1)
- `limit?: number` (default: 20)
- `industry?: string` (filter by industry)
- `companyType?: string` (filter by companyType)

**Response**:
```typescript
{
  success: true
  companies: Array<Company>  // Full Company model objects
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

**Note**: Returns full Company model objects from shared database.

---

#### `GET /api/company/[id]`
**Purpose**: Get company by ID

**Response**:
```typescript
{
  success: true
  company: {
    id: string
    name: string
    website: string | null
    city: string | null
    state: string | null
    country: string | null
    industry: string | null
    headcount: number | null
    companyType: string | null
    revenueRange: string | null
    description: string | null
    
    // Apollo Enrichment fields
    missionStatement: string | null
    vision: string | null
    values: string | null
    brandTagline: string | null
    brandLogoUrl: string | null
    brandColorPrimary: string | null
    brandColorSecondary: string | null
    ceoName: string | null
    ceoTitle: string | null
    deputyName: string | null
    deputyTitle: string | null
    chiefOfStaff: string | null
    directorates: string[]
    linkedinUrl: string | null
    twitterUrl: string | null
    facebookUrl: string | null
    phone: string | null
    
    createdAt: string
  }
}
```

**Note**: Returns all fields from the existing Company model.

---

#### `POST /api/company/[id]/enrich`
**Purpose**: Trigger Apollo.io enrichment for a company

**Response**:
```typescript
{
  success: true
  company: {
    // Updated company with enriched data from Apollo.io
    // Includes: industry, headcount, companyType, revenueRange,
    // missionStatement, vision, values, brandLogoUrl, brandTagline,
    // ceoName, ceoTitle, directorates, linkedinUrl, etc.
  }
  enriched: boolean  // true if new data was added
  fieldsUpdated: string[]  // List of fields that were updated
}
```

**Implementation Notes**:
- Calls Apollo.io API to enrich company data
- Updates Company model fields with enriched data:
  - Identity: `missionStatement`, `vision`, `values`, `brandTagline`, `brandLogoUrl`, `brandColorPrimary`, `brandColorSecondary`
  - Leadership: `ceoName`, `ceoTitle`, `deputyName`, `deputyTitle`, `chiefOfStaff`
  - Organization: `directorates` (array)
  - Social: `linkedinUrl`, `twitterUrl`, `facebookUrl`, `phone`
  - Location: `city`, `state`, `country`
  - Basic: `industry`, `headcount`, `companyType`, `revenueRange`, `description`
- Note: Company model doesn't have `enrichedAt` or `enrichmentStatus` fields - consider adding these if needed for tracking

---

## 📄 **APP ROUTES**

### `/splash` (Task 1)
**Purpose**: Initial entry point with professional branding

**Features**:
- WorkMe branding/logo
- Loading animation
- 2-3 second delay for splash effect
- Redirect logic (authenticated → `/welcome`, not authenticated → `/signin`)

**Status**: 🚧 To Do

---

### `/signin` (Task 2)
**Purpose**: User sign-in page

**Features**:
- Google sign-in button (prominent)
- Email/password sign-in (secondary)
- Error handling
- Redirect to `/welcome` on success

**Status**: ✅ Implemented (needs verification for consistency)

---

### `/welcome`
**Purpose**: Post-authentication hydration and routing

**Flow**:
1. Wait for AuthProvider to hydrate session
2. If profile incomplete → redirect to `/profile`
3. If profile complete → redirect to `/home` (management console)

**Status**: ✅ Implemented (needs update to redirect to `/home`)

---

### `/home` (Task 3)
**Purpose**: Management console dashboard

**Features**:
- Stats cards:
  - Total companies
  - Enriched companies
  - Pending enrichment
  - Recently added (last 7 days)
- Recent companies list (last 5-10)
- Quick actions:
  - "Add Company" button
  - "Search Companies" search bar
- Navigation to:
  - Company management (`/company`)
  - Profile (`/profile`)
  - Settings (`/settings`)

**Status**: 🚧 To Do

---

### `/company` (Task 4)
**Purpose**: Company management interface

**Features**:
- Search bar (real-time search)
- "Add New Company" button/modal
- Company grid/list view
- Company cards with:
  - Name, domain, industry
  - Enrichment status badge
  - "Enrich" button
  - "View Details" link
- Pagination (if many companies)

**Status**: 🚧 To Do

---

### `/company/[id]` (Task 4 - Optional)
**Purpose**: Company details page

**Features**:
- Full company information display
- Edit company details
- Enrich company button
- Enrichment history
- Delete company (with confirmation)

**Status**: 🚧 To Do (Optional)

---

## 🧩 **COMPONENTS (To Be Created)**

### `CompanyCard`
**Location**: `components/CompanyCard.tsx`

**Purpose**: Display company information in card format

**Props**:
```typescript
interface CompanyCardProps {
  company: {
    id: string
    name: string
    domain: string | null
    industry: string | null
    size: string | null
    logoUrl: string | null
    enrichmentStatus: string | null
  }
  onEnrich?: (companyId: string) => void
  onViewDetails?: (companyId: string) => void
}
```

---

### `CompanySearch`
**Location**: `components/CompanySearch.tsx`

**Purpose**: Real-time company search component

**Props**:
```typescript
interface CompanySearchProps {
  onSelect?: (company: Company) => void
  placeholder?: string
  minQueryLength?: number  // Default: 2
}
```

---

### `AddCompanyModal`
**Location**: `components/AddCompanyModal.tsx`

**Purpose**: Modal for adding new company

**Props**:
```typescript
interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (company: Company) => void
  autoEnrich?: boolean  // Default: false
}
```

**Features**:
- Form fields: Name (required), Domain (optional), Website (optional)
- "Auto-enrich after creation" checkbox
- Validation
- Success/error handling

---

### `EnrichCompanyButton`
**Location**: `components/EnrichCompanyButton.tsx`

**Purpose**: Button to trigger company enrichment

**Props**:
```typescript
interface EnrichCompanyButtonProps {
  companyId: string
  currentStatus?: string
  onEnriched?: (company: Company) => void
}
```

**Features**:
- Shows loading state during enrichment
- Displays enrichment status
- Handles errors gracefully

---

## 🔄 **IMPLEMENTATION PLAN**

### Phase 1: Foundation (Tasks 1-2)
1. ✅ Update splash page with professional branding
2. ✅ Verify/standardize Google sign-in flow
3. ✅ Test authentication flow end-to-end

### Phase 2: Management Console (Task 3)
1. ✅ Create `/app/home/page.tsx`
2. ✅ Build dashboard with stats and quick actions
3. ✅ Update welcome flow to redirect to `/home`
4. ✅ Add navigation components

### Phase 3: Company Management (Task 4)
1. ✅ Update Prisma schema with Company model
2. ✅ Run migration
3. ✅ Create company API routes
4. ✅ Build company management page (`/company`)
5. ✅ Create company components (Card, Search, Modal, EnrichButton)
6. ✅ Integrate enrichment service (Apollo.io or similar)

### Phase 4: Polish & Testing
1. ✅ Error handling and edge cases
2. ✅ Loading states and UX improvements
3. ✅ Responsive design
4. ✅ Integration testing

---

## 🔧 **ENRICHMENT SERVICE INTEGRATION**

### Apollo.io Integration (Example)

**Service File**: `lib/services/companyEnrichment.ts`

```typescript
export async function enrichCompanyWithApollo(company: {
  name: string
  domain?: string | null
}): Promise<{
  industry?: string
  size?: string
  location?: string
  logoUrl?: string
  description?: string
  apolloId?: string
}> {
  // 1. Search Apollo.io for company
  // 2. Extract enriched data
  // 3. Return enriched fields
}
```

**API Route**: `app/api/company/[id]/enrich/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verify auth
  // 2. Get company from DB
  // 3. Call enrichCompanyWithApollo()
  // 4. Update company in DB
  // 5. Return updated company
}
```

**Environment Variables Needed**:
```bash
APOLLO_API_KEY=...
# Or other enrichment service credentials
```

---

## 📋 **KEY FINDINGS & DECISIONS**

### Shared Database Architecture

✅ **Confirmed**: Manage console shares the same PostgreSQL database as `workme-nextapp`
- Both apps use the same `DATABASE_URL`
- Company model already exists and is actively used
- No need to create new Company model - use existing one

### Company Model Structure

✅ **Company Model** (from workme-nextapp):
- Globally unique by `name` (enforced by schema)
- Extensive Apollo enrichment fields already defined
- Independent entity - not directly linked to users
- Used by workme-nextapp via `/api/workme/company` endpoint

### WorkMe Model Fields

✅ **WorkMe model** has:
- `companyUnit String?` - Required for WorkContext, collected after signup
- `companyDivision String?` - Optional grouping layer
- `workMeCompanyId String?` - ⚠️ **Deprecated** - may need cleanup

### Implementation Priorities

1. **Use existing Company model** - Do NOT create a new one
2. **Reference workme-nextapp schema** - Ensure Prisma schema includes Company model
3. **Focus on enrichment** - Add/enrich companies that become available in workme-nextapp
4. **Consider enrichment tracking** - May want to add `enrichedAt`/`enrichmentStatus` fields if needed

---

## 📚 **REFERENCES**

### Related Documentation
- **WorkMe NextApp**: `workme-nextapp/docs/` - Main WorkMe application
- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Next.js App Router**: https://nextjs.org/docs/app
- **Prisma**: https://www.prisma.io/docs

### Key Files to Reference
- `workme-nextapp/lib/firebase.ts` - Firebase client pattern
- `workme-nextapp/lib/providers/AuthProvider.tsx` - AuthProvider pattern
- `workme-nextapp/lib/api.ts` - Axios interceptor pattern

---

## 🎯 **QUICK REFERENCE**

| Task | Status | Priority |
|------|--------|----------|
| 1. Nail the splash | 🚧 To Do | High |
| 2. Standardize Google sign-in | 🚧 To Do | High |
| 3. Management console dashboard | 🚧 To Do | High |
| 4. Company enrich/add UX | 🚧 To Do | High |

---

**Last Updated**: 2025-01-XX  
**Maintainer**: WorkMe Team  
**Status**: 🚧 In Active Development
