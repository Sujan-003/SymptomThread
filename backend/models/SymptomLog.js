const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'demo_user',
    required: true
  },
  symptomName: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  triggers: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  loggedAt: {
    type: Date,
    default: Date.now
  },
  syncedToGraph: {
    type: Boolean,
    default: false
  }
});

const SymptomLog = mongoose.model('SymptomLog', symptomLogSchema);

module.exports = SymptomLog;
