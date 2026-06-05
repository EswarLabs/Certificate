# Certificate Management System - Backend API Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [Authentication Routes](#authentication-routes) ✅
4. [User Routes](#user-routes) 🟠
5. [Organization Routes](#organization-routes) ✅
6. [Member Routes](#member-routes) ✅
7. [Workspace Routes](#workspace-routes) ✅
8. [Certificate Template Routes](#certificate-template-routes) 🔴
9. [Credential Routes](#credential-routes) 🔴
10. [Verification Routes](#verification-routes) 🔴
11. [Email Routes](#email-routes) 🔴
12. [Job Routes](#job-routes) 🔴
13. [File Routes](#file-routes) 🔴

**Legend:** ✅ Implemented | 🟠 Partial | 🔴 Not Started

---

## System Architecture

### Core Resource Hierarchy
```
User
  ├── Credential (created by user)
  ├── Memberships (in organizations/workspaces)
  └── Templates (created by user)

Organization (User -> Membership -> Organization)
  ├── Workspaces
  │   ├── Members (via memberships)
  │   ├── Templates
  │   ├── Credentials
  │   ├── Files
  │   └── Jobs
  ├── Credentials
  ├── Members (via memberships)
  └── Metadata

Workspace (Organization -> Workspaces)
  ├── Members (Memberships)
  ├── Templates
  ├── Credentials
  ├── Files
  └── Jobs
```

### API Route Structure (Nested)
```
/api/auth                                     - Authentication ✅
/api/users                                    - User management 🟠
/api/organizations                            - Organization management ✅
  ├── /{orgId}/members                       - Organization members ✅
  ├── /{orgId}/workspaces                    - Workspaces in org ✅
  │   ├── /{wsId}/members                    - Workspace members (separate, TODO)
  │   ├── /{wsId}/templates                  - Templates in workspace 🔴
  │   ├── /{wsId}/credentials                - Credentials in workspace 🔴
  │   ├── /{wsId}/files                      - Files in workspace 🔴
  │   └── /{wsId}/jobs                       - Jobs in workspace 🔴
  └── /{orgId}/credentials                   - Org-level credentials 🔴
/api/verify/{code}                            - Credential verification 🔴
/api/email                                    - Email operations 🔴
/api/webhooks                                 - Webhook handlers 🔴
```

---

## Authentication Routes ✅

### 1. Google OAuth Login
**Method:** `POST`  
**Endpoint:** `/api/auth/google`  
**Auth:** None (Public)  
**Status:** ✅ Implemented

**Request:**
```json
{
  "credential": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
    "avatarUrl": "https://example.com/avatar.jpg",
    "googleId": "google_123",
    "createdAt": "2026-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800
}
```

---

### 2. Get Current User
**Method:** `GET`  
**Endpoint:** `/api/auth/me`  
**Auth:** Required (Bearer Token)  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### 3. Logout
**Method:** `POST`  
**Endpoint:** `/api/auth/logout`  
**Auth:** None  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Routes 🟠

### 1. Get User Profile
**Method:** `GET`  
**Endpoint:** `/api/users/me`  
**Auth:** Required  
**Status:** 🟠 TODO

**Response:**
```json
{
  "id": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-20T14:45:00Z"
}
```

---

### 2. Update User Profile
**Method:** `PATCH`  
**Endpoint:** `/api/users/me`  
**Auth:** Required  
**Status:** 🟠 TODO

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

## Organization Routes ✅

### 1. Create Organization
**Method:** `POST`  
**Endpoint:** `/api/organizations`  
**Auth:** Required  
**Status:** ✅ Implemented

**Request:**
```json
{
  "name": "Acme Corporation"
}
```

**Response:**
```json
{
  "organization": {
    "id": "org_123",
    "name": "Acme Corporation",
    "slug": "acme-corporation-user_123",
    "createdAt": "2026-01-15T10:30:00Z"
  },
  "workspace": {
    "id": "ws_123",
    "name": "Acme Corporation Workspace",
    "organizationId": "org_123"
  },
  "membership": {
    "id": "mem_123",
    "role": "OWNER",
    "joinedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### 2. List Organizations
**Method:** `GET`  
**Endpoint:** `/api/organizations`  
**Auth:** Required  
**Status:** ✅ Implemented

**Response:**
```json
[
  {
    "id": "org_123",
    "name": "Acme Corporation",
    "slug": "acme-corporation-user_123",
    "createdAt": "2026-01-15T10:30:00Z"
  }
]
```

---

### 3. Get Organization by ID
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}`  
**Auth:** Required  
**Status:** ✅ Implemented

**Response:**
```json
{
  "id": "org_123",
  "name": "Acme Corporation",
  "slug": "acme-corporation-user_123",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 4. Update Organization
**Method:** `PUT`  
**Endpoint:** `/api/organizations/{orgId}`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Request:**
```json
{
  "name": "Acme Corp Inc"
}
```

**Response:**
```json
{
  "id": "org_123",
  "name": "Acme Corp Inc",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 5. Delete Organization
**Method:** `DELETE`  
**Endpoint:** `/api/organizations/{orgId}`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "message": "Organization deleted"
}
```

---

## Member Routes ✅

### 1. Add Member to Organization
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/members`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Request:**
```json
{
  "newUserId": "user_456",
  "workspaceId": "ws_123",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "membership": {
    "id": "mem_456",
    "userId": "user_456",
    "role": "ADMIN",
    "joinedAt": "2026-02-01T10:30:00Z",
    "user": {
      "id": "user_456",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

### 2. List Organization Members
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/members`  
**Auth:** Required (member of org)  
**Status:** ✅ Implemented

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response:**
```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "limit": 10,
  "members": [...]
}
```

---

### 3. Get Member Details
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/members/{memberId}`  
**Auth:** Required  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "membership": {...}
}
```

---

### 4. Update Member Role
**Method:** `PATCH`  
**Endpoint:** `/api/organizations/{orgId}/members/{memberId}`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Request:**
```json
{
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member role updated successfully"
}
```

---

### 5. Remove Member
**Method:** `DELETE`  
**Endpoint:** `/api/organizations/{orgId}/members/{memberId}`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## Workspace Routes ✅

### 1. Create Workspace
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/workspaces`  
**Auth:** Required  
**Status:** ✅ Implemented

**Request:**
```json
{
  "name": "Development Workspace"
}
```

**Response:**
```json
{
  "workspace": {
    "id": "ws_456",
    "organizationId": "org_123",
    "name": "Development Workspace",
    "createdAt": "2026-02-01T10:30:00Z"
  },
  "membership": {
    "id": "mem_789",
    "role": "OWNER",
    "joinedAt": "2026-02-01T10:30:00Z"
  }
}
```

---

### 2. List Workspaces
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces`  
**Auth:** Required  
**Status:** ✅ Implemented

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response:**
```json
[
  {
    "id": "ws_123",
    "organizationId": "org_123",
    "name": "Production Workspace",
    "createdAt": "2026-01-15T10:30:00Z"
  }
]
```

---

### 3. Get Workspace Details
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}`  
**Auth:** Required  
**Status:** ✅ Implemented

**Response:**
```json
{
  "id": "ws_123",
  "organizationId": "org_123",
  "name": "Production Workspace",
  "brandingSettings": null,
  "customDomain": null,
  "smtpEnabled": false,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### 4. Update Workspace
**Method:** `PUT`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}`  
**Auth:** Required  
**Status:** ✅ Implemented

**Request:**
```json
{
  "name": "Updated Workspace",
  "brandingSettings": {"primaryColor": "#FF0000"}
}
```

**Response:**
```json
{
  "id": "ws_123",
  "name": "Updated Workspace",
  "updatedAt": "2026-02-01T10:15:00Z"
}
```

---

### 5. Delete Workspace
**Method:** `DELETE`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}`  
**Auth:** Required (OWNER only)  
**Status:** ✅ Implemented

**Response:**
```json
{
  "success": true,
  "message": "Workspace deleted"
}
```

---

### 6. Upload File to Workspace
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/upload`  
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Status:** ✅ Implemented

**Response:**
```json
{
  "id": "file_123",
  "workspaceId": "ws_123",
  "fileName": "certificate_batch.csv",
  "mimeType": "text/csv",
  "fileSize": 2048,
  "publicUrl": "https://cdn.example.com/files/cert_batch_abc123.csv",
  "createdAt": "2026-02-01T10:30:00Z"
}
```

---

## Certificate Template Routes 🔴

### 1. Create Template
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/templates`  
**Auth:** Required  
**Status:** 🔴 TODO

**Request:**
```json
{
  "name": "Achievement Certificate",
  "description": "Certificate for course completion",
  "htmlTemplate": "<div class='certificate'><h1>{{courseTitle}}</h1></div>",
  "cssStyles": ".certificate { text-align: center; }",
  "orientation": "landscape",
  "schemaDefinition": {
    "courseTitle": {"type": "string", "label": "Course Title", "required": true}
  }
}
```

---

### 2. List Templates
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/templates`  
**Auth:** Required  
**Status:** 🔴 TODO

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

---

### 3. Get Template Details
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/templates/{tmplId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 4. Update Template
**Method:** `PUT`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/templates/{tmplId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 5. Delete Template
**Method:** `DELETE`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/templates/{tmplId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

## Credential Routes 🔴

### 1. Create Single Credential
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials`  
**Auth:** Required  
**Status:** 🔴 TODO

**Request:**
```json
{
  "templateId": "tmpl_123",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "credentialData": {
    "courseTitle": "Advanced JavaScript",
    "issueDate": "2026-02-01"
  }
}
```

---

### 2. Create Batch Credentials
**Method:** `POST`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials/batch`  
**Auth:** Required  
**Status:** 🔴 TODO

**Request:**
```json
{
  "templateId": "tmpl_123",
  "fileId": "file_123",
  "recipientNameColumn": "name",
  "recipientEmailColumn": "email",
  "dataMapping": {"courseTitle": "course", "issueDate": "date"}
}
```

---

### 3. List Credentials
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials`  
**Auth:** Required  
**Status:** 🔴 TODO

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)
- `status` (pending, issued, revoked, expired)

---

### 4. Get Credential Details
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials/{credId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 5. Issue Credential
**Method:** `PATCH`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials/{credId}/issue`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 6. Revoke Credential
**Method:** `PATCH`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/credentials/{credId}/revoke`  
**Auth:** Required  
**Status:** 🔴 TODO

---

## Verification Routes 🔴

### 1. Verify Credential
**Method:** `GET`  
**Endpoint:** `/api/verify/{verificationCode}`  
**Auth:** None (Public)  
**Status:** 🔴 TODO

---

### 2. Track Credential Event
**Method:** `POST`  
**Endpoint:** `/api/credentials/{credId}/events`  
**Auth:** None (Public)  
**Status:** 🔴 TODO

**Request:**
```json
{
  "eventType": "view|download|email_open|email_click",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## Email Routes 🔴

### 1. Send Verification Email
**Method:** `POST`  
**Endpoint:** `/api/email/send-verification`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 2. Get Email Logs
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/emails`  
**Auth:** Required  
**Status:** 🔴 TODO

---

## Job Routes 🔴

### 1. Get Job Status
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/jobs/{jobId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 2. List Jobs
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/jobs`  
**Auth:** Required  
**Status:** 🔴 TODO

**Query Parameters:**
- `status` (pending, in_progress, completed, failed)
- `type` (batch_credentials, generate_pdf, send_emails)
- `page` (integer, default: 1)

---

## File Routes 🔴

### 1. List Workspace Files
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/files`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 2. Get File Details
**Method:** `GET`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/files/{fileId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

### 3. Delete File
**Method:** `DELETE`  
**Endpoint:** `/api/organizations/{orgId}/workspaces/{wsId}/files/{fileId}`  
**Auth:** Required  
**Status:** 🔴 TODO

---

## Implementation Priority Checklist

### Phase 1 - Foundation ✅
- [x] Auth Module (Google OAuth, JWT)
- [x] Organization Module (CRUD)
- [x] Workspace Module (Nested under Org, CRUD)
- [x] Membership Module (Nested under Org, Role Management)
- [x] Upload Module (Cloudinary integration)

### Phase 2 - User & Helpers 🟠
- [ ] User Module (GET/PATCH profile)

### Phase 3 - Content & Credentials 🔴
- [ ] Certificate Template Module (CRUD, Schema validation)
- [ ] Credential Module (Single, Batch, PDF generation)
- [ ] Verification Module (Code verification, Public page)

### Phase 4 - Communication & Background 🔴
- [ ] Email Module (Send, Track opens/clicks, Webhook handling)
- [ ] Job Module (Background processing, Progress tracking)
- [ ] File Module (Management, CSV parsing)

---

## Key Implementation Notes

1. **Route Nesting**: All workspace routes are now nested under organizations
2. **Access Control**: All operations validate user membership in organization/workspace
3. **Transactions**: Org/Workspace creation uses transactions to prevent partial state
4. **Pagination**: All list endpoints support `page` and `limit` parameters
5. **Roles**: OWNER | ADMIN | MEMBER | VIEWER (membership.role)
6. **Status**: Credentials can be draft → issued → revoked
7. **Verification**: Unique verification codes for public credential viewing
8. **Background Jobs**: Batch operations create jobs (pending → in_progress → completed)
9. **Email Tracking**: EmailLog records opens, clicks, bounces
10. **Timestamps**: All models have createdAt and updatedAt (except Job which has completedAt)

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
