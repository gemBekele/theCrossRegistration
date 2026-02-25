import bcrypt from 'bcryptjs';
import { pool } from './config/database';

async function seedAdmin() {
  try {
    const username = 'admin';
    const password = 'admin123';
    const role = 'super_admin';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existing.rows.length > 0) {
      console.log('Admin user already exists, updating password...');
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [passwordHash, username]
      );
    } else {
      console.log('Creating admin user...');
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, passwordHash, role]
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