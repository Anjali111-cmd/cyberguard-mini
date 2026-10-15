const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Complaint = require('./models/Complaint');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB Connection Cache for Vercel
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing');
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Admin Login Endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const envUsername = process.env.ADMIN_USERNAME || 'admin';
  const envPassword = process.env.ADMIN_PASSWORD || 'anjali@1234';

  if (username === envUsername && password === envPassword) {
    const token = jwt.sign(
      { role: 'admin' }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '2h' }
    );
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// JWT Verification Middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Access denied.' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Complaint API Routes
app.post('/api/complaints', async (req, res) => {
  try {
    const newComplaint = new Complaint(req.body);
    await newComplaint.save();
    res.status(201).json(newComplaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save complaint' });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.delete('/api/complaints/:id', verifyAdmin, async (req, res) => {
  try {
    await Complaint.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

module.exports = app;