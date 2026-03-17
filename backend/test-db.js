// Test PostgreSQL Database Connection
import 'dotenv/config';
import { initDatabase, query, getClient, closePool } from './db.js';

async function testDatabase() {
  console.log('🔍 Testing PostgreSQL Connection...\n');

  try {
    // Test 1: Initialize connection
    console.log('Test 1: Initializing database connection...');
    const connected = await initDatabase();
    if (!connected) {
      throw new Error('Failed to initialize database connection');
    }
    console.log('✓ Connection initialized\n');

    // Test 2: Simple query
    console.log('Test 2: Running simple query...');
    const result = await query('SELECT NOW(), version()');
    console.log('✓ Query result:', {
      time: result.rows[0].now,
      version: result.rows[0].version.substring(0, 50) + '...'
    });
    console.log();

    // Test 3: Check tables
    console.log('Test 3: Checking database tables...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✓ Tables found:', tables.rows.map(r => r.table_name));
    console.log();

    // Test 4: Check users table
    console.log('Test 4: Querying users table...');
    const users = await query('SELECT COUNT(*) as count FROM users');
    console.log('✓ Users count:', users.rows[0].count);
    console.log();

    // Test 5: Insert and query a test user
    console.log('Test 5: Inserting test user...');
    const insertResult = await query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      ['test@example.com', 'Test User']
    );
    console.log('✓ User inserted:', insertResult.rows[0]);
    console.log();

    // Test 6: Query the test user
    console.log('Test 6: Querying test user...');
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    console.log('✓ User found:', userResult.rows[0]);
    console.log();

    // Test 7: Transaction test
    console.log('Test 7: Testing transaction...');
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO users (email, name) VALUES ($1, $2)',
        ['test2@example.com', 'Test User 2']
      );
      await client.query('COMMIT');
      console.log('✓ Transaction committed');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    console.log();

    // Test 8: Clean up test data
    console.log('Test 8: Cleaning up test data...');
    await query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    console.log('✓ Test data cleaned up');
    console.log();

    // Test 9: Check extensions
    console.log('Test 9: Checking installed extensions...');
    const extensions = await query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `);
    console.log('✓ Extensions installed:', extensions.rows);
    console.log();

    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await closePool();
  }
}

// Run the tests
testDatabase();
