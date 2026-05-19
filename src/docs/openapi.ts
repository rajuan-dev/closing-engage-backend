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
    { name: 'Orders', description: 'Admin order creation, listing, assignment, status, and timeline endpoints' },
    { name: 'Documents', description: 'Role-scoped document metadata, review, versioning, and signed URL endpoints' },
    { name: 'Notifications', description: 'Role-scoped notification inbox and read-state endpoints' },
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
      CompanyLoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  company: { $ref: '#/components/schemas/CompanyUser' },
                },
                required: ['token', 'company'],
              },
            },
            required: ['data'],
          },
        ],
      },
      NotaryLoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  notary: { $ref: '#/components/schemas/NotaryUser' },
                },
                required: ['token', 'notary'],
              },
            },
            required: ['data'],
          },
        ],
      },
      PortalLoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  role: { type: 'string', enum: ['company', 'notary'], example: 'company' },
                  user: {
                    oneOf: [{ $ref: '#/components/schemas/CompanyUser' }, { $ref: '#/components/schemas/NotaryUser' }],
                  },
                  redirectTo: { type: 'string', enum: ['/company/dashboard', '/notary/dashboard'], example: '/company/dashboard' },
                },
                required: ['token', 'role', 'user', 'redirectTo'],
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
      CompanySessionResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  company: { $ref: '#/components/schemas/CompanyUser' },
                },
                required: ['company'],
              },
            },
            required: ['data'],
          },
        ],
      },
      NotarySessionResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  notary: { $ref: '#/components/schemas/NotaryUser' },
                },
                required: ['notary'],
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
      ForgotPasswordRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          role: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'company' },
        },
        required: ['email'],
      },
      VerifyOtpRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          role: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'company' },
          otp: { type: 'string', example: '123456' },
        },
        required: ['email', 'otp'],
      },
      ResetPasswordRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          role: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'company' },
          otp: { type: 'string', example: '123456' },
          newPassword: { type: 'string', example: 'newStrongPassword123' },
          confirmPassword: { type: 'string', example: 'newStrongPassword123' },
        },
        required: ['email', 'otp', 'newPassword', 'confirmPassword'],
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
          publicId: {
            type: 'string',
            example: 'CE-COMP-2026-A1B2C3',
            description: 'Readable public company identifier for admin display and search. MongoDB id remains internal for API mutations.',
          },
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
          'publicId',
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
        required: ['companyName', 'businessEmail', 'contactPerson', 'userName'],
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
          publicId: {
            type: 'string',
            example: 'CE-NOT-2026-A1B2C3',
            description: 'Readable public notary identifier for admin display and search. MongoDB id remains internal for API mutations.',
          },
          initials: { type: 'string', example: 'JB' },
          color: { type: 'string', example: 'bg-[#FFE2D3] text-[#C66B33]' },
          fullName: { type: 'string', example: 'Jordan Blake' },
          specialty: { type: 'string', example: 'Mobile Loan Signing Agent' },
          email: { type: 'string', format: 'email', example: 'jordan@example.com' },
          phone: { type: 'string', example: '+1 (555) 200-1100' },
          license: { type: 'string', example: 'TX-99541', default: '' },
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
          'publicId',
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
        required: ['fullName', 'email', 'userName'],
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
      OrderStatus: {
        type: 'string',
        enum: [
          'Received',
          'Assigned',
          'In Progress',
          'Under Review',
          'Approved',
          'Completed',
          'Rejected',
          'Pending Upload',
          'Submitted',
        ],
        example: 'Received',
      },
      OrderRow: {
        type: 'array',
        description:
          'Dashboard table row tuple: [orderId, titleCompany, companyInitials, assignedNotary, propertyLocation, signingDateTime, status, avatarKey].',
        items: {
          oneOf: [
            { type: 'string' },
            { $ref: '#/components/schemas/OrderStatus' },
            { type: 'string', enum: ['none', 'jane', 'mark'] },
          ],
        },
        example: [
          '#ORD-90212',
          'Grand Peak Title',
          'GP',
          'Unassigned',
          '452 Pine St\nSan Francisco\nCA 94104',
          '10/24/2024\n2:00 PM',
          'Received',
          'none',
        ],
        minItems: 8,
        maxItems: 8,
      },
      OrderDocumentPayload: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Closing_Package.pdf' },
          meta: { type: 'string', example: '4.2 MB • Uploaded 2h ago' },
        },
        required: ['name', 'meta'],
      },
      OrderPayload: {
        type: 'object',
        properties: {
          title: { type: 'string', example: '452 Oak Street Refinance' },
          titleCompany: { type: 'string', example: 'Grand Peak Title' },
          companyId: { type: 'string', example: '682afc5f8d249f890fad5501' },
          clientName: { type: 'string', example: 'Daniel Brooks' },
          propertyAddress: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          signerName: { type: 'string', example: 'Daniel Brooks' },
          signerPhone: { type: 'string', example: '(555) 401-8291' },
          signingDate: { type: 'string', example: '10/24/2024' },
          signingTime: { type: 'string', example: '2:00 PM' },
          loanType: { type: 'string', enum: ['Refinance', 'Purchase', 'HELOC', 'Other'], example: 'Refinance' },
          scanbacksRequired: { type: 'boolean', example: true },
          status: { $ref: '#/components/schemas/OrderStatus' },
          priority: {
            type: 'string',
            enum: ['Standard', 'Rush', 'High Touch', 'High', 'Low', 'Normal Processing', 'Urgent Request'],
            example: 'Standard',
          },
          notaryPreference: {
            type: 'string',
            enum: ['First available', 'Verified only', 'Manual assignment'],
            example: 'First available',
          },
          instructions: { type: 'string', example: 'Please ensure all signatures are in blue ink.' },
          notaryNotes: { type: 'string', example: 'Borrower requested evening signing.' },
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderDocumentPayload' },
          },
        },
        required: ['propertyAddress', 'signingDate', 'signingTime'],
      },
      PortalOrder: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '#ORD-90212' },
          clientName: { type: 'string', example: 'Daniel Brooks' },
          propertyAddress: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          location: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          notary: { type: 'string', example: 'Sarah Jenkins' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          date: { type: 'string', example: '10/24/2024' },
          time: { type: 'string', example: '2:00 PM' },
          loanType: { type: 'string', example: 'Refinance' },
          scanbacksRequired: { type: 'boolean', example: true },
        },
        required: ['id', 'clientName', 'propertyAddress', 'location', 'notary', 'status', 'date'],
      },
      OrderDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '#ORD-90212' },
          row: { $ref: '#/components/schemas/OrderRow' },
          title: { type: 'string', example: '452 Oak Street Refinance' },
          titleCompany: { type: 'string', example: 'Grand Peak Title' },
          companyId: { type: 'string', example: '682afc5f8d249f890fad5501' },
          clientName: { type: 'string', example: 'Daniel Brooks' },
          propertyAddress: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          location: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          signingDate: { type: 'string', example: '10/24/2024' },
          signingTime: { type: 'string', example: '2:00 PM' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          priority: { type: 'string', example: 'Standard' },
          loanType: { type: 'string', example: 'Refinance' },
          scanbacksRequired: { type: 'boolean', example: true },
          assignedNotaryName: { type: 'string', example: 'Sarah Jenkins' },
          assignedNotaryId: { type: 'string', example: '682afc5f8d249f890fad6601' },
          specialInstructions: { type: 'string', example: 'Please ensure blue ink signatures.' },
          notaryNotes: { type: 'string', example: 'Signing completed without exceptions.' },
          timeline: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderTimelineEvent' },
          },
        },
        required: ['id', 'status', 'propertyAddress', 'signingDate'],
      },
      OrderStatusPayload: {
        type: 'object',
        properties: {
          status: { $ref: '#/components/schemas/OrderStatus' },
        },
        required: ['status'],
      },
      OrderAssignNotaryPayload: {
        type: 'object',
        properties: {
          notaryName: { type: 'string', example: 'Sarah Jenkins' },
          notaryId: { type: 'string', example: '682afc5f8d249f890fad6601' },
        },
        required: ['notaryName'],
      },
      OrderTimelineEvent: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Order created by Admin' },
          date: { type: 'string', example: 'May 19, 2026, 10:15 AM' },
          tone: { type: 'string', enum: ['blue', 'slate', 'green', 'red'], example: 'blue' },
        },
        required: ['title', 'date', 'tone'],
      },
      OrderListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  oneOf: [{ $ref: '#/components/schemas/OrderRow' }, { $ref: '#/components/schemas/PortalOrder' }],
                },
              },
            },
            required: ['data'],
          },
        ],
      },
      OrderSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                oneOf: [
                  { $ref: '#/components/schemas/OrderRow' },
                  { $ref: '#/components/schemas/PortalOrder' },
                  { $ref: '#/components/schemas/OrderDetail' },
                ],
              },
            },
            required: ['data'],
          },
        ],
      },
      OrderTimelineResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderTimelineEvent' },
              },
            },
            required: ['data'],
          },
        ],
      },
      DocumentStatus: {
        type: 'string',
        enum: ['Pending Review', 'Approved', 'Rejected', 'Submitted', 'Pending', 'Verified'],
        example: 'Pending Review',
      },
      DocumentRow: {
        type: 'array',
        description: 'Admin dashboard document row tuple: [fileName, orderId, uploadedBy, uploadDate, size, status].',
        items: { type: 'string' },
        minItems: 6,
        maxItems: 6,
        example: ['Closing_Disclosure_Final.pdf', '#ORD-882190', 'TITLE COMPANY', 'Oct 24, 2023', '1.2 MB', 'Pending'],
      },
      DocumentRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad7701' },
          name: { type: 'string', example: 'Closing_Disclosure_Final.pdf' },
          orderId: { type: 'string', example: 'ORD-882190' },
          uploadDate: { type: 'string', example: 'Oct 24, 2023' },
          size: { type: 'string', example: '1.2 MB' },
          status: { type: 'string', enum: ['Approved', 'Submitted', 'Pending', 'Verified'], example: 'Pending' },
          uploadedBy: { type: 'string', example: 'Northway Holdings' },
        },
        required: ['id', 'name', 'orderId', 'uploadDate', 'size', 'status'],
      },
      DocumentDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad7701' },
          fileName: { type: 'string', example: 'Closing_Disclosure_Final.pdf' },
          name: { type: 'string', example: 'Closing_Disclosure_Final.pdf' },
          orderId: { type: 'string', example: 'ORD-882190' },
          orderNumber: { type: 'string', example: '#ORD-882190' },
          uploadedAt: { type: 'string', format: 'date-time' },
          uploadDate: { type: 'string', example: 'Oct 24, 2023' },
          size: { type: 'string', example: '1.2 MB' },
          fileSize: { type: 'number', example: 1258291 },
          mimeType: { type: 'string', example: 'application/pdf' },
          status: { $ref: '#/components/schemas/DocumentStatus' },
          displayStatus: { type: 'string', enum: ['Approved', 'Submitted', 'Pending', 'Verified'], example: 'Pending' },
          uploadedBy: { type: 'string', example: 'Northway Holdings' },
          uploaderRole: { type: 'string', enum: ['admin', 'company', 'notary', 'buyer', 'title-company'], example: 'company' },
          comments: { type: 'string', example: 'Needs clearer scanback on page 4.' },
          isLocked: { type: 'boolean', example: false },
          s3Key: { type: 'string', example: 'documents/company/ORD-882190/user/closing.pdf' },
          versions: {
            type: 'array',
            items: { $ref: '#/components/schemas/DocumentVersion' },
          },
        },
        required: ['id', 'fileName', 'orderNumber', 'status', 'isLocked', 'versions'],
      },
      DocumentVersion: {
        type: 'object',
        properties: {
          versionId: { type: 'string', example: 'V2' },
          fileName: { type: 'string', example: 'Closing_Disclosure_Final.pdf' },
          fileSize: { type: 'number', example: 1258291 },
          size: { type: 'string', example: '1.2 MB' },
          mimeType: { type: 'string', example: 'application/pdf' },
          uploadedAt: { type: 'string', format: 'date-time' },
          uploaderRole: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'notary' },
        },
        required: ['versionId', 'fileName', 'fileSize', 'mimeType', 'uploadedAt', 'uploaderRole'],
      },
      DocumentPayload: {
        type: 'object',
        properties: {
          orderId: { type: 'string', example: '#ORD-882190' },
          orderNumber: { type: 'string', example: '#ORD-882190' },
          fileName: { type: 'string', example: 'scanback_signed_final.pdf' },
          fileSize: { type: 'number', example: 4404019 },
          size: { type: 'string', example: '4.2 MB' },
          mimeType: { type: 'string', example: 'application/pdf' },
          uploadedByName: { type: 'string', example: 'Sarah Miller' },
          uploaderRole: { type: 'string', enum: ['admin', 'company', 'notary', 'buyer', 'title-company'], example: 'notary' },
          status: { $ref: '#/components/schemas/DocumentStatus' },
          comments: { type: 'string', example: 'Uploaded from notary scanback flow.' },
          s3Key: { type: 'string', example: 'documents/notary/ORD-882190/user/scanback.pdf' },
          requestUploadUrl: { type: 'boolean', example: true },
        },
        required: ['fileName'],
      },
      DocumentStatusPayload: {
        type: 'object',
        properties: {
          status: { $ref: '#/components/schemas/DocumentStatus' },
          comments: { type: 'string', example: 'Approved after compliance review.' },
        },
        required: ['status'],
      },
      DocumentVersionPayload: {
        type: 'object',
        properties: {
          fileName: { type: 'string', example: 'scanback_signed_final_v2.pdf' },
          fileSize: { type: 'number', example: 4450000 },
          mimeType: { type: 'string', example: 'application/pdf' },
          s3Key: { type: 'string', example: 'documents/notary/ORD-882190/user/scanback-v2.pdf' },
          requestUploadUrl: { type: 'boolean', example: true },
        },
      },
      RestoreDocumentVersionPayload: {
        type: 'object',
        properties: {
          versionId: { type: 'string', example: 'V1' },
        },
        required: ['versionId'],
      },
      DocumentWriteResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  document: { $ref: '#/components/schemas/DocumentDetail' },
                  uploadUrl: { type: 'string', nullable: true, example: 'https://bucket.s3.amazonaws.com/...' },
                  uploadUrlError: { type: 'string', example: 'Upload URL could not be generated. Document metadata was saved.' },
                },
                required: ['document'],
              },
            },
            required: ['data'],
          },
        ],
      },
      DocumentListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  oneOf: [
                    { $ref: '#/components/schemas/DocumentRow' },
                    { $ref: '#/components/schemas/DocumentRecord' },
                    { $ref: '#/components/schemas/DocumentDetail' },
                  ],
                },
              },
            },
            required: ['data'],
          },
        ],
      },
      DocumentSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/DocumentDetail' },
            },
            required: ['data'],
          },
        ],
      },
      DocumentVersionListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/DocumentVersion' },
              },
            },
            required: ['data'],
          },
        ],
      },
      DocumentSignedUrlResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://bucket.s3.amazonaws.com/...' },
                  expiresInSeconds: { type: 'number', example: 900 },
                  fileName: { type: 'string', example: 'Closing_Disclosure_Final.pdf' },
                  mode: { type: 'string', enum: ['download', 'preview'], example: 'download' },
                },
                required: ['url', 'expiresInSeconds', 'fileName', 'mode'],
              },
            },
            required: ['data'],
          },
        ],
      },
      NotificationItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad8801' },
          title: { type: 'string', example: 'New Order Assigned' },
          message: { type: 'string', example: 'You have been assigned to #ORD-90212.' },
          time: { type: 'string', example: '2 min ago' },
          read: { type: 'boolean', example: false },
          type: { type: 'string', enum: ['order', 'document', 'user', 'system'], example: 'order' },
          linkId: { type: 'string', example: '#ORD-90212' },
          recipientRole: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'notary' },
        },
        required: ['id', 'title', 'message', 'time', 'read', 'type', 'recipientRole'],
      },
      NotificationListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/NotificationItem' },
              },
            },
            required: ['data'],
          },
        ],
      },
      NotificationSingleResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/NotificationItem' },
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
    '/auth/company/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a title company user',
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
            description: 'Company login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyLoginResponse' },
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
    '/auth/company/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated company session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Company session is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanySessionResponse' },
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
          '403': {
            description: 'Company role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/company/profile': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated company profile',
        security: [{ bearerAuth: [] }],
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
            description: 'Company profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanySessionResponse' },
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
    '/auth/company/password': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated company password',
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
            description: 'Company password updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/notary/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a notary user',
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
            description: 'Notary login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotaryLoginResponse' },
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
    '/auth/portal/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a company or notary user from the shared website login page',
        description:
          'Only active admin-created company and notary accounts with a stored password hash can authenticate. The response includes the role-specific dashboard redirect path.',
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
            description: 'Portal login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PortalLoginResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid email or password, inactive account, or account not created by admin',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/notary/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated notary session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notary session is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotarySessionResponse' },
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
          '403': {
            description: 'Notary role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/notary/profile': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated notary profile',
        security: [{ bearerAuth: [] }],
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
            description: 'Notary profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotarySessionResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/notary/password': {
      patch: {
        tags: ['Auth'],
        summary: 'Update the authenticated notary password',
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
            description: 'Notary password updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset verification code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Reset request accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify a password reset code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyOtpRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification code accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '400': {
            description: 'Invalid or expired verification code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset a password using a verified code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '400': {
            description: 'Invalid or expired verification code',
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
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders scoped to the authenticated role',
        description:
          'Admins receive dashboard row tuples for all orders. Company users receive only their company orders. Notaries receive only assigned orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'status',
            required: false,
            schema: { $ref: '#/components/schemas/OrderStatus' },
          },
          {
            in: 'query',
            name: 'search',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Orders fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderListResponse' },
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
        tags: ['Orders'],
        summary: 'Create an order as an admin or title company user',
        description: 'Notary users are not allowed to create orders. Company-created orders are automatically scoped to the caller.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
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
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Fetch one order detail by Mongo id or order number within caller scope',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        responses: {
          '200': {
            description: 'Order fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Orders'],
        summary: 'Update order details within caller scope',
        description:
          'Admins can update all order fields. Company users can update their own order details. Notaries can update only status and notary notes on assigned orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Delete an order as an admin',
        description: 'Only admins can delete orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        responses: {
          '200': {
            description: 'Order deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status within caller scope',
        description: 'Admins can update any order. Company users can update company-owned orders. Notaries can update assigned orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderStatusPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/assign-notary': {
      patch: {
        tags: ['Orders'],
        summary: 'Assign a notary to an order',
        description: 'Only admins can assign notaries.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderAssignNotaryPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order assignment updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/timeline': {
      get: {
        tags: ['Orders'],
        summary: 'List order timeline events',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', example: '#ORD-90212' },
          },
        ],
        responses: {
          '200': {
            description: 'Timeline fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderTimelineResponse' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List documents scoped to the authenticated role',
        description:
          'Admins receive dashboard tuple rows by default. Company and notary users receive portal document records scoped to owned or assigned orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'status',
            required: false,
            schema: { $ref: '#/components/schemas/DocumentStatus' },
          },
          {
            in: 'query',
            name: 'search',
            required: false,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'shape',
            required: false,
            schema: { type: 'string', enum: ['admin', 'portal', 'detail'] },
          },
        ],
        responses: {
          '200': {
            description: 'Documents fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentListResponse' },
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
        tags: ['Documents'],
        summary: 'Create document metadata and optionally return a signed S3 upload URL',
        description:
          'The database record is created even if S3 upload URL generation fails. Use requestUploadUrl=true when the frontend needs a direct upload URL.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DocumentPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document metadata created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentWriteResponse' },
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
          '403': {
            description: 'Role scope violation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Fetch one document within caller scope',
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
            description: 'Document fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Document not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete a document as an admin',
        description: 'The database delete completes even if S3 object cleanup fails; S3 cleanup failure is logged.',
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
            description: 'Document deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '404': {
            description: 'Document not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}/status': {
      patch: {
        tags: ['Documents'],
        summary: 'Review document status as an admin',
        description: 'Approved or verified documents are locked from non-admin version uploads.',
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
              schema: { $ref: '#/components/schemas/DocumentStatusPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Document status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}/versions': {
      get: {
        tags: ['Documents'],
        summary: 'List document versions within caller scope',
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
            description: 'Document versions fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentVersionListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Add a new document version and optionally return a signed S3 upload URL',
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
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DocumentVersionPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document version added',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentWriteResponse' },
              },
            },
          },
          '409': {
            description: 'Document is locked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}/restore-version': {
      post: {
        tags: ['Documents'],
        summary: 'Restore a previous document version as an admin',
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
              schema: { $ref: '#/components/schemas/RestoreDocumentVersionPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Document version restored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Admin role required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}/download-url': {
      get: {
        tags: ['Documents'],
        summary: 'Generate a temporary document download URL',
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
            description: 'Download URL generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSignedUrlResponse' },
              },
            },
          },
          '502': {
            description: 'S3 signed URL generation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/documents/{id}/preview-url': {
      get: {
        tags: ['Documents'],
        summary: 'Generate a temporary inline preview URL',
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
            description: 'Preview URL generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSignedUrlResponse' },
              },
            },
          },
          '502': {
            description: 'S3 signed URL generation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications scoped to the authenticated session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notifications fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationListResponse' },
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
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark one notification as read',
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
            description: 'Notification marked read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationSingleResponse' },
              },
            },
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications read for the authenticated session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All notifications marked read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
              },
            },
          },
        },
      },
    },
  },
} as const;
