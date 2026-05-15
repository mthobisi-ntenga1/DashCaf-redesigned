import * as bcrypt from 'bcrypt';

async function hashPassword() {
  const password = 'admin123'; // the password you want
  const saltRounds = 10;

  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password:', hash);
}

hashPassword();