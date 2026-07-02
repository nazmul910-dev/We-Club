import swaggerJSDoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'We-Club Updated API',
    version: '1.0.0',
    description:
      'API documentation for the We-Club backend — a real estate listing & referral commission platform. ' +
      'Use the "Authorize" button below and paste your JWT access token to call protected endpoints.',
    contact: {
      name: 'We-Club',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Base API (relative to current host)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Login, signup, and password management' },
    { name: 'Users', description: 'User listing & profile lookup' },
    { name: 'Admin', description: 'Admin-only user management actions' },
    { name: 'Listings', description: 'Property listings' },
    { name: 'Listing Promote Requests', description: 'Requests to promote a listing' },
    { name: 'Commission Ledger', description: 'Referral commission tracking' },
    { name: 'Listing Assets', description: 'Downloadable listing asset packages & logs' },
    { name: 'Payments', description: 'Stripe pricing, checkout & webhook' },
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
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' },
          errorDetails: { type: 'object', nullable: true },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          fullName: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: {
            type: 'string',
            enum: [
              'admin', 'manager', 'ceo', 'ceo_partner',
              'associate', 'partner', 'ambassador', 'we_club_member',
            ],
          },
          licenseNumber: { type: 'string', nullable: true },
          brokerage: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          profileImage: { type: 'string', nullable: true },
          paymentStatus: {
            type: 'string',
            enum: ['unpaid', 'paid', 'failed', 'refunded', 'expired'],
          },
          approvalStatus: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected'],
          },
          accountStatus: {
            type: 'string',
            enum: ['active', 'pending_payment', 'pending_approval', 'suspended', 'rejected'],
          },
          licenseVerificationStatus: {
            type: 'string',
            enum: ['pending', 'verified', 'rejected'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'role'],
        properties: {
          fullName: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'StrongPass123!' },
          role: {
            type: 'string',
            enum: [
              'admin', 'manager', 'ceo', 'ceo_partner',
              'associate', 'partner', 'ambassador', 'we_club_member',
            ],
          },
          phone: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          licenseNumber: { type: 'string', nullable: true },
          brokerage: { type: 'string', nullable: true },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'StrongPass123!' },
        },
      },
      AuthTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      ForgetPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string', format: 'password' },
        },
      },
      Location: {
        type: 'object',
        properties: {
          city: { type: 'string', example: 'Dhaka' },
          region: { type: 'string', example: 'Dhaka Division' },
          country: { type: 'string', example: 'Bangladesh' },
        },
      },
      Price: {
        type: 'object',
        properties: {
          amount: { type: 'number', example: 250000 },
          currency: { type: 'string', example: 'USD' },
        },
      },
      ReferralCommission: {
        type: 'object',
        properties: {
          offered_amount: { type: 'number', example: 5 },
          confirmed_amount: { type: 'number', nullable: true, example: 4.5 },
        },
      },
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', example: 'Modern 3BR Apartment in Gulshan' },
          ref_code: { type: 'string', example: 'WC-10234' },
          status: { type: 'string', enum: ['active', 'pending', 'sold', 'draft'] },
          location: { $ref: '#/components/schemas/Location' },
          price: { $ref: '#/components/schemas/Price' },
          bedrooms: { type: 'number', example: 3 },
          bathrooms: { type: 'number', example: 2 },
          area_sqm: { type: 'number', example: 145 },
          referral_commission: { $ref: '#/components/schemas/ReferralCommission' },
          cover_image: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          associate_id: { type: 'string' },
          promoters: { type: 'array', items: { type: 'string' } },
          is_deleted: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateListingRequest: {
        type: 'object',
        required: ['title', 'location', 'price', 'bedrooms', 'bathrooms', 'area_sqm'],
        properties: {
          title: { type: 'string', example: 'Modern 3BR Apartment in Gulshan' },
          location: {
            type: 'string',
            description: 'JSON string of Location object, e.g. {"city":"Dhaka","region":"Dhaka Division","country":"Bangladesh"}',
          },
          price: {
            type: 'string',
            description: 'JSON string of Price object, e.g. {"amount":250000,"currency":"USD"}',
          },
          referral_commission: {
            type: 'string',
            description: 'JSON string of ReferralCommission object, e.g. {"offered_amount":5}',
          },
          bedrooms: { type: 'number', example: 3 },
          bathrooms: { type: 'number', example: 2 },
          area_sqm: { type: 'number', example: 145 },
          cover_image: { type: 'string', format: 'binary' },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
        },
      },
      PromoteRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          listing_id: { type: 'string' },
          requester_id: { type: 'string' },
          proposed_commission_pct: { type: 'number', example: 4.5 },
          confirmed_commission_pct: { type: 'number', nullable: true },
          marketing_channels: { type: 'array', items: { type: 'string' } },
          message: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
          },
          requested_at: { type: 'string', format: 'date-time' },
          resolved_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CreatePromoteRequest: {
        type: 'object',
        required: ['listing_id', 'proposed_commission_pct'],
        properties: {
          listing_id: { type: 'string' },
          proposed_commission_pct: { type: 'number', example: 4.5 },
          marketing_channels: { type: 'array', items: { type: 'string' } },
          message: { type: 'string', nullable: true },
        },
      },
      ManagePromoteRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['approved', 'rejected'] },
          confirmed_commission_pct: { type: 'number', nullable: true },
          listing_id: { type: 'string' },
        },
      },
      CommissionLedger: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          listing_id: { type: 'string' },
          promotion_request_id: { type: 'string', nullable: true },
          listing_owner_id: { type: 'string' },
          promoter_id: { type: 'string' },
          created_by: { type: 'string' },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'paid', 'disputed', 'cancelled'],
          },
          currency: { type: 'string', example: 'USD' },
          listing_price_amount: { type: 'number' },
          commission_rate_percent: { type: 'number' },
          estimated_commission_amount: { type: 'number' },
          final_commission_amount: { type: 'number', nullable: true },
          deal_closed_at: { type: 'string', format: 'date-time', nullable: true },
          is_frozen: { type: 'boolean' },
          note: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateManualCommissionRequest: {
        type: 'object',
        required: ['listing_id', 'listing_owner_id', 'promoter_id', 'listing_price_amount', 'commission_rate_percent'],
        properties: {
          listing_id: { type: 'string' },
          promotion_request_id: { type: 'string', nullable: true },
          listing_owner_id: { type: 'string' },
          promoter_id: { type: 'string' },
          currency: { type: 'string', example: 'USD' },
          listing_price_amount: { type: 'number' },
          commission_rate_percent: { type: 'number' },
          note: { type: 'string', nullable: true },
        },
      },
      MarkPaidRequest: {
        type: 'object',
        properties: {
          payment_method: {
            type: 'string',
            enum: ['bank_transfer', 'stripe', 'helcim', 'cash', 'check', 'other'],
          },
          payment_reference: { type: 'string', nullable: true },
          note: { type: 'string', nullable: true },
        },
      },
      DisputeRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string', example: 'Amount does not match agreed rate' },
        },
      },
      ResolveDisputeRequest: {
        type: 'object',
        required: ['resolution_note'],
        properties: {
          resolution_note: { type: 'string' },
          final_commission_amount: { type: 'number', nullable: true },
        },
      },
      ApprovalStatusRequest: {
        type: 'object',
        required: ['approvalStatus'],
        properties: {
          approvalStatus: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          rejectedReason: { type: 'string', nullable: true },
        },
      },
      LicenseVerificationStatusRequest: {
        type: 'object',
        required: ['licenseVerificationStatus'],
        properties: {
          licenseVerificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
        },
      },
      AccountStatusRequest: {
        type: 'object',
        required: ['accountStatus'],
        properties: {
          accountStatus: {
            type: 'string',
            enum: ['active', 'pending_payment', 'pending_approval', 'suspended', 'rejected'],
          },
        },
      },
      PricingItem: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string', example: 'usd' },
          interval: { type: 'string', enum: ['month', 'year'] },
          formattedAmount: { type: 'string', example: '$49.00' },
          billingText: { type: 'string', example: '$49.00 / month' },
        },
      },
      RolePricingPlan: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          displayName: { type: 'string' },
          requiresPayment: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/PricingItem' } },
          totalFirstPayment: { type: 'number' },
          totalFirstPaymentFormatted: { type: 'string' },
        },
      },
      UpgradeCheckoutRequest: {
        type: 'object',
        required: ['targetRole'],
        properties: {
          targetRole: {
            type: 'string',
            enum: [
              'admin', 'manager', 'ceo', 'ceo_partner',
              'associate', 'partner', 'ambassador', 'we_club_member',
            ],
          },
        },
      },
      CheckoutSessionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              checkoutUrl: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_...' },
              sessionId: { type: 'string', example: 'cs_test_a1b2c3' },
            },
          },
        },
      },
      ListingAssetDownloadLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          listing_id: { type: 'string' },
          downloaded_by: { type: 'string' },
          ip_address: { type: 'string', nullable: true },
          user_agent: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options: swaggerJSDoc.Options = {
  definition,

  apis: [
    './src/modules/**/*.route.ts',
    './src/modules/**/*.docs.ts',
    './dist/modules/**/*.route.js',
    './dist/modules/**/*.docs.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
