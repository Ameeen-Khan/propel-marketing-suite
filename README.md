# Propel Marketing Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF.svg)](https://vitejs.dev/)

A modern, full-featured email marketing platform built with React, TypeScript, and Tailwind CSS. Propel Marketing Suite enables organizations to manage contacts, create dynamic email campaigns, build audiences with advanced filtering, and track campaign performance through an intuitive dashboard.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Building for Production](#-building-for-production)
- [Project Structure](#-project-structure)
- [Key Features Documentation](#-key-features-documentation)
- [API Integration](#-api-integration)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality

- **Dashboard & Analytics**
  - Real-time campaign performance metrics
  - Contact growth tracking
  - Email delivery statistics
  - Interactive charts and visualizations

- **Contact Management**
  - Import contacts via CSV
  - Advanced contact filtering and search
  - Custom fields (budget, property preferences, location, etc.)
  - Bulk contact operations
  - Contact activity tracking

- **Audience Builder**
  - Dynamic audience creation with filter rules
  - Real-time contact count preview
  - Filter by property type, budget range, location, bedrooms, bathrooms, square footage
  - Manual contact selection and management
  - Audience assignment to campaigns

- **Email Template Editor**
  - Rich text email template creation
  - Variable substitution support ({{FirstName}}, {{LastName}}, etc.)
  - HTML and plain text editing
  - Template preview
  - Test email sending
  - Template library management

- **Campaign Management**
  - One-time and recurring campaign scheduling
  - Multiple audience targeting
  - Campaign status tracking (draft, scheduled, running, paused, completed)
  - Daily, weekly, and monthly recurrence options
  - Campaign logs and delivery tracking
  - Pause/resume functionality

- **Team Collaboration**
  - Multi-user organization support
  - Role-based access control (Admin, Agent)
  - Team member invitation system
  - Activity tracking

- **Notifications**
  - Real-time in-app notifications
  - Campaign status updates
  - CSV import completion alerts
  - Team member activity notifications
  - Unread notification count

## 🛠 Tech Stack

### Frontend Framework
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety and developer experience
- **Vite 5.4.19** - Build tool and dev server

### UI Components & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **shadcn/ui** - Re-usable component collection

### State Management & Data Fetching
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Server state management
- **React Hook Form 7.61.1** - Form state management
- **Zod 3.25.76** - Schema validation

### Charts & Visualization
- **Recharts 2.15.4** - Composable charting library

### Development Tools
- **ESLint 9.32.0** - Code linting
- **Vitest 3.2.4** - Unit testing framework
- **TypeScript ESLint** - TypeScript-specific linting

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git** (for version control)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ameeen-Khan/propel-marketing-suite.git
   cd propel-marketing-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure the required variables (see [Configuration](#-configuration))

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Frontend Configuration
VITE_APP_NAME=Propel Marketing Suite
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` | Yes |
| `VITE_APP_NAME` | Application name | `Propel Marketing Suite` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |

## 💻 Development

### Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development environment |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## 🏗 Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

The production-ready files will be in the `dist/` directory.

### Deployment

The application can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **AWS S3 + CloudFront**: Upload `dist/` folder
- **Docker**: Use the included Dockerfile (if available)

## 📁 Project Structure

```
propel-marketing-suite/
├── public/                 # Static assets
│   └── logo.png           # Application logo
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── audience/     # Audience-specific components
│   │   └── layout/       # Layout components
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── use-toast.ts
│   │   └── use-auth.ts
│   ├── lib/              # Utility functions
│   │   └── utils.ts
│   ├── pages/            # Page components
│   │   ├── app/          # Application pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ContactsPage.tsx
│   │   │   ├── AudiencesPage.tsx
│   │   │   ├── TemplatesPage.tsx
│   │   │   ├── CampaignsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── auth/         # Authentication pages
│   │       ├── LoginPage.tsx
│   │       ├── SignupPage.tsx
│   │       └── ActivateAccountPage.tsx
│   ├── services/         # API services
│   │   └── api.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md            # This file
```

## 📖 Key Features Documentation

### Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **Login**: Email and password authentication
- **Signup**: Organization creation with admin user
- **Account Activation**: Token-based password setup for invited team members
- **Roles**: Admin (full access) and Agent (limited access)

### Contact Management

Import and manage contacts with custom fields:

```typescript
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  preferred_location?: string;
  notes?: string;
}
```

### Audience Filtering

Create dynamic audiences using filter criteria:

```typescript
interface AudienceFilters {
  property_type?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  budget_min?: number;
  budget_max?: number;
  square_feet_min?: number;
  square_feet_max?: number;
  preferred_location?: string[];
}
```

### Campaign Scheduling

Support for one-time and recurring campaigns:

- **One-time**: Schedule for a specific date and time
- **Daily**: Run every day at a specified time
- **Weekly**: Run on a specific day of the week
- **Monthly**: Run on a specific day of the month

## 🔌 API Integration

The application integrates with a backend API. All API calls are centralized in `src/services/api.ts`.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/signup` | POST | Organization signup |
| `/auth/activate` | POST | Activate account with token |
| `/agent/contacts` | GET, POST | List and create contacts |
| `/agent/contacts/:id` | GET, PUT, DELETE | Get, update, delete contact |
| `/agent/contacts/import` | POST | Import contacts from CSV |
| `/agent/audiences` | GET, POST | List and create audiences |
| `/agent/audiences/:id` | GET, PUT | Get and update audience |
| `/agent/audiences/:id/contacts` | GET, POST, DELETE | Manage audience contacts |
| `/agent/email-templates` | GET, POST | List and create templates |
| `/agent/email-templates/:id` | GET, PUT | Get and update template |
| `/agent/campaigns` | GET, POST | List and create campaigns |
| `/agent/campaigns/:id` | GET, PUT | Get and update campaign |
| `/agent/campaigns/:id/pause` | POST | Pause campaign |
| `/agent/campaigns/:id/resume` | POST | Resume campaign |
| `/agent/notifications` | GET | List notifications |
| `/agent/notifications/:id/read` | PUT | Mark notification as read |

## 🧪 Testing

Run the test suite:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Testing Stack

- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **jsdom** - DOM implementation for Node.js

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful icon library

## 📞 Support

For support, please:

- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

