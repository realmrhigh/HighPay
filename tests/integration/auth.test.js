const request = require('supertest');
const app = require('../../index');
const { connectDatabase, closeDatabase } = require('../config/database');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        jobRoleId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        jobRoleId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        firstName: 'Jane',
        lastName: 'Doe',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        jobRoleId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        email: 'login-test@example.com',
        password: 'Test123!@#',
        firstName: 'Login',
        lastName: 'Test',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        jobRoleId: '123e4567-e89b-12d3-a456-426614174001'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Then try to login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Register and login to get a token
      const userData = {
        email: 'profile-test@example.com',
        password: 'Test123!@#',
        firstName: 'Profile',
        lastName: 'Test',
        companyId: '123e4567-e89b-12d3-a456-426614174000',
        jobRoleId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
