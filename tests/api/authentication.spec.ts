import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

type AuthenticationError = {
  error: string;
};

test.describe('Authentication API', () => {
  test('@regression rejects incorrect credentials', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBe(401);
    expect(response.headers()['content-type']).toContain(
      'application/json',
    );

    const body =
      (await response.json()) as AuthenticationError;

    expect(body).toEqual({
      error: 'Invalid credentials',
    });
  });
});
