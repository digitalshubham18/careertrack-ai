const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');

const app = createApp(null);

async function markVerified(email) {
  await User.findOneAndUpdate({ email }, { isEmailVerified: true });
}

describe('Auth API', () => {
  const testUser = { name: 'Test User', email: 'test@example.com', password: 'Password123' };

  it('registers a new user but does not issue tokens (unverified)', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeUndefined();

    const user = await User.findOne({ email: testUser.email });
    expect(user.isEmailVerified).toBe(false);
  });

  it('rejects registration with a disposable email domain', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Fake', email: 'fake@mailinator.com', password: 'Password123' });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('blocks login for an unverified account with EMAIL_NOT_VERIFIED', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('rejects verification with an incorrect code', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: testUser.email, otp: '000000' });
    expect(res.status).toBe(400);
  });

  it('rejects verification for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'nobody@example.com', otp: '123456' });
    expect(res.status).toBe(400);
  });

  it('verifies and logs in with the correct OTP end-to-end', async () => {
    const emailService = require('../src/services/email.service');
    const originalSendMail = emailService.sendMail;
    let capturedCode = null;
    emailService.sendMail = async (opts) => {
      const match = opts.text.match(/code is: (\d{6})/);
      if (match) capturedCode = match[1];
      return { delivered: false };
    };

    try {
      await request(app).post('/api/auth/register').send(testUser);
      expect(capturedCode).toMatch(/^\d{6}$/);

      const wrongRes = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: testUser.email, otp: '000000' });
      expect(wrongRes.status).toBe(400);

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: testUser.email, otp: capturedCode });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();

      const user = await User.findOne({ email: testUser.email });
      expect(user.isEmailVerified).toBe(true);
    } finally {
      emailService.sendMail = originalSendMail;
    }
  });

  it('logs in successfully once verified', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    await markVerified(testUser.email);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    await markVerified(testUser.email);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  it('blocks access to /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    await markVerified(testUser.email);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const token = loginRes.body.data.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });
});
