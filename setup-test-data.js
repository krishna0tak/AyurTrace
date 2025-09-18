// Database test and setup script
const { createClient } = require('@supabase/supabase-js');

// Configuration (replace with your actual Supabase credentials)
const SUPABASE_URL = 'https://uktkljrgbkenbvvpqcbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrdGtsanJnYmtlbmJ2dnBxY2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTkwMjMsImV4cCI6MjA3MzU3NTAyM30.2KHill336u0RcXSKjEfhqWCTofAs8B0eCZ7JXsHcyrQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupTestData() {
    console.log('Setting up test data...');
    
    // Test connection
    try {
        const { data, error } = await supabase.from('users_plain').select('count');
        if (error) {
            console.error('Error connecting to database:', error);
            console.log('Creating users_plain table...');
            
            // Create the table if it doesn't exist
            const { error: createError } = await supabase.rpc('sql', {
                query: `
                    CREATE TABLE IF NOT EXISTS users_plain (
                        id SERIAL PRIMARY KEY,
                        actorId VARCHAR(50) NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        fullName VARCHAR(100),
                        phone VARCHAR(20),
                        address TEXT,
                        role INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        UNIQUE(actorId, role)
                    );
                `
            });
            
            if (createError) {
                console.error('Error creating table:', createError);
                return;
            }
        }
        
        // Insert test users
        const testUsers = [
            {
                actorId: 'FARM001',
                password: 'farmer123',
                fullName: 'Test Farmer',
                phone: '+1234567890',
                address: '123 Farm Road, Agricultural District',
                role: 1
            },
            {
                actorId: 'COLL001',
                password: 'collector123',
                fullName: 'Test Collector',
                phone: '+1234567891',
                address: '456 Collection Center, Market District',
                role: 2
            },
            {
                actorId: 'AUDIT001',
                password: 'auditor123',
                fullName: 'Test Auditor',
                phone: '+1234567892',
                address: '789 Audit Office, Business District',
                role: 3
            },
            {
                actorId: 'MANUF001',
                password: 'manufacturer123',
                fullName: 'Test Manufacturer',
                phone: '+1234567893',
                address: '321 Manufacturing Plant, Industrial Zone',
                role: 4
            },
            {
                actorId: 'DIST001',
                password: 'distributor123',
                fullName: 'Test Distributor',
                phone: '+1234567894',
                address: '654 Distribution Center, Logistics Hub',
                role: 5
            }
        ];
        
        for (const user of testUsers) {
            const { data, error } = await supabase
                .from('users_plain')
                .upsert(user, { onConflict: 'actorId,role' });
                
            if (error) {
                console.error(`Error inserting user ${user.actorId}:`, error);
            } else {
                console.log(`✓ User ${user.actorId} (${user.fullName}) created/updated`);
            }
        }
        
        console.log('\nTest users created successfully!');
        console.log('\nYou can now test login with:');
        console.log('- Farmer: FARM001 / farmer123');
        console.log('- Collector: COLL001 / collector123');
        console.log('- Auditor: AUDIT001 / auditor123');
        console.log('- Manufacturer: MANUF001 / manufacturer123');
        console.log('- Distributor: DIST001 / distributor123');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupTestData();