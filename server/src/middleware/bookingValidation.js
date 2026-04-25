export async function validateBookingRequest(req, res, next) {
  const { termsAccepted, preorder } = req.body;
  
  // 1. Legal Check
  if (!termsAccepted) {
    return res.status(403).json({ error: "You must accept the Terms of Service to book." });
  }

  // Get full user profile from DB to ensure fresh data
  const user = await req.prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  // 2. Ban Check
  if (user.isBanned) {
    return res.status(403).json({ error: "Your account is permanently restricted." });
  }

  // 3. Verification Check
  if (!user.isPhoneVerified) {
    return res.status(403).json({ error: "Phone verification required to make a booking." });
  }

  // 4. Single Active Booking Limit
  const activeBooking = await req.prisma.booking.findFirst({
    where: { 
      userId: user.id, 
      status: { in: ["confirmed", "pending_deposit"] } 
    }
  });
  
  if (activeBooking) {
    return res.status(409).json({ error: "You already have an active booking. Only 1 active booking is allowed." });
  }

  // 5. Trust Score Dynamic Restrictions
  if (preorder && preorder.length > 0 && user.trustScore < 50) {
     return res.status(403).json({ error: "Trust score too low to use pre-order functionality." });
  }

  // Pass fresh user data downstream just in case
  req.fullUser = user;
  next();
}
