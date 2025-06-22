const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { version } = require('../../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HighPay API',
      version,
      description: 'Comprehensive payroll management system API',
      contact: {
        name: 'HighPay Support',
        email: 'support@highpay.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.highpay.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'employee'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'User active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            }
          }
        },
        TimePunch: {
          type: 'object',
          required: ['userId', 'type'],
          properties: {
            id: {
              type: 'integer',
              description: 'Time punch ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID'
            },
            type: {
              type: 'string',
              enum: ['clock_in', 'clock_out', 'break_start', 'break_end'],
              description: 'Punch type'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Punch timestamp'
            },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                address: { type: 'string' }
              }
            },
            notes: {
              type: 'string',
              description: 'Optional notes'
            }
          }
        },
        PayStub: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Pay stub ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID'
            },
            payrollId: {
              type: 'integer',
              description: 'Payroll ID'
            },
            payPeriodStart: {
              type: 'string',
              format: 'date',
              description: 'Pay period start date'
            },
            payPeriodEnd: {
              type: 'string',
              format: 'date',
              description: 'Pay period end date'
            },
            grossPay: {
              type: 'number',
              format: 'decimal',
              description: 'Gross pay amount'
            },
            netPay: {
              type: 'number',
              format: 'decimal',
              description: 'Net pay amount'
            },
            deductions: {
              type: 'object',
              description: 'Deduction breakdown'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
    `,
    customSiteTitle: 'HighPay API Documentation'
  }),
  specs
};
