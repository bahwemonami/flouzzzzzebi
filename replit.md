# FLOUZ - Cash Register Application

## Overview

FLOUZ is a modern, touch-optimized cash register application built with React and Node.js. The application features a clean, professional interface designed for retail environments with a focus on simplicity and efficiency. It includes user authentication, a demo mode, and follows modern web development best practices.

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
- **User Management**: User profiles with first name, last name, and demo flags
- **Security**: Password validation with Zod schemas

### Database Schema
- **Users Table**: Stores user accounts with email, password, and profile information
- **Sessions Table**: Manages authentication tokens with expiration
- **Drizzle ORM**: Type-safe database queries with PostgreSQL dialect

### UI Design System
- **Color Palette**: Professional blue theme (#2F80ED primary, #56CCF2 secondary, #27AE60 accent)
- **Typography**: Inter font family with consistent weight hierarchy
- **Components**: Comprehensive UI component library based on Radix UI
- **Responsive**: Touch-optimized interface for retail environments

### Storage Architecture
- **Database Storage**: PostgreSQL for production with Neon Database
- **Memory Storage**: Fallback in-memory storage for development
- **Interface Pattern**: Storage abstraction layer for easy switching between implementations

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

## User Preferences

Preferred communication style: Simple, everyday language.