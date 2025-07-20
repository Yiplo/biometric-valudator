# Biometric Authentication System

## Overview

This is a full-stack biometric authentication system built with React (frontend), Express.js (backend), and in-memory storage. The system provides functionality for biometric validation, electoral registry management, and validation history tracking. It features a modern cyberpunk-themed UI with shadcn/ui components and simulates a professional biometric validation platform.

## Recent Changes

**January 2025 - Multi-User Authentication & Enhanced Features:**
- Implemented multiple administrator accounts (admin, admin1-admin4) with unified password
- Added dropdown user selector in login interface with professional labels
- Enhanced biometric visualization with detailed fingerprint display modals
- Improved search functionality with RFC/CURP specific placeholders
- Added 5 sample electoral records with realistic fingerprint data simulation
- Implemented comprehensive user detail views with biometric characteristics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom cyberpunk theme variables
- **Authentication**: Local storage-based session management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: bcrypt for password hashing
- **Session Management**: Basic username/password authentication
- **API Structure**: RESTful endpoints with proper error handling
- **Development**: Hot reloading with tsx and Vite middleware

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Tables**:
  - `users`: System administrators
  - `electoral_registry`: Citizen biometric records
  - `validation_history`: Audit trail of validation attempts
  - `institutions`: API key management for external services

## Key Components

### Authentication System
- Login page with cyberpunk styling
- Session-based authentication using localStorage
- Protected routes that redirect to login when unauthenticated
- User validation with bcrypt password hashing

### Biometric Validation
- Simulated fingerprint capture interface
- Biometric matching algorithm (simulated)
- Support for multiple identifier types (CURP, INE, RFC)
- Real-time validation results with matching percentages
- Threshold-based success/failure determination

### Electoral Registry Management
- CRUD operations for citizen records
- Search and filtering capabilities
- Bulk data management interface
- Status tracking (active/inactive)
- Secure storage of biometric data (base64 encoded)

### Validation History & Analytics
- Complete audit trail of validation attempts
- Statistics dashboard with success rates
- Institution-based filtering
- Timestamp tracking with IP address logging
- Performance metrics and trends

## Data Flow

1. **Authentication Flow**:
   - User submits credentials → Backend validates → Session stored locally
   - Protected routes check authentication state on render

2. **Biometric Validation Flow**:
   - Capture biometric data → Send to validation endpoint → Compare with stored data
   - Generate matching percentage → Record in validation history → Return result

3. **Registry Management Flow**:
   - CRUD operations → Database via Drizzle ORM → Real-time UI updates via React Query
   - Form validation with Zod schemas → Error handling and user feedback

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **bcrypt**: Password hashing and validation
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for backend development with hot reloading
- Integrated development experience with concurrent frontend/backend

### Production Build Process
1. Frontend: `vite build` → Static files in `dist/public`
2. Backend: `esbuild` bundle → Single file in `dist/index.js`
3. Database: `drizzle-kit push` for schema synchronization

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Separate client and server build outputs for optimal deployment

### Hosting Considerations
- Static frontend can be served from any CDN
- Backend requires Node.js runtime environment
- Database migrations handled via Drizzle Kit
- Session management currently client-side (localStorage)

## Security Features

- Password hashing with bcrypt
- SQL injection protection via Drizzle ORM
- Input validation with Zod schemas
- CORS handling for API endpoints
- Secure biometric data storage (base64 encoded)
- Audit logging for all validation attempts