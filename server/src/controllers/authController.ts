import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../db/index.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.ts';
import { User, UserRole } from '../types/index.ts';

export function login(req: Request, res: Response): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  const { passwordHash, ...userWithoutPassword } = user;

  // Audit log
  db.auditLogs.unshift({
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    details: `User logged in with role ${user.role}`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip,
  });
  saveDatabase();

  res.json({
    success: true,
    token,
    user: userWithoutPassword,
  });
}

export function register(req: Request, res: Response): void {
  const { name, email, password, role = 'STUDENT', department, studentId } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    return;
  }

  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${uuidv4().slice(0, 8)}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: (role as UserRole) || 'STUDENT',
    department: department || 'General Studies',
    studentId: studentId || (role === 'STUDENT' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.auditLogs.unshift({
    id: uuidv4(),
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    action: 'USER_REGISTER',
    details: `New account registered as ${newUser.role}`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip,
  });
  saveDatabase();

  const token = generateToken(newUser);
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    token,
    user: userWithoutPassword,
  });
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json({
    success: true,
    user: userWithoutPassword,
  });
}

export function demoSwitch(req: Request, res: Response): void {
  const { role } = req.body;
  const db = getDb();

  let targetUser = db.users.find((u) => u.role === role);
  if (!targetUser) {
    // Fallback to first user
    targetUser = db.users[0];
  }

  if (!targetUser) {
    res.status(404).json({ success: false, message: 'No demo user found for this role.' });
    return;
  }

  const token = generateToken(targetUser);
  const { passwordHash, ...userWithoutPassword } = targetUser;

  res.json({
    success: true,
    token,
    user: userWithoutPassword,
  });
}
