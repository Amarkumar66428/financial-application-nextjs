// Single hard-coded user for the demo. A real app would look this up in a DB
// and compare a password hash.

const MOCK_USER = {
  id: "user_001",
  email: "test@finapp.com",
  password: "123456",
};

export function authenticate(email: string, password: string): { id: string } | null {
  if (email.toLowerCase() === MOCK_USER.email && password === MOCK_USER.password) {
    return { id: MOCK_USER.id };
  }
  return null;
}
