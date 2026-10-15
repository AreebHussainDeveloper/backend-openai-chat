export class User {
  id: string;
  email: string;
  fullName: string;
  password: string;
  role: 'USER' | 'ADMIN';
}
