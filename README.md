# Order Delivery Manager

A full-stack order and delivery management system that integrates with Shopify and HubSpot CRM.

## Features

- **Shopify Integration**: Automatic order sync via webhooks
- **Order Management**: Track orders through the entire fulfillment flow
- **Delivery Management**: Assign drivers, capture signatures, take delivery photos
- **HubSpot CRM Sync**: Automatically sync delivered orders to HubSpot
- **Real-time Status Updates**: Status changes sync back to Shopify
- **Mobile-friendly**: Signature capture and camera integration work on mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS
- **File Storage**: Cloudinary (signatures & photos)
- **External APIs**: Shopify GraphQL API, HubSpot API

## Order Status Flow

```
RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
                              ↓
                            FAILED (can retry)
```

Each status change syncs to Shopify automatically.

## Setup

### 1. Clone and Install

```bash
cd order-delivery-manager
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"

# Shopify
SHOPIFY_SHOP_NAME="your-shop.myshopify.com"
SHOPIFY_API_KEY="your-api-key"
SHOPIFY_API_SECRET="your-api-secret"
SHOPIFY_ACCESS_TOKEN="your-access-token"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"

# HubSpot
HUBSPOT_ACCESS_TOKEN="your-hubspot-token"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample users
npm run db:seed
```

### 4. Shopify Webhook Setup

In your Shopify admin:
1. Go to Settings → Notifications → Webhooks
2. Add webhook: `https://your-domain.com/api/webhooks/shopify`
3. Topics: `orders/create`, `orders/updated`
4. Copy the webhook secret to `SHOPIFY_WEBHOOK_SECRET`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

Default login:
- Email: `admin@example.com`
- Password: `admin123`

## Project Structure

```
order-delivery-manager/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth routes
│   │   ├── orders/               # Order API endpoints
│   │   ├── webhooks/shopify/     # Shopify webhook handler
│   │   └── setup/                # Initial setup endpoint
│   ├── dashboard/
│   │   ├── page.tsx              # Orders list
│   │   ├── layout.tsx            # Dashboard layout
│   │   └── orders/[id]/          # Order detail page
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client
│   ├── shopify.ts                # Shopify client
│   ├── shopify-orders.ts         # Shopify order operations
│   ├── hubspot.ts                # HubSpot client
│   ├── hubspot-sync.ts           # HubSpot sync logic
│   ├── cloudinary.ts             # File upload utilities
│   ├── constants.ts              # Status flow definitions
│   └── utils.ts                  # Helper functions
├── prisma/
│   └── schema.prisma             # Database schema
└── types/
    └── next-auth.d.ts            # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List all orders |
| `/api/orders/[id]` | GET | Get order details |
| `/api/orders/[id]` | PATCH | Update order status |
| `/api/orders/[id]/delivery` | POST | Assign driver or complete delivery |
| `/api/webhooks/shopify` | POST | Shopify webhook handler |

## Future 3PL Integration

The delivery system is designed to support 3PL providers:

- Abstract delivery assignment layer
- Webhook system for external logistics
- Tracking number support
- API endpoints ready for 3PL callbacks

## License

MIT
# Deployment trigger: Tue Mar 17 15:42:10 HKT 2026
