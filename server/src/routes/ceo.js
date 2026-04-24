import { Router } from 'express';
import { authenticate, requireCEO } from '../middleware/auth.js';

const router = Router();

// All CEO routes require authentication + ceo role
router.use(authenticate, requireCEO);

// ── Restaurants ──────────────────────────────────────────────────────────────

// GET /api/ceo/restaurants — all restaurants with assigned admin
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await req.prisma.restaurant.findMany({
      include: {
        admins: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: { select: { bookings: true, tables: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(restaurants);
  } catch (err) {
    console.error('CEO list restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// POST /api/ceo/restaurants — create restaurant
router.post('/restaurants', async (req, res) => {
  try {
    const {
      name, address, lat, lng, cuisineType, openingHours,
      phone, description, imageUrl, defaultBookingDuration, rating
    } = req.body;

    if (!name || !address || lat == null || lng == null || !cuisineType || !openingHours) {
      return res.status(400).json({ error: 'name, address, lat, lng, cuisineType, openingHours are required' });
    }

    const restaurant = await req.prisma.restaurant.create({
      data: {
        name,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        cuisineType,
        openingHours,
        phone: phone || null,
        description: description || null,
        imageUrl: imageUrl || null,
        defaultBookingDuration: defaultBookingDuration ? parseInt(defaultBookingDuration) : 90,
        rating: rating ? parseFloat(rating) : 0,
        floorPlan: JSON.stringify({ width: 800, height: 600, tables: [] })
      }
    });

    res.status(201).json(restaurant);
  } catch (err) {
    console.error('CEO create restaurant error:', err);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// PUT /api/ceo/restaurants/:id — update restaurant
router.put('/restaurants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, address, lat, lng, cuisineType, openingHours,
      phone, description, imageUrl, defaultBookingDuration, rating
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (lat !== undefined) data.lat = parseFloat(lat);
    if (lng !== undefined) data.lng = parseFloat(lng);
    if (cuisineType !== undefined) data.cuisineType = cuisineType;
    if (openingHours !== undefined) data.openingHours = openingHours;
    if (phone !== undefined) data.phone = phone;
    if (description !== undefined) data.description = description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (defaultBookingDuration !== undefined) data.defaultBookingDuration = parseInt(defaultBookingDuration);
    if (rating !== undefined) data.rating = parseFloat(rating);

    const restaurant = await req.prisma.restaurant.update({ where: { id }, data });
    res.json(restaurant);
  } catch (err) {
    console.error('CEO update restaurant error:', err);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// DELETE /api/ceo/restaurants/:id — delete restaurant
router.delete('/restaurants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await req.prisma.restaurant.delete({ where: { id } });
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    console.error('CEO delete restaurant error:', err);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// ── Admin Assignment ──────────────────────────────────────────────────────────

// POST /api/ceo/assign-admin — assign a user as admin of a restaurant
router.post('/assign-admin', async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    if (!userId || !restaurantId) {
      return res.status(400).json({ error: 'userId and restaurantId required' });
    }

    const user = await req.prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        role: 'admin',
        restaurantId: parseInt(restaurantId)
      },
      select: { id: true, name: true, email: true, role: true, restaurantId: true }
    });

    res.json(user);
  } catch (err) {
    console.error('CEO assign admin error:', err);
    res.status(500).json({ error: 'Failed to assign admin' });
  }
});

// POST /api/ceo/remove-admin — remove admin role from user
router.post('/remove-admin', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await req.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: 'customer', restaurantId: null },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json(user);
  } catch (err) {
    console.error('CEO remove admin error:', err);
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

// ── Users ────────────────────────────────────────────────────────────────────

// GET /api/ceo/users — all users (excluding CEO itself)
router.get('/users', async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, restaurantId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Bookings ─────────────────────────────────────────────────────────────────

// GET /api/ceo/bookings — all bookings across all restaurants
router.get('/bookings', async (req, res) => {
  try {
    const { date, status, restaurantId } = req.query;
    const where = {};
    if (date) where.bookingDate = date;
    if (status) where.status = status;
    if (restaurantId) where.restaurantId = parseInt(restaurantId);

    const bookings = await req.prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        table: { select: { label: true, seatCount: true } },
        restaurant: { select: { name: true } },
        preorderItems: { include: { menuItem: { select: { name: true } } } }
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'asc' }]
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;
