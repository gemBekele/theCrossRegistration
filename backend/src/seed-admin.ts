import bcrypt from 'bcryptjs';
import { pool } from './config/database';

async function seedAdmin() {
  try {
    const username = 'admin';
    const email = 'admin@thecross.org';
    const password = 'admin123';
    const role = 'super_admin';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existing.rows.length > 0) {
      console.log('Admin user already exists, updating password and email...');
      await pool.query(
        'UPDATE users SET password_hash = $1, email = $2 WHERE username = $3',
        [passwordHash, email, username]
      );
    } else {
      console.log('Creating admin user...');
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [username, email, passwordHash, role]
      );
    }

    console.log('✅ Admin user created/updated successfully!');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

seedAdmin();