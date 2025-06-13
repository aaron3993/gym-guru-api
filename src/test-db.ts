import { getDb } from './database/db';
import { users } from './schema';

async function testDbConnection() {
  try {
    const db = await getDb();
    
    // Test insert
    const newUser = await db.insert(users).values({
      email: 'test@example.com'
    }).returning();
    
    console.log('Successfully inserted user:', newUser);
    
    // Test query
    const allUsers = await db.query.users.findMany();
    console.log('All users:', allUsers);
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDbConnection(); 