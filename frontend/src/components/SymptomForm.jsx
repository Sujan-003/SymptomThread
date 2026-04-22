import React, { useState } from 'react';
import axios from 'axios';

const TRIGGERS_LIST = [
  { id: 'sleep', icon: 'bed', label: 'Poor Sleep' },
  { id: 'stress', icon: 'psychology', label: 'Stress' },
  { id: 'diet', icon: 'restaurant', label: 'Diet' },
  { id: 'weather', icon: 'routine', label: 'Weather' }
];

function SymptomForm() {
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [customTriggers, setCustomTriggers] = useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTriggerText, setNewTriggerText] = useState('');

  const handleTriggerChange = (triggerLabel) => {
    setSelectedTriggers(prev => 
      prev.includes(triggerLabel) ? prev.filter(t => t !== triggerLabel) : [...prev, triggerLabel]
    );
  };

  const handleAddCustomTrigger = () => {
    const trimmed = newTriggerText.trim();
    if (!trimmed) return;
    // Avoid exact duplicates (case-insensitive)
    const exists = [...TRIGGERS_LIST.map(t => t.label), ...customTriggers]
      .some(l => l.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setCustomTriggers(prev => [...prev, trimmed]);
    }
    // Auto-select the newly added trigger
    setSelectedTriggers(prev =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setNewTriggerText('');
    setShowAddInput(false);
  };

  const handleAddInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTrigger();
    } else if (e.key === 'Escape') {
      setNewTriggerText('');
      setShowAddInput(false);
    }
  };

  const handleSubmit = async () => {
    if (!symptomName.trim()) {
      setStatus({ type: 'error', message: 'Symptom is required.' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Saving...' });
      
      const payload = {
        symptomName: symptomName.trim(),
        severity: Number(severity),
        triggers: selectedTriggers,
        notes: notes.trim()
      };

      const res = await axios.post('http://localhost:5000/api/log-symptom', payload);
      
      if (res.status === 201) {
        setStatus({ type: 'success', message: 'Symptom logged successfully!' });
        // Reset form
        setSymptomName('');
        setSeverity(5);
        setSelectedTriggers([]);
        setNotes('');
        
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to log symptom.' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-container-margin md:p-section-gap max-w-3xl mx-auto w-full mt-4 md:mt-0">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full overflow-hidden border border-surface-variant/50">
        <div className="p-6 md:p-8 space-y-stack-lg">
          
          {/* Header */}
          <div className="text-center">
            <h2 className="font-display-lg text-display-lg text-on-surface mb-2 hidden md:block">Log a Symptom</h2>
            <p className="font-body-base text-body-base text-secondary">How are you feeling right now?</p>
          </div>

          {status && (
            <div className={`p-4 rounded-lg text-center font-title-sm text-white ${status.type === 'success' ? 'bg-green-600' : status.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
              {status.message}
            </div>
          )}

          <form className="space-y-stack-lg">
            {/* Symptom Dropdown */}
            <div className="space-y-stack-sm">
              <label className="block font-title-sm text-title-sm text-on-surface" htmlFor="symptom-select">Symptom</label>
              <div className="relative">
                <select 
                  id="symptom-select"
                  className="w-full h-14 bg-surface-container-low border border-outline-variant text-on-surface font-body-base text-body-base rounded-lg px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-surface-container-lowest transition-colors cursor-pointer"
                  value={symptomName}
                  onChange={(e) => setSymptomName(e.target.value)}
                >
                  <option disabled value="">Select a symptom...</option>
                  <option value="Headache">Headache</option>
                  <option value="Fatigue">Fatigue</option>
                  <option value="Nausea">Nausea</option>
                  <option value="Brain Fog">Brain Fog</option>
                  <option value="Joint Pain">Joint Pain</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            {/* Severity Slider */}
            <div className="space-y-stack-sm pt-2">
              <div className="flex justify-between items-end">
                <label className="block font-title-sm text-title-sm text-on-surface" htmlFor="severity">Severity</label>
                <span className="font-body-base text-body-base text-primary font-bold">{severity} / 10</span>
              </div>
              <div className="px-2 py-4">
                <input 
                  type="range" 
                  id="severity" 
                  min="1" max="10" 
                  className="w-full" 
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                />
              </div>
              <div className="flex justify-between font-label-caps text-label-caps text-secondary px-1">
                <span>MILD</span>
                <span>SEVERE</span>
              </div>
            </div>

            {/* Triggers / Tags */}
            <div className="space-y-stack-sm pt-2">
              <label className="block font-title-sm text-title-sm text-on-surface">Potential Triggers</label>
              <div className="flex flex-wrap gap-3 items-center">
                {TRIGGERS_LIST.map(trigger => (
                  <label key={trigger.id} className="cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="trigger" 
                      value={trigger.id} 
                      className="peer sr-only" 
                      checked={selectedTriggers.includes(trigger.label)}
                      onChange={() => handleTriggerChange(trigger.label)}
                    />
                    <div className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary-container transition-colors select-none flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{fontSize: '16px'}}>{trigger.icon}</span>
                      {trigger.label}
                    </div>
                  </label>
                ))}

                {/* Custom trigger chips */}
                {customTriggers.map(ct => (
                  <label key={ct} className="cursor-pointer">
                    <input 
                      type="checkbox"
                      className="peer sr-only"
                      checked={selectedTriggers.includes(ct)}
                      onChange={() => handleTriggerChange(ct)}
                    />
                    <div className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary-container transition-colors select-none flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{fontSize: '16px'}}>label</span>
                      {ct}
                    </div>
                  </label>
                ))}

                {/* +Add button / inline input */}
                {showAddInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={newTriggerText}
                      onChange={e => setNewTriggerText(e.target.value)}
                      onKeyDown={handleAddInputKeyDown}
                      placeholder="e.g. Caffeine"
                      className="h-9 px-3 rounded-full border border-primary bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary w-32 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTrigger}
                      className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                      title="Confirm"
                    >
                      <span className="material-symbols-outlined" style={{fontSize: '16px'}}>check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewTriggerText(''); setShowAddInput(false); }}
                      className="w-8 h-8 rounded-full border border-outline-variant text-secondary flex items-center justify-center hover:bg-surface-container-low transition-colors"
                      title="Cancel"
                    >
                      <span className="material-symbols-outlined" style={{fontSize: '16px'}}>close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddInput(true)}
                    className="px-4 py-2 rounded-full border border-dashed border-outline-variant text-secondary font-body-sm text-body-sm hover:bg-surface-container-low hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '16px'}}>add</span> Add
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-stack-sm pt-2">
              <label className="block font-title-sm text-title-sm text-on-surface" htmlFor="notes">
                Additional Notes <span className="text-secondary font-body-sm text-body-sm font-normal">(Optional)</span>
              </label>
              <textarea 
                id="notes" 
                rows="3" 
                placeholder="Any specific details?"
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface font-body-base text-body-base rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-surface-container-lowest transition-colors resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="button" 
                onClick={handleSubmit}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-[0.98]"
              >
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                Save Entry
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-surface-container border-t border-surface-variant/50 p-4 text-center">
          <p className="font-label-caps text-label-caps text-secondary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>database</span>
            Source: MongoDB
          </p>
        </div>
      </div>
    </main>
  );
}

export default SymptomForm;
