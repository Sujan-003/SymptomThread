import { useState } from 'react';
import axios from 'axios';

const TRIGGERS_LIST = [
  'Poor Sleep', 'Dairy', 'Gluten', 'Stress', 'Caffeine',
  'Dehydration', 'Alcohol', 'Weather Change', 'Screen Time', 'Missed Meal'
];

function SymptomForm() {
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [otherTrigger, setOtherTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  const handleTriggerChange = (trigger) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptomName.trim()) {
      setStatus({ type: 'error', message: 'Symptom name is required.' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Saving...' });
      
      const finalTriggers = [...selectedTriggers];
      if (otherTrigger.trim()) {
        finalTriggers.push(otherTrigger.trim());
      }

      const payload = {
        symptomName: symptomName.trim(),
        severity: Number(severity),
        triggers: finalTriggers,
        notes: notes.trim()
      };

      const res = await axios.post('http://localhost:5000/api/log-symptom', payload);
      
      if (res.status === 201) {
        setStatus({ type: 'success', message: 'Symptom logged successfully!' });
        // Reset form
        setSymptomName('');
        setSeverity(5);
        setSelectedTriggers([]);
        setOtherTrigger('');
        setNotes('');
        
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to log symptom. Please try again.' });
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Log a Symptom</h2>
      
      {status && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '4px',
          backgroundColor: status.type === 'success' ? '#065f46' : status.type === 'error' ? '#7f1d1d' : '#1e3a8a',
          color: 'white'
        }}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Symptom *</label>
          <input 
            type="text" 
            className="form-control"
            value={symptomName}
            onChange={(e) => setSymptomName(e.target.value)}
            placeholder="e.g. Headache, Nausea, Fatigue..."
            list="common-symptoms"
            required
          />
          <datalist id="common-symptoms">
            <option value="Headache" />
            <option value="Fatigue" />
            <option value="Nausea" />
            <option value="Bloating" />
            <option value="Brain Fog" />
            <option value="Joint Pain" />
          </datalist>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Severity ({severity}/10)
          </label>
          <input 
            type="range" 
            min="1" max="10" 
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Mild (1)</span>
            <span>Moderate (5)</span>
            <span>Severe (10)</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Potential Triggers</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {TRIGGERS_LIST.map(trigger => (
              <label key={trigger} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={selectedTriggers.includes(trigger)}
                  onChange={() => handleTriggerChange(trigger)}
                />
                {trigger}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Other trigger:</label>
            <input 
              type="text" 
              className="form-control"
              value={otherTrigger}
              onChange={(e) => setOtherTrigger(e.target.value)}
              placeholder="Type custom trigger..."
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes (Optional)</label>
          <textarea 
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows="3"
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Submit Log
        </button>

      </form>
    </div>
  );
}

export default SymptomForm;
