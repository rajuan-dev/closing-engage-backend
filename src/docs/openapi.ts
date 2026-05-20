import { env } from '../config/env';
import { generatedOpenApiModules } from './generated-modules';

const apiBaseUrl = `http://localhost:${env.PORT}${env.API_PREFIX}`;
const generatedTags = generatedOpenApiModules.map((moduleDoc) => moduleDoc.tag);
const generatedPaths = Object.assign({}, ...generatedOpenApiModules.map((moduleDoc) => moduleDoc.paths));

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
    { name: 'Analytics', description: 'Admin-only operational analytics and trend endpoints' },
    { name: 'Dashboard', description: 'Admin-only dashboard overview metrics and trend endpoints' },
    { name: 'Search', description: 'Admin-only global dashboard search endpoints' },
    { name: 'Communications', description: 'Order-scoped real-time admin and assigned-notary messaging endpoints' },
    ...generatedTags,
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
          avatarUrl: { type: 'string', example: 'data:image/jpeg;base64,...' },
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
          id: { type: 'string', example: '682afc5f8d249f890fad3311' },
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
          companyId: { type: 'string', example: '682afc5f8d249f890fad5501' },
          permissions: {
            type: 'object',
            properties: {
              createOrders: { type: 'boolean', example: true },
              viewOrders: { type: 'boolean', example: true },
              downloadDocuments: { type: 'boolean', example: false },
            },
            required: ['createOrders', 'viewOrders', 'downloadDocuments'],
          },
        },
        required: ['id', 'name', 'email', 'role', 'status', 'joinedDate', 'companyId', 'permissions'],
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
          permissions: {
            type: 'object',
            properties: {
              createOrders: { type: 'boolean', example: true },
              viewOrders: { type: 'boolean', example: true },
              downloadDocuments: { type: 'boolean', example: false },
            },
          },
          sendInvite: { type: 'boolean', example: true },
        },
        required: ['name', 'email'],
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
      TeamInviteResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  member: { $ref: '#/components/schemas/TeamMember' },
                  temporaryPassword: { type: 'string', example: 'rv4Y7dDfKPY3' },
                  inviteDelivered: { type: 'boolean', example: true },
                },
                required: ['member', 'temporaryPassword', 'inviteDelivered'],
              },
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
          fileName: { type: 'string', example: 'Closing_Package.pdf' },
          meta: { type: 'string', example: '4.2 MB • Uploaded 2h ago' },
          size: { type: 'string', example: '4.2 MB' },
          fileSize: { type: 'number', example: 4404019 },
          mimeType: { type: 'string', example: 'application/pdf' },
        },
        description:
          'Document metadata submitted with an order. Use either name or fileName. Binary upload can be handled separately through document upload URLs.',
      },
      OrderPayload: {
        type: 'object',
        properties: {
          title: { type: 'string', example: '452 Oak Street Refinance' },
          titleCompany: { type: 'string', example: 'Grand Peak Title' },
          companyId: { type: 'string', example: '682afc5f8d249f890fad5501' },
          clientName: { type: 'string', example: 'Daniel Brooks' },
          propertyAddress: { type: 'string', example: '452 Pine St, San Francisco, CA 94104' },
          address: { type: 'string', example: '452 Pine St' },
          city: { type: 'string', example: 'San Francisco' },
          state: { type: 'string', example: 'CA' },
          zip: { type: 'string', example: '94104' },
          signerName: { type: 'string', example: 'Daniel Brooks' },
          signerPhone: { type: 'string', example: '(555) 401-8291' },
          signingDate: { type: 'string', example: '10/24/2024' },
          signingTime: { type: 'string', example: '2:00 PM' },
          date: { type: 'string', example: 'Mar 20, 2026' },
          loanType: { type: 'string', enum: ['Refinance', 'Purchase', 'HELOC', 'Other'], example: 'Refinance' },
          scanbacksRequired: { type: 'boolean', example: true },
          scanbacks: { type: 'string', example: 'Yes' },
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
          preferredNotary: { type: 'string', example: 'Sarah Jenkins' },
          instructions: { type: 'string', example: 'Please ensure all signatures are in blue ink.' },
          specialInstructions: { type: 'string', example: 'Signer prefers blue ink and evening availability.' },
          notaryNotes: { type: 'string', example: 'Borrower requested evening signing.' },
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderDocumentPayload' },
          },
        },
        description:
          'Accepts both admin dashboard fields and company portal fields. propertyAddress may be sent directly, or built from address/city/state/zip. signingDate may also be sent as date. signingTime defaults to TBD when omitted.',
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
          preferredNotaryName: { type: 'string', example: 'Sarah Jenkins' },
          meeting: {
            oneOf: [{ $ref: '#/components/schemas/OrderMeeting' }, { type: 'null' }],
          },
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
          preferredNotaryName: { type: 'string', example: 'Sarah Jenkins' },
          assignedNotaryName: { type: 'string', example: 'Sarah Jenkins' },
          assignedNotaryId: { type: 'string', example: '682afc5f8d249f890fad6601' },
          specialInstructions: { type: 'string', example: 'Please ensure blue ink signatures.' },
          notaryNotes: { type: 'string', example: 'Signing completed without exceptions.' },
          meeting: {
            oneOf: [{ $ref: '#/components/schemas/OrderMeeting' }, { type: 'null' }],
          },
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
          notaryEmail: { type: 'string', format: 'email', example: 'sarah.jenkins@example.com' },
        },
        required: ['notaryName'],
      },
      OrderMeeting: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['scheduled', 'confirmed'], example: 'scheduled' },
          date: { type: 'string', example: 'May 31, 2026' },
          time: { type: 'string', example: '9:30 AM' },
          scheduledByRole: { type: 'string', enum: ['admin', 'company', 'notary'], example: 'notary' },
          scheduledAt: { type: 'string', format: 'date-time' },
          confirmedByRole: { type: 'string', enum: ['admin', 'company', 'notary'], nullable: true, example: 'company' },
          confirmedAt: { type: 'string', format: 'date-time', nullable: true },
        },
        required: ['status', 'date', 'time', 'scheduledByRole', 'scheduledAt'],
      },
      OrderMeetingPayload: {
        type: 'object',
        properties: {
          signingDate: { type: 'string', example: 'May 31, 2026' },
          signingTime: { type: 'string', example: '9:30 AM' },
        },
        required: ['signingDate', 'signingTime'],
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
          status: { type: 'string', enum: ['Approved', 'Submitted', 'Pending', 'Verified', 'Rejected'], example: 'Pending' },
          uploadedBy: { type: 'string', example: 'Northway Holdings' },
          uploaderRole: { type: 'string', enum: ['admin', 'company', 'notary', 'buyer', 'title-company'], example: 'notary' },
        },
        required: ['id', 'name', 'orderId', 'uploadDate', 'size', 'status', 'uploaderRole'],
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
          displayStatus: { type: 'string', enum: ['Approved', 'Submitted', 'Pending', 'Verified', 'Rejected'], example: 'Pending' },
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
      DashboardOverviewResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  generatedAt: { type: 'string', format: 'date-time' },
                  trendPeriod: { type: 'string', enum: ['7d', '30d', '90d'], example: '30d' },
                  metrics: {
                    type: 'object',
                    properties: {
                      totalCompanies: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 142 },
                          note: { type: 'string', example: '+12%' },
                        },
                        required: ['value'],
                      },
                      totalNotaries: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 1208 },
                          note: { type: 'string', example: '+4%' },
                        },
                        required: ['value'],
                      },
                      totalOrders: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 8492 },
                        },
                        required: ['value'],
                      },
                      pendingApprovalOrders: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 28 },
                          note: { type: 'string', example: 'Alert' },
                        },
                        required: ['value'],
                      },
                      completedOrders: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 7814 },
                          note: { type: 'string', example: '92%' },
                        },
                        required: ['value'],
                      },
                    },
                    required: ['totalCompanies', 'totalNotaries', 'totalOrders', 'pendingApprovalOrders', 'completedOrders'],
                  },
                  activeUsersTrend: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', example: 'Week 1' },
                        value: { type: 'integer', example: 820 },
                      },
                      required: ['label', 'value'],
                    },
                  },
                  quickActions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string', example: 'assign-orders' },
                        title: { type: 'string', example: 'Assign Orders' },
                        description: { type: 'string', example: 'Route 12 unassigned files to available notaries' },
                        tone: { type: 'string', example: 'slate' },
                      },
                      required: ['key', 'title', 'description', 'tone'],
                    },
                  },
                  comparisonWindow: {
                    type: 'object',
                    properties: {
                      currentStart: { type: 'string', format: 'date-time' },
                      currentEnd: { type: 'string', format: 'date-time' },
                      previousStart: { type: 'string', format: 'date-time' },
                      previousEnd: { type: 'string', format: 'date-time' },
                    },
                    required: ['currentStart', 'currentEnd', 'previousStart', 'previousEnd'],
                  },
                },
                required: ['generatedAt', 'trendPeriod', 'metrics', 'activeUsersTrend', 'quickActions', 'comparisonWindow'],
              },
            },
            required: ['data'],
          },
        ],
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad2230' },
          title: { type: 'string', example: '#ORD-85856' },
          subtitle: { type: 'string', example: 'Grand Peak Title · Sarah Jenkins' },
          type: { type: 'string', enum: ['order', 'notary', 'document', 'company'], example: 'order' },
        },
        required: ['id', 'title', 'subtitle', 'type'],
      },
      SearchResultsResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/SearchResult' },
              },
            },
            required: ['data'],
          },
        ],
      },
      AnalyticsOverviewResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  range: { type: 'string', enum: ['today', '7d', '30d', '90d', 'custom'], example: '30d' },
                  generatedAt: { type: 'string', format: 'date-time' },
                  filters: {
                    type: 'object',
                    properties: {
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time' },
                    },
                    required: ['startDate', 'endDate'],
                  },
                  metrics: {
                    type: 'object',
                    properties: {
                      totalOrders: {
                        type: 'object',
                        properties: {
                          value: { type: 'integer', example: 2482 },
                          note: { type: 'string', example: '+12%' },
                        },
                        required: ['value'],
                      },
                      completedOrders: { type: 'integer', example: 1845 },
                      pendingOrders: { type: 'integer', example: 485 },
                      activeNotaries: { type: 'integer', example: 124 },
                      titleCompanies: { type: 'integer', example: 86 },
                    },
                    required: ['totalOrders', 'completedOrders', 'pendingOrders', 'activeNotaries', 'titleCompanies'],
                  },
                  ordersByStatus: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', example: 'Completed' },
                        shortLabel: { type: 'string', example: 'Completed' },
                        value: { type: 'integer', example: 1845 },
                      },
                      required: ['label', 'shortLabel', 'value'],
                    },
                  },
                  ordersTrend: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string', example: 'Wk 1' },
                        value: { type: 'integer', example: 420 },
                      },
                      required: ['label', 'value'],
                    },
                  },
                  topNotaries: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '682afc5f8d249f890fad2230' },
                        initials: { type: 'string', example: 'SC' },
                        name: { type: 'string', example: 'Sarah Connor' },
                        completedOrders: { type: 'integer', example: 142 },
                      },
                      required: ['id', 'initials', 'name', 'completedOrders'],
                    },
                  },
                  topCompanies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '682afc5f8d249f890fad2210' },
                        name: { type: 'string', example: 'First American Title' },
                        subtitle: { type: 'string', example: '412 orders in selected range' },
                        orderCount: { type: 'integer', example: 412 },
                      },
                      required: ['id', 'name', 'subtitle', 'orderCount'],
                    },
                  },
                },
                required: ['range', 'generatedAt', 'filters', 'metrics', 'ordersByStatus', 'ordersTrend', 'topNotaries', 'topCompanies'],
              },
            },
            required: ['data'],
          },
        ],
      },
      CommunicationThread: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad2221' },
          orderNumber: { type: 'string', example: '#ORD-85856' },
          companyId: { type: 'string', example: '682afc5f8d249f890fad2210' },
          notaryId: { type: 'string', example: '682afc5f8d249f890fad2230' },
          lastMessage: { type: 'string', example: 'Please review the corrected scanback.' },
          lastMessageAt: { type: 'string', format: 'date-time' },
          lastSenderRole: { type: 'string', enum: ['admin', 'notary', ''], example: 'notary' },
          unreadCount: { type: 'integer', minimum: 0, example: 2 },
        },
        required: ['id', 'orderNumber', 'companyId', 'notaryId', 'lastMessage', 'lastMessageAt', 'lastSenderRole', 'unreadCount'],
      },
      CommunicationMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '682afc5f8d249f890fad2222' },
          threadId: { type: 'string', example: '682afc5f8d249f890fad2221' },
          orderNumber: { type: 'string', example: '#ORD-85856' },
          senderId: { type: 'string', example: '682afc5f8d249f890fad2230' },
          senderRole: { type: 'string', enum: ['admin', 'notary'], example: 'notary' },
          senderName: { type: 'string', example: 'notary 1' },
          body: { type: 'string', example: 'Scanbacks are uploaded and ready for review.' },
          createdAt: { type: 'string', format: 'date-time' },
          time: { type: 'string', example: 'May 20, 11:30 AM' },
          readByAdmin: { type: 'boolean', example: false },
          readByNotary: { type: 'boolean', example: true },
        },
        required: [
          'id',
          'threadId',
          'orderNumber',
          'senderId',
          'senderRole',
          'senderName',
          'body',
          'createdAt',
          'time',
          'readByAdmin',
          'readByNotary',
        ],
      },
      CommunicationConversation: {
        type: 'object',
        properties: {
          thread: { $ref: '#/components/schemas/CommunicationThread' },
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/CommunicationMessage' },
          },
        },
        required: ['thread', 'messages'],
      },
      CommunicationMessageRequest: {
        type: 'object',
        properties: {
          body: { type: 'string', minLength: 1, maxLength: 4000, example: 'Can you confirm page 4 was corrected?' },
        },
        required: ['body'],
      },
      CommunicationThreadListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/CommunicationThread' },
              },
            },
            required: ['data'],
          },
        ],
      },
      CommunicationThreadResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CommunicationThread' },
            },
            required: ['data'],
          },
        ],
      },
      CommunicationConversationResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CommunicationConversation' },
            },
            required: ['data'],
          },
        ],
      },
      CommunicationMessageResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessEnvelope' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  thread: { $ref: '#/components/schemas/CommunicationThread' },
                  message: { $ref: '#/components/schemas/CommunicationMessage' },
                },
                required: ['thread', 'message'],
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
        summary: 'List team members for the authenticated company workspace',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Team members fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TeamListResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid or missing company token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Authenticated team member is not allowed to manage team members',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Team'],
        summary: 'Invite a new company team member with portal permissions',
        security: [{ bearerAuth: [] }],
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
            description: 'Team member created and temporary login password generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TeamInviteResponse' },
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
          '409': {
            description: 'A team member with this email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Authenticated team member is not allowed to manage team members',
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
        security: [{ bearerAuth: [] }],
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
          '403': {
            description: 'Authenticated team member is not allowed to manage team members',
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
        security: [{ bearerAuth: [] }],
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
          '403': {
            description: 'Authenticated team member is not allowed to manage team members',
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
        description:
          'Notary users are not allowed to create orders. Company-created orders are automatically scoped to the caller, notify admins, and create document metadata records for submitted document entries.',
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
          '403': {
            description: 'Company member lacks create order permission or notary attempted to create an order',
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
          'Admins can update all order fields. Company users can update their own order details. Notaries can update status, notary notes, signing date, and signing time on assigned orders.',
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
        description: 'Admins can update any order. Company users are blocked from direct status changes. Notaries should use the dedicated /orders/{id}/notary-status endpoint.',
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
          '403': {
            description: 'Company users cannot update order status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/notary-status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status as the assigned notary',
        description:
          'Only authenticated notaries can call this endpoint, and only for orders assigned to their account.',
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
            description: 'Notary order status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Notary role required or order is outside notary assignment scope',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
        description:
          'Only admins can assign notaries. The API accepts a notary id, email, or display name; when a real notary account is resolved, the assigned order becomes visible in that notary dashboard scope.',
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
    '/orders/{id}/printed-confirmation': {
      patch: {
        tags: ['Orders'],
        summary: 'Confirm printed documents as the assigned notary',
        description:
          'Only the assigned notary can confirm that documents were printed. The endpoint updates the order timeline and triggers notifications without requiring a request body.',
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
            description: 'Printed documents confirmed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Only notaries can confirm printed documents',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    '/orders/{id}/meeting': {
      patch: {
        tags: ['Orders'],
        summary: 'Schedule or reschedule a closing meeting',
        description:
          'Admins and notaries can schedule the closing meeting for an order. The endpoint persists meeting state, updates the order timeline, and sends notifications to the company and admins.',
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
              schema: { $ref: '#/components/schemas/OrderMeetingPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Meeting scheduled successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Company users cannot schedule meetings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    '/orders/{id}/meeting/confirm': {
      patch: {
        tags: ['Orders'],
        summary: 'Confirm a scheduled closing meeting',
        description:
          'Company users and admins can confirm a previously scheduled meeting. The endpoint updates the meeting status, appends a timeline event, and notifies the assigned notary and admins.',
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
            description: 'Meeting confirmed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderSingleResponse' },
              },
            },
          },
          '400': {
            description: 'No scheduled meeting exists for this order',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Only company users or admins can confirm meetings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    '/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload a binary document body directly',
        description:
          'Uploads a raw file body and immediately creates the document record. The binary payload is read from the request body, while metadata such as orderNumber and fileName is passed through query parameters.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'orderId',
            required: false,
            schema: { type: 'string', example: '#ORD-882190' },
          },
          {
            in: 'query',
            name: 'orderNumber',
            required: false,
            schema: { type: 'string', example: '#ORD-882190' },
          },
          {
            in: 'query',
            name: 'fileName',
            required: true,
            schema: { type: 'string', example: 'scanback_signed_final.pdf' },
          },
          {
            in: 'query',
            name: 'fileSize',
            required: false,
            schema: { type: 'number', example: 4404019 },
          },
          {
            in: 'query',
            name: 'size',
            required: false,
            schema: { type: 'string', example: '4.2 MB' },
          },
          {
            in: 'query',
            name: 'mimeType',
            required: false,
            schema: { type: 'string', example: 'application/pdf' },
          },
          {
            in: 'query',
            name: 'uploadedByName',
            required: false,
            schema: { type: 'string', example: 'Sarah Miller' },
          },
          {
            in: 'query',
            name: 'uploaderRole',
            required: false,
            schema: { type: 'string', enum: ['admin', 'company', 'notary', 'buyer', 'title-company'], example: 'notary' },
          },
          {
            in: 'query',
            name: 'status',
            required: false,
            schema: { $ref: '#/components/schemas/DocumentStatus' },
          },
          {
            in: 'query',
            name: 'comments',
            required: false,
            schema: { type: 'string', example: 'Uploaded from notary scanback flow.' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/pdf': {
              schema: { type: 'string', format: 'binary' },
            },
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSingleResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed or binary body missing',
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
    '/documents/{id}/resubmit': {
      post: {
        tags: ['Documents'],
        summary: 'Resubmit a rejected scanback as the original notary uploader',
        description:
          'Only notaries can resubmit their own rejected scanback documents. The document status becomes Submitted again and the parent order returns to Under Review.',
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
            description: 'Document resubmitted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentSingleResponse' },
              },
            },
          },
          '403': {
            description: 'Only notaries can resubmit their own scanbacks',
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
          '409': {
            description: 'Only rejected scanbacks can be resubmitted',
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
    '/documents/{id}/content': {
      get: {
        tags: ['Documents'],
        summary: 'Stream document content for inline preview or download',
        description:
          'Returns the stored file bytes directly. Use mode=preview for inline viewing or mode=download for attachment delivery.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'mode',
            required: false,
            schema: { type: 'string', enum: ['preview', 'download'], example: 'preview' },
          },
        ],
        responses: {
          '200': {
            description: 'Binary document content',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '404': {
            description: 'Stored document file was not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '502': {
            description: 'Secure document retrieval failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/communications/threads': {
      get: {
        tags: ['Communications'],
        summary: 'List order chat threads for the authenticated admin or notary',
        description:
          'Admins receive all order chat threads. Notaries receive only threads for orders assigned to them. Company users are not allowed to use this admin-notary channel.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Communication threads fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommunicationThreadListResponse' },
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
            description: 'Role is not allowed to use order chat',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/communications/orders/{orderNumber}/thread': {
      get: {
        tags: ['Communications'],
        summary: 'Get or create the chat thread for one order',
        description:
          'Creates a single persistent order-scoped thread if it does not already exist. Notary access is limited to assigned orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'orderNumber',
            required: true,
            schema: { type: 'string' },
            example: '#ORD-85856',
          },
        ],
        responses: {
          '200': {
            description: 'Communication thread fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommunicationThreadResponse' },
              },
            },
          },
          '403': {
            description: 'Order is outside the notary assignment scope or role is not allowed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    '/communications/orders/{orderNumber}/messages': {
      get: {
        tags: ['Communications'],
        summary: 'Fetch message history for one order chat',
        description:
          'Returns the thread and chronological messages. Fetching marks messages as read for the authenticated role.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'orderNumber',
            required: true,
            schema: { type: 'string' },
            example: '#ORD-85856',
          },
        ],
        responses: {
          '200': {
            description: 'Communication messages fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommunicationConversationResponse' },
              },
            },
          },
          '403': {
            description: 'Order is outside the notary assignment scope or role is not allowed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
      post: {
        tags: ['Communications'],
        summary: 'Send a message in one order chat',
        description:
          'Persists a message, updates thread metadata, sends an in-app notification to the opposite side, and emits the message to connected Socket.IO clients in the order thread room.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'orderNumber',
            required: true,
            schema: { type: 'string' },
            example: '#ORD-85856',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommunicationMessageRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Communication message sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommunicationMessageResponse' },
              },
            },
          },
          '400': {
            description: 'Message body is empty or too long',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
          '403': {
            description: 'Order is outside the notary assignment scope or role is not allowed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    '/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Fetch admin analytics for the selected reporting range',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'range',
            schema: { type: 'string', enum: ['today', '7d', '30d', '90d', 'custom'], default: '30d' },
          },
          {
            in: 'query',
            name: 'startDate',
            schema: { type: 'string', format: 'date', example: '2026-05-01' },
            description: 'Required when range is custom',
          },
          {
            in: 'query',
            name: 'endDate',
            schema: { type: 'string', format: 'date', example: '2026-05-20' },
            description: 'Required when range is custom',
          },
        ],
        responses: {
          '200': {
            description: 'Analytics overview fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalyticsOverviewResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid custom date range',
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
          '403': {
            description: 'Admin role is required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/dashboard/overview': {
      get: {
        tags: ['Dashboard'],
        summary: 'Fetch admin dashboard overview metrics and activity trend',
        description:
          'Returns the live admin dashboard payload used by the analytics cards, active user trend chart, quick actions, and comparison window metadata.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'period',
            schema: { type: 'string', enum: ['7d', '30d', '90d'], default: '30d' },
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard overview fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardOverviewResponse' },
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
            description: 'Admin role is required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Run admin global search across orders, companies, notaries, and documents',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'q',
            schema: { type: 'string', example: 'Sarah' },
            description: 'Search query. Empty values return an empty array.',
          },
        ],
        responses: {
          '200': {
            description: 'Search results fetched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchResultsResponse' },
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
            description: 'Admin role is required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' },
              },
            },
          },
        },
      },
    },
    ...generatedPaths,
  },
} as const;
