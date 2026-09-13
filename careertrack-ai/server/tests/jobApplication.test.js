const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');

const app = createApp(null);

async function registerAndLogin(email) {
  const password = 'Password123';
  await request(app).post('/api/auth/register').send({ name: 'User', email, password });
  await User.findOneAndUpdate({ email }, { isEmailVerified: true });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.data.accessToken;
}

describe('Job Application API', () => {
  it('creates and lists a job application for the authenticated user', async () => {
    const token = await registerAndLogin('owner@example.com');

    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyName: 'Acme', jobTitle: 'Backend Engineer' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.application.companyName).toBe('Acme');

    const listRes = await request(app).get('/api/jobs').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.applications).toHaveLength(1);
  });

  it('rejects application creation without required fields', async () => {
    const token = await registerAndLogin('validation@example.com');
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyName: '' });
    expect(res.status).toBe(400);
  });

  it('prevents a user from accessing another user\'s application', async () => {
    const tokenA = await registerAndLogin('userA@example.com');
    const tokenB = await registerAndLogin('userB@example.com');

    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ companyName: 'Acme', jobTitle: 'Backend Engineer' });

    const appId = createRes.body.data.application._id;

    const getRes = await request(app)
      .get(`/api/jobs/${appId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(getRes.status).toBe(404);
  });

  it('updates application status and records activity', async () => {
    const token = await registerAndLogin('status@example.com');
    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyName: 'Acme', jobTitle: 'Backend Engineer' });
    const appId = createRes.body.data.application._id;

    const statusRes = await request(app)
      .patch(`/api/jobs/${appId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Applied' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.application.status).toBe('Applied');

    const detailsRes = await request(app)
      .get(`/api/jobs/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detailsRes.body.data.activity.length).toBeGreaterThanOrEqual(2);
  });
});
