# SASF Law Firm | Smart Assistant & Solicitor Framework

SASF Law Firm is a premium, role-based legal management platform designed for high-efficiency collaboration between clients, legal assistants, lawyers, and administrators.

## 🏛️ System Architecture

The project follows a modular **Client-Server** architecture for scalability and security.

- **Frontend (`/client`)**: Role-isolated modules for Admin, Assistant, Lawyer, and Client.
  - **Shared Assets**: Centralized authentication (`auth.js`), global styles (`styles.css`), and common logic.
- **Backend (`/server`)**: Node.js & Express API with role-based data filtering.
- **Database**: PostgreSQL (via Neon) for persistent state management with LocalStorage synchronization.

## 👥 Roles and Workflows

### 1. Client Portal
Clients can seamlessly interact with the firm through a dedicated interface.
- **Case Category Selection**: Choose from 12 specialized practice areas (Criminal, Family, Corporate, etc.).
- **Unassigned Booking**: Book appointments that enter a specialty pool for expert claiming.
- **Real-time Tracking**: Monitor case status and upcoming hearing dates instantly.

### 2. Assistant Dashboard (Amber Theme)
Assistants act as the primary intake and management layer, working under specific lawyers.
- **Specialty-Based Claiming**: Assistants see and claim unassigned appointments matching their legal specialty.
- **Lawyer Collaboration**: View the assigned Lawyer's schedule directly to manage task delegation.
- **Case Proposal System**: Verify payments and "Propose" cases to Lawyers for final acceptance.
- **Status Management**: Update case progress visible to clients in real-time.

### 3. Lawyer Dashboard
Lawyers focus on legal strategy and case representation.
- **Case Request Pool**: Review and "Accept" new case proposals sent by their Assistants.
- **Schedule Integrity**: Integrated calendar for managing hearings, meetings, and deadlines.
- **Full Case Oversight**: Access to all documents and case notes synchronized with their assistant.

### 4. Admin Command Center
- **System Governance**: Manage user accounts and role permissions.
- **Operational Reporting**: Generate transaction logs and activity reports.
- **Verification Logic**: Oversee account registrations and security.

## 🛠️ Key Features

- **Dynamic Filtering**: Assistant registration is context-aware; selecting a category filters available lawyers to those specializing in that field.
- **Premium UI/UX**: Distinctive color systems for different roles (e.g., **Amber Yellow** for Assistants) with modern glassmorphism and micro-animations.
- **Role Isolation**: Filtered API endpoints ensure that Lawyers and Assistants only see data relevant to their specific partnership.
- **Security**: Password visibility toggles, confirmation validation, and role-based access control.

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Neon PostgreSQL connection string

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   DATABASE_URL=your_neon_sql_url
   PORT=3000
   ```
3. Start the server:
   ```bash
   npm start
   ```

## ⚖️ Legal Practice Categories
1. Criminal Law
2. Civil Law
3. Family Law
4. Corporate / Business Law
5. Property / Real Estate Law
6. Labor & Employment Law
7. Intellectual Property (IP) Law
8. Tax Law
9. Immigration Law
10. Cyber Law / IT Law
11. Environmental Law
12. Constitutional / Administrative Law
