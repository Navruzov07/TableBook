import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { isTableAvailable, calculateEndTime } from '../utils/availability.js';

const router = Router();

// POST /api/bookings — create a booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { restaurantId, tableId, bookingDate, startTime, guestCount, notes, preorder } = req.body;

    if (!restaurantId || !tableId || !bookingDate || !startTime || !guestCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get restaurant for booking duration
    const restaurant = await req.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { defaultBookingDuration: true }
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const endTime = calculateEndTime(startTime, restaurant.defaultBookingDuration);

    // Check availability
    const available = await isTableAvailable(req.prisma, tableId, bookingDate, startTime, endTime);
    if (!available) {
      return res.status(409).json({ error: 'Table is not available for this time slot' });
    }

    // Create booking with optional pre-order in a transaction
    const booking = await req.prisma.$transaction(async (tx) => {
      // Double-check availability inside transaction
      const conflicts = await tx.booking.findMany({
        where: {
          tableId,
          bookingDate,
          status: { not: 'cancelled' },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      });

      if (conflicts.length > 0) {
        throw new Error('CONFLICT');
      }

      const newBooking = await tx.booking.create({
        data: {
          userId: req.user.id,
          restaurantId,
          tableId,
          bookingDate,
          startTime,
          endTime,
          guestCount,
          notes: notes || null,
          status: 'confirmed'
        }
      });

      // Create pre-order items if provided
      if (preorder && preorder.length > 0) {
        // Get menu item prices
        const menuItemIds = preorder.map(p => p.menuItemId);
        const menuItems = await tx.menuItem.findMany({
          where: { id: { in: menuItemIds } }
        });
        const priceMap = Object.fromEntries(menuItems.map(m => [m.id, m.price]));

        await tx.preorderItem.createMany({
          data: preorder.map(p => ({
            bookingId: newBooking.id,
            menuItemId: p.menuItemId,
            quantity: p.quantity,
            unitPrice: priceMap[p.menuItemId] || 0,
            notes: p.notes || null
          }))
        });
      }

      return newBooking;
    });

    // Fetch complete booking with relations
    const fullBooking = await req.prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        table: { select: { label: true, seatCount: true } },
        restaurant: { select: { name: true } },
        preorderItems: {
          include: { menuItem: { select: { name: true } } }
        }
      }
    });

    res.status(201).json(fullBooking);
  } catch (err) {
    if (err.message === 'CONFLICT') {
      return res.status(409).json({ error: 'Table was just booked by someone else' });
    }
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings/mine — current user's bookings
router.get('/mine', authenticate, async (req, res) => {
  try {
    const bookings = await req.prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        table: { select: { label: true, seatCount: true } },
        restaurant: { select: { name: true, address: true } },
        preorderItems: {
          include: { menuItem: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id — booking detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        table: { select: { label: true, seatCount: true } },
        restaurant: { select: { name: true, address: true, phone: true } },
        preorderItems: {
          include: { menuItem: { select: { name: true } } }
        }
      }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await req.prisma.booking.findUnique({ where: { id } });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await req.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
