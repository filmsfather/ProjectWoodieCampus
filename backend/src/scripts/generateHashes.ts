import bcrypt from 'bcryptjs';

async function generateHashes() {
  const passwords = ['admin123', 'teacher123', 'student123'];
  
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('---');
  }
}

generateHashes();