# Certificate Management System - Backend API Documentation

All API routes are prefixed with `/api`. Authenticated endpoints require a JWT bearer token passed in the `Authorization` header or through cookies.

## Table of Contents
1. [Authentication Routes](#1-authentication-routes)
2. [User Routes](#2-user-routes)
3. [Organization Routes](#3-organization-routes)
4. [Membership Routes](#4-membership-routes)
5. [Workspace Routes](#5-workspace-routes)
6. [Upload Routes](#6-upload-routes)
7. [Certificate Template Routes](#7-certificate-template-routes)
8. [Credential Routes](#8-credential-routes)
9. [Verification Routes](#9-verification-routes)
10. [Email Routes](#10-email-routes)
11. [Background Job Routes](#11-background-job-routes)
12. [File Routes](#12-file-routes)
13. [Error Handling](#13-error-handling)

---

## 1. Authentication Routes

### Register User
* **Endpoint:** `POST /api/auth/register`
* **Auth:** Public
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "secretpassword",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_982bca81",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": ""
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "message": "Registration successful"
  }
  ```

### Login User
* **Endpoint:** `POST /api/auth/login`
* **Auth:** Public
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "secretpassword"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_982bca81",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": ""
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "message": "Login successful"
  }
  ```

### Google OAuth Login
* **Endpoint:** `POST /api/auth/google`
* **Auth:** Public
* **Request Body:**
  ```json
  {
    "credential": "google-oauth-id-token"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_7ea84bc1",
      "email": "googleuser@example.com",
      "firstName": "GoogleFirst",
      "lastName": "GoogleLast",
      "avatarUrl": "https://lh3.googleusercontent.com/..."
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

### Get Current User Profile (Fresh Data)
* **Endpoint:** `GET /api/auth/me`
* **Auth:** Required (Bearer Token)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User fetched successfully",
    "user": {
      "id": "usr_982bca81",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "",
      "createdAt": "2026-06-10T02:00:00.000Z",
      "updatedAt": "2026-06-10T02:00:00.000Z"
    }
  }
  ```

### Logout User
* **Endpoint:** `POST /api/auth/logout`
* **Auth:** Public
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 2. User Routes

### Get All Users
* **Endpoint:** `GET /api/users`
* **Auth:** Required
* **Query Parameters:**
  * `email` (string, optional) - Filter users by email (partial match)
  * `name` (string, optional) - Filter users by name (partial match)
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "users": [
      {
        "id": "usr_982bca81",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": ""
      }
    ]
  }
  ```

### Get User by ID
* **Endpoint:** `GET /api/users/{id}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "usr_982bca81",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "",
    "googleId": null,
    "createdAt": "2026-06-10T02:00:00.000Z",
    "updatedAt": "2026-06-10T02:00:00.000Z"
  }
  ```

### Update User Profile
* **Endpoint:** `PUT /api/users/{id}` (Note: Users can only update their own profile)
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "firstName": "Johnny",
    "lastName": "Smith",
    "avatarUrl": "https://newurl.com/avatar.jpg"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "usr_982bca81",
    "email": "user@example.com",
    "firstName": "Johnny",
    "lastName": "Smith",
    "avatarUrl": "https://newurl.com/avatar.jpg"
  }
  ```

---

## 3. Organization Routes

### Create Organization
* **Endpoint:** `POST /api/organizations`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "name": "Acme Corp"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "organization": {
      "organization": {
        "id": "org_a7e4bca2",
        "name": "Acme Corp",
        "slug": "acme-corp-usr_982bca81",
        "logoUrl": null,
        "credentialLimit": 100,
        "credentialsUsed": 0,
        "createdAt": "2026-06-10T02:00:00.000Z",
        "updatedAt": "2026-06-10T02:00:00.000Z"
      },
      "workspace": {
        "id": "ws_b9e28dc1",
        "organizationId": "org_a7e4bca2",
        "name": "Acme Corp Workspace",
        "slug": "workspace-org_a7e4bca2",
        "brandingSettings": null,
        "customDomain": null,
        "smtpEnabled": false,
        "smtpSettings": null,
        "createdAt": "2026-06-10T02:00:00.000Z",
        "updatedAt": "2026-06-10T02:00:00.000Z"
      },
      "membership": {
        "id": "mem_d8b92ef1",
        "userId": "usr_982bca81",
        "organizationId": "org_a7e4bca2",
        "workspaceId": "ws_b9e28dc1",
        "role": "OWNER",
        "joinedAt": "2026-06-10T02:00:00.000Z"
      }
    },
    "message": "Organization created successfully"
  }
  ```

### List Organizations
* **Endpoint:** `GET /api/organizations`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Organizations fetched successfully",
    "organizations": {
      "success": true,
      "page": 1,
      "limit": 10,
      "total": 1,
      "organizations": [
        {
          "id": "org_a7e4bca2",
          "name": "Acme Corp",
          "slug": "acme-corp-usr_982bca81",
          "logoUrl": null,
          "credentialLimit": 100,
          "credentialsUsed": 0,
          "createdAt": "2026-06-10T02:00:00.000Z",
          "updatedAt": "2026-06-10T02:00:00.000Z"
        }
      ]
    }
  }
  ```

### Get Organization by ID
* **Endpoint:** `GET /api/organizations/{id}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Organization fetched successfully",
    "organization": {
      "id": "org_a7e4bca2",
      "name": "Acme Corp",
      "slug": "acme-corp-usr_982bca81",
      "logoUrl": null,
      "credentialLimit": 100,
      "credentialsUsed": 0,
      "createdAt": "2026-06-10T02:00:00.000Z",
      "updatedAt": "2026-06-10T02:00:00.000Z"
    }
  }
  ```

### Update Organization
* **Endpoint:** `PUT /api/organizations/{id}` (Note: Requires OWNER role)
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "name": "Acme Corporation",
    "logoUrl": "https://acme.com/logo.png"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Organization updated successfully",
    "organization": {
      "id": "org_a7e4bca2",
      "name": "Acme Corporation",
      "slug": "acme-corporation-usr_982bca81",
      "logoUrl": "https://acme.com/logo.png",
      "credentialLimit": 100,
      "credentialsUsed": 0,
      "createdAt": "2026-06-10T02:00:00.000Z",
      "updatedAt": "2026-06-10T02:05:00.000Z"
    }
  }
  ```

### Delete Organization
* **Endpoint:** `DELETE /api/organizations/{id}` (Note: Requires OWNER role)
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Organization deleted successfully"
  }
  ```

---

## 4. Membership Routes

### Add Member to Organization & Workspace
* **Endpoint:** `POST /api/organizations/{organizationId}/members` (Note: Requires OWNER role)
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "newUserId": "usr_12345678",
    "workspaceId": "ws_b9e28dc1",
    "role": "MEMBER"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Member added successfully",
    "membership": {
      "id": "mem_f0e8d7c6",
      "userId": "usr_12345678",
      "organizationId": "org_a7e4bca2",
      "workspaceId": "ws_b9e28dc1",
      "role": "MEMBER",
      "joinedAt": "2026-06-10T02:10:00.000Z",
      "user": {
        "id": "usr_12345678",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "avatarUrl": null
      }
    }
  }
  ```

### List Organization Members
* **Endpoint:** `GET /api/organizations/{organizationId}/members`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "total": 2,
    "page": 1,
    "limit": 10,
    "members": [
      {
        "id": "mem_d8b92ef1",
        "userId": "usr_982bca81",
        "organizationId": "org_a7e4bca2",
        "workspaceId": "ws_b9e28dc1",
        "role": "OWNER",
        "joinedAt": "2026-06-10T02:00:00.000Z",
        "user": {
          "id": "usr_982bca81",
          "firstName": "John",
          "lastName": "Doe",
          "email": "user@example.com",
          "avatarUrl": ""
        }
      }
    ]
  }
  ```

### Get Member Details
* **Endpoint:** `GET /api/organizations/{organizationId}/members/{memberId}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "membership": {
      "id": "mem_d8b92ef1",
      "userId": "usr_982bca81",
      "organizationId": "org_a7e4bca2",
      "workspaceId": "ws_b9e28dc1",
      "role": "OWNER",
      "joinedAt": "2026-06-10T02:00:00.000Z",
      "user": {
        "id": "usr_982bca81",
        "firstName": "John",
        "lastName": "Doe",
        "email": "user@example.com",
        "avatarUrl": ""
      }
    }
  }
  ```

### Update Member Role
* **Endpoint:** `PATCH /api/organizations/{organizationId}/members/{memberId}` (Note: Requires OWNER role)
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "role": "ADMIN"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Member role updated successfully",
    "membership": {
      "id": "mem_f0e8d7c6",
      "userId": "usr_12345678",
      "organizationId": "org_a7e4bca2",
      "workspaceId": "ws_b9e28dc1",
      "role": "ADMIN",
      "joinedAt": "2026-06-10T02:10:00.000Z",
      "user": {
        "id": "usr_12345678",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com"
      }
    }
  }
  ```

### Remove Member
* **Endpoint:** `DELETE /api/organizations/{organizationId}/members/{memberId}` (Note: Requires OWNER role)
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Member removed successfully"
  }
  ```

---

## 5. Workspace Routes

### Create Workspace
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "name": "Design Workspace"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "workspace": {
      "id": "ws_c7e8a9b2",
      "organizationId": "org_a7e4bca2",
      "name": "Design Workspace",
      "slug": "design-workspace-org_a7e4bca2",
      "createdAt": "2026-06-10T02:15:00.000Z",
      "updatedAt": "2026-06-10T02:15:00.000Z"
    },
    "membership": {
      "id": "mem_e8f2c3b6",
      "userId": "usr_982bca81",
      "organizationId": "org_a7e4bca2",
      "workspaceId": "ws_c7e8a9b2",
      "role": "OWNER",
      "joinedAt": "2026-06-10T02:15:00.000Z"
    }
  }
  ```

### List Workspaces in Organization
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "workspaces": [
      {
        "id": "ws_b9e28dc1",
        "name": "Acme Corp Workspace",
        "slug": "workspace-org_a7e4bca2",
        "organizationId": "org_a7e4bca2",
        "brandingSettings": null,
        "customDomain": null,
        "smtpEnabled": false,
        "smtpSettings": null,
        "createdAt": "2026-06-10T02:00:00.000Z",
        "updatedAt": "2026-06-10T02:00:00.000Z"
      }
    ]
  }
  ```

### Get Workspace by ID
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{id}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "ws_b9e28dc1",
    "name": "Acme Corp Workspace",
    "slug": "workspace-org_a7e4bca2",
    "organizationId": "org_a7e4bca2",
    "brandingSettings": null,
    "customDomain": null,
    "smtpEnabled": false,
    "smtpSettings": null,
    "createdAt": "2026-06-10T02:00:00.000Z",
    "updatedAt": "2026-06-10T02:00:00.000Z"
  }
  ```

### Update Workspace
* **Endpoint:** `PUT /api/organizations/{organizationId}/workspaces/{id}`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "name": "Acme Primary Workspace",
    "brandingSettings": {
      "primaryColor": "#ff0000",
      "logo": "https://res.cloudinary.com/..."
    },
    "customDomain": "certs.acme.com",
    "smtpEnabled": true,
    "smtpSettings": {
      "host": "smtp.mailgun.org",
      "port": 587,
      "username": "postmaster@acme.com",
      "password": "smtppassword"
    }
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "ws_b9e28dc1",
    "name": "Acme Primary Workspace",
    "slug": "acme-primary-workspace-org_a7e4bca2",
    "organizationId": "org_a7e4bca2",
    "brandingSettings": {
      "primaryColor": "#ff0000",
      "logo": "https://res.cloudinary.com/..."
    },
    "customDomain": "certs.acme.com",
    "smtpEnabled": true,
    "smtpSettings": {
      "host": "smtp.mailgun.org",
      "port": 587,
      "username": "postmaster@acme.com"
    },
    "createdAt": "2026-06-10T02:00:00.000Z",
    "updatedAt": "2026-06-10T02:20:00.000Z"
  }
  ```

### Delete Workspace
* **Endpoint:** `DELETE /api/organizations/{organizationId}/workspaces/{id}` (Note: Requires OWNER role)
* **Auth:** Required
* **Response (204 No Content)**

### Upload File to Workspace
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces/{id}/upload`
* **Auth:** Required
* **Content-Type:** `multipart/form-data`
* **Request:** File attached to `file` key
* **Response (200 OK):**
  ```json
  {
    "id": "fil_7ca82bd1",
    "workspaceId": "ws_b9e28dc1",
    "uploadedById": "usr_982bca81",
    "fileName": "students_list.csv",
    "mimeType": "text/csv",
    "fileSize": 4120,
    "storageKey": "workspace_files/students_list_uuid",
    "publicUrl": "https://res.cloudinary.com/...",
    "createdAt": "2026-06-10T02:25:00.000Z",
    "updatedAt": "2026-06-10T02:25:00.000Z"
  }
  ```

---

## 6. Upload Routes

This module allows general file uploads to Cloudinary. Associate files with a workspace by sending the optional `workspaceId`.

### Upload Image
* **Endpoint:** `POST /api/upload/image`
* **Auth:** Required
* **Content-Type:** `multipart/form-data`
* **Request Parameters:**
  * `file` (binary, required) - Image file
  * `workspaceId` (string, optional) - Workspace ID
* **Response (200 OK):**
  ```json
  {
    "url": "https://res.cloudinary.com/...",
    "public_id": "image_upload_id",
    "dbEntry": null
  }
  ```

### Upload Document / CSV / General File
* **Endpoint:** `POST /api/upload/file`
* **Auth:** Required
* **Content-Type:** `multipart/form-data`
* **Request Parameters:**
  * `file` (binary, required) - Document file
  * `workspaceId` (string, optional) - Workspace ID
* **Response (200 OK):**
  ```json
  {
    "url": "https://res.cloudinary.com/...",
    "public_id": "file_upload_id",
    "dbEntry": {
      "id": "fil_7ca82bd1",
      "workspaceId": "ws_b9e28dc1",
      "uploadedById": "usr_982bca81",
      "fileName": "certificates.csv",
      "mimeType": "text/csv",
      "fileSize": 1024,
      "storageKey": "file_upload_id",
      "publicUrl": "https://res.cloudinary.com/...",
      "createdAt": "2026-06-10T02:25:00.000Z",
      "updatedAt": "2026-06-10T02:25:00.000Z"
    }
  }
  ```

---

## 7. Certificate Template Routes

### Create Template
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces/{workspaceId}/templates`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "name": "Achievement Certificate",
    "description": "General award certificate template",
    "htmlTemplate": "<div style='padding: 20px;'><h1>Award of Achievement</h1><p>Presented to {{recipientName}}</p><p>For: {{courseTitle}}</p></div>",
    "cssStyles": "h1 { color: #333; }",
    "orientation": "landscape",
    "schemaDefinition": [
      {
        "key": "courseTitle",
        "label": "Course Title",
        "type": "text",
        "required": true
      }
    ]
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "tmpl_e8c7a6b2",
    "name": "Achievement Certificate",
    "description": "General award certificate template",
    "htmlTemplate": "<div style='padding: 20px;'>...",
    "cssStyles": "h1 { color: #333; }",
    "orientation": "landscape",
    "schemaDefinition": [
      {
        "key": "courseTitle",
        "label": "Course Title",
        "type": "text",
        "required": true
      }
    ],
    "workspaceId": "ws_b9e28dc1",
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:30:00.000Z",
    "updatedAt": "2026-06-10T02:30:00.000Z"
  }
  ```

### List Templates in Workspace
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/templates`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "templates": [
      {
        "id": "tmpl_e8c7a6b2",
        "name": "Achievement Certificate",
        "description": "General award certificate template",
        "htmlTemplate": "<div style='padding: 20px;'>...",
        "cssStyles": "h1 { color: #333; }",
        "orientation": "landscape",
        "schemaDefinition": [ ... ],
        "workspaceId": "ws_b9e28dc1",
        "createdById": "usr_982bca81",
        "createdAt": "2026-06-10T02:30:00.000Z",
        "updatedAt": "2026-06-10T02:30:00.000Z"
      }
    ]
  }
  ```

### List My Templates in Workspace
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/my-templates`
* **Auth:** Required
* **Response (200 OK):** (Same pagination envelope as GET templates, showing only templates created by the logged-in user)

### Get Template by ID
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "tmpl_e8c7a6b2",
    "name": "Achievement Certificate",
    "description": "General award certificate template",
    "htmlTemplate": "<div style='padding: 20px;'>...",
    "cssStyles": "h1 { color: #333; }",
    "orientation": "landscape",
    "schemaDefinition": [ ... ],
    "workspaceId": "ws_b9e28dc1",
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:30:00.000Z",
    "updatedAt": "2026-06-10T02:30:00.000Z"
  }
  ```

### Update Template (Note: Allowed for creator or admin/owner)
* **Endpoint:** `PUT /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}`
* **Auth:** Required
* **Request Body:** (All fields optional)
  ```json
  {
    "name": "Updated Certificate Title",
    "htmlTemplate": "<div>Updated HTML</div>"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "tmpl_e8c7a6b2",
    "name": "Updated Certificate Title",
    "description": "General award certificate template",
    "htmlTemplate": "<div>Updated HTML</div>",
    "cssStyles": "h1 { color: #333; }",
    "orientation": "landscape",
    "schemaDefinition": [ ... ],
    "workspaceId": "ws_b9e28dc1",
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:30:00.000Z",
    "updatedAt": "2026-06-10T02:35:00.000Z"
  }
  ```

### Delete Template (Note: Allowed for creator or admin/owner if no credentials exist)
* **Endpoint:** `DELETE /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}`
* **Auth:** Required
* **Response (204 No Content)**

---

## 8. Credential Routes

### Create Single Credential
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "templateId": "tmpl_e8c7a6b2",
    "recipientEmail": "student@example.com",
    "recipientName": "Jane Doe",
    "credentialData": {
      "courseTitle": "Introduction to Node.js"
    },
    "expiresAt": null
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "crd_8ebc2da1",
    "workspaceId": "ws_b9e28dc1",
    "organizationId": "org_a7e4bca2",
    "templateId": "tmpl_e8c7a6b2",
    "recipientName": "Jane Doe",
    "recipientEmail": "student@example.com",
    "credentialData": {
      "courseTitle": "Introduction to Node.js"
    },
    "verificationCode": "CERT-8DBC7A98EF10492B",
    "status": "draft",
    "expiresAt": null,
    "issuedAt": null,
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:40:00.000Z",
    "updatedAt": "2026-06-10T02:40:00.000Z",
    "template": { ... },
    "createdBy": { ... }
  }
  ```

### Create Batch Credentials (Asynchronous Job)
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/batch`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "templateId": "tmpl_e8c7a6b2",
    "fileId": "fil_7ca82bd1",
    "recipientNameColumn": "name",
    "recipientEmailColumn": "email",
    "dataMapping": {
      "courseTitle": "course"
    }
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "message": "Batch credential processing started",
    "job": {
      "id": "job_09e7ba21",
      "workspaceId": "ws_b9e28dc1",
      "type": "batch_credentials",
      "status": "pending",
      "progress": 0,
      "createdAt": "2026-06-10T02:42:00.000Z",
      "updatedAt": "2026-06-10T02:42:00.000Z"
    }
  }
  ```

### List Credentials in Workspace
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
  * `status` (string, optional) - `draft`, `issued`, or `revoked`
  * `recipientEmail` (string, optional) - Filter by email
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "credentials": [
      {
        "id": "crd_8ebc2da1",
        "workspaceId": "ws_b9e28dc1",
        "organizationId": "org_a7e4bca2",
        "templateId": "tmpl_e8c7a6b2",
        "recipientName": "Jane Doe",
        "recipientEmail": "student@example.com",
        "credentialData": {
          "courseTitle": "Introduction to Node.js"
        },
        "verificationCode": "CERT-8DBC7A98EF10492B",
        "status": "draft",
        "expiresAt": null,
        "issuedAt": null,
        "createdById": "usr_982bca81",
        "createdAt": "2026-06-10T02:40:00.000Z",
        "updatedAt": "2026-06-10T02:40:00.000Z",
        "template": {
          "name": "Achievement Certificate"
        }
      }
    ]
  }
  ```

### Get Credential by ID
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "crd_8ebc2da1",
    "workspaceId": "ws_b9e28dc1",
    "organizationId": "org_a7e4bca2",
    "templateId": "tmpl_e8c7a6b2",
    "recipientName": "Jane Doe",
    "recipientEmail": "student@example.com",
    "credentialData": {
      "courseTitle": "Introduction to Node.js"
    },
    "verificationCode": "CERT-8DBC7A98EF10492B",
    "status": "draft",
    "expiresAt": null,
    "issuedAt": null,
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:40:00.000Z",
    "updatedAt": "2026-06-10T02:40:00.000Z",
    "template": { ... },
    "createdBy": {
      "id": "usr_982bca81",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "events": [],
    "emailLogs": []
  }
  ```

### Issue Credential (Transitions status to `issued` & triggers email)
* **Endpoint:** `PATCH /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}/issue`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "crd_8ebc2da1",
    "workspaceId": "ws_b9e28dc1",
    "organizationId": "org_a7e4bca2",
    "templateId": "tmpl_e8c7a6b2",
    "recipientName": "Jane Doe",
    "recipientEmail": "student@example.com",
    "credentialData": {
      "courseTitle": "Introduction to Node.js"
    },
    "verificationCode": "CERT-8DBC7A98EF10492B",
    "status": "issued",
    "expiresAt": null,
    "issuedAt": "2026-06-10T02:45:00.000Z",
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:40:00.000Z",
    "updatedAt": "2026-06-10T02:45:00.000Z",
    "template": { ... }
  }
  ```

### Revoke Credential
* **Endpoint:** `PATCH /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}/revoke`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "crd_8ebc2da1",
    "workspaceId": "ws_b9e28dc1",
    "organizationId": "org_a7e4bca2",
    "templateId": "tmpl_e8c7a6b2",
    "recipientName": "Jane Doe",
    "recipientEmail": "student@example.com",
    "credentialData": {
      "courseTitle": "Introduction to Node.js"
    },
    "verificationCode": "CERT-8DBC7A98EF10492B",
    "status": "revoked",
    "expiresAt": null,
    "issuedAt": "2026-06-10T02:45:00.000Z",
    "createdById": "usr_982bca81",
    "createdAt": "2026-06-10T02:40:00.000Z",
    "updatedAt": "2026-06-10T02:50:00.000Z"
  }
  ```

### Bulk Issue Draft Credentials (Asynchronous Job)
* **Endpoint:** `POST /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/issue-batch`
* **Auth:** Required
* **Request Body:**
  ```json
  {
    "credentialIds": ["crd_8ebc2da1", "crd_9fc02ab3"]
  }
  ```
* **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "message": "Bulk issuance job started",
    "job": {
      "id": "job_3ae8cb01",
      "workspaceId": "ws_b9e28dc1",
      "type": "bulk_issue",
      "status": "pending",
      "progress": 0,
      "createdAt": "2026-06-10T02:52:00.000Z",
      "updatedAt": "2026-06-10T02:52:00.000Z"
    }
  }
  ```

---

## 9. Verification Routes

These are public endpoints for credential verification, which do not require authentication.

### Verify Credential by Code
* **Endpoint:** `GET /api/verify/{verificationCode}`
* **Auth:** Public
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "issued",
    "credential": {
      "id": "crd_8ebc2da1",
      "recipientName": "Jane Doe",
      "recipientEmail": "student@example.com",
      "credentialData": {
        "courseTitle": "Introduction to Node.js"
      },
      "verificationCode": "CERT-8DBC7A98EF10492B",
      "status": "issued",
      "expiresAt": null,
      "issuedAt": "2026-06-10T02:45:00.000Z",
      "template": {
        "id": "tmpl_e8c7a6b2",
        "name": "Achievement Certificate",
        "description": "General award certificate template"
      },
      "workspace": {
        "id": "ws_b9e28dc1",
        "name": "Acme Corp Workspace",
        "customDomain": null
      },
      "organization": {
        "id": "org_a7e4bca2",
        "name": "Acme Corp",
        "slug": "acme-corp-usr_982bca81",
        "logoUrl": null
      }
    }
  }
  ```

### Track Credential Event (e.g. Viewed, Downloaded)
* **Endpoint:** `POST /api/credentials/{credId}/events`
* **Auth:** Public
* **Request Body:**
  ```json
  {
    "eventType": "viewed",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "metadata": {
      "screen": "public_viewer"
    }
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "event": {
      "id": "evt_9fa1bca0",
      "credentialId": "crd_8ebc2da1",
      "eventType": "viewed",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "screen": "public_viewer"
      },
      "createdAt": "2026-06-10T03:00:00.000Z"
    }
  }
  ```

---

## 10. Email Routes

### Manually Send Verification Email
* **Endpoint:** `POST /api/email/send-verification`
* **Auth:** Required (Allowed for workspace member/admin/owner)
* **Request Body:**
  ```json
  {
    "credentialId": "crd_8ebc2da1"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verification email sent successfully",
    "logId": "log_a8e7cb01"
  }
  ```

### List Workspace Email Logs
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/emails`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "logs": [
      {
        "id": "log_a8e7cb01",
        "credentialId": "crd_8ebc2da1",
        "status": "sent",
        "providerMessageId": "mock-msg-id",
        "bounceReason": null,
        "openedAt": "2026-06-10T02:50:00.000Z",
        "clickedAt": null,
        "createdAt": "2026-06-10T02:45:00.000Z",
        "updatedAt": "2026-06-10T02:50:00.000Z",
        "credential": {
          "recipientName": "Jane Doe",
          "verificationCode": "CERT-8DBC7A98EF10492B"
        }
      }
    ]
  }
  ```

### Email Open Tracking (1x1 Transparent Pixel)
* **Endpoint:** `GET /api/email/track/open/{logId}`
* **Auth:** Public
* **Response (200 OK):** transparent image/gif data

### Email Link Click Tracking
* **Endpoint:** `GET /api/email/track/click/{logId}`
* **Auth:** Public
* **Query Parameters:**
  * `url` (string, required) - URL-encoded redirect URL destination
* **Response (302 Found):** Redirects to the destination URL (if matching CORS allowed origins) or redirects to the default frontend URL home page.

---

## 11. Background Job Routes

### List Workspace Jobs
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/jobs`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
  * `status` (string, optional) - `pending`, `in_progress`, `completed`, `failed`
  * `type` (string, optional) - `batch_credentials` or `bulk_issue`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "jobs": [
      {
        "id": "job_09e7ba21",
        "workspaceId": "ws_b9e28dc1",
        "type": "batch_credentials",
        "status": "completed",
        "progress": 100,
        "payload": {
          "templateId": "tmpl_e8c7a6b2",
          "fileId": "fil_7ca82bd1",
          "recipientNameColumn": "name",
          "recipientEmailColumn": "email",
          "dataMapping": {
            "courseTitle": "course"
          }
        },
        "result": {
          "total": 5,
          "success": 5,
          "failed": 0,
          "errors": []
        },
        "error": null,
        "createdAt": "2026-06-10T02:42:00.000Z",
        "updatedAt": "2026-06-10T02:43:00.000Z"
      }
    ]
  }
  ```

### Get Job Status by ID
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/jobs/{jobId}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "job_09e7ba21",
    "workspaceId": "ws_b9e28dc1",
    "type": "batch_credentials",
    "status": "completed",
    "progress": 100,
    "payload": { ... },
    "result": { ... },
    "error": null,
    "createdAt": "2026-06-10T02:42:00.000Z",
    "updatedAt": "2026-06-10T02:43:00.000Z"
  }
  ```

---

## 12. File Routes

### List Workspace Files
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/files`
* **Auth:** Required
* **Query Parameters:**
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 1,
    "files": [
      {
        "id": "fil_7ca82bd1",
        "workspaceId": "ws_b9e28dc1",
        "uploadedById": "usr_982bca81",
        "fileName": "students_list.csv",
        "mimeType": "text/csv",
        "fileSize": 4120,
        "storageKey": "workspace_files/students_list_uuid",
        "publicUrl": "https://res.cloudinary.com/...",
        "createdAt": "2026-06-10T02:25:00.000Z",
        "updatedAt": "2026-06-10T02:25:00.000Z",
        "uploadedBy": {
          "id": "usr_982bca81",
          "firstName": "John",
          "lastName": "Doe",
          "email": "user@example.com"
        }
      }
    ]
  }
  ```

### Get File Details
* **Endpoint:** `GET /api/organizations/{organizationId}/workspaces/{workspaceId}/files/{fileId}`
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "id": "fil_7ca82bd1",
    "workspaceId": "ws_b9e28dc1",
    "uploadedById": "usr_982bca81",
    "fileName": "students_list.csv",
    "mimeType": "text/csv",
    "fileSize": 4120,
    "storageKey": "workspace_files/students_list_uuid",
    "publicUrl": "https://res.cloudinary.com/...",
    "createdAt": "2026-06-10T02:25:00.000Z",
    "updatedAt": "2026-06-10T02:25:00.000Z",
    "uploadedBy": {
      "id": "usr_982bca81",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    }
  }
  ```

### Delete File (Note: Deletes file from database and Cloudinary storage)
* **Endpoint:** `DELETE /api/organizations/{organizationId}/workspaces/{workspaceId}/files/{fileId}` (Note: Allowed for owner/admin)
* **Auth:** Required
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "File deleted successfully"
  }
  ```

---

## 13. Error Handling

When errors occur during request processing, the backend handles them gracefully and responds with appropriate status codes and error bodies.

* **400 Bad Request:** Occurs on input validation failure, e.g., missing required fields, Zod schema validation errors.
* **401 Unauthorized:** Occurs when authorization token is missing, invalid, or expired.
* **403 Forbidden:** Occurs when trying to perform operations without sufficient membership permission level (e.g. VIEWER attempting to issue credentials).
* **404 Not Found:** Occurs when requesting non-existent entities (workspace, templates, files, credentials).
* **409 Conflict:** Occurs when creating resources that violate unique constraints (e.g. user already exists).
* **500 Internal Server Error:** General unhandled error fallback.
