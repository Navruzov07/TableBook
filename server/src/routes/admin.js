import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// PUT /api/admin/floor-plan — update restaurant floor plan + sync tables
router.put('/floor-plan', async (req, res) => {
  try {
    const { floorPlan } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'No restaurant linked to this admin account' });
    }

    // Update floor plan JSON
    await req.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { floorPlan: JSON.stringify(floorPlan) }
    });

    // Sync tables: delete old, create from floor plan
    const tables = floorPlan.tables || [];

    await req.prisma.$transaction(async (tx) => {
      // Get existing tables that have bookings (can't delete these)
      const existingWithBookings = await tx.restaurantTable.findMany({
        where: { restaurantId },
        include: { bookings: { where: { status: { not: 'cancelled' } }, take: 1 } }
      });

      const tablesWithBookings = new Set(
        existingWithBookings.filter(t => t.bookings.length > 0).map(t => t.tableRef)
      );

      // Delete tables without active bookings
      await tx.restaurantTable.deleteMany({
        where: {
          restaurantId,
          tableRef: { notIn: [...tablesWithBookings] }
        }
      });

      // Upsert tables from floor plan
      for (const table of tables) {
        await tx.restaurantTable.upsert({
          where: {
            restaurantId_tableRef: {
              restaurantId,
              tableRef: table.id
            }
          },
          create: {
            restaurantId,
            tableRef: table.id,
            label: table.label || table.id,
            seatCount: table.seats || 4
          },
          update: {
            label: table.label || table.id,
            seatCount: table.seats || 4
          }
        });
      }
    });

    res.json({ message: 'Floor plan updated', tableCount: tables.length });
  } catch (err) {
    console.error('Update floor plan error:', err);
    res.status(500).json({ error: 'Failed to update floor plan' });
  }
});

// GET /api/admin/bookings — all bookings for admin's restaurant
router.get('/bookings', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant linked' });

    const { date, status } = req.query;
    const where = { restaurantId };
    if (date) where.bookingDate = date;
    if (status) where.status = status;

    const bookings = await req.prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        table: { select: { label: true, seatCount: true } },
        preorderItems: {
          include: { menuItem: { select: { name: true } } }
        }
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'asc' }]
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /api/admin/bookings/:id/status — update booking status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await req.prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// --- Menu Management ---

// POST /api/admin/menu — add menu item
router.post('/menu', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'No restaurant linked' });

    const { name, description, price, category, imageUrl, sortOrder } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const item = await req.prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description: description || null,
        price: parseFloat(price),
        category,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/admin/menu/:id — update menu item
router.put('/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, category, imageUrl, available, sortOrder } = req.body;

    const item = await req.prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(available !== undefined && { available }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/admin/menu/:id — delete menu item
router.delete('/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await req.prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
