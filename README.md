# 🦷 Dental Clinic Management System

> **Full-Stack clinic management platform built with Express.js, SQL Server, and React (Vite + TypeScript)**
> A scalable solution designed to simplify and automate dental clinic operations — from patient records to billing and analytics.

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2019%2B-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## 📌 Overview

This system helps clinics manage daily operations efficiently through:

| Module | Description |
|--------|-------------|
| 👤 **Patient & Doctor Management** | Register, update, and view patient and doctor profiles |
| 📅 **Appointment Scheduling** | Book, reschedule, and track appointment status |
| 🦷 **Treatment Tracking** | Assign and manage dental treatments per visit |
| 💰 **Billing & Payment System** | Generate invoices, apply discounts, and record payments |
| 📊 **Real-Time Dashboard** | Live statistics and clinic-wide analytics |

---



## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 
- **Framework**: Express.js 
- **Database**: Microsoft SQL Server 

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: CSS (custom, via `index.css`)
- **API Layer**: Fetch-based helpers (`api.ts`)

---

## 🔐 User Roles

| Role | Access Level |
|------|-------------|
| `doctor` | Visits, treatments, appointments (own records) |
| `receptionist` | Patients, appointments, basic billing |
| `billing` | Invoices and payments only |

--- 

## 📁 Project Structure

```
dental-clinic/
├── 📁 Database/
│   ├── 🗃️ DentalClinicSystem.sql    (Main DB schema)
│   ├── 🗃️ QUERIES.sql              (Common queries)
│   └── 🗃️ Seed.sql                 (Sample data)
│
├── 📦 node_modules/                 (Dependencies folder)
│
├── ⚛️ src/                          (React/Vite frontend)
│   ├── 📂 components/               (React components)
│   ├── 📂 utils/                    (Utility functions)
│   ├── 📘 api.ts                    (API fetch helpers)
│   ├── ⚛️ App.tsx                   (Main App component)
│   ├── 📘 displayName.ts            (Name formatting utils)
│   ├── 🎨 index.css                 (Global styles)
│   ├── ⚛️ main.tsx                  (React entry point)
│   ├── 📘 store.ts                  (State management)
│   └── 📘 types.ts                  (TypeScript interfaces)
│
├── 🔐 .env                          (Environment variables)
├── 🚫 .gitignore                    (Git ignore rules)
├── 📄 .hintrc                       (HTML hints config)
├── 🌐 index.html                    (HTML entry point)
├── 📋 package-lock.json             (Lock file)
├── 📋 package.json                  (Project config)
├── 📜 server.js                     (Express backend)
├── 📋 tsconfig.json                 (TypeScript config)
└── 📘 vite.config.ts                (Vite build config)
```
---


## 🗄️ Database Schema

The system uses **8 relational tables** in SQL Server:

```
Patients ──< Appointments >── Doctors
Patients ──< Visits        >── Doctors
Visits   ──< Uses          >── Treatments
Patients ──< Invoices      ──< Payments
```

| Table | Description |
|-------|-------------|
| `Patients` | Patient demographics and medical history |
| `Doctors` | Doctor profiles, specialty, and working hours |
| `Appointments` | Scheduled sessions between patients and doctors |
| `Visits` | Recorded clinical visits with diagnosis and notes |
| `Treatments` | Available treatments with cost, duration, and category |
| `Invoices` | Billing records with discount and final amount |
| `Payments` | Payment transactions linked to invoices |
| `Users` | System login accounts with role-based access |


---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) v18 or higher
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) 2019 or higher
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) *(recommended)*
- npm (comes with Node.js)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/dental-clinic.git
cd dental-clinic
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

DB_USER=your_sql_user
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_NAME=DentalClinicDB
DB_PORT=1433
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

### 4️⃣ Setup Database

1. Open **SQL Server Management Studio (SSMS)**
2. Run the main schema script:

```
Database/DentalClinicSystem.sql
```

3. Seed sample data:

```
Database/Seed.sql
```

---

### 5️⃣ Start Development Servers

**Backend**

```bash
node server.js
```

**Frontend**

```bash
npm run dev
```

Then open your browser at:

```
http://localhost:5173   ← Frontend (Vite)
http://localhost:5000   ← Backend API (Express)
```

---


## 🔌 API Endpoints

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | Get all patients |
| `GET` | `/api/patients/:id` | Get patient by ID |
| `POST` | `/api/patients` | Create new patient |
| `PUT` | `/api/patients/:id` | Update patient |
| `DELETE` | `/api/patients/:id` | Delete patient |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors` | Get all doctors |
| `GET` | `/api/doctors/:id` | Get doctor by ID |
| `POST` | `/api/doctors` | Create new doctor |
| `PUT` | `/api/doctors/:id` | Update doctor |
| `DELETE` | `/api/doctors/:id` | Delete doctor |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/appointments` | Get all appointments |
| `GET` | `/api/appointments/today` | Get today's appointments |
| `POST` | `/api/appointments` | Book new appointment |
| `PUT` | `/api/appointments/:id` | Update appointment |
| `DELETE` | `/api/appointments/:id` | Cancel appointment |

### Visits & Treatments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/visits` | Get all visits |
| `GET` | `/api/visits/:patientId` | Get visits by patient |
| `POST` | `/api/visits` | Record new visit |
| `GET` | `/api/treatments` | Get all treatments |
| `POST` | `/api/treatments` | Add new treatment |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/invoices` | Get all invoices |
| `GET` | `/api/invoices/pending` | Get unpaid invoices |
| `POST` | `/api/invoices` | Create invoice |
| `GET` | `/api/payments` | Get all payments |
| `POST` | `/api/payments` | Record payment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Total revenue, patients, appointments |
| `GET` | `/api/dashboard/top-doctor` | Most active doctor |

---