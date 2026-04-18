import { Router } from 'express';
import { getRestaurantAvailability } from '../utils/availability.js';

const router = Router();

// GET /api/restaurants — list all restaurants
router.get('/', async (req, res) => {
  try {
    const { cuisine, search } = req.query;
    const where = {};

    if (cuisine) where.cuisineType = cuisine;
    if (search) where.name = { contains: search };

    const restaurants = await req.prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        rating: true,
        cuisineType: true,
        openingHours: true,
        phone: true,
        description: true,
        imageUrl: true
      },
      orderBy: { rating: 'desc' }
    });

    res.json(restaurants);
  } catch (err) {
    console.error('List restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// GET /api/restaurants/:id — restaurant detail with floor plan
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const restaurant = await req.prisma.restaurant.findUnique({
      where: { id },
      include: {
        tables: {
          select: { id: true, tableRef: true, label: true, seatCount: true }
        }
      }
    });

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    // Parse floorPlan JSON
    restaurant.floorPlan = JSON.parse(restaurant.floorPlan || '{}');
    res.json(restaurant);
  } catch (err) {
    console.error('Get restaurant error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// GET /api/restaurants/:id/menu — full menu grouped by category
router.get('/:id/menu', async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const items = await req.prisma.menuItem.findMany({
      where: { restaurantId, available: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    });

    // Group by category
    const menu = {};
    items.forEach(item => {
      if (!menu[item.category]) menu[item.category] = [];
      menu[item.category].push(item);
    });

    res.json(menu);
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/restaurants/:id/availability?date=YYYY-MM-DD&time=HH:MM
router.get('/:id/availability', async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ error: 'date and time query params required' });
    }

    const restaurant = await req.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { defaultBookingDuration: true }
    });

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const availability = await getRestaurantAvailability(
      req.prisma,
      restaurantId,
      date,
      time,
      restaurant.defaultBookingDuration
    );

    res.json(availability);
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
