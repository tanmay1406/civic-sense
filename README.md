# Civic Issue Reporter - Municipal Governance System

A comprehensive mobile-first solution that bridges the communication gap between citizens and municipal authorities for reporting civic issues like potholes, streetlights, and waste management.

## 🌟 Overview

This system enables citizens to report civic issues through a mobile app while providing municipal authorities with a centralized dashboard for efficient issue management and resolution tracking.

### Key Features

**👥 Citizen Features:**

- 📸 Real-time photo reporting with GPS location tagging
- 🎤 Voice and text descriptions for comprehensive issue documentation
- 📊 Progress tracking and notification system
- 🌐 Responsive web interface accessible on all devices

**🏛️ Administrative Features:**

- 🗺️ Centralized dashboard with interactive city mapping
- ⚙️ Automated routing engine for department-specific task allocation
- 🔍 Advanced filtering by category, location, and priority
- 📈 Analytics and reporting for performance insights

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Citizen Web App │    │ Admin Dashboard │    │   Backend API   │
│   (React.js)    │◄──►│   (React.js)    │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Database      │◄───│  File Storage   │
                    │  (PostgreSQL)   │    │   (AWS S3)      │
                    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
civic-issue-reporter/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Authentication & validation
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── config/             # Configuration files
│   └── tests/              # API tests
├── citizen-web/            # React.js citizen web application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store and slices
│   │   ├── theme/          # UI theme configuration
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── admin-dashboard/        # React.js admin web dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Dashboard pages
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── shared/                 # Shared utilities and types
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Shared constants
│   └── utils/              # Shared utility functions
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

### Backend

- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT with bcrypt
- **File Storage:** AWS S3 / Google Cloud Storage
- **Real-time:** Socket.io for live updates
- **Validation:** Joi for input validation

### Citizen Web App

- **Framework:** React.js with modern hooks
- **State Management:** Redux Toolkit
- **UI Components:** Material-UI / Custom components
- **Maps:** Leaflet with OpenStreetMap / Google Maps
- **File Upload:** Browser APIs for camera/file access
- **Notifications:** Web Push Notifications

### Admin Dashboard

- **Framework:** React.js with TypeScript
- **UI Library:** Material-UI / Ant Design
- **Maps:** Leaflet with OpenStreetMap
- **Charts:** Recharts / D3.js
- **State Management:** Redux Toolkit

### DevOps & Deployment

- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Cloud Platform:** AWS / Google Cloud Platform
- **Monitoring:** CloudWatch / Google Cloud Monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Modern web browser
- Git for version control

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run migrate
npm run seed
npm run dev
```

### Citizen Web App Setup

```bash
cd citizen-web
npm install
npm start
# Access at http://localhost:3000
```

### Admin Dashboard Setup

```bash
cd admin-dashboard
npm install
npm start
```

## 📊 Database Schema

### Core Tables

- **users** - Citizens, admins, department staff
- **issues** - Reported civic issues
- **categories** - Issue categories (potholes, streetlights, etc.)
- **departments** - Municipal departments
- **assignments** - Issue-to-department assignments
- **status_updates** - Issue progress tracking
- **media** - Photos and videos attached to issues
- **notifications** - System notifications

## 🔌 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Issues

- `GET /issues` - List issues (with filtering)
- `POST /issues` - Create new issue
- `GET /issues/:id` - Get issue details
- `PUT /issues/:id` - Update issue
- `DELETE /issues/:id` - Delete issue

### Admin

- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/issues` - Admin issue management
- `PUT /admin/issues/:id/assign` - Assign issue to department
- `GET /admin/analytics` - Analytics data

## 🔔 Features Implementation Status

### Phase 1 - Core Features ✅

- [x] Project setup and architecture
- [x] Database schema design
- [x] Basic API endpoints
- [x] User authentication system

### Phase 2 - Citizen Web App 🚧

- [ ] Photo upload with location tagging
- [ ] Voice recording and transcription
- [ ] Issue submission workflow
- [ ] Progress tracking
- [ ] Web push notifications

### Phase 3 - Admin Dashboard 🚧

- [ ] Interactive mapping interface
- [ ] Issue management system
- [ ] Department routing engine
- [ ] Analytics and reporting

### Phase 4 - Advanced Features ⏳

- [ ] Predictive analytics
- [ ] Performance optimization
- [ ] Advanced search and filtering
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Email: support@civicissues.gov
- Documentation: [docs/](docs/)

## 🎯 Roadmap

- **Q1 2024:** Core functionality and citizen mobile app
- **Q2 2024:** Admin dashboard and department integration
- **Q3 2024:** Analytics, reporting, and performance optimization
- **Q4 2024:** AI-powered features and predictive analytics

---

**Built for Smart India Hackathon 2024** 🇮🇳
