import { addMinutes, parse, format, isWithinInterval } from 'date-fns';

/**
 * Check if a table is available for a given time slot.
 * Returns true if available, false if conflicting booking exists.
 */
export async function isTableAvailable(prisma, tableId, bookingDate, startTime, endTime) {
  const conflicts = await prisma.booking.findMany({
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
  return conflicts.length === 0;
}

/**
 * Calculate end time based on start time and duration in minutes.
 */
export function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

/**
 * Get availability for all tables of a restaurant at a given date/time.
 */
export async function getRestaurantAvailability(prisma, restaurantId, bookingDate, startTime, durationMinutes = 90) {
  const endTime = calculateEndTime(startTime, durationMinutes);

  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId },
    include: {
      bookings: {
        where: {
          bookingDate,
          status: { not: 'cancelled' },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      }
    }
  });

  return tables.map(table => ({
    id: table.id,
    tableRef: table.tableRef,
    label: table.label,
    seatCount: table.seatCount,
    available: table.bookings.length === 0
  }));
}
