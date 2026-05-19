import { env } from '../config/env';

const apiBaseUrl = `http://localhost:${env.PORT}${env.API_PREFIX}`;

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Closing Engage Backend API',
    version: '1.0.0',
    description:
      'OpenAPI documentation for the Closing Engage backend. This document must be updated whenever backend endpoints, request bodies, responses, or auth rules change.',
  },
  servers: [
    {
      url: apiBaseUrl,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health and uptime endpoints' },
    { name: 'Auth', description: 'Admin authentication and profile management endpoints' },
    { name: 'Team', description: 'Team member management endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Request completed successfully' },
        },
        required: ['success', 'message'],
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          error: {
            oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'string' }],
          },
        },
        required: ['success', 'message'],
      },
      HealthResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  service: { type: 'string', example: 'closing-engage-backend' },
                  status: { type: 'string', example: 'healthy' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
                required: ['service', 'status', 'timestamp'],
              },
            },
            required: ['data'],
          },
        ],
      },
      AdminProfile: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Closing Engage Admin' },
          email: { type: 'string', format: 'email', example: 'admin@closingengage.com' },
          phone: { type: 'string', example: '+1 (555) 010-1000' },
          companyName: { type: 'string', example: 'Closing Engage' },
          companyEmail: { type: 'string', format: 'email', example: 'admin@closingengage.com' },
          contactNumber: { type: 'string', example: '+1 (555) 010-1000' },
          businessAddress: { type: 'string', example: 'Austin, Texas' },
        },
        required: [
          'fullName',
          'email',
          'phone',
          'companyName',
          'companyEmail',
          'contactNumber',
          'businessAddress',
        ],
      },
      AdminAccount: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad2221' },
          email: { type: 'string', format: 'email', example: 'admin@closingengage.com' },
          role: { type: 'string', enum: ['admin'], example: 'admin' },
          profile: { $ref: '#/components/schemas/AdminProfile' },
        },
        required: ['id', 'email', 'role', 'profile'],
      },
      AdminLoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@closingengage.com' },
          password: { type: 'string', example: 'admin@123' },
        },
        required: ['email', 'password'],
      },
      AdminLoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  admin: { $ref: '#/components/schemas/AdminAccount' },
                },
                required: ['token', 'admin'],
              },
            },
            required: ['data'],
          },
        ],
      },
      AdminSessionResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  admin: { $ref: '#/components/schemas/AdminAccount' },
                },
                required: ['admin'],
              },
            },
            required: ['data'],
          },
        ],
      },
      UpdateAdminPasswordRequest: {
        type: 'object',
        properties: {
          currentPassword: { type: 'string', example: 'admin@123' },
          newPassword: { type: 'string', example: 'newStrongPassword123' },
          confirmPassword: { type: 'string', example: 'newStrongPassword123' },
        },
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
      },
      TeamMember: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '682afc5f8d249f890fad3311' },
          name: { type: 'string', example: 'Sarah Miller' },
          email: { type: 'string', format: 'email', example: 'sarah.miller@closingengage.com' },
          phone: { type: 'string', example: '+1 (555) 222-1000' },
          role: { type: 'string', enum: ['Admin', 'Member'], example: 'Admin' },
          status: {
            type: 'string',
            enum: ['Active', 'Pending Invite', 'Inactive'],
            example: 'Active',
          },
          joinedDate: { type: 'string', example: 'May 19, 2026' },
          companyId: { type: 'string', example: 'COMP-10' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['name', 'email', 'role', 'status', 'joinedDate', 'companyId'],
      },
      TeamMemberPayload: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Sarah Miller' },
          email: { type: 'string', format: 'email', example: 'sarah.miller@closingengage.com' },
          phone: { type: 'string', example: '+1 (555) 222-1000' },
          role: { type: 'string', enum: ['Admin', 'Member'], example: 'Admin' },
          status: {
            type: 'string',
            enum: ['Active', 'Pending Invite', 'Inactive'],
            example: 'Active',
          },
          joinedDate: { type: 'string', example: 'May 19, 2026' },
          companyId: { type: 'string', example: 'COMP-10' },
        },
        required: ['name', 'email', 'joinedDate', 'companyId'],
      },
      TeamListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/TeamMember' },
              },
            },
            required: ['data'],
          },
        ],
      },
      TeamSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/TeamMember' },
            },
            required: ['data'],
          },
        ],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Get backend health status',
        responses: {
          '200': {
            description: 'Backend is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/admin/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate the default or persisted admin user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminLoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Admin login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminLoginResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/admin/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated admin session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin session is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminSessionResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid or missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/admin/profile': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated admin profile and settings identity block',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminProfile' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Admin profile updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminSessionResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/admin/password': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated admin password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAdminPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Admin password updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '400': {
            description: 'Current password incorrect or validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/team': {
      get: {
        tags: ['Team'],
        summary: 'List team members',
        responses: {
          '200': {
            description: 'Team members fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TeamListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Team'],
        summary: 'Create a new team member',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TeamMemberPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Team member created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TeamSingleResponse' },
              },
            },
          },
          '400': {
            description: 'Validation or persistence error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/team/{email}': {
      patch: {
        tags: ['Team'],
        summary: 'Update an existing team member by email',
        parameters: [
          {
            in: 'path',
            name: 'email',
            required: true,
            schema: { type: 'string', format: 'email' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/TeamMemberPayload' },
                ],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Team member updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TeamSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Member not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Team'],
        summary: 'Delete a team member by email',
        parameters: [
          {
            in: 'path',
            name: 'email',
            required: true,
            schema: { type: 'string', format: 'email' },
          },
        ],
        responses: {
          '200': {
            description: 'Team member deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '404': {
            description: 'Member not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
  },
} as const;
