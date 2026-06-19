# EswarLabs Certificate Platform

A modern, multi-tenant SaaS platform for generating, issuing, and verifying digital certificates and credentials at scale.

## 🚀 Features

- **Multi-tenant Architecture:** Organize by Organizations and Workspaces with role-based access control (RBAC).
- **Dynamic Template Builder:** Visual drag-and-drop editor to design custom certificate templates.
- **Bulk Issuance:** Upload CSV files to generate and issue hundreds of certificates instantly.
- **High-Performance Background Workers:** Built with BullMQ and Redis to handle PDF generation, Image generation, and mass email delivery asynchronously without blocking the main thread.
- **Custom Email Delivery:** Workspaces can configure their own custom SMTP settings for white-labeled email delivery.
- **Public Verification:** Unique verification codes and links for every issued credential.

## 🛠 Tech Stack

### Frontend
- **React 18** (Vite)
- **Konva.js** (Canvas rendering for templates)
- **Lucide React** (Icons)
- **SWR** (Data fetching & caching)
- **React Router v6**

### Backend
- **Node.js / Express**
- **Prisma** (PostgreSQL ORM)
- **BullMQ / Redis** (Background task queues)
- **Cloudinary** (Image and PDF storage)
- **Nodemailer** (Email delivery)
- **Puppeteer / PDFKit** (Document generation)

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis Server
- Cloudinary Account

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and configure your variables:
   ```bash
   cp .env.example .env
   ```
4. Run Prisma migrations and generate the client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Start the development servers:
   ```bash
   # Starts both the Express API server and the BullMQ background worker
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🌍 Deployment

The platform is designed to be easily deployed on standard cloud providers. 
- **Frontend**: Vercel or Netlify.
- **Backend API**: Render Web Service.
- **Background Worker**: Render Background Worker.
- **Database**: Render PostgreSQL / Supabase.
- **Queues**: Render Redis / Upstash.

*(A complete step-by-step deployment guide can be found in the system artifacts.)*
