import bcrypt from 'bcryptjs';

async function testPassword() {
  const plainPassword = 'admin123';
  const sampleHash = '$2a$10$rZ3j8nX2fGqM.5xVpR3bF.UuFz3vTwcbqY9x5yUqY7nCxwZzKqE8e';
  
  console.log('Testing password:', plainPassword);
  console.log('Sample hash:', sampleHash);
  
  const isValid = await bcrypt.compare(plainPassword, sampleHash);
  console.log('Password matches sample hash:', isValid);
  
  // Generate new hash for comparison
  const newHash = await bcrypt.hash(plainPassword, 12);
  console.log('New hash generated:', newHash);
  
  const newHashValid = await bcrypt.compare(plainPassword, newHash);
  console.log('New hash validates:', newHashValid);
}

testPassword();