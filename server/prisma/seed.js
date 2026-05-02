import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Create 4 Restaurants in Karshi, Uzbekistan ---
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: 'Evos',
        address: 'Mustaqillik Avenue, Karshi',
        lat: 38.865,
        lng: 65.785,
        rating: 4.5,
        cuisineType: 'Fast Food',
        openingHours: '09:00 - 23:00',
        phone: '+998-75-221-0001',
        description: 'Karshi favorite for fresh lavash, burgers, and quick bites.',
        imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
        floorPlan: JSON.stringify({
          width: 800, height: 600,
          tables: [
            { id: 'T1', x: 100, y: 150, shape: 'circle', radius: 30, seats: 2, label: 'E1' },
            { id: 'T2', x: 250, y: 150, shape: 'circle', radius: 30, seats: 2, label: 'E2' },
            { id: 'T3', x: 400, y: 150, shape: 'rect', width: 80, height: 50, seats: 4, label: 'E3' },
            { id: 'T4', x: 600, y: 150, shape: 'rect', width: 80, height: 50, seats: 4, label: 'E4' }
          ],
          decorations: [{ type: 'kitchen', x: 0, y: 0, width: 800, height: 60 }]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'Apelsin',
        address: 'Nasaf Street, Karshi',
        lat: 38.855,
        lng: 65.795,
        rating: 4.8,
        cuisineType: 'European',
        openingHours: '11:00 - 23:00',
        phone: '+998-75-223-0002',
        description: 'Premium dining experience with a modern European menu.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        floorPlan: JSON.stringify({
          width: 700, height: 500,
          tables: [
            { id: 'T1', x: 150, y: 150, shape: 'circle', radius: 40, seats: 4, label: 'A1' },
            { id: 'T2', x: 450, y: 150, shape: 'circle', radius: 40, seats: 4, label: 'A2' },
            { id: 'T3', x: 300, y: 350, shape: 'rect', width: 120, height: 60, seats: 6, label: 'VIP' }
          ],
          decorations: [{ type: 'bar', x: 0, y: 0, width: 700, height: 50 }]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: "Mo'jiza",
        address: 'Jayhun Street, Karshi',
        lat: 38.870,
        lng: 65.770,
        rating: 4.7,
        cuisineType: 'Uzbek National',
        openingHours: '08:00 - 22:00',
        phone: '+998-75-225-0003',
        description: 'Authentic Uzbek traditions, best known for Osh and Shashlik.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        floorPlan: JSON.stringify({
          width: 800, height: 600,
          tables: [
            { id: 'T1', x: 100, y: 100, shape: 'rect', width: 150, height: 100, seats: 8, label: 'Topchan 1' },
            { id: 'T2', x: 350, y: 100, shape: 'rect', width: 150, height: 100, seats: 8, label: 'Topchan 2' },
            { id: 'T3', x: 600, y: 100, shape: 'rect', width: 150, height: 100, seats: 8, label: 'Topchan 3' }
          ],
          decorations: [{ type: 'door', x: 375, y: 550, width: 50 }]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'Oqsaroy',
        address: 'Oqsaroy Square, Karshi',
        lat: 38.850,
        lng: 65.780,
        rating: 4.9,
        cuisineType: 'Fine Dining',
        openingHours: '10:00 - 23:00',
        phone: '+998-75-227-0004',
        description: 'Elegant venue with historic views and premium service.',
        imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
        floorPlan: JSON.stringify({
          width: 600, height: 400,
          tables: [
            { id: 'T1', x: 300, y: 200, shape: 'circle', radius: 50, seats: 4, label: 'Royal' }
          ],
          decorations: [{ type: 'kitchen', x: 0, y: 0, width: 600, height: 40 }]
        })
      }
    })
  ]);

  console.log(`✅ Created ${restaurants.length} restaurants in Karshi`);

  // --- Create tables for each restaurant ---
  for (const restaurant of restaurants) {
    const floorPlan = JSON.parse(restaurant.floorPlan);
    for (const table of floorPlan.tables) {
      await prisma.restaurantTable.create({
        data: {
          restaurantId: restaurant.id,
          tableRef: table.id,
          label: table.label,
          seatCount: table.seats
        }
      });
    }
  }
  console.log('✅ Created tables for all restaurants');

  // --- Create menu items ---
  const menus = {
    [restaurants[0].id]: [ // Evos
      { name: 'Classic Lavash', description: 'Freshly grilled lavash with beef and secret sauce', price: 25000, category: 'Mains', sortOrder: 1 },
      { name: 'Cheeseburger', description: 'Juicy beef patty with extra cheese', price: 22000, category: 'Mains', sortOrder: 2 },
      { name: 'Iced Tea', description: 'Freshly brewed peach iced tea', price: 8000, category: 'Drinks', sortOrder: 3 }
    ],
    [restaurants[1].id]: [ // Apelsin
      { name: 'Caesar Salad', description: 'Classic salad with grilled chicken and parmesan', price: 35000, category: 'Starters', sortOrder: 1 },
      { name: 'Ribeye Steak', description: 'Premium cut steak with roasted vegetables', price: 95000, category: 'Mains', sortOrder: 2 },
      { name: 'Tiramisu', description: 'Italian coffee-flavored dessert', price: 28000, category: 'Desserts', sortOrder: 3 }
    ],
    [restaurants[2].id]: [ // Mo'jiza
      { name: 'Karshi Osh', description: 'Special local palov with tender lamb', price: 30000, category: 'Mains', sortOrder: 1 },
      { name: 'Mutton Shashlik', description: 'Traditional charcoal-grilled lamb (per skewer)', price: 15000, category: 'Mains', sortOrder: 2 },
      { name: 'Green Tea', description: 'Traditional Uzbek green tea set', price: 5000, category: 'Drinks', sortOrder: 3 }
    ],
    [restaurants[3].id]: [ // Oqsaroy
      { name: 'Filet Mignon', description: 'Served with mushroom glaze and mashed potatoes', price: 110000, category: 'Mains', sortOrder: 1 },
      { name: 'Chocolate Fondant', description: 'Warm cake with melting chocolate center', price: 32000, category: 'Desserts', sortOrder: 2 }
    ]
  };

  for (const [restaurantId, items] of Object.entries(menus)) {
    for (const item of items) {
      await prisma.menuItem.create({
        data: { restaurantId: parseInt(restaurantId), ...item }
      });
    }
  }
  console.log('✅ Created menu items for all restaurants');

  // --- Create test users (phone-based, no password) ---
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      phone: '+998750000001',
      role: 'admin',
      restaurantId: restaurants[0].id
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Test Customer',
      phone: '+998750000002',
      role: 'customer'
    }
  });

  console.log('✅ Created test users');
  console.log('');
  console.log('📋 Test phones (use OTP to login):');
  console.log('   Admin:    +998750000001');
  console.log('   Customer: +998750000002');
  console.log('   OTP code will be printed to console (mock SMS)');
  console.log('');
  console.log('🔑 CEO login: use the Staff Access passphrase from CEO_SECRET env var');
  console.log('   Default: tablebook-ceo-secret-2024');
  console.log('');
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
