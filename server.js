const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const Complaint = require('./models/Complaint');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CyberGuard AI Backend is Running' });
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

// JWT Protection Middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Access denied. No token provided.' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Complaint Routes
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
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// Static Fallback Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;