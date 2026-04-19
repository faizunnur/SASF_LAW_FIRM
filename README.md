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
- **Case Lifecycle Management**: Create, update, and manage case statuses.
- **Legal Assignment**: Assign lawyers to specific cases and track progress.
- **Appointment Handling**: Review appointment requests, verify payments, and confirm schedules.
- **Document Repository**: Manage the document library (uploads, updates, deletions).
- **Advanced Search**: Filter the case database by keywords, types, and priority.

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

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies (Optional if running locally with LocalStorage):
   ```bash
   npm install
   ```

### Running the Project
- **Production/Server Mode**:
  ```bash
  npm start
  ```
  The app will be available at `http://localhost:3000`.

- **Client-Only Mode**:
  Simply open `index.html` in your browser. The system will default to LocalStorage for data persistence.

## 🛠️ Technology Stack
- **Styling**: Premium custom CSS with a focus on glassmorphism and modern typography.
- **Storage**: Hybrid model supporting both cloud SQL and browser-based LocalStorage.
- **Icons**: Emoji-based iconography for lightweight, framework-free visual cues.
