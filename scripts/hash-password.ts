import { hash } from 'bcryptjs';

async function main() {
  const password = 'demo123';
  const hashedPassword = await hash(password, 10);
  console.log('Bcrypt hash for "demo123":');
  console.log(hashedPassword);
}

main();
