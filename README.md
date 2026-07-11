# RentNest 🏠

> "Find & List Rental Properties with Ease"

A production-ready RESTful backend API for a rental property marketplace built with **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. Landlords can list properties, manage availability, and approve/reject rental requests. Tenants can browse listings, submit rental requests, make payments via Stripe, and leave reviews. Admins oversee the entire platform.

---

## 🔗 Live Links

| Resource | URL |
|----------|-----|
| **Backend Repo** | [GitHub](https://github.com/Ahammad204/RentNestBackend) |
| **Live API** | [rent-nest-backend-brown.vercel.app](https://rent-nest-backend-brown.vercel.app/) |





---

## ✨ Features

### Authentication & Authorization
- **JWT-based auth** with access & refresh tokens stored in httpOnly cookies
- **Role-based access control** — Tenant, Landlord, Admin
- Password hashing with bcryptjs
- Token refresh mechanism

### Tenant Features
- Browse & search available properties (filter by location, price, type, amenities)
- Submit rental requests for properties
- Make payments via **Stripe Checkout** after approval
- View rental request history & payment history
- Leave reviews (1–5 stars) after completed rentals
- Manage profile

### Landlord Features
- Create, edit, and delete property listings
- View incoming rental requests
- Approve or reject rental requests (state machine: PENDING → APPROVED/REJECTED → ACTIVE → COMPLETED)
- View tenant history

### Admin Features
- View all users with role filter
- Ban/unban users
- View all properties and rental requests
- Manage property categories

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES2023) |
| Language | TypeScript 7.x |
| Framework | Express 5.x |
| ORM | Prisma 7.x |
| Database | PostgreSQL |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Build Tool | tsup |
| Dev Runner | tsx (watch mode) |
| Deployment | Vercel (Serverless) |
| Module System | ES Modules |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** database (local or hosted — Prisma Postgres, Supabase, Neon, etc.)
- **Stripe** account ([stripe.com](https://stripe.com)) for payment integration

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ahammad204/RentNestBackend.git
cd RentNestBackend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual values (see Environment Variables below)

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Seed the database
npx prisma db seed

# 6. Start the development server
npm run dev
```

The server will start at `http://localhost:5000`.

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/rentnest"

# Server
PORT=5000
APP_URL=http://localhost:5000

# Authentication
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your-access-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_PRODUCT_ID=your-stripe-product-id
STRIPE_PRODUCT_PRICE_ID=your-stripe-price-id
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-signing-secret
```

| Variable | Description | Required |
|----------|-------------|:--------:|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `APP_URL` | Frontend/app URL (for CORS & Stripe redirects) | ✅ |
| `BCRYPT_SALT_ROUNDS` | Password hash rounds | ✅ |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | ✅ |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (e.g., `15m`) | ✅ |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., `7d`) | ✅ |
| `STRIPE_PRODUCT_ID` | Stripe product ID | ✅ |
| `STRIPE_PRODUCT_PRICE_ID` | Stripe price ID | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | ✅ |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/users/register` | Public | Register new user (select role: TENANT/LANDLORD) |
| `POST` | `/api/auth/login` | Public | Login user, returns JWT in httpOnly cookies |
| `POST` | `/api/auth/refresh-token` | Public | Refresh access token |

### User Profile

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/users/me` | Authenticated | Get current user profile |
| `PUT` | `/api/users/me` | Authenticated | Update profile (name, phone, bio) |

### Categories

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/category` | Admin | Create a property category |
| `GET` | `/api/category` | Public | Get all categories |

### Properties

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/properties` | Public | Get all properties (with filters: location, price, type, amenities, pagination) |
| `GET` | `/api/properties/:id` | Public | Get property details with reviews |
| `POST` | `/api/properties` | Landlord | Create a new property listing |
| `PUT` | `/api/properties/:id` | Landlord | Update property (owner only) |
| `DELETE` | `/api/properties/:id` | Landlord | Delete property (owner only) |

### Rental Requests

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/rentals` | Tenant | Submit a rental request |
| `GET` | `/api/rentals` | Tenant / Landlord | Get my rental requests (role-based) |
| `GET` | `/api/rentals/landlord` | Landlord | Get all requests for landlord's properties |
| `GET` | `/api/rentals/:id` | Tenant / Landlord / Admin | Get rental request details |
| `PATCH` | `/api/rentals/landlord/:id` | Landlord | Approve or reject a rental request |

### Payments (Stripe)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/payments/create` | Tenant | Create Stripe Checkout session for approved rental |
| `POST` | `/api/payments/confirm` | Public (Webhook) | Stripe webhook — confirms payment, activates rental |
| `GET` | `/api/payments` | Tenant / Landlord / Admin | Get payment history |
| `GET` | `/api/payments/:id` | Tenant / Landlord / Admin | Get payment details |

### Reviews

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/reviews` | Tenant | Create review (1–5 stars) for completed/active rental |
| `GET` | `/api/reviews/property/:propertyId` | Public | Get reviews & average rating for a property |

### Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/users` | Admin | Get all users (optional `?role=` filter) |
| `PATCH` | `/api/admin/users/:id` | Admin | Ban or unban a user |
| `GET` | `/api/admin/properties` | Admin | Get all properties (any status) |
| `GET` | `/api/admin/rentals` | Admin | Get all rental requests |

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│   User   │──1:1──│   Profile    │       │   Category   │
│          │       │              │       │              │
│ id       │       │ id           │       │ id           │
│ name     │       │ phone        │       │ name         │
│ email    │       │ bio          │       │ description  │
│ password │       │ userId (FK)  │       │              │
│ role     │       └──────────────┘       └──────┬───────┘
│ status   │                                     │
└────┬─────┘                                     │
     │                                           │
     │ 1:N                                       │ 1:N
     │                                           │
     ▼                                           ▼
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│   Property   │───│ RentalRequest  │    │    Review    │
│              │    │                │    │              │
│ id           │    │ id             │    │ id           │
│ title        │    │ status         │    │ rating       │
│ price        │    │ moveInDate     │    │ comment      │
│ location     │    │ message        │    │ tenantId(FK) │
│ propertyType │    │ tenantId (FK)  │    │ propertyId   │
│ amenities[]  │    │ propertyId(FK) │    │ rentalReqId  │
│ status       │    └───────┬────────┘    └──────────────┘
│ images[]     │            │
│ landlordId   │            │ 1:1
│ categoryId   │            ▼
└──────────────┘    ┌────────────────┐
                    │    Payment     │
                    │                │
                    │ id             │
                    │ transactionId  │
                    │ amount         │
                    │ method         │
                    │ status         │
                    │ paidAt         │
                    │ rentalReqId(FK)│
                    └────────────────┘
```

### Models

| Model | Description |
|-------|-------------|
| **User** | Stores user info, auth details, role (TENANT/LANDLORD/ADMIN), status (ACTIVE/BANNED) |
| **Profile** | Extended user profile with phone and bio (linked 1:1 to User) |
| **Category** | Property categories (Apartment, House, Studio, Condo, Townhouse) |
| **Property** | Rental listings with title, price, location, amenities, images, status (AVAILABLE/RENTED) |
| **RentalRequest** | Requests from tenants with state machine (PENDING → APPROVED → ACTIVE → COMPLETED) |
| **Payment** | Stripe payment records with transaction ID, amount, status (PENDING/COMPLETED/FAILED) |
| **Review** | Tenant reviews with 1–5 star rating and comment (one per rental request) |

### Enums

| Enum | Values |
|------|--------|
| `Role` | `TENANT`, `LANDLORD`, `ADMIN` |
| `UserStatus` | `ACTIVE`, `BANNED` |
| `PropertyStatus` | `AVAILABLE`, `RENTED` |
| `RentalRequestStatus` | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED` |
| `PaymentStatus` | `PENDING`, `COMPLETED`, `FAILED` |

---

## 📁 Project Structure

```
RentNestBackend/
├── prisma/
│   ├── migrations/              # Database migration files
│   ├── schema/                  # Prisma schema (split by model)
│   │   ├── schema.prisma        # Generator & datasource config
│   │   ├── enums.prisma         # All enums
│   │   ├── user.prisma          # User model
│   │   ├── profile.prisma       # Profile model
│   │   ├── category.prisma      # Category model
│   │   ├── property.prisma      # Property model
│   │   ├── rentalrequest.prisma # RentalRequest model
│   │   ├── payment.prisma       # Payment model
│   │   └── review.prisma        # Review model
│   └── seed.ts                  # Database seeder
├── src/
│   ├── config/
│   │   └── index.ts             # Environment config
│   ├── generated/               # Prisma generated client
│   ├── lib/
│   │   └── prisma.ts            # Prisma client instance
│   ├── middlewares/
│   │   ├── auth.ts              # JWT auth middleware
│   │   ├── globalErrorHandlar.ts # Global error handler
│   │   └── notFound.ts          # 404 handler
│   ├── modules/
│   │   ├── admin/               # Admin controller, service, routes
│   │   ├── auth/                # Login, refresh token
│   │   ├── category/            # Category CRUD
│   │   ├── payment/             # Stripe integration
│   │   ├── properties/          # Property CRUD
│   │   ├── rental/              # Rental request management
│   │   ├── review/              # Review system
│   │   └── user/                # User registration & profile
│   ├── utils/
│   │   ├── AppError.ts          # Custom error class
│   │   ├── catchAsync.ts        # Async error wrapper
│   │   ├── jwt.ts               # JWT sign/verify utilities
│   │   ├── ownershipCheck.ts    # Property ownership verification
│   │   └── sendResponse.ts      # Standardized response helper
│   ├── app.ts                   # Express app setup & middleware
│   └── server.ts                # Server entry point
├── .env.example                 # Environment variable template
├── package.json
├── tsconfig.json
├── vercel.json                  # Vercel deployment config
└── README.md
```

---

## 🚀 Deployment (Vercel)

### Steps

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repository
3. Configure environment variables in Vercel dashboard (same as `.env`)
4. Deploy — Vercel builds with `tsup` and serves from `dist/server.js`

### Build Configuration

- **Build command:** `npm run build` (runs `tsup`)
- **Output directory:** `dist/`
- **Entry point:** `dist/server.js`

> ⚠️ **Important:** After deploying, update your Stripe webhook URL to point to the Vercel domain.

---

## 🔗 Stripe Webhook Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) → **Developers** → **Webhooks**
2. Click **Add destination**
3. Enter your webhook URL: `https://rent-nest-backend-brown.vercel.app/api/payments/confirm`
4. Select event: **`checkout.session.completed`**
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Set it as `STRIPE_WEBHOOK_SECRET` in your Vercel environment variables
7. Redeploy your Vercel project

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production with tsup |
| `npm start` | Run production build |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma db seed` | Seed database with admin user & categories |
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |
| `npm run stripe:webhook` | Forward Stripe webhooks to local server |

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/Ahammad204/RentNestBackend/issues).
