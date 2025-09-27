import { db } from '../src/core/database';
import { developerEntities } from '../src/core/database/schemas/developer-entities';
import postgres from 'postgres';

async function seedEntities() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev';
  const sql = postgres(databaseUrl);

  try {
    console.log('🌱 Starting entity seeding...\n');

    // Test user ID (you can replace this with an actual user ID from your database)
    const userId = 'test-user-123';

    // 1. Products Entity
    console.log('Creating Products entity...');
    const [productsEntity] = await db.insert(developerEntities).values({
      name: 'Products',
      tableName: 'products_catalog',
      description: 'Product catalog with inventory tracking',
      fields: JSON.stringify([
        { name: 'name', type: 'text', required: true, unique: false },
        { name: 'description', type: 'text', required: false, unique: false },
        { name: 'sku', type: 'text', required: true, unique: true },
        { name: 'price', type: 'number', required: true, unique: false },
        { name: 'cost', type: 'number', required: false, unique: false },
        { name: 'quantity', type: 'number', required: true, unique: false },
        { name: 'category', type: 'text', required: true, unique: false },
        { name: 'brand', type: 'text', required: false, unique: false },
        { name: 'active', type: 'boolean', required: false, unique: false },
        { name: 'featured', type: 'boolean', required: false, unique: false },
        { name: 'launch_date', type: 'date', required: false, unique: false }
      ]),
      userId
    }).returning();

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products_catalog (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT NOT NULL UNIQUE,
        price NUMERIC NOT NULL,
        cost NUMERIC,
        quantity INTEGER NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        active BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        launch_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert sample products
    await sql`
      INSERT INTO products_catalog (name, description, sku, price, cost, quantity, category, brand, active, featured, launch_date)
      VALUES
        ('MacBook Pro 14"', 'M3 Pro chip, 18GB RAM, 512GB SSD', 'MBP14-M3-001', 1999, 1400, 25, 'Laptops', 'Apple', true, true, NOW() - INTERVAL '30 days'),
        ('iPhone 15 Pro', '256GB, Titanium Blue', 'IPH15P-256-BLU', 1199, 800, 45, 'Smartphones', 'Apple', true, true, NOW() - INTERVAL '90 days'),
        ('AirPods Pro 2', 'Active Noise Cancellation, USB-C', 'APP2-USC-001', 249, 150, 100, 'Audio', 'Apple', true, false, NOW() - INTERVAL '180 days'),
        ('Dell XPS 15', 'Intel Core i7, 32GB RAM, 1TB SSD', 'DXP15-I7-001', 2399, 1800, 15, 'Laptops', 'Dell', true, true, NOW() - INTERVAL '60 days'),
        ('Samsung Galaxy S24 Ultra', '512GB, Titanium Gray', 'SGS24U-512-GRY', 1299, 900, 30, 'Smartphones', 'Samsung', true, true, NOW() - INTERVAL '45 days'),
        ('Sony WH-1000XM5', 'Wireless Noise Cancelling Headphones', 'SNY-WH5-BLK', 399, 250, 50, 'Audio', 'Sony', true, false, NOW() - INTERVAL '120 days'),
        ('iPad Pro 12.9"', 'M2 chip, 256GB, WiFi + Cellular', 'IPD-M2-256-CELL', 1399, 1000, 20, 'Tablets', 'Apple', true, true, NOW() - INTERVAL '75 days'),
        ('Logitech MX Master 3S', 'Wireless Performance Mouse', 'LOG-MX3S-BLK', 99, 60, 150, 'Accessories', 'Logitech', true, false, NOW() - INTERVAL '200 days'),
        ('LG C3 OLED 65"', '4K Smart TV, 120Hz', 'LG-C3-65-OLED', 2499, 1800, 10, 'TVs', 'LG', true, true, NOW() - INTERVAL '30 days'),
        ('Nintendo Switch OLED', 'White Joy-Con', 'NSW-OLED-WHT', 349, 250, 35, 'Gaming', 'Nintendo', true, false, NOW() - INTERVAL '365 days')
    `;

    console.log('✅ Products entity created with 10 sample products\n');

    // 2. Customers Entity
    console.log('Creating Customers entity...');
    const [customersEntity] = await db.insert(developerEntities).values({
      name: 'Customers',
      tableName: 'customer_records',
      description: 'Customer management system',
      fields: JSON.stringify([
        { name: 'first_name', type: 'text', required: true, unique: false },
        { name: 'last_name', type: 'text', required: true, unique: false },
        { name: 'email', type: 'text', required: true, unique: true },
        { name: 'phone', type: 'text', required: false, unique: false },
        { name: 'company', type: 'text', required: false, unique: false },
        { name: 'address', type: 'text', required: false, unique: false },
        { name: 'city', type: 'text', required: false, unique: false },
        { name: 'country', type: 'text', required: false, unique: false },
        { name: 'vip_status', type: 'boolean', required: false, unique: false },
        { name: 'registration_date', type: 'date', required: false, unique: false }
      ]),
      userId
    }).returning();

    // Create customers table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_records (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        company TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        vip_status BOOLEAN DEFAULT false,
        registration_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert sample customers
    await sql`
      INSERT INTO customer_records (first_name, last_name, email, phone, company, address, city, country, vip_status, registration_date)
      VALUES
        ('John', 'Doe', 'john.doe@example.com', '+1-555-0101', 'Tech Corp', '123 Main St', 'San Francisco', 'USA', true, NOW() - INTERVAL '2 years'),
        ('Jane', 'Smith', 'jane.smith@example.com', '+1-555-0102', 'Design Studio', '456 Oak Ave', 'New York', 'USA', true, NOW() - INTERVAL '18 months'),
        ('Michael', 'Johnson', 'michael.j@example.com', '+44-20-1234-5678', 'Global Solutions', '789 Park Lane', 'London', 'UK', false, NOW() - INTERVAL '1 year'),
        ('Sarah', 'Williams', 'sarah.w@example.com', '+1-555-0103', NULL, '321 Elm St', 'Los Angeles', 'USA', false, NOW() - INTERVAL '6 months'),
        ('David', 'Brown', 'david.brown@example.com', '+49-30-9876-5432', 'Berlin Tech', 'Alexanderplatz 10', 'Berlin', 'Germany', true, NOW() - INTERVAL '3 years')
    `;

    console.log('✅ Customers entity created with 5 sample customers\n');

    // 3. Orders Entity
    console.log('Creating Orders entity...');
    const [ordersEntity] = await db.insert(developerEntities).values({
      name: 'Orders',
      tableName: 'order_management',
      description: 'Order tracking and management',
      fields: JSON.stringify([
        { name: 'order_number', type: 'text', required: true, unique: true },
        { name: 'customer_email', type: 'text', required: true, unique: false },
        { name: 'total_amount', type: 'number', required: true, unique: false },
        { name: 'status', type: 'text', required: true, unique: false },
        { name: 'payment_method', type: 'text', required: true, unique: false },
        { name: 'shipping_address', type: 'text', required: true, unique: false },
        { name: 'tracking_number', type: 'text', required: false, unique: false },
        { name: 'notes', type: 'text', required: false, unique: false },
        { name: 'order_date', type: 'date', required: true, unique: false }
      ]),
      userId
    }).returning();

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS order_management (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL UNIQUE,
        customer_email TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        tracking_number TEXT,
        notes TEXT,
        order_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert sample orders
    await sql`
      INSERT INTO order_management (order_number, customer_email, total_amount, status, payment_method, shipping_address, tracking_number, notes, order_date)
      VALUES
        ('ORD-2024-0001', 'john.doe@example.com', 2248.00, 'delivered', 'Credit Card', '123 Main St, San Francisco, USA', 'TRK123456789', 'VIP customer, expedited shipping', NOW() - INTERVAL '15 days'),
        ('ORD-2024-0002', 'jane.smith@example.com', 1448.00, 'processing', 'PayPal', '456 Oak Ave, New York, USA', NULL, 'Gift wrapping requested', NOW() - INTERVAL '2 days'),
        ('ORD-2024-0003', 'michael.j@example.com', 3897.00, 'shipped', 'Credit Card', '789 Park Lane, London, UK', 'TRK987654321', 'International shipping', NOW() - INTERVAL '5 days'),
        ('ORD-2024-0004', 'sarah.w@example.com', 349.00, 'pending', 'Debit Card', '321 Elm St, Los Angeles, USA', NULL, NULL, NOW() - INTERVAL '1 hour'),
        ('ORD-2024-0005', 'david.brown@example.com', 5496.00, 'delivered', 'Bank Transfer', 'Alexanderplatz 10, Berlin, Germany', 'TRK456789123', 'Bulk order discount applied', NOW() - INTERVAL '30 days')
    `;

    console.log('✅ Orders entity created with 5 sample orders\n');

    // 4. Events Entity
    console.log('Creating Events entity...');
    const [eventsEntity] = await db.insert(developerEntities).values({
      name: 'Events',
      tableName: 'event_calendar',
      description: 'Event scheduling and management',
      fields: JSON.stringify([
        { name: 'title', type: 'text', required: true, unique: false },
        { name: 'description', type: 'text', required: false, unique: false },
        { name: 'location', type: 'text', required: true, unique: false },
        { name: 'start_time', type: 'date', required: true, unique: false },
        { name: 'end_time', type: 'date', required: true, unique: false },
        { name: 'capacity', type: 'number', required: false, unique: false },
        { name: 'registered', type: 'number', required: false, unique: false },
        { name: 'event_type', type: 'text', required: true, unique: false },
        { name: 'is_public', type: 'boolean', required: false, unique: false }
      ]),
      userId
    }).returning();

    // Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS event_calendar (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        capacity INTEGER,
        registered INTEGER DEFAULT 0,
        event_type TEXT NOT NULL,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert sample events
    await sql`
      INSERT INTO event_calendar (title, description, location, start_time, end_time, capacity, registered, event_type, is_public)
      VALUES
        ('Tech Conference 2024', 'Annual technology conference featuring latest innovations', 'Convention Center, San Francisco', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 500, 342, 'Conference', true),
        ('Product Launch Webinar', 'Introducing our new product line', 'Online', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 1000, 567, 'Webinar', true),
        ('Developer Workshop', 'Hands-on workshop for API development', 'Tech Hub, New York', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 4 hours', 50, 48, 'Workshop', false),
        ('Customer Appreciation Event', 'Exclusive event for VIP customers', 'Grand Hotel, Los Angeles', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 3 hours', 200, 156, 'Social', false)
    `;

    console.log('✅ Events entity created with 4 sample events\n');

    // 5. Support Tickets Entity
    console.log('Creating Support Tickets entity...');
    const [ticketsEntity] = await db.insert(developerEntities).values({
      name: 'Support Tickets',
      tableName: 'support_tickets',
      description: 'Customer support ticket system',
      fields: JSON.stringify([
        { name: 'ticket_number', type: 'text', required: true, unique: true },
        { name: 'customer_email', type: 'text', required: true, unique: false },
        { name: 'subject', type: 'text', required: true, unique: false },
        { name: 'description', type: 'text', required: true, unique: false },
        { name: 'priority', type: 'text', required: true, unique: false },
        { name: 'status', type: 'text', required: true, unique: false },
        { name: 'assigned_to', type: 'text', required: false, unique: false },
        { name: 'resolved_at', type: 'date', required: false, unique: false }
      ]),
      userId
    }).returning();

    // Create tickets table
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number TEXT NOT NULL UNIQUE,
        customer_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_to TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert sample tickets
    await sql`
      INSERT INTO support_tickets (ticket_number, customer_email, subject, description, priority, status, assigned_to, resolved_at)
      VALUES
        ('TKT-2024-0001', 'john.doe@example.com', 'Login Issue', 'Unable to login after password reset', 'high', 'resolved', 'support@example.com', NOW() - INTERVAL '2 days'),
        ('TKT-2024-0002', 'jane.smith@example.com', 'Billing Question', 'Question about recent invoice', 'medium', 'in_progress', 'billing@example.com', NULL),
        ('TKT-2024-0003', 'michael.j@example.com', 'Feature Request', 'Request for bulk export functionality', 'low', 'open', NULL, NULL),
        ('TKT-2024-0004', 'sarah.w@example.com', 'Order Issue', 'Wrong item received in order ORD-2024-0004', 'high', 'in_progress', 'support@example.com', NULL)
    `;

    console.log('✅ Support Tickets entity created with 4 sample tickets\n');

    // Create trigger function if it doesn't exist
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    // Create triggers for all tables
    const tables = ['products_catalog', 'customer_records', 'order_management', 'event_calendar', 'support_tickets'];
    for (const table of tables) {
      await sql`
        DROP TRIGGER IF EXISTS update_${sql(table)}_updated_at ON ${sql(table)};
        CREATE TRIGGER update_${sql(table)}_updated_at
        BEFORE UPDATE ON ${sql(table)}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
    }

    console.log('✅ All triggers created\n');
    console.log('========================================');
    console.log('🎉 Entity seeding completed successfully!');
    console.log('========================================\n');
    console.log('Created entities:');
    console.log('  1. Products (10 items)');
    console.log('  2. Customers (5 records)');
    console.log('  3. Orders (5 records)');
    console.log('  4. Events (4 records)');
    console.log('  5. Support Tickets (4 records)\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding entities:', error);
    await sql.end();
    process.exit(1);
  }
}

seedEntities();