# CaseCloud: Legal Case & Document Organizer

CaseCloud is a modern, web-based management system for law firms. It provides a robust, role-based platform for administrators, legal assistants, lawyers, and clients to collaborate on cases, manage documents, and schedule appointments.

## 🏛️ System Architecture

- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), and JavaScript.
- **Backend**: Node.js & Express (API layer).
- **Database**: SQL-based (Neon/PostgreSQL) with LocalStorage fallback for offline capability.
- **Security**: Role-Based Access Control (RBAC) with session management.

## 👥 Roles and Tasks

The system is defined by four distinct user roles, each with specialized dashboards and workflows.

### 1. Administrator
The Administrator oversees the entire system and manages the firm's operations.
- **User Management**: Add, update, and disable user accounts.
- **Role Assignment**: Assign and update roles (Client, Assistant, Lawyer).
- **System Overview**: Monitor active sessions and system health.
- **Reporting**: Generate detailed transaction and activity reports.
- **Global Notifications**: View and manage all system-wide alerts.

### 2. Assistant
The Assistant supports the legal team by handling the administrative lifecycle of legal cases.
- **Command Center Dashboard**: Personalized overview of assigned cases, recent documents, and pending appointments.
- **Lawyer Directory**: Integrated access to the firm's legal counsel roster with search and filter capabilities.
- **Global Search**: Persistent header search bar for instant access to cases, documents, and lawyers.
- **Case Lifecycle Management**: Create, update, and manage case statuses with automatic assistant attribution.
- **Appointment Handling**: Review appointment requests, verify payments, and confirm schedules.
- **Document Repository**: Manage the document library (uploads, updates, deletions).

### 3. Lawyer
Lawyers focus on case details and represent clients in legal proceedings.
- **Case Review**: Access detailed information for assigned cases.
- **Schedule Management**: Track hearing dates, deadlines, and consultations.
- **Notifications**: Stay updated on new case assignments and scheduling changes.
- **Documentation**: Access and review legal evidence and contracts.

### 4. Client
Clients interact with the firm to track their legal matters.
- **Status Tracking**: Monitor the live status of their active cases.
- **Appointment Management**: View confirmed consultations and hearing reminders.
- **Notifications**: Receive instant alerts for payment confirmations and case updates.
- **Profile Security**: Manage personal information and login credentials.

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.
- Neon PostgreSQL connection string (configure in `.env`).

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Create a `.env` file with your `DATABASE_URL` and `PORT`.

### Running the Project
- **Production/Server Mode**:
  ```bash
  npm start
  ```
  The app will be available at `http://localhost:3000`.

- **Hybrid Synchronization**:
  The system automatically synchronizes data between the browser's LocalStorage and the Cloud SQL database for high availability and offline resilience.

## 🛠️ Technology Stack
- **Styling**: Premium custom CSS with a focus on glassmorphism, responsive grids, and modern typography.
- **Database**: SQL-based (Neon/PostgreSQL) with a robust synchronization layer for multi-tab consistency.
- **Search**: Real-time context-aware global search integrated into the dashboard header.
- **Icons**: Emoji-based iconography for lightweight, framework-free visual cues.
