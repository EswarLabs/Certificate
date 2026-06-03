# Certificate Management System - Backend API Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Flow](#data-flow)
3. [Authentication Routes](#authentication-routes)
4. [User Routes](#user-routes)
5. [Organization Routes](#organization-routes)
6. [Workspace Routes](#workspace-routes)
7. [Certificate Template Routes](#certificate-template-routes)
8. [Credential Routes](#credential-routes)
9. [Verification Routes](#verification-routes)
10. [Email Routes](#email-routes)
11. [Job Routes](#job-routes)
12. [File Routes](#file-routes)

---

## System Architecture

### Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Login      │  │  Dashboard   │  │   Profile    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTP/REST API (Axios)
             │
┌────────────▼────────────────────────────────────────────────────┐
│                    Backend API Server (Node.js)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Middleware Layer                       │        │
│  │  ├─ Auth Middleware                                │        │
│  │  ├─ CORS Middleware                                │        │
│  │  └─ Error Handling                                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                          │                                      │
│  ┌───────┬──────────┬────┼────┬──────────┬──────────┬──────┐   │
│  │       │          │    │    │          │          │      │   │
│  ▼       ▼          ▼    ▼    ▼          ▼          ▼      ▼   │
│ Auth   User      Org  Space Template  Credential  Email   File │
│Routes  Routes   Routes Routes Routes   Routes     Routes Routes│
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Prisma ORM
             │
┌────────────▼────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────┐   │
│  │  Users   │  │Organizations │  │ Workspaces  │  │Cred...│   │
│  │          │  │              │  │             │  │       │   │
│  └──────────┘  └──────────────┘  └─────────────┘  └────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Auth Module                         │
│  ├─ Login (Google OAuth)                               │
│  ├─ Register                                            │
│  └─ Token Management (JWT)                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   User Module                           │
│  ├─ Get Profile                                        │
│  ├─ Update Profile                                     │
│  └─ Upload Avatar                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │  Org   │ │Workspace│ │Member  │
    │ Module │ │ Module  │ │ Module │
    └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Template  │ │Credential│ │ Verif    │
    │ Module   │ │ Module   │ │ Module   │
    └──────────┘ └──────────┘ └──────────┘
        │          │
        └──────┬───┘
               │
        ┌──────┴────────┐
        │               │
        ▼               ▼
    ┌────────┐      ┌─────────┐
    │  Email │      │   Job   │
    │ Module │      │ Module  │
    └────────┘      └─────────┘
        │               │
        └───────┬───────┘
                │
                ▼
            ┌────────┐
            │ File   │
            │ Module │
            └────────┘
```

---

## Data Flow

### 1. User Registration & Authentication Flow
```
User Signs Up / Logs In
         │
         ▼
Google OAuth / Email Auth
         │
         ▼
POST /auth/login
         │
         ▼
Create/Update User in DB
         │
         ▼
Generate JWT Token
         │
         ▼
Return Token to Frontend
         │
         ▼
Frontend stores JWT
         │
         ▼
Subsequent requests include JWT in headers
```

### 2. Organization & Workspace Setup Flow
```
User Creates Organization
         │
         ▼
POST /organizations
         │
         ▼
Organization Created + User becomes Owner
         │
         ▼
User Creates Workspace within Org
         │
         ▼
POST /workspaces
         │
         ▼
Workspace Created + User membership set up
         │
         ▼
User can now create templates & issue credentials
```

### 3. Certificate Issuance Flow
```
User Creates Certificate Template
         │
         ▼
POST /templates
         │
         ▼
Template stored with HTML/CSS
         │
         ▼
User Creates Credentials (Single or Batch)
         │
         ▼
POST /credentials
         │
         ▼
Credential created with status: "draft"
         │
         ▼
Generate PDF from Template + Data
         │
         ▼
Upload PDF to Storage
         │
         ▼
Issue Credential (change status to "issued")
         │
         ▼
PATCH /credentials/{id}/issue
         │
         ▼
Send Verification Email with Link
         │
         ▼
POST /email/send
         │
         ▼
Email stored in EmailLog
         │
         ▼
User clicks email link
         │
         ▼
GET /verify/{verificationCode}
         │
         ▼
Redirect to credential display page
         │
         ▼
Track event (view, download, etc.)
         │
         ▼
POST /credentials/{id}/events
```

### 4. Batch Credential Generation Flow
```
User uploads CSV file
         │
         ▼
POST /files/upload
         │
         ▼
File stored with metadata
         │
         ▼
User initiates batch credential creation
         │
         ▼
POST /credentials/batch
         │
         ▼
Create Job with status: "pending"
         │
         ▼
POST /jobs
         │
         ▼
Background Job Processor Starts
         │
         ├─ Parse CSV
         │
         ├─ For each row:
         │  ├─ Create Credential
         │  ├─ Generate PDF
         │  └─ Create EmailLog
         │
         └─ Update Job status: "completed"
```

---

## Authentication Routes

### 1. Login / Register
**Method:** `POST`  
**Endpoint:** `/auth/login`  
**Description:** Authenticate user via Google OAuth or email

**Request:**
```json
{
  "email": "user@example.com",
  "googleId": "google_oauth_id_123",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

---

### 2. Logout
**Method:** `POST`  
**Endpoint:** `/auth/logout`  
**Description:** Logout user (invalidate token)

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 3. Verify Token
**Method:** `GET`  
**Endpoint:** `/auth/verify`  
**Description:** Verify if token is valid

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  }
}
```

---

## User Routes

### 1. Get User Profile
**Method:** `GET`  
**Endpoint:** `/users/me`  
**Description:** Get current authenticated user's profile

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "googleId": "google_123",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-20T14:45:00Z"
}
```

---

### 2. Update User Profile
**Method:** `PATCH`  
**Endpoint:** `/users/me`  
**Description:** Update user profile information

**Request:**
```json
{
  "firstName": "Johnny",
  "lastName": "Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "user_123",
  "firstName": "Johnny",
  "lastName": "Smith",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 3. Get User by ID
**Method:** `GET`  
**Endpoint:** `/users/{userId}`  
**Description:** Get specific user details

**Response:**
```json
{
  "id": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

## Organization Routes

### 1. Create Organization
**Method:** `POST`  
**Endpoint:** `/organizations`  
**Description:** Create a new organization

**Request:**
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "logoUrl": "https://example.com/logo.png",
  "credentialLimit": 5000,
  "metadata": {
    "industry": "Technology",
    "employees": 250
  }
}
```

**Response:**
```json
{
  "id": "org_123",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "logoUrl": "https://example.com/logo.png",
  "credentialLimit": 5000,
  "credentialsUsed": 0,
  "metadata": {
    "industry": "Technology",
    "employees": 250
  },
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

---

### 2. Get Organization
**Method:** `GET`  
**Endpoint:** `/organizations/{orgId}`  
**Description:** Get organization details

**Response:**
```json
{
  "id": "org_123",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "logoUrl": "https://example.com/logo.png",
  "credentialLimit": 5000,
  "credentialsUsed": 150,
  "metadata": {
    "industry": "Technology",
    "employees": 250
  },
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-20T14:45:00Z"
}
```

---

### 3. List User's Organizations
**Method:** `GET`  
**Endpoint:** `/organizations`  
**Description:** List all organizations user belongs to

**Response:**
```json
{
  "success": true,
  "total": 2,
  "organizations": [
    {
      "id": "org_123",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "credentialsUsed": 150,
      "credentialLimit": 5000
    },
    {
      "id": "org_456",
      "name": "Tech Startup Inc",
      "slug": "tech-startup",
      "credentialsUsed": 25,
      "credentialLimit": 1000
    }
  ]
}
```

---

### 4. Update Organization
**Method:** `PATCH`  
**Endpoint:** `/organizations/{orgId}`  
**Description:** Update organization details

**Request:**
```json
{
  "name": "Acme Corporation International",
  "logoUrl": "https://example.com/new-logo.png",
  "credentialLimit": 10000
}
```

**Response:**
```json
{
  "id": "org_123",
  "name": "Acme Corporation International",
  "slug": "acme-corp",
  "credentialLimit": 10000,
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 5. Delete Organization
**Method:** `DELETE`  
**Endpoint:** `/organizations/{orgId}`  
**Description:** Delete organization (cascade deletes related data)

**Response:**
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

## Workspace Routes

### 1. Create Workspace
**Method:** `POST`  
**Endpoint:** `/workspaces`  
**Description:** Create workspace within an organization

**Request:**
```json
{
  "organizationId": "org_123",
  "name": "Production Workspace",
  "slug": "prod-workspace",
  "customDomain": "certs.acme-corp.com",
  "smtpEnabled": true,
  "smtpSettings": {
    "host": "smtp.example.com",
    "port": 587,
    "username": "admin@acme-corp.com",
    "password": "secure_password"
  },
  "brandingSettings": {
    "primaryColor": "#007bff",
    "accentColor": "#28a745",
    "fontFamily": "Arial"
  }
}
```

**Response:**
```json
{
  "id": "ws_123",
  "organizationId": "org_123",
  "name": "Production Workspace",
  "slug": "prod-workspace",
  "customDomain": "certs.acme-corp.com",
  "smtpEnabled": true,
  "brandingSettings": {
    "primaryColor": "#007bff",
    "accentColor": "#28a745",
    "fontFamily": "Arial"
  },
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

---

### 2. Get Workspace
**Method:** `GET`  
**Endpoint:** `/workspaces/{workspaceId}`  
**Description:** Get workspace details

**Response:**
```json
{
  "id": "ws_123",
  "organizationId": "org_123",
  "name": "Production Workspace",
  "slug": "prod-workspace",
  "customDomain": "certs.acme-corp.com",
  "smtpEnabled": true,
  "brandingSettings": {
    "primaryColor": "#007bff",
    "accentColor": "#28a745"
  },
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 3. List Workspace
**Method:** `GET`  
**Endpoint:** `/organizations/{orgId}/workspaces`  
**Description:** List all workspaces in an organization

**Response:**
```json
{
  "success": true,
  "total": 2,
  "workspaces": [
    {
      "id": "ws_123",
      "name": "Production Workspace",
      "slug": "prod-workspace",
      "customDomain": "certs.acme-corp.com"
    },
    {
      "id": "ws_456",
      "name": "Staging Workspace",
      "slug": "staging-workspace"
    }
  ]
}
```

---

### 4. Update Workspace
**Method:** `PATCH`  
**Endpoint:** `/workspaces/{workspaceId}`  
**Description:** Update workspace settings

**Request:**
```json
{
  "name": "Production - Main",
  "smtpSettings": {
    "host": "smtp.newserver.com",
    "port": 587
  },
  "brandingSettings": {
    "primaryColor": "#ff0000"
  }
}
```

**Response:**
```json
{
  "id": "ws_123",
  "name": "Production - Main",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 5. Delete Workspace
**Method:** `DELETE`  
**Endpoint:** `/workspaces/{workspaceId}`  
**Description:** Delete workspace and all related data

**Response:**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

---

## Certificate Template Routes

### 1. Create Certificate Template
**Method:** `POST`  
**Endpoint:** `/templates`  
**Description:** Create a new certificate template

**Request:**
```json
{
  "workspaceId": "ws_123",
  "name": "Achievement Certificate",
  "description": "Certificate for course completion",
  "backgroundImageUrl": "https://example.com/template-bg.jpg",
  "htmlTemplate": "<div class='certificate'><h1>Certificate of Achievement</h1><p>This certifies that {{recipientName}} has successfully completed the course.</p><p>Date: {{issuedAt}}</p><p>Code: {{verificationCode}}</p></div>",
  "cssStyles": ".certificate { text-align: center; font-family: Arial; padding: 40px; }",
  "orientation": "landscape",
  "schemaDefinition": {
    "recipientName": {
      "type": "string",
      "label": "Student Name",
      "required": true
    },
    "courseTitle": {
      "type": "string",
      "label": "Course Title",
      "required": true
    },
    "issueDate": {
      "type": "date",
      "label": "Issue Date",
      "required": true
    }
  }
}
```

**Response:**
```json
{
  "id": "tmpl_123",
  "workspaceId": "ws_123",
  "name": "Achievement Certificate",
  "description": "Certificate for course completion",
  "backgroundImageUrl": "https://example.com/template-bg.jpg",
  "htmlTemplate": "<div class='certificate'>...",
  "cssStyles": ".certificate { ... }",
  "orientation": "landscape",
  "createdById": "user_123",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

---

### 2. Get Template
**Method:** `GET`  
**Endpoint:** `/templates/{templateId}`  
**Description:** Get template details

**Response:**
```json
{
  "id": "tmpl_123",
  "workspaceId": "ws_123",
  "name": "Achievement Certificate",
  "description": "Certificate for course completion",
  "orientation": "landscape",
  "schemaDefinition": {
    "recipientName": {
      "type": "string",
      "label": "Student Name",
      "required": true
    }
  },
  "createdById": "user_123",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 3. List Templates
**Method:** `GET`  
**Endpoint:** `/workspaces/{workspaceId}/templates`  
**Description:** List all templates in workspace

**Response:**
```json
{
  "success": true,
  "total": 3,
  "templates": [
    {
      "id": "tmpl_123",
      "name": "Achievement Certificate",
      "description": "Certificate for course completion",
      "orientation": "landscape"
    },
    {
      "id": "tmpl_456",
      "name": "Completion Badge",
      "description": "Digital badge for completion",
      "orientation": "portrait"
    }
  ]
}
```

---

### 4. Update Template
**Method:** `PATCH`  
**Endpoint:** `/templates/{templateId}`  
**Description:** Update template

**Request:**
```json
{
  "name": "Achievement Certificate - Updated",
  "htmlTemplate": "<div>Updated HTML...</div>",
  "cssStyles": ".certificate { color: blue; }"
}
```

**Response:**
```json
{
  "id": "tmpl_123",
  "name": "Achievement Certificate - Updated",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 5. Delete Template
**Method:** `DELETE`  
**Endpoint:** `/templates/{templateId}`  
**Description:** Delete template

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

### 6. Preview Template
**Method:** `POST`  
**Endpoint:** `/templates/{templateId}/preview`  
**Description:** Generate HTML preview of template with sample data

**Request:**
```json
{
  "recipientName": "John Doe",
  "courseTitle": "Advanced JavaScript",
  "issueDate": "2026-02-01"
}
```

**Response:**
```json
{
  "html": "<div class='certificate'><h1>Certificate of Achievement</h1><p>This certifies that John Doe has successfully completed Advanced JavaScript.</p><p>Date: 2026-02-01</p></div>",
  "success": true
}
```

---

## Credential Routes

### 1. Create Single Credential
**Method:** `POST`  
**Endpoint:** `/credentials`  
**Description:** Create a single credential

**Request:**
```json
{
  "workspaceId": "ws_123",
  "organizationId": "org_123",
  "templateId": "tmpl_123",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "credentialData": {
    "courseTitle": "Advanced JavaScript",
    "issueDate": "2026-02-01",
    "score": "95%"
  },
  "status": "draft"
}
```

**Response:**
```json
{
  "id": "cred_123",
  "workspaceId": "ws_123",
  "organizationId": "org_123",
  "templateId": "tmpl_123",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "credentialData": {
    "courseTitle": "Advanced JavaScript",
    "issueDate": "2026-02-01",
    "score": "95%"
  },
  "verificationCode": "VERIFY-ABC123XYZ789",
  "status": "draft",
  "createdById": "user_123",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 2. Create Batch Credentials
**Method:** `POST`  
**Endpoint:** `/credentials/batch`  
**Description:** Create multiple credentials from CSV file

**Request:**
```json
{
  "workspaceId": "ws_123",
  "organizationId": "org_123",
  "templateId": "tmpl_123",
  "fileId": "file_123",
  "recipientNameColumn": "name",
  "recipientEmailColumn": "email",
  "dataMapping": {
    "courseTitle": "course",
    "issueDate": "date",
    "score": "score"
  }
}
```

**Response:**
```json
{
  "jobId": "job_123",
  "status": "pending",
  "message": "Batch credential creation started",
  "estimatedCount": 150,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 3. Get Credential
**Method:** `GET`  
**Endpoint:** `/credentials/{credentialId}`  
**Description:** Get credential details

**Response:**
```json
{
  "id": "cred_123",
  "workspaceId": "ws_123",
  "organizationId": "org_123",
  "templateId": "tmpl_123",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "credentialData": {
    "courseTitle": "Advanced JavaScript",
    "issueDate": "2026-02-01",
    "score": "95%"
  },
  "verificationCode": "VERIFY-ABC123XYZ789",
  "pdfUrl": "https://storage.example.com/cred_123.pdf",
  "imageUrl": "https://storage.example.com/cred_123.png",
  "status": "issued",
  "issuedAt": "2026-01-15T10:30:00Z",
  "expiresAt": "2027-01-15T10:30:00Z",
  "createdBy": {
    "id": "user_123",
    "firstName": "Admin",
    "lastName": "User"
  },
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 4. List Credentials
**Method:** `GET`  
**Endpoint:** `/workspaces/{workspaceId}/credentials`  
**Query Parameters:**
- `templateId` - Filter by template
- `status` - Filter by status (draft, issued, revoked)
- `recipientEmail` - Search by email
- `page` - Page number
- `limit` - Items per page

**Description:** List credentials with filtering and pagination

**Response:**
```json
{
  "success": true,
  "total": 250,
  "page": 1,
  "limit": 20,
  "credentials": [
    {
      "id": "cred_123",
      "recipientName": "John Doe",
      "recipientEmail": "john@example.com",
      "status": "issued",
      "verificationCode": "VERIFY-ABC123XYZ789",
      "issuedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### 5. Issue Credential
**Method:** `PATCH`  
**Endpoint:** `/credentials/{credentialId}/issue`  
**Description:** Change credential status from draft to issued

**Request:**
```json
{
  "issuedAt": "2026-02-01T00:00:00Z",
  "expiresAt": "2027-02-01T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "cred_123",
  "status": "issued",
  "issuedAt": "2026-02-01T00:00:00Z",
  "expiresAt": "2027-02-01T00:00:00Z",
  "pdfUrl": "https://storage.example.com/cred_123.pdf",
  "success": true,
  "message": "Credential issued successfully"
}
```

---

### 6. Revoke Credential
**Method:** `PATCH`  
**Endpoint:** `/credentials/{credentialId}/revoke`  
**Description:** Revoke issued credential

**Request:**
```json
{
  "reason": "Duplicate entry"
}
```

**Response:**
```json
{
  "id": "cred_123",
  "status": "revoked",
  "success": true,
  "message": "Credential revoked successfully"
}
```

---

### 7. Regenerate Verification Code
**Method:** `POST`  
**Endpoint:** `/credentials/{credentialId}/regenerate-code`  
**Description:** Generate new verification code

**Response:**
```json
{
  "id": "cred_123",
  "verificationCode": "VERIFY-XYZ987ABC456",
  "success": true,
  "message": "Verification code regenerated"
}
```

---

### 8. Download Credential
**Method:** `GET`  
**Endpoint:** `/credentials/{credentialId}/download`  
**Query Parameters:**
- `format` - Format type (pdf, png, json)

**Description:** Download credential in specified format

**Response:** File download (PDF/PNG/JSON)

---

## Verification Routes

### 1. Verify Credential
**Method:** `GET`  
**Endpoint:** `/verify/{verificationCode}`  
**Description:** Verify credential authenticity

**Response:**
```json
{
  "valid": true,
  "credential": {
    "id": "cred_123",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "status": "issued",
    "issuedAt": "2026-01-15T10:30:00Z",
    "expiresAt": "2027-01-15T10:30:00Z",
    "credentialData": {
      "courseTitle": "Advanced JavaScript",
      "score": "95%"
    },
    "template": {
      "name": "Achievement Certificate",
      "organization": {
        "name": "Acme Corporation",
        "logoUrl": "https://example.com/logo.png"
      }
    }
  },
  "verifiedAt": "2026-02-01T12:30:00Z"
}
```

---

### 2. Get Credential Public Page
**Method:** `GET`  
**Endpoint:** `/public/credentials/{verificationCode}`  
**Description:** Get public credential display page

**Response:**
```json
{
  "success": true,
  "credential": {
    "id": "cred_123",
    "recipientName": "John Doe",
    "template": {
      "htmlTemplate": "<div>...",
      "cssStyles": ".certificate {...}"
    },
    "credentialData": {...},
    "organizationLogoUrl": "https://example.com/logo.png",
    "isValid": true
  }
}
```

---

## Email Routes

### 1. Send Credential Email
**Method:** `POST`  
**Endpoint:** `/credentials/{credentialId}/send-email`  
**Description:** Send credential to recipient via email

**Request:**
```json
{
  "recipientEmail": "john@example.com",
  "subject": "Your Achievement Certificate",
  "customMessage": "Congratulations on completing the course!"
}
```

**Response:**
```json
{
  "success": true,
  "emailLogId": "email_123",
  "status": "sent",
  "message": "Email sent successfully",
  "sentAt": "2026-02-01T10:15:00Z"
}
```

---

### 2. Get Email Logs
**Method:** `GET`  
**Endpoint:** `/credentials/{credentialId}/email-logs`  
**Description:** Get email send history for credential

**Response:**
```json
{
  "success": true,
  "total": 2,
  "emailLogs": [
    {
      "id": "email_123",
      "recipientEmail": "john@example.com",
      "status": "sent",
      "providerMessageId": "sendgrid_msg_123",
      "openedAt": "2026-02-01T11:30:00Z",
      "clickedAt": "2026-02-01T12:00:00Z",
      "createdAt": "2026-02-01T10:15:00Z"
    },
    {
      "id": "email_456",
      "recipientEmail": "john@example.com",
      "status": "bounced",
      "bounceReason": "Invalid email address",
      "createdAt": "2026-02-02T09:00:00Z"
    }
  ]
}
```

---

### 3. Resend Email
**Method:** `POST`  
**Endpoint:** `/credentials/{credentialId}/resend-email`  
**Description:** Resend credential email

**Response:**
```json
{
  "success": true,
  "emailLogId": "email_789",
  "status": "sent",
  "message": "Email resent successfully"
}
```

---

### 4. Update Email Status
**Method:** `POST`  
**Endpoint:** `/email/webhook/status`  
**Description:** Update email status from email provider (webhook)

**Request:**
```json
{
  "messageId": "sendgrid_msg_123",
  "event": "open",
  "timestamp": 1612137600,
  "useragent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email status updated"
}
```

---

## Job Routes

### 1. Create Job
**Method:** `POST`  
**Endpoint:** `/jobs`  
**Description:** Create background job for batch operations

**Request:**
```json
{
  "workspaceId": "ws_123",
  "type": "batch_credential_generation",
  "payload": {
    "fileId": "file_123",
    "templateId": "tmpl_123",
    "credentialCount": 150
  }
}
```

**Response:**
```json
{
  "id": "job_123",
  "workspaceId": "ws_123",
  "type": "batch_credential_generation",
  "status": "pending",
  "progress": 0,
  "createdAt": "2026-02-01T10:15:00Z"
}
```

---

### 2. Get Job Status
**Method:** `GET`  
**Endpoint:** `/jobs/{jobId}`  
**Description:** Get job details and progress

**Response:**
```json
{
  "id": "job_123",
  "workspaceId": "ws_123",
  "type": "batch_credential_generation",
  "status": "in_progress",
  "progress": 65,
  "payload": {
    "fileId": "file_123",
    "templateId": "tmpl_123",
    "credentialCount": 150
  },
  "result": {
    "processedCount": 97,
    "failedCount": 2,
    "errors": [
      {
        "row": 45,
        "reason": "Invalid email format"
      }
    ]
  },
  "startedAt": "2026-02-01T10:15:00Z",
  "updatedAt": "2026-02-01T10:45:00Z"
}
```

---

### 3. List Jobs
**Method:** `GET`  
**Endpoint:** `/workspaces/{workspaceId}/jobs`  
**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, failed)
- `type` - Filter by type
- `page` - Page number
- `limit` - Items per page

**Description:** List jobs with filtering

**Response:**
```json
{
  "success": true,
  "total": 25,
  "jobs": [
    {
      "id": "job_123",
      "type": "batch_credential_generation",
      "status": "completed",
      "progress": 100,
      "createdAt": "2026-02-01T10:15:00Z",
      "completedAt": "2026-02-01T11:30:00Z"
    }
  ]
}
```

---

### 4. Cancel Job
**Method:** `POST`  
**Endpoint:** `/jobs/{jobId}/cancel`  
**Description:** Cancel pending or in-progress job

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully",
  "id": "job_123"
}
```

---

## File Routes

### 1. Upload File
**Method:** `POST`  
**Endpoint:** `/files/upload`  
**Description:** Upload file (CSV, image, etc.)

**Request:** Form Data
```
Content-Type: multipart/form-data

{
  "file": <File Object>,
  "workspaceId": "ws_123"
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file_123",
    "fileName": "recipients.csv",
    "mimeType": "text/csv",
    "fileSize": 45678,
    "storageKey": "s3://bucket/recipients.csv",
    "publicUrl": "https://storage.example.com/recipients.csv",
    "metadata": {
      "rows": 150,
      "columns": ["name", "email", "score"]
    },
    "createdAt": "2026-02-01T10:15:00Z"
  }
}
```

---

### 2. Get File
**Method:** `GET`  
**Endpoint:** `/files/{fileId}`  
**Description:** Get file metadata and details

**Response:**
```json
{
  "id": "file_123",
  "workspaceId": "ws_123",
  "fileName": "recipients.csv",
  "mimeType": "text/csv",
  "fileSize": 45678,
  "storageKey": "s3://bucket/recipients.csv",
  "publicUrl": "https://storage.example.com/recipients.csv",
  "metadata": {
    "rows": 150,
    "columns": ["name", "email", "score"]
  },
  "uploadedBy": {
    "id": "user_123",
    "firstName": "Admin"
  },
  "createdAt": "2026-02-01T10:15:00Z"
}
```

---

### 3. List Files
**Method:** `GET`  
**Endpoint:** `/workspaces/{workspaceId}/files`  
**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Description:** List uploaded files in workspace

**Response:**
```json
{
  "success": true,
  "total": 10,
  "files": [
    {
      "id": "file_123",
      "fileName": "recipients.csv",
      "fileSize": 45678,
      "mimeType": "text/csv",
      "createdAt": "2026-02-01T10:15:00Z"
    }
  ]
}
```

---

### 4. Delete File
**Method:** `DELETE`  
**Endpoint:** `/files/{fileId}`  
**Description:** Delete uploaded file

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### 5. Parse CSV
**Method:** `POST`  
**Endpoint:** `/files/{fileId}/parse`  
**Description:** Parse CSV file and return preview

**Response:**
```json
{
  "success": true,
  "fileName": "recipients.csv",
  "totalRows": 150,
  "headers": ["name", "email", "score", "date"],
  "preview": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "score": "95",
      "date": "2026-02-01"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "score": "87",
      "date": "2026-02-01"
    }
  ]
}
```

---

## Membership Routes

### 1. Add Member to Organization
**Method:** `POST`  
**Endpoint:** `/organizations/{orgId}/members`  
**Description:** Add user to organization

**Request:**
```json
{
  "userId": "user_456",
  "role": "admin",
  "workspaceId": "ws_123"
}
```

**Response:**
```json
{
  "id": "membership_123",
  "userId": "user_456",
  "organizationId": "org_123",
  "workspaceId": "ws_123",
  "role": "admin",
  "joinedAt": "2026-02-01T10:15:00Z"
}
```

---

### 2. List Organization Members
**Method:** `GET`  
**Endpoint:** `/organizations/{orgId}/members`  
**Description:** List all members of organization

**Response:**
```json
{
  "success": true,
  "total": 5,
  "members": [
    {
      "id": "membership_123",
      "user": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "role": "owner",
      "joinedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3. Update Member Role
**Method:** `PATCH`  
**Endpoint:** `/organizations/{orgId}/members/{memberId}`  
**Description:** Update member role

**Request:**
```json
{
  "role": "member"
}
```

**Response:**
```json
{
  "id": "membership_123",
  "role": "member",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 4. Remove Member
**Method:** `DELETE`  
**Endpoint:** `/organizations/{orgId}/members/{memberId}`  
**Description:** Remove member from organization

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## Error Responses

All errors follow this standard format:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": null
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": null
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "resource": "Credential",
      "id": "cred_123"
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "details": null
  }
}
```

---

## Authentication & Security

### Header Requirements
All authenticated endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-API-Version: v1
```

### Rate Limiting
- 1000 requests per hour per API key
- 100 requests per minute per IP

### CORS
- Allowed origins: Configured in `.env` file
- Methods: GET, POST, PATCH, DELETE
- Headers: Authorization, Content-Type

---

## Webhook Endpoints

### Email Status Webhook
**Method:** `POST`  
**Endpoint:** `/webhooks/email/status`  
**Provider:** SendGrid/Email Service

### Credential Event Webhook
**Method:** `POST`  
**Endpoint:** `/webhooks/credentials/events`  
**Purpose:** Track credential views, downloads, verifications

---

## API Pagination

All list endpoints support pagination:

### Query Parameters:
```
page: 1 (default)
limit: 20 (default, max: 100)
sortBy: createdAt (default)
sortOrder: desc (asc/desc)
```

### Response Format:
```json
{
  "success": true,
  "total": 250,
  "page": 1,
  "limit": 20,
  "totalPages": 13,
  "data": [...]
}
```

---

## Summary

This certificate management system follows a hierarchical architecture:

1. **Users** authenticate via Google OAuth
2. **Organizations** contain multiple **Workspaces**
3. **Workspaces** host **Certificate Templates**
4. **Credentials** are issued based on templates
5. **Credentials** are verified via unique codes
6. **Emails** track engagement (opens, clicks)
7. **Jobs** handle batch operations
8. **Files** store user-uploaded data
9. **Memberships** manage access control

The system is designed for scalability with proper indexing, cascade deletes, and background job processing for bulk operations.
