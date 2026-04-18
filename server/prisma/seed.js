import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Create admin and customer users ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('user123', 10);

  // --- Create 5 Restaurants ---
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: 'Bella Italia',
        address: '14 Via Roma, Downtown',
        lat: 41.9028,
        lng: 12.4964,
        rating: 8.7,
        cuisineType: 'Italian',
        openingHours: '11:00 - 23:00',
        phone: '+1-555-0101',
        description: 'Authentic Italian cuisine with handmade pasta and wood-fired pizzas.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        floorPlan: JSON.stringify({
          width: 800, height: 600,
          tables: [
            { id: 'T1', x: 120, y: 150, shape: 'circle', radius: 35, seats: 2, label: 'Table 1' },
            { id: 'T2', x: 280, y: 150, shape: 'circle', radius: 35, seats: 2, label: 'Table 2' },
            { id: 'T3', x: 450, y: 150, shape: 'rect', width: 90, height: 55, seats: 4, label: 'Table 3' },
            { id: 'T4', x: 650, y: 150, shape: 'rect', width: 90, height: 55, seats: 4, label: 'Table 4' },
            { id: 'T5', x: 120, y: 350, shape: 'rect', width: 110, height: 65, seats: 6, label: 'Table 5' },
            { id: 'T6', x: 350, y: 350, shape: 'circle', radius: 45, seats: 4, label: 'Table 6' },
            { id: 'T7', x: 570, y: 350, shape: 'rect', width: 140, height: 70, seats: 8, label: 'Table 7' },
            { id: 'T8', x: 200, y: 500, shape: 'circle', radius: 30, seats: 2, label: 'Table 8' },
            { id: 'T9', x: 500, y: 500, shape: 'circle', radius: 30, seats: 2, label: 'Table 9' }
          ],
          decorations: [
            { type: 'kitchen', x: 0, y: 0, width: 800, height: 60 },
            { type: 'door', x: 370, y: 580, width: 60 },
            { type: 'bar', x: 700, y: 400, width: 100, height: 200 }
          ]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'Sakura Garden',
        address: '88 Cherry Lane, Eastside',
        lat: 41.9050,
        lng: 12.5000,
        rating: 9.1,
        cuisineType: 'Japanese',
        openingHours: '12:00 - 22:00',
        phone: '+1-555-0102',
        description: 'Premium sushi and traditional Japanese dishes in a zen atmosphere.',
        imageUrl: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800',
        floorPlan: JSON.stringify({
          width: 700, height: 500,
          tables: [
            { id: 'T1', x: 100, y: 120, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Sakura 1' },
            { id: 'T2', x: 300, y: 120, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Sakura 2' },
            { id: 'T3', x: 500, y: 120, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Sakura 3' },
            { id: 'T4', x: 150, y: 300, shape: 'rect', width: 120, height: 60, seats: 6, label: 'Tatami 1' },
            { id: 'T5', x: 420, y: 300, shape: 'rect', width: 120, height: 60, seats: 6, label: 'Tatami 2' },
            { id: 'T6', x: 300, y: 430, shape: 'circle', radius: 30, seats: 2, label: 'Bar Seat' }
          ],
          decorations: [
            { type: 'kitchen', x: 0, y: 0, width: 700, height: 50 },
            { type: 'door', x: 320, y: 480, width: 60 }
          ]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'Le Petit Bistro',
        address: '27 Rue de Paris, Midtown',
        lat: 41.9000,
        lng: 12.4900,
        rating: 8.3,
        cuisineType: 'French',
        openingHours: '10:00 - 22:30',
        phone: '+1-555-0103',
        description: 'Charming French bistro with seasonal menus and fine wines.',
        imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800',
        floorPlan: JSON.stringify({
          width: 600, height: 450,
          tables: [
            { id: 'T1', x: 100, y: 100, shape: 'circle', radius: 30, seats: 2, label: 'Romantic 1' },
            { id: 'T2', x: 250, y: 100, shape: 'circle', radius: 30, seats: 2, label: 'Romantic 2' },
            { id: 'T3', x: 430, y: 100, shape: 'circle', radius: 30, seats: 2, label: 'Romantic 3' },
            { id: 'T4', x: 150, y: 260, shape: 'rect', width: 100, height: 55, seats: 4, label: 'Window 1' },
            { id: 'T5', x: 380, y: 260, shape: 'rect', width: 100, height: 55, seats: 4, label: 'Window 2' },
            { id: 'T6', x: 250, y: 380, shape: 'rect', width: 130, height: 60, seats: 6, label: 'Family' }
          ],
          decorations: [
            { type: 'kitchen', x: 0, y: 0, width: 600, height: 40 },
            { type: 'bar', x: 500, y: 300, width: 100, height: 150 },
            { type: 'door', x: 270, y: 430, width: 60 }
          ]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'Spice Route',
        address: '55 Curry Road, Westside',
        lat: 41.8980,
        lng: 12.4850,
        rating: 7.9,
        cuisineType: 'Indian',
        openingHours: '11:30 - 23:30',
        phone: '+1-555-0104',
        description: 'Bold flavors and aromatic spices from all regions of India.',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        floorPlan: JSON.stringify({
          width: 750, height: 550,
          tables: [
            { id: 'T1', x: 100, y: 130, shape: 'circle', radius: 35, seats: 2, label: 'Naan 1' },
            { id: 'T2', x: 260, y: 130, shape: 'circle', radius: 35, seats: 2, label: 'Naan 2' },
            { id: 'T3', x: 450, y: 130, shape: 'rect', width: 90, height: 55, seats: 4, label: 'Tandoori 1' },
            { id: 'T4', x: 630, y: 130, shape: 'rect', width: 90, height: 55, seats: 4, label: 'Tandoori 2' },
            { id: 'T5', x: 180, y: 330, shape: 'rect', width: 130, height: 70, seats: 8, label: 'Maharaja' },
            { id: 'T6', x: 500, y: 330, shape: 'rect', width: 100, height: 55, seats: 4, label: 'Spice Corner' },
            { id: 'T7', x: 350, y: 470, shape: 'circle', radius: 30, seats: 2, label: 'Chai Spot' }
          ],
          decorations: [
            { type: 'kitchen', x: 0, y: 0, width: 750, height: 50 },
            { type: 'door', x: 345, y: 530, width: 60 }
          ]
        })
      }
    }),
    prisma.restaurant.create({
      data: {
        name: 'The Grill House',
        address: '101 Smoke Street, Northend',
        lat: 41.9080,
        lng: 12.4940,
        rating: 8.5,
        cuisineType: 'American',
        openingHours: '11:00 - 00:00',
        phone: '+1-555-0105',
        description: 'Premium steaks, craft burgers, and smoky BBQ in a rustic setting.',
        imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
        floorPlan: JSON.stringify({
          width: 850, height: 600,
          tables: [
            { id: 'T1', x: 100, y: 130, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Booth 1' },
            { id: 'T2', x: 100, y: 250, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Booth 2' },
            { id: 'T3', x: 100, y: 370, shape: 'rect', width: 80, height: 50, seats: 4, label: 'Booth 3' },
            { id: 'T4', x: 350, y: 150, shape: 'circle', radius: 40, seats: 2, label: 'High Top 1' },
            { id: 'T5', x: 500, y: 150, shape: 'circle', radius: 40, seats: 2, label: 'High Top 2' },
            { id: 'T6', x: 650, y: 150, shape: 'circle', radius: 40, seats: 2, label: 'High Top 3' },
            { id: 'T7', x: 420, y: 350, shape: 'rect', width: 160, height: 80, seats: 10, label: 'Party Table' },
            { id: 'T8', x: 350, y: 500, shape: 'rect', width: 100, height: 55, seats: 6, label: 'Patio 1' },
            { id: 'T9', x: 560, y: 500, shape: 'rect', width: 100, height: 55, seats: 6, label: 'Patio 2' }
          ],
          decorations: [
            { type: 'kitchen', x: 0, y: 0, width: 850, height: 60 },
            { type: 'bar', x: 700, y: 300, width: 150, height: 200 },
            { type: 'door', x: 395, y: 580, width: 60 }
          ]
        })
      }
    })
  ]);

  console.log(`✅ Created ${restaurants.length} restaurants`);

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
    [restaurants[0].id]: [ // Bella Italia
      { name: 'Bruschetta', description: 'Toasted bread with tomato, basil & olive oil', price: 8.50, category: 'Starters', sortOrder: 1 },
      { name: 'Caprese Salad', description: 'Fresh mozzarella, tomatoes & basil', price: 10.00, category: 'Starters', sortOrder: 2 },
      { name: 'Margherita Pizza', description: 'San Marzano tomato, mozzarella, fresh basil', price: 14.00, category: 'Mains', sortOrder: 1 },
      { name: 'Spaghetti Carbonara', description: 'Guanciale, pecorino, egg yolk, black pepper', price: 16.50, category: 'Mains', sortOrder: 2 },
      { name: 'Risotto ai Funghi', description: 'Arborio rice with wild mushrooms & parmesan', price: 18.00, category: 'Mains', sortOrder: 3 },
      { name: 'Osso Buco', description: 'Braised veal shanks with gremolata', price: 24.00, category: 'Mains', sortOrder: 4 },
      { name: 'Tiramisu', description: 'Classic mascarpone, espresso, cocoa', price: 9.00, category: 'Desserts', sortOrder: 1 },
      { name: 'Panna Cotta', description: 'Vanilla cream with berry compote', price: 8.00, category: 'Desserts', sortOrder: 2 },
      { name: 'Chianti (Glass)', description: 'Tuscan red wine', price: 7.00, category: 'Drinks', sortOrder: 1 },
      { name: 'Espresso', description: 'Double shot Italian espresso', price: 3.50, category: 'Drinks', sortOrder: 2 },
      { name: 'Limoncello', description: 'Homemade lemon liqueur', price: 6.00, category: 'Drinks', sortOrder: 3 }
    ],
    [restaurants[1].id]: [ // Sakura Garden
      { name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 5.50, category: 'Starters', sortOrder: 1 },
      { name: 'Miso Soup', description: 'Traditional dashi broth with tofu & wakame', price: 4.50, category: 'Starters', sortOrder: 2 },
      { name: 'Gyoza', description: 'Pan-fried pork dumplings (6 pcs)', price: 8.00, category: 'Starters', sortOrder: 3 },
      { name: 'Salmon Sashimi', description: 'Fresh Norwegian salmon (8 slices)', price: 16.00, category: 'Mains', sortOrder: 1 },
      { name: 'Dragon Roll', description: 'Eel, avocado, cucumber with unagi sauce', price: 18.00, category: 'Mains', sortOrder: 2 },
      { name: 'Chicken Teriyaki', description: 'Grilled chicken with teriyaki glaze & rice', price: 15.00, category: 'Mains', sortOrder: 3 },
      { name: 'Tonkotsu Ramen', description: 'Rich pork broth, chashu, soft egg, noodles', price: 14.50, category: 'Mains', sortOrder: 4 },
      { name: 'Matcha Ice Cream', description: 'House-made green tea ice cream', price: 6.00, category: 'Desserts', sortOrder: 1 },
      { name: 'Mochi', description: 'Assorted flavors (3 pcs)', price: 7.00, category: 'Desserts', sortOrder: 2 },
      { name: 'Sake (Carafe)', description: 'Premium Junmai Daiginjo', price: 12.00, category: 'Drinks', sortOrder: 1 },
      { name: 'Ramune', description: 'Japanese marble soda', price: 4.00, category: 'Drinks', sortOrder: 2 }
    ],
    [restaurants[2].id]: [ // Le Petit Bistro
      { name: 'French Onion Soup', description: 'Caramelized onions, gruyère crouton', price: 9.50, category: 'Starters', sortOrder: 1 },
      { name: 'Duck Confit', description: 'Slow-cooked duck leg with roasted potatoes', price: 22.00, category: 'Mains', sortOrder: 1 },
      { name: 'Coq au Vin', description: 'Braised chicken in Burgundy wine', price: 19.50, category: 'Mains', sortOrder: 2 },
      { name: 'Steak Frites', description: 'Grilled ribeye with hand-cut fries & béarnaise', price: 26.00, category: 'Mains', sortOrder: 3 },
      { name: 'Crème Brûlée', description: 'Vanilla custard with caramelized sugar', price: 9.00, category: 'Desserts', sortOrder: 1 },
      { name: 'Tarte Tatin', description: 'Caramelized apple tart with crème fraîche', price: 10.00, category: 'Desserts', sortOrder: 2 },
      { name: 'Bordeaux (Glass)', description: 'Red Bordeaux AOC', price: 9.00, category: 'Drinks', sortOrder: 1 },
      { name: 'Café au Lait', description: 'Coffee with steamed milk', price: 4.50, category: 'Drinks', sortOrder: 2 }
    ],
    [restaurants[3].id]: [ // Spice Route
      { name: 'Samosa', description: 'Crispy pastry with spiced potatoes & peas (2 pcs)', price: 6.00, category: 'Starters', sortOrder: 1 },
      { name: 'Chicken Tikka', description: 'Tandoori-marinated chicken skewers', price: 9.00, category: 'Starters', sortOrder: 2 },
      { name: 'Butter Chicken', description: 'Creamy tomato curry with tender chicken', price: 15.00, category: 'Mains', sortOrder: 1 },
      { name: 'Lamb Biryani', description: 'Fragrant basmati rice with slow-cooked lamb', price: 17.00, category: 'Mains', sortOrder: 2 },
      { name: 'Palak Paneer', description: 'Spinach curry with cottage cheese', price: 13.00, category: 'Mains', sortOrder: 3 },
      { name: 'Garlic Naan', description: 'Freshly baked garlic flatbread', price: 3.50, category: 'Sides', sortOrder: 1 },
      { name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in rose syrup', price: 6.50, category: 'Desserts', sortOrder: 1 },
      { name: 'Mango Lassi', description: 'Yogurt smoothie with Alphonso mango', price: 5.00, category: 'Drinks', sortOrder: 1 },
      { name: 'Masala Chai', description: 'Spiced Indian tea with milk', price: 3.50, category: 'Drinks', sortOrder: 2 }
    ],
    [restaurants[4].id]: [ // The Grill House
      { name: 'Loaded Nachos', description: 'Tortilla chips, cheese, jalapeños, sour cream', price: 11.00, category: 'Starters', sortOrder: 1 },
      { name: 'Buffalo Wings', description: 'Crispy wings with ranch dip (8 pcs)', price: 12.00, category: 'Starters', sortOrder: 2 },
      { name: 'Classic Smash Burger', description: 'Double patty, American cheese, special sauce', price: 14.50, category: 'Mains', sortOrder: 1 },
      { name: 'Ribeye Steak 12oz', description: 'Dry-aged, charcoal grilled, herb butter', price: 32.00, category: 'Mains', sortOrder: 2 },
      { name: 'BBQ Ribs (Full Rack)', description: 'Slow-smoked with house BBQ glaze', price: 24.00, category: 'Mains', sortOrder: 3 },
      { name: 'Mac & Cheese', description: 'Four cheese blend, crispy breadcrumb topping', price: 8.00, category: 'Sides', sortOrder: 1 },
      { name: 'Coleslaw', description: 'Creamy house slaw', price: 4.50, category: 'Sides', sortOrder: 2 },
      { name: 'Chocolate Brownie', description: 'Warm brownie with vanilla ice cream', price: 9.00, category: 'Desserts', sortOrder: 1 },
      { name: 'Craft IPA (Pint)', description: 'Local craft India Pale Ale', price: 7.00, category: 'Drinks', sortOrder: 1 },
      { name: 'Bourbon Old Fashioned', description: 'Whiskey, bitters, orange peel', price: 11.00, category: 'Drinks', sortOrder: 2 }
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

  // --- Create users ---
  const admin = await prisma.user.create({
    data: {
      name: 'Marco Rossi',
      email: 'admin@bellaitalia.com',
      passwordHash: adminHash,
      phone: '+1-555-0201',
      role: 'admin',
      restaurantId: restaurants[0].id
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: customerHash,
      phone: '+1-555-0301',
      role: 'customer'
    }
  });

  console.log('✅ Created users');
  console.log('');
  console.log('📋 Test credentials:');
  console.log('   Admin:    admin@bellaitalia.com / admin123');
  console.log('   Customer: john@example.com / user123');
  console.log('');
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
