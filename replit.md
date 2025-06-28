# FLOUZ - Application de Caisse Complète

## Overview

FLOUZ est une application de caisse moderne et complète, optimisée pour usage tactile, construite avec React et Node.js. L'application propose une interface professionnelle et épurée conçue pour les environnements commerciaux, mettant l'accent sur la simplicité et l'efficacité. Elle inclut l'authentification utilisateur, un mode démonstration, la gestion complète des produits et transactions, ainsi qu'un point de vente fonctionnel.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Token-based authentication with database sessions
- **Development**: Vite for frontend bundling and development server

## Key Components

### Authentication System
- **Login/Demo Mode**: Users can log in with credentials or use demo mode
- **Session Management**: Token-based sessions stored in PostgreSQL
- **User Management**: User profiles with first name, last name, demo flags, and master privileges
- **Master Account System**: Single administrative account (flouz@mail.com) with analytics and user management capabilities
- **Security**: Password validation with Zod schemas and role-based access control

### Point of Sale Features
- **Product Management**: Complete CRUD operations for products with categories
- **Inventory Tracking**: Stock management with real-time updates
- **Transaction Processing**: Support for cash, card, and check payments
- **Shopping Cart**: Interactive cart with quantity management
- **Categories**: Color-coded product organization system
- **Cash Register Closure**: Daily closure functionality with automatic Telegram reporting
- **Telegram Integration**: Automated daily sales reports sent to configured Telegram groups

### Database Schema
- **Users Table**: Stores user accounts with email, password, profile information, and Telegram configuration
- **Sessions Table**: Manages authentication tokens with expiration
- **Categories Table**: Product categories with custom colors
- **Products Table**: Complete product catalog with pricing, stock, and barcodes
- **Transactions Table**: Sales records with payment methods and totals
- **Transaction Items Table**: Detailed line items for each sale
- **Drizzle ORM**: Type-safe database queries with PostgreSQL dialect

### Telegram Integration
- **User Configuration**: Chat ID and Bot Token fields for each user
- **Daily Reports**: Automated end-of-day sales summaries
- **Report Content**: Total revenue, cash/card/check breakdowns, transaction count, average ticket
- **Cash Register Closure**: One-click day closure with automatic logout and Telegram notification

### User Interface
- **Dashboard**: Overview with quick actions and daily statistics
- **POS Interface**: Touch-optimized point of sale with product grid and cart
- **Product Management**: Administrative interface for catalog management
- **Master Analytics**: Advanced analytics dashboard with KPIs, transaction trends, and user insights
- **User Management**: Complete CRUD interface for managing user accounts, status, and permissions
- **Color Palette**: Professional FLOUZ theme (#2F80ED primary, #56CCF2 secondary, #27AE60 accent, #E74C3C for master functions)
- **Typography**: Inter font family with consistent weight hierarchy
- **Components**: Comprehensive UI component library based on Radix UI
- **Responsive**: Touch-optimized interface for retail environments

### Storage Architecture
- **Memory Storage**: In-memory storage with demo data for development and testing
- **Interface Pattern**: Storage abstraction layer for easy switching between implementations
- **Demo Data**: Pre-populated categories and products for immediate testing

## Data Flow

1. **Authentication Flow**:
   - User submits login credentials or requests demo access
   - Server validates credentials and creates session token
   - Token stored in localStorage and sent with subsequent requests
   - Server validates token on protected routes

2. **Application Flow**:
   - Authenticated users access the dashboard
   - Real-time session validation ensures security
   - Graceful error handling with toast notifications

3. **Development Flow**:
   - Vite handles frontend development with hot reloading
   - Express server serves API endpoints
   - Database migrations managed through Drizzle Kit

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript support
- **Component Library**: Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom configuration
- **HTTP Client**: Fetch API with custom wrapper for authentication
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom token-based session management
- **Development**: tsx for TypeScript execution

### Build Tools
- **Frontend**: Vite for bundling and development
- **Backend**: esbuild for production builds
- **Database**: Drizzle Kit for schema management and migrations

## Deployment Strategy

### Replit Environment
- **Modules**: Node.js 20, Web, PostgreSQL 16
- **Development**: `npm run dev` for concurrent frontend/backend development
- **Production**: `npm run build` followed by `npm run start`
- **Port Configuration**: Application runs on port 5000, exposed as port 80

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend bundled with esbuild to `dist/index.js`
3. Static assets served from built frontend
4. Database schema pushed with `npm run db:push`

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment configuration (development/production)

## Changelog

Changelog:
- June 26, 2025. Initial setup
- June 28, 2025. Implémentation du système de compte master avec analytics et gestion utilisateurs
- June 28, 2025. Ajout de la fonctionnalité de clôture de caisse avec notifications Telegram

## User Preferences

Preferred communication style: Simple, everyday language.