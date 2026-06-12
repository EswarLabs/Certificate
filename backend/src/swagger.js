import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Certificate Management API",
      version: "1.0.0",
      description: "API for managing certificates, organizations, and users",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/modules/auth/auth.routes.js",
    "./src/modules/organization/org.routes.js",
    "./src/modules/upload/upload.routes.js",
    "./src/modules/workspaces/workspace.routes.js",
    "./src/modules/memberships/membership.routes.js",
    "./src/modules/templates/template.routes.js",
    "./src/modules/users/user.routes.js",
    "./src/modules/certificates/credential.routes.js",
    "./src/modules/verification/verification.routes.js",
    "./src/modules/email/email.routes.js",
    "./src/modules/jobs/jobs.routes.js",
    "./src/modules/files/files.routes.js",
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
