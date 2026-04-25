import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = Router();

// CEO hardcoded credentials (MVP — no DB lookup needed)
const CEO_EMAIL = 'tablebookceo@gmail.com';
const CEO_PASSWORD = 'navruzov7ceo!';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await req.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        role: role === 'admin' ? 'admin' : 'customer'
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurantId: user.restaurantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { 
        id: user.id, name: user.name, email: user.email, role: user.role, 
        isPhoneVerified: user.isPhoneVerified, trustScore: user.trustScore, isBanned: user.isBanned 
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // ── CEO shortcut ──────────────────────────────────────────────────────────
    if (email === CEO_EMAIL && password === CEO_PASSWORD) {
      const token = jwt.sign(
        { id: 0, email: CEO_EMAIL, role: 'ceo', restaurantId: null },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { id: 0, name: 'CEO', email: CEO_EMAIL, role: 'ceo', restaurantId: null }
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurantId: user.restaurantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId,
        isPhoneVerified: user.isPhoneVerified, trustScore: user.trustScore, isBanned: user.isBanned
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    // CEO has no DB record (id = 0)
    if (req.user.role === 'ceo') {
      return res.json({ id: 0, name: 'CEO', email: CEO_EMAIL, role: 'ceo', restaurantId: null });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, name: true, email: true, phone: true, role: true, restaurantId: true,
        isPhoneVerified: true, trustScore: true, isBanned: true 
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // CEO mock update (doesn't persist to DB, but returns success)
    if (req.user.role === 'ceo') {
      return res.json({ id: 0, name: name || 'CEO', phone: phone || '', email: CEO_EMAIL, role: 'ceo', restaurantId: null });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) {
      data.phone = phone || null;
      // If phone changes, we might want to reset isPhoneVerified, but for now we just save it
    }

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { 
        id: true, name: true, email: true, phone: true, role: true, restaurantId: true,
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
