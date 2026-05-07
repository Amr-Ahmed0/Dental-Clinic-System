# 🦷 Dental Clinic Management System

> **Full-Stack clinic management platform built with Express.js, SQL Server, and Vanilla JavaScript**

A scalable solution designed to simplify and automate dental clinic operations — from patient records to billing and analytics.

---

## 📌 Overview

This system helps clinics manage daily operations efficiently through:

- 👤 **Patient & Doctor Management**  
- 📅 **Appointment Scheduling**  
- 🦷 **Treatment Tracking**  
- 💰 **Billing & Payment System**  
- 📊 **Real-Time Dashboard & Insights**  

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


## 🔌 API Endpoints Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/dashboard/stats` | Overview counts + revenue |
| GET | `/dashboard/today-appointments` | Today's appointments |
| GET | `/dashboard/appointments-with-names` | All appointments with names |
| GET / POST | `/patients` | List / Create patients |
| GET / PUT / DELETE | `/patients/:id` | Get / Update / Delete patient |
| GET / POST | `/doctors` | List / Create doctors |
| GET / PUT / DELETE | `/doctors/:id` | Get / Update / Delete doctor |
| GET / POST | `/appointments` | List / Create appointments |
| GET / PUT / DELETE | `/appointments/:id` | Get / Update / Delete appointment |
| GET / POST | `/treatments` | List / Create treatments |
| GET / PUT / DELETE | `/treatments/:id` | Get / Update / Delete treatment |
| GET / POST | `/visits` | List / Create visits |
| GET | `/visits/:id` | Get visit details |
| GET / POST | `/visits/:id/treatments` | Treatments for a visit |
| GET / POST | `/invoices` | List / Create invoices |
| GET / PUT / DELETE | `/invoices/:id` | Get / Update / Delete invoice |
| GET / POST | `/payments` | List / Create payments |
| GET | `/payments/:id` | Get payment details |



---


## 🚀 Getting Started

Follow these steps to set up and run the project locally:

---

### 📥 1. Clone the repository

```bash
git clone https://github.com/Amr-Ahmed0/Dental-Clinic-Management-System.git
cd Dental-Clinic-Management-System

npm install

PORT=5000
DB_SERVER=localhost
DB_NAME=MedicalSystem
DB_USER=your_username
DB_PASSWORD=your_password

npm start

http://localhost:5000
```