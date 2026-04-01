const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  size: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('File', fileSchema);
