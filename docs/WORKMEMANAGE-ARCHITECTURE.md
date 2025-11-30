# WorkMe Manage Console - Architecture Documentation

**Last Updated**: 2025-01-XX  
**Status**: ✅ Initial Scaffold Complete  
**Purpose**: Admin console for managing companies and users of the WorkMe platform

---

## 🎯 **OVERVIEW**

The WorkMe Manage Console is a Next.js 14 application built to provide administrative capabilities for managing companies and users within the WorkMe ecosystem. It follows the same authentication architecture patterns as the main WorkMe application (`workme-nextapp`) for consistency and maintainability.

### Key Principles

1. **Firebase-First Authentication**: All authentication flows through Firebase Auth
2. **Token-Based API Security**: All API routes verify Firebase ID tokens
3. **Automatic Token Injection**: Axios interceptor handles token attachment
4. **Server-Side Verification**: Firebase Admin SDK verifies tokens on all API routes
5. **Unified Session Management**: Single source of truth via AuthProvider

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
│   │   │   ├── enrich/route.ts  # Trigger Apollo enrichment
│   │   │   ├── get/route.ts      # Get company by ID
│   │   │   └── search/route.ts   # Search companies
│   │   └── user/
│   │       ├── get/route.ts      # Get current user
│   │       ├── update/route.ts   # Update user profile
│   │       └── upsert/route.ts   # Create/update user
│   ├── admin/page.tsx            # Admin panel (stub)
│   ├── company/page.tsx          # Company management
│   ├── profile/page.tsx          # User profile
│   ├── settings/page.tsx         # Account settings
│   ├── signin/page.tsx           # Sign in page
│   ├── signup/page.tsx           # Sign up page
│   ├── splash/page.tsx           # Initial redirect logic
│   ├── welcome/page.tsx          # Post-auth hydration
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Root redirect to /splash
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── AuthProvider.tsx          # Session management
│   ├── CompanySelector.tsx       # Company search/create
│   ├── Protected.tsx            # Route protection wrapper
│   └── UserProfileForm.tsx      # Profile editing form
├── lib/                          # Shared utilities
│   ├── api.ts                    # Axios client with token interceptor
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth/
│   │   ├── getServerSession.ts   # Server-side session verification
│   │   └── useAuth.ts           # Client auth hook (re-export)
│   └── firebase/
│       ├── client.ts            # Firebase client SDK utilities
│       ├── firebaseClient.ts    # Firebase app initialization
│       ├── getIdToken.ts        # Token retrieval utility
│       ├── server.ts            # Firebase Admin SDK
│       └── firebase.config.ts   # Firebase config values
├── prisma/
│   └── schema.prisma             # Database schema
└── docs/
    └── WORKMEMANAGE-ARCHITECTURE.md  # This file
```

---

## 🔐 **AUTHENTICATION ARCHITECTURE**

### Overview

The authentication system follows the same pattern as `workme-nextapp`:

1. **Client-side**: Firebase Auth SDK handles sign-in/sign-up
2. **Token Management**: Firebase SDK automatically manages token refresh
3. **API Requests**: Axios interceptor automatically attaches tokens
4. **Server Verification**: Firebase Admin SDK verifies tokens on all API routes

### Authentication Flow

```
┌─────────────┐
│   /splash   │ → Check Firebase token
└──────┬──────┘
       │
       ├─ No token → /signin
       └─ Has token → /welcome
                      │
                      ├─ Hydrate user via /api/user/upsert
                      │
                      ├─ Profile incomplete → /profile
                      └─ Profile complete → /home (future)
```

### Session Management

**Client-Side (`components/AuthProvider.tsx`)**
- Listens to Firebase `onAuthStateChanged` and `onIdTokenChanged`
- Hydrates user data from database via `/api/user/upsert`
- Maintains unified session object:
  ```typescript
  interface Session {
    userId: string | null
    firebaseId: string | null
    email: string | null
    name: string | null
    photoUrl: string | null
    companyId: string | null
    firebaseToken: string | null
    hydratedAt: number | null
  }
  ```

**Server-Side (`lib/auth/getServerSession.ts`)**
- Verifies Firebase token from `Authorization: Bearer <token>` header
- Returns user session or null
- Used in API routes for authentication

### Token Injection

**Automatic via Axios Interceptor (`lib/api.ts`)**
```typescript
// All requests to /api/* automatically get token attached
api.interceptors.request.use(async (config) => {
  const token = await getIdToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

**Usage Pattern:**
```typescript
// Client component
import api from '@/lib/api'

const response = await api.post('/api/user/update', { name: 'John' })
// Token automatically attached ✅
```

### API Route Protection

**Pattern:**
```typescript
// app/api/user/update/route.ts
import { getAdminAuth } from '@/lib/firebase/server'

export async function POST(request: NextRequest) {
  // 1. Extract token from header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verify token
  const token = authHeader.replace('Bearer ', '')
  const decodedToken = await getAdminAuth().verifyIdToken(token)

  // 3. Use decodedToken.uid to query database
  const user = await prisma.user.findUnique({
    where: { firebaseId: decodedToken.uid }
  })

  // 4. Proceed with authenticated operation
}
```

---

## 🗄️ **DATA MODELS**

### User Model

```prisma
model User {
  id         String   @id @default(cuid())
  firebaseId String   @unique
  email      String   @unique
  name       String?
  photoUrl   String?
  title      String?

  companyId  String?
  company    Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  division   String?
  unit       String?

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([firebaseId])
  @@index([email])
  @@index([companyId])
}
```

**Key Fields:**
- `firebaseId` - Unique Firebase Auth UID (required)
- `email` - User email (unique, required)
- `companyId` - Optional link to Company
- `title`, `division`, `unit` - Optional profile fields

### Company Model

```prisma
model Company {
  id         String   @id @default(cuid())
  name       String
  domain     String?
  apolloId   String?      # Apollo.io integration ID
  size       String?
  industry   String?
  logoUrl    String?
  enrichedAt DateTime?    # Timestamp of last Apollo enrichment
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  employees User[]

  @@index([name])
  @@index([domain])
  @@index([apolloId])
}
```

**Key Features:**
- `apolloId` - Ready for Apollo.io enrichment integration
- `enrichedAt` - Tracks when company data was last enriched
- `domain` - Optional domain for matching

---

## 🛣️ **API ROUTES**

### User Routes

#### `POST /api/user/upsert`
**Purpose**: Create or update user record from Firebase auth

**Request:**
```typescript
{
  firebaseId: string
  email: string
  displayName?: string
  photoUrl?: string
}
```

**Response:**
```typescript
{
  success: true
  user: {
    id: string
    firebaseId: string
    email: string
    name: string | null
    photoUrl: string | null
    title: string | null
    companyId: string | null
    division: string | null
    unit: string | null
    company: { id: string, name: string } | null
  }
}
```

**Auth**: Requires Firebase token (auto-injected)

---

#### `GET /api/user/get`
**Purpose**: Get current authenticated user

**Response**: Same as `/api/user/upsert`

**Auth**: Requires Firebase token

---

#### `POST /api/user/update`
**Purpose**: Update user profile fields

**Request:**
```typescript
{
  name?: string
  title?: string
  photoUrl?: string | null
  companyId?: string | null
  division?: string | null
  unit?: string | null
}
```

**Response**: Same as `/api/user/upsert`

**Auth**: Requires Firebase token

---

### Company Routes

#### `POST /api/company/search`
**Purpose**: Search companies by name

**Request:**
```typescript
{
  query: string  // Minimum 1 character
}
```

**Response:**
```typescript
{
  success: true
  companies: Array<{
    id: string
    name: string
    domain: string | null
    industry: string | null
    size: string | null
    logoUrl: string | null
  }>
}
```

**Auth**: Requires Firebase token

---

#### `POST /api/company/create`
**Purpose**: Create new company

**Request:**
```typescript
{
  name: string
  domain?: string | null
}
```

**Response:**
```typescript
{
  success: true
  company: {
    id: string
    name: string
    domain: string | null
    industry: string | null
    size: string | null
    logoUrl: string | null
  }
  alreadyExists: boolean  // true if company with same name/domain exists
}
```

**Auth**: Requires Firebase token

**Note**: Returns existing company if found (prevents duplicates)

---

#### `POST /api/company/get`
**Purpose**: Get company by ID

**Request:**
```typescript
{
  companyId: string
}
```

**Response:**
```typescript
{
  success: true
  company: {
    id: string
    name: string
    domain: string | null
    industry: string | null
    size: string | null
    logoUrl: string | null
    apolloId: string | null
    enrichedAt: string | null
  }
}
```

**Auth**: Requires Firebase token

---

#### `POST /api/company/enrich`
**Purpose**: Trigger Apollo.io enrichment for company

**Request:**
```typescript
{
  companyId: string
}
```

**Response:**
```typescript
{
  success: true
  company: { /* enriched company data */ }
}
```

**Auth**: Requires Firebase token

**Status**: Currently stubbed - Apollo integration pending

---

## 📄 **APP ROUTES**

### `/splash`
**Purpose**: Initial entry point with redirect logic

**Flow:**
1. Check if Firebase token exists
2. If no token → redirect to `/signin`
3. If token exists → redirect to `/welcome`

**Component**: Client component with `useEffect` redirect

---

### `/welcome`
**Purpose**: Post-authentication hydration and routing

**Flow:**
1. Wait for AuthProvider to hydrate session
2. If profile incomplete (missing name or companyId) → redirect to `/profile`
3. If profile complete → redirect to `/home` (future) or `/profile`

**Component**: Client component with conditional redirect

---

### `/signin`
**Purpose**: User sign-in page

**Features:**
- Email/password sign-in
- Google sign-in
- Link to sign-up page

**On Success**: Redirects to `/welcome`

---

### `/signup`
**Purpose**: User registration page

**Features:**
- Email/password sign-up
- Optional display name
- Google sign-up
- Link to sign-in page

**On Success**: Redirects to `/welcome`

---

### `/profile`
**Purpose**: User profile management

**Features:**
- Edit name, title, division, unit
- Company selection via `CompanySelector`
- Save profile updates

**Protection**: Wrapped in `<Protected>` component

---

### `/settings`
**Purpose**: Account settings and information

**Features:**
- View account information (email, name, IDs)
- View token status
- Sign out functionality
- Link to profile editing

**Protection**: Wrapped in `<Protected>` component

---

### `/company`
**Purpose**: Company selection and creation

**Features:**
- Search existing companies
- Create new company
- Auto-trigger enrichment on creation
- Save company selection to user profile

**Protection**: Wrapped in `<Protected>` component

---

### `/admin`
**Purpose**: Admin panel (stub)

**Status**: Placeholder for future admin functionality

**Protection**: Wrapped in `<Protected>` component

---

## 🧩 **COMPONENTS**

### `AuthProvider`
**Location**: `components/AuthProvider.tsx`

**Purpose**: Centralized session management

**Features:**
- Listens to Firebase auth state changes
- Hydrates user data from database
- Manages unified session object
- Provides `useAuth()` hook

**Usage:**
```typescript
import { useAuth } from '@/components/AuthProvider'

function MyComponent() {
  const { session, loading, error, refreshSession } = useAuth()
  // session.userId, session.email, etc.
}
```

---

### `Protected`
**Location**: `components/Protected.tsx`

**Purpose**: Route protection wrapper

**Features:**
- Checks authentication state
- Redirects to `/signin` if not authenticated
- Shows loading state during auth check

**Usage:**
```typescript
<Protected>
  <YourProtectedContent />
</Protected>
```

---

### `CompanySelector`
**Location**: `components/CompanySelector.tsx`

**Purpose**: Company search and creation UI

**Features:**
- Real-time company search (2+ characters)
- Display selected company
- Create new company inline
- Auto-trigger enrichment on creation
- Callback for company selection

**Props:**
```typescript
interface CompanySelectorProps {
  value?: string | null        // Selected company ID
  onChange: (companyId: string | null) => void
  onCreateNew?: (name: string, domain?: string) => Promise<string>
}
```

---

### `UserProfileForm`
**Location**: `components/UserProfileForm.tsx`

**Purpose**: User profile editing form

**Features:**
- Load current user data
- Edit name, title, division, unit
- Company selection integration
- Save updates to database
- Success/error feedback

**Integration**: Uses `CompanySelector` for company selection

---

## 🔄 **KEY PATTERNS & CONVENTIONS**

### API Request Pattern

**Always use the axios client:**
```typescript
import api from '@/lib/api'

// ✅ DO THIS
const response = await api.post('/api/user/update', { name: 'John' })

// ❌ DON'T DO THIS
const response = await fetch('/api/user/update', { ... })
```

**Why**: Axios interceptor automatically attaches Firebase token

---

### API Route Protection Pattern

**Always verify token:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Extract token
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verify token
  const token = authHeader.replace('Bearer ', '')
  const decodedToken = await getAdminAuth().verifyIdToken(token)

  // 3. Use decodedToken.uid for database queries
  // ...
}
```

---

### Client Component Pattern

**Mark client components:**
```typescript
'use client'

import { useState } from 'react'
// ...
```

**Why**: Next.js App Router uses Server Components by default

---

### Error Handling Pattern

**API Routes:**
```typescript
try {
  // ... operation
  return NextResponse.json({ success: true, data })
} catch (error: any) {
  console.error('[API /route] Error:', error)
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: 'Invalid data', details: error.errors },
      { status: 400 }
    )
  }
  
  if (error.code === 'auth/id-token-expired') {
    return NextResponse.json(
      { success: false, error: 'Token expired' },
      { status: 401 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: error.message || 'Internal error' },
    { status: 500 }
  )
}
```

---

## 🚀 **CURRENT STATE**

### ✅ Completed

- [x] Next.js 14 App Router setup
- [x] Firebase client and server utilities
- [x] Prisma schema (User, Company models)
- [x] Authentication system (AuthProvider, hooks)
- [x] API routes (user CRUD, company CRUD)
- [x] App routes (splash, welcome, signin, signup, profile, settings, company)
- [x] Core components (Protected, CompanySelector, UserProfileForm)
- [x] Token injection via axios interceptor
- [x] Server-side token verification

### 🚧 Pending / Future

- [ ] Apollo.io integration for company enrichment
- [ ] Admin panel functionality
- [ ] User management (list, edit, delete users)
- [ ] Company management (list, edit, delete companies)
- [ ] Bulk operations
- [ ] Analytics/dashboard
- [ ] Role-based access control (admin vs regular user)
- [ ] Email notifications
- [ ] Audit logging

---

## 🔧 **SETUP & DEPLOYMENT**

### Environment Variables

**Required:**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (Server - Keep Secret)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
# OR individual vars:
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 3. Set up database
npx prisma generate
npx prisma migrate dev

# 4. Run development server
npm run dev
```

### Production Deployment

```bash
# 1. Build
npm run build

# 2. Deploy (Vercel recommended)
vercel deploy

# 3. Run migrations
npm run migrate:deploy
```

---

## 📚 **REFERENCES**

### Related Documentation
- **WorkMe NextApp Auth Architecture**: `workme-nextapp/docs/AUTH-ARCHITECTURE.md`
- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Next.js App Router**: https://nextjs.org/docs/app
- **Prisma**: https://www.prisma.io/docs

### Key Files to Reference
- `workme-nextapp/lib/providers/AuthProvider.tsx` - AuthProvider pattern
- `workme-nextapp/lib/api.ts` - Axios interceptor pattern
- `workme-nextapp/lib/server/verifyAuth.ts` - Server verification pattern

---

## 🎯 **QUICK REFERENCE**

| Task | Pattern |
|------|---------|
| Make authenticated API call | `api.post('/api/...', data)` |
| Protect API route | Verify token with `getAdminAuth().verifyIdToken()` |
| Protect page | Wrap in `<Protected>` component |
| Get current user | `const { session } = useAuth()` |
| Search companies | `api.post('/api/company/search', { query })` |
| Create company | `api.post('/api/company/create', { name, domain })` |
| Update user | `api.post('/api/user/update', { name, title, ... })` |

---

**Last Updated**: 2025-01-XX  
**Maintainer**: WorkMe Team  
**Status**: ✅ Production Ready (Initial Scaffold)

