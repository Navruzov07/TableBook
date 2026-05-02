import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';
import { sendSMS, generateOTP } from '../utils/sms.js';

const router = Router();

// ── CEO passphrase backdoor (no phone / no DB record needed) ──────────────────
// Set CEO_SECRET in your .env to something long and random.
// On the login page a hidden "Staff Access" button reveals a passphrase field.
const CEO_SECRET = process.env.CEO_SECRET || 'tablebook-ceo-secret-2024';

// OTP validity window (minutes)
const OTP_TTL_MINUTES = 5;

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s\-()]/g, ''))) {
      return res.status(400).json({ error: 'Valid phone number required (e.g. +998901234567)' });
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, '');

    // Invalidate any existing unused OTPs for this phone
    await req.prisma.otpCode.updateMany({
      where: { phone: normalizedPhone, used: false },
      data: { used: true }
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await req.prisma.otpCode.create({
      data: { phone: normalizedPhone, code, expiresAt }
    });

    await sendSMS(normalizedPhone, `Your TableBook verification code: ${code}\nValid for ${OTP_TTL_MINUTES} minutes. Do not share it.`);

    res.json({ sent: true, expiresIn: OTP_TTL_MINUTES * 60 });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, '');

    // Find most recent valid OTP
    const otp = await req.prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp) {
      return res.status(400).json({ error: 'Code expired or not found. Request a new one.' });
    }

    if (otp.code !== code) {
      return res.status(400).json({ error: 'Incorrect code' });
    }

    // Mark OTP as used
    await req.prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true }
    });

    // Find or create user
    let user = await req.prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (!user) {
      user = await req.prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: name?.trim() || '',
          isPhoneVerified: true
        }
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, restaurantId: user.restaurantId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        isPhoneVerified: user.isPhoneVerified,
        trustScore: user.trustScore,
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── POST /api/auth/ceo-login ──────────────────────────────────────────────────
// CEO uses a secret passphrase — no phone / no DB lookup needed.
router.post('/ceo-login', (req, res) => {
  const { passphrase } = req.body;

  if (!passphrase || passphrase !== CEO_SECRET) {
    return res.status(401).json({ error: 'Invalid passphrase' });
  }

  const token = jwt.sign(
    { id: 0, phone: 'ceo', role: 'ceo', restaurantId: null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: 0, name: 'CEO', phone: 'ceo', role: 'ceo', restaurantId: null }
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'ceo') {
      return res.json({ id: 0, name: 'CEO', phone: 'ceo', role: 'ceo', restaurantId: null });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true, email: true, role: true, restaurantId: true,
        isPhoneVerified: true, trustScore: true, isBanned: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (req.user.role === 'ceo') {
      return res.json({ id: 0, name: name || 'CEO', phone: 'ceo', role: 'ceo', restaurantId: null });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email || null;

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, phone: true, email: true, role: true, restaurantId: true,
        isPhoneVerified: true, trustScore: true, isBanned: true
      }
    });

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
