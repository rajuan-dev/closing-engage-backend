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
    { name: 'Access Requests', description: 'Public request intake and admin review endpoints' },
    { name: 'Users', description: 'Admin-managed title company and notary user endpoints' },
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
      AccessRequestRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad4401' },
          role: { type: 'string', enum: ['company', 'notary'], example: 'company' },
          fullName: { type: 'string', example: 'Alex Turner' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          phone: { type: 'string', example: '+1 (555) 902-4412' },
          companyName: { type: 'string', example: 'Estate Flux Title' },
          contactType: { type: 'string', example: 'Title Company' },
          requestType: { type: 'string', example: 'Access Request' },
          commissionNumber: { type: 'string', example: 'NOT-55410' },
          commissionExpiration: { type: 'string', example: '2027-08-31' },
          eoInsurance: { type: 'string', example: '$100,000' },
          certifications: { type: 'string', example: 'NNA Certified' },
          coverageArea: { type: 'string', example: 'Austin, TX' },
          message: { type: 'string', example: 'Need access for new closings.' },
          status: { type: 'string', enum: ['Pending', 'Approved', 'Declined'], example: 'Pending' },
          createdDate: { type: 'string', example: 'May 19, 2026' },
        },
        required: [
          'id',
          'role',
          'fullName',
          'email',
          'phone',
          'coverageArea',
          'status',
          'createdDate',
        ],
      },
      CompanyAccessRequestPayload: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['company'], example: 'company' },
          fullName: { type: 'string', example: 'Alex Turner' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          phone: { type: 'string', example: '+1 (555) 902-4412', default: 'N/A' },
          companyName: { type: 'string', example: 'Estate Flux Title', default: 'Independent Escrow LLC' },
          contactType: { type: 'string', example: 'Title Company', default: 'Title Company' },
          requestType: { type: 'string', example: 'Access Request', default: 'Access Request' },
          coverageArea: { type: 'string', example: 'Austin, TX', default: 'N/A' },
          message: { type: 'string', example: 'Need portal access for my team.', default: 'No additional comments.' },
        },
        required: ['role', 'fullName', 'email'],
      },
      NotaryAccessRequestPayload: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['notary'], example: 'notary' },
          fullName: { type: 'string', example: 'Jordan Blake' },
          email: { type: 'string', format: 'email', example: 'jordan@example.com' },
          phone: { type: 'string', example: '+1 (555) 200-1100', default: 'N/A' },
          commissionNumber: { type: 'string', example: 'NOT-55410', default: 'N/A' },
          commissionExpiration: { type: 'string', example: '2027-08-31', default: 'N/A' },
          eoInsurance: { type: 'string', example: '$100,000', default: 'N/A' },
          certifications: { type: 'string', example: 'NNA Certified', default: 'N/A' },
          coverageArea: { type: 'string', example: 'Austin, TX', default: 'N/A' },
          message: { type: 'string', example: 'Available for evening signings.', default: 'No additional comments.' },
        },
        required: ['role', 'fullName', 'email'],
      },
      AccessRequestStatusPayload: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['Pending', 'Approved', 'Declined'],
            example: 'Approved',
          },
        },
        required: ['status'],
      },
      AccessRequestSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AccessRequestRecord' },
            },
            required: ['data'],
          },
        ],
      },
      AccessRequestListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/AccessRequestRecord' },
              },
            },
            required: ['data'],
          },
        ],
      },
      CompanyUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad5501' },
          initials: { type: 'string', example: 'ES' },
          color: { type: 'string', example: 'bg-[#DCE7FF] text-[#3165CF]' },
          companyName: { type: 'string', example: 'Estate Flux Title' },
          contactPerson: { type: 'string', example: 'Alex Turner' },
          businessEmail: { type: 'string', format: 'email', example: 'ops@estateflux.com' },
          phone: { type: 'string', example: '+1 (555) 902-4412' },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Active' },
          createdDate: { type: 'string', example: 'May 19, 2026' },
          address: { type: 'string', example: '782 Commerce Blvd, Austin TX' },
          contactEmail: { type: 'string', format: 'email', example: 'alex.t@estateflux.com' },
          userName: { type: 'string', example: 'estateflux-admin' },
          sendInvite: { type: 'boolean', example: true },
          verify: { type: 'boolean', example: true },
        },
        required: [
          'id',
          'initials',
          'color',
          'companyName',
          'contactPerson',
          'businessEmail',
          'phone',
          'status',
          'createdDate',
          'address',
          'contactEmail',
          'userName',
          'sendInvite',
          'verify',
        ],
      },
      CompanyUserPayload: {
        type: 'object',
        properties: {
          companyName: { type: 'string', example: 'Estate Flux Title' },
          businessEmail: { type: 'string', format: 'email', example: 'ops@estateflux.com' },
          phone: { type: 'string', example: '+1 (555) 902-4412', default: '' },
          contactPerson: { type: 'string', example: 'Alex Turner' },
          address: { type: 'string', example: '782 Commerce Blvd, Austin TX' },
          contactEmail: { type: 'string', example: 'alex.t@estateflux.com' },
          userName: { type: 'string', example: 'estateflux-admin' },
          password: { type: 'string', example: 'TempPassword123' },
          sendInvite: { type: 'boolean', example: true },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Active' },
          verify: { type: 'boolean', example: true },
        },
        required: ['companyName', 'businessEmail', 'contactPerson', 'status'],
      },
      CompanyUserUpdatePayload: {
        type: 'object',
        properties: {
          companyName: { type: 'string', example: 'Estate Flux Title' },
          businessEmail: { type: 'string', format: 'email', example: 'ops@estateflux.com' },
          phone: { type: 'string', example: '+1 (555) 902-4412' },
          contactPerson: { type: 'string', example: 'Alex Turner' },
          address: { type: 'string', example: '782 Commerce Blvd, Austin TX' },
          contactEmail: { type: 'string', example: 'alex.t@estateflux.com' },
          userName: { type: 'string', example: 'estateflux-admin' },
          password: { type: 'string', example: 'UpdatedPassword123' },
          sendInvite: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Inactive' },
          verify: { type: 'boolean', example: false },
        },
      },
      CompanyUserSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CompanyUser' },
            },
            required: ['data'],
          },
        ],
      },
      CompanyUserListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/CompanyUser' },
              },
            },
            required: ['data'],
          },
        ],
      },
      NotaryUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad6601' },
          initials: { type: 'string', example: 'JB' },
          color: { type: 'string', example: 'bg-[#FFE2D3] text-[#C66B33]' },
          fullName: { type: 'string', example: 'Jordan Blake' },
          specialty: { type: 'string', example: 'Mobile Loan Signing Agent' },
          email: { type: 'string', format: 'email', example: 'jordan@example.com' },
          phone: { type: 'string', example: '+1 (555) 200-1100' },
          license: { type: 'string', example: 'TX-99541' },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Active' },
          createdDate: { type: 'string', example: 'May 19, 2026' },
          expiry: { type: 'string', example: '2027-08-31' },
          serviceArea: { type: 'string', example: 'Austin Metro' },
          userName: { type: 'string', example: 'jblake' },
          sendInvite: { type: 'boolean', example: true },
          verify: { type: 'boolean', example: true },
        },
        required: [
          'id',
          'initials',
          'color',
          'fullName',
          'specialty',
          'email',
          'phone',
          'license',
          'status',
          'createdDate',
          'expiry',
          'serviceArea',
          'userName',
          'sendInvite',
          'verify',
        ],
      },
      NotaryUserPayload: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Jordan Blake' },
          specialty: { type: 'string', example: 'Mobile Loan Signing Agent' },
          email: { type: 'string', format: 'email', example: 'jordan@example.com' },
          phone: { type: 'string', example: '+1 (555) 200-1100', default: '' },
          license: { type: 'string', example: 'TX-99541' },
          expiry: { type: 'string', example: '2027-08-31' },
          serviceArea: { type: 'string', example: 'Austin Metro' },
          userName: { type: 'string', example: 'jblake' },
          password: { type: 'string', example: 'TempPassword123' },
          sendInvite: { type: 'boolean', example: true },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Active' },
          verify: { type: 'boolean', example: true },
        },
        required: ['fullName', 'email', 'license', 'status'],
      },
      NotaryUserUpdatePayload: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Jordan Blake' },
          specialty: { type: 'string', example: 'Remote Online Notary' },
          email: { type: 'string', format: 'email', example: 'jordan@example.com' },
          phone: { type: 'string', example: '+1 (555) 200-1100' },
          license: { type: 'string', example: 'TX-99541' },
          expiry: { type: 'string', example: '2027-08-31' },
          serviceArea: { type: 'string', example: 'Austin Metro' },
          userName: { type: 'string', example: 'jblake' },
          password: { type: 'string', example: 'UpdatedPassword123' },
          sendInvite: { type: 'boolean', example: false },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Pending'], example: 'Inactive' },
          verify: { type: 'boolean', example: false },
        },
      },
      NotaryUserSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/NotaryUser' },
            },
            required: ['data'],
          },
        ],
      },
      NotaryUserListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/NotaryUser' },
              },
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
              schema: { $ref: '#/components/schemas/TeamMemberPayload' },
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
    '/access-requests/company': {
      post: {
        tags: ['Access Requests'],
        summary: 'Submit a public title company access request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompanyAccessRequestPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Company request submitted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessRequestSingleResponse' },
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
    '/access-requests/notary': {
      post: {
        tags: ['Access Requests'],
        summary: 'Submit a public notary access request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotaryAccessRequestPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Notary request submitted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessRequestSingleResponse' },
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
    '/access-requests': {
      get: {
        tags: ['Access Requests'],
        summary: 'List all submitted access requests for admin review',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Access requests fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessRequestListResponse' },
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
    '/access-requests/{id}/status': {
      patch: {
        tags: ['Access Requests'],
        summary: 'Update an access request review status',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AccessRequestStatusPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Access request status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessRequestSingleResponse' },
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
          '404': {
            description: 'Access request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/users/companies': {
      get: {
        tags: ['Users'],
        summary: 'List title company users',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Company users fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyUserListResponse' },
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
      post: {
        tags: ['Users'],
        summary: 'Create a title company user and optionally send an invite email',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompanyUserPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Company user created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyUserSingleResponse' },
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
    '/users/companies/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a title company user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompanyUserUpdatePayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Company user updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyUserSingleResponse' },
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
          '404': {
            description: 'Company user not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a title company user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Company user deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
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
          '404': {
            description: 'Company user not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/users/notaries': {
      get: {
        tags: ['Users'],
        summary: 'List notary users',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notary users fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotaryUserListResponse' },
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
      post: {
        tags: ['Users'],
        summary: 'Create a notary user and optionally send an invite email',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotaryUserPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Notary user created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotaryUserSingleResponse' },
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
    '/users/notaries/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a notary user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotaryUserUpdatePayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Notary user updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotaryUserSingleResponse' },
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
          '404': {
            description: 'Notary user not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a notary user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Notary user deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
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
          '404': {
            description: 'Notary user not found',
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
