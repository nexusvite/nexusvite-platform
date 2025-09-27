import { db } from '../src/core/database';
import { developerEntities } from '../src/core/database/schemas/developer-entities';
import postgres from 'postgres';

async function createTestEntity() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev';
  const sql = postgres(databaseUrl);

  try {
    // Create test entity record
    const [entity] = await db.insert(developerEntities).values({
      name: 'Product',
      tableName: 'test_products',
      description: 'Test product catalog entity',
      fields: JSON.stringify([
        { name: 'name', type: 'text', required: true, unique: false },
        { name: 'description', type: 'text', required: false, unique: false },
        { name: 'price', type: 'number', required: true, unique: false },
        { name: 'in_stock', type: 'boolean', required: false, unique: false },
        { name: 'created_date', type: 'date', required: false, unique: false }
      ]),
      userId: 'test-user-id'
    }).returning();

    console.log('Created entity:', entity);

    // Create the actual database table
    await sql`
      CREATE TABLE IF NOT EXISTS test_products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        in_stock BOOLEAN,
        created_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create trigger for updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_test_products_updated_at ON test_products;

      CREATE TRIGGER update_test_products_updated_at
      BEFORE UPDATE ON test_products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Insert some test data
    await sql`
      INSERT INTO test_products (name, description, price, in_stock, created_date)
      VALUES
        ('Laptop Pro', 'High-performance laptop for developers', 1299.99, true, NOW()),
        ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, true, NOW()),
        ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 149.99, false, NOW()),
        ('USB-C Hub', '7-in-1 USB-C hub with HDMI', 49.99, true, NOW()),
        ('Monitor Stand', 'Adjustable monitor stand with drawer', 89.99, true, NOW())
    `;

    console.log('Test table created and populated with sample data');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test entity:', error);
    await sql.end();
    process.exit(1);
  }
}

createTestEntity();