import request from 'supertest';
import app from '../src/app';
import mocks from '../src/util/interceptors';
import { getCountry } from '../src/controllers/country';

describe('Server', () => {
  test('Has a /api endpoint', () => {
    return request(app)
      .get('/api')
      .expect('Content-Type', /json/)
      .expect(200, { message: { hello: 'Hello World' } });
  });
});

describe('Auth endpoints', () => {
  test('Should return 400 status code for login without email in body', async () => {
    return request(app)
      .post('/api/v1/auth/login')
      .expect('Content-Type', /json/)
      .expect(400);
  });
  test('Should return 200 status code and token for valid login detail', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'johndoe@gmail.com' })
      .expect(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).not.toBeNull();
    expect(response.body.token.length).toBeGreaterThan(0);
  });
});

describe('Country endpoints', () => {
  test('Should return 401 unauthorized for unauthorized request', async () => {
    return await request(app).get('/api/v1/country/nigeria').expect(401);
  });

  test('Test GET Country API', async () => {
    const res = mocks.mockResponse();
    let req = mocks.mockRequest();
    req.params.country = 'nigeria';

    await getCountry(req, res);

    expect(res.status).toHaveBeenCalled();
    expect(req.params.country).toEqual('nigeria');
  });

  test('Test GET Country API invalid with AUTH token', async () => {
    const response = await request(app)
      .get('/api/v1/country/nigeria')
      .set('Content-Type', 'application/json')
      .set(
        'Authorization',
        `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5kb2VAZ21haWwuY29tIiwiaWF0IjoxNjA4NTk0NjQwLCJleHAiOjE2MDg2ODEwNDB9.UAWr9jDzKsBOQZauKDsGxbhLEFs0BfnCwZTmOc2fgR2`,
      )
      .expect(401);
    expect(response.body.message).toBe('Invalid token');
  });
});
