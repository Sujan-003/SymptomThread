const express = require('express');
const router = express.Router();
const SymptomLog = require('../models/SymptomLog');
const { getDb } = require('../db/arango');

const formatKey = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

const syncToArango = async (logData) => {
  const db = getDb();
  const userId = logData.userId || 'demo_user';

  const symptomsCollection = db.collection('symptoms');
  const triggersCollection = db.collection('triggers');
  const triggeredByEdge = db.collection('triggered_by');
  const coOccursEdge = db.collection('co_occurs_with');

  const symBaseKey = formatKey(logData.symptomName);
  const symKey = `${userId}_${symBaseKey}`;

  // 1. Upsert Symptom Node
  let symExists = await symptomsCollection.documentExists(symKey);
  if (!symExists) {
    await symptomsCollection.save({ _key: symKey, name: logData.symptomName, userId, totalCount: 1 });
  } else {
    // Increment totalCount
    const doc = await symptomsCollection.document(symKey);
    await symptomsCollection.update(symKey, { totalCount: (doc.totalCount || 0) + 1 });
  }

  // 2. Upsert Triggers and Triggered-By Edges
  if (logData.triggers && Array.isArray(logData.triggers)) {
    for (const triggerName of logData.triggers) {
      if (!triggerName) continue;
      const trigBaseKey = formatKey(triggerName);
      const trigKey = `${userId}_${trigBaseKey}`;

      let trigExists = await triggersCollection.documentExists(trigKey);
      if (!trigExists) {
        await triggersCollection.save({ _key: trigKey, name: triggerName, userId });
      }

      // Edge from Symptom to Trigger
      const edgeKey = `${userId}_${symBaseKey}_${trigBaseKey}`;
      let edgeExists = await triggeredByEdge.documentExists(edgeKey);
      if (!edgeExists) {
        await triggeredByEdge.save({
          _key: edgeKey,
          _from: `symptoms/${symKey}`,
          _to: `triggers/${trigKey}`,
          userId,
          occurrences: 1
        });
      } else {
        const doc = await triggeredByEdge.document(edgeKey);
        await triggeredByEdge.update(edgeKey, { occurrences: (doc.occurrences || 0) + 1 });
      }
    }
  }

  // 3. Co-occurrences based on last 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentLogs = await SymptomLog.find({
    userId,
    loggedAt: { $gte: fortyEightHoursAgo },
    _id: { $ne: logData._id } // exclude current log
  });

  // Unique symptoms in the 48h window
  const uniqueRecentSymptoms = [...new Set(recentLogs.map(l => l.symptomName))];

  for (const otherSymName of uniqueRecentSymptoms) {
    if (otherSymName.toLowerCase() === logData.symptomName.toLowerCase()) continue; // Don't link to self

    const otherSymBaseKey = formatKey(otherSymName);
    const otherSymKey = `${userId}_${otherSymBaseKey}`;

    // Ensure the other symptom node exists just in case
    let otherExists = await symptomsCollection.documentExists(otherSymKey);
    if (!otherExists) {
      await symptomsCollection.save({ _key: otherSymKey, name: otherSymName, userId, totalCount: 1 });
    }

    // Bidirectional/Undirected representation: just sort keys alphabetically so A-B is same as B-A
    const sortedKeys = [symBaseKey, otherSymBaseKey].sort();
    const coOccursKey = `${userId}_${sortedKeys[0]}_${sortedKeys[1]}`;

    let coEdgeExists = await coOccursEdge.documentExists(coOccursKey);
    if (!coEdgeExists) {
      await coOccursEdge.save({
        _key: coOccursKey,
        _from: `symptoms/${userId}_${sortedKeys[0]}`,
        _to: `symptoms/${userId}_${sortedKeys[1]}`,
        userId,
        occurrences: 1
      });
    } else {
      const doc = await coOccursEdge.document(coOccursKey);
      await coOccursEdge.update(coOccursKey, { occurrences: (doc.occurrences || 0) + 1 });
    }
  }
};

// Log a Symptom
router.post('/log-symptom', async (req, res) => {
  try {
    const { symptomName, severity, triggers, notes } = req.body;
    const userId = 'demo_user';

    // 1. Save to MongoDB (syncedToGraph: false)
    const log = new SymptomLog({ userId, symptomName, severity, triggers, notes, syncedToGraph: false });
    const savedLog = await log.save();

    // 2. Dual-Sync to ArangoDB
    try {
      await syncToArango(savedLog);
      
      // Update Mongo document on success
      savedLog.syncedToGraph = true;
      await savedLog.save();
      res.status(201).json({ message: 'Log saved and synced', log: savedLog });
    } catch (arangoError) {
      console.error('Arango sync failed:', arangoError);
      res.status(201).json({ 
        message: 'Log saved to MongoDB but graph sync failed', 
        log: savedLog,
        warning: arangoError.message 
      });
    }

  } catch (error) {
    console.error('Error logging symptom:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// View Timeline
router.get('/timeline', async (req, res) => {
  try {
    const userId = 'demo_user';
    const logs = await SymptomLog.find({ userId }).sort({ loggedAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// View Graph
router.get('/graph-data', async (req, res) => {
  try {
    const db = getDb();
    const userId = 'demo_user';
    
    const symptoms = await db.query(`FOR s IN symptoms FILTER s.userId == @userId RETURN s`, { userId }).then(c => c.all());
    const triggers = await db.query(`FOR t IN triggers FILTER t.userId == @userId RETURN t`, { userId }).then(c => c.all());
    
    const triggered_by = await db.query(`FOR e IN triggered_by FILTER e.userId == @userId RETURN e`, { userId }).then(c => c.all());
    const co_occurs_with = await db.query(`FOR e IN co_occurs_with FILTER e.userId == @userId RETURN e`, { userId }).then(c => c.all());

    res.json({
      nodes: { symptoms, triggers },
      edges: { triggered_by, co_occurs_with }
    });
  } catch (error) {
    console.error('Error fetching graph:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Correlations for a specific symptom
router.get('/correlations/:symptom', async (req, res) => {
  try {
    const db = getDb();
    const userId = 'demo_user';
    const symBaseKey = formatKey(req.params.symptom);
    const symId = `symptoms/${userId}_${symBaseKey}`;

    // Get Top 5 Co-occurring Symptoms
    const coOccurring = await db.query(`
      FOR v, e IN 1..1 ANY @symId co_occurs_with
      FILTER e.userId == @userId
      SORT e.occurrences DESC
      LIMIT 5
      RETURN { symptom: v.name, occurrences: e.occurrences }
    `, { symId, userId }).then(c => c.all());

    // Get Triggers for this symptom
    const commonTriggers = await db.query(`
      FOR v, e IN 1..1 OUTBOUND @symId triggered_by
      FILTER e.userId == @userId
      SORT e.occurrences DESC
      RETURN { trigger: v.name, occurrences: e.occurrences }
    `, { symId, userId }).then(c => c.all());

    res.json({
      coOccurring,
      commonTriggers
    });
  } catch (error) {
    console.error('Error fetching correlations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Seed Endpoint
router.post('/seed', async (req, res) => {
  try {
    const db = getDb();
    const userId = 'demo_user';

    // 1. Clear Collections
    await SymptomLog.deleteMany({ userId });
    
    const collections = ['symptoms', 'triggers', 'triggered_by', 'co_occurs_with'];
    for (const name of collections) {
      const col = db.collection(name);
      if (await col.exists()) {
        await col.truncate();
      }
    }

    // 2. Generate 70 synthetic logs
    const symptomsList = ['Headache', 'Fatigue', 'Nausea', 'Bloating', 'Brain Fog', 'Joint Pain', 'Dizziness', 'Heart Palpitations'];
    const triggersList = ['Poor Sleep', 'Dairy', 'Gluten', 'Stress', 'Caffeine', 'Dehydration', 'Alcohol', 'Weather Change'];

    const logs = [];
    const now = Date.now();
    
    for (let i = 0; i < 70; i++) {
      // Create timestamps going back up to 30 days, but clustered
      const daysAgo = Math.floor(Math.random() * 30);
      // Ensure logs are spread out but some happen within the 48h windows of each other
      const hoursOffset = Math.floor(Math.random() * 24);
      const loggedAt = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursOffset * 60 * 60 * 1000));
      
      let symptomName = symptomsList[Math.floor(Math.random() * symptomsList.length)];
      let triggers = [];
      let severity = Math.floor(Math.random() * 10) + 1;
      
      // Force correlations for seed data testing: Headache often comes with Fatigue and Poor Sleep
      if (i < 15) {
        symptomName = 'Headache';
        triggers = ['Poor Sleep', 'Stress'];
        severity = 8;
      } else if (i >= 15 && i < 30) {
        symptomName = 'Fatigue';
        triggers = ['Poor Sleep'];
        // we'll make sure these have timestamps very close to the headache ones to force co-occurrences
      } else if (i === 30 || i === 31) {
        symptomName = 'Nausea';
        triggers = ['Dairy'];
      } else if (i === 32 || i === 33) {
        symptomName = 'Bloating';
        triggers = ['Dairy'];
      } else {
        // Random triggers
        const numTriggers = Math.floor(Math.random() * 3);
        for(let j = 0; j < numTriggers; j++) {
           const trig = triggersList[Math.floor(Math.random() * triggersList.length)];
           if (!triggers.includes(trig)) triggers.push(trig);
        }
      }

      logs.push(new SymptomLog({
        userId,
        symptomName,
        severity,
        triggers,
        notes: `Synthetic log ${i}`,
        loggedAt,
        syncedToGraph: false
      }));
    }

    // Sort logs chronologically to simulate real ingestion
    logs.sort((a, b) => a.loggedAt - b.loggedAt);

    let successCount = 0;
    for (const log of logs) {
       const savedLog = await log.save();
       try {
         await syncToArango(savedLog);
         savedLog.syncedToGraph = true;
         await savedLog.save();
         successCount++;
       } catch (err) {
         console.error('Seed sync error:', err);
       }
    }

    res.status(200).json({ message: `Seeded ${successCount} logs and auto-populated graph` });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Internal Server Error during seed' });
  }
});

module.exports = router;
