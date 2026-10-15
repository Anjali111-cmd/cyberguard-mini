const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true },
  status: { type: String, default: 'Registered' },
  date: { type: String, required: true },
  updatedAt: { type: String, required: true },
  evidence: { type: [String], default: [] },
  screenshots: { type: [String], default: [] }
});

module.exports = mongoose.model('Complaint', complaintSchema);