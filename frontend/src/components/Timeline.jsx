import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Timeline() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/timeline');
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load timeline. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    if (severity <= 3) return { bg: 'bg-severity-low', border: 'border-severity-low', onBg: 'text-on-severity-low', icon: 'check_circle', label: 'Mild' };
    if (severity <= 6) return { bg: 'bg-severity-medium', border: 'border-severity-medium', onBg: 'text-on-severity-medium', icon: 'circle', label: 'Medium' };
    return { bg: 'bg-severity-high', border: 'border-severity-high', onBg: 'text-on-severity-high', icon: 'warning', label: 'High' };
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const isYesterday = new Date(today.setDate(today.getDate() - 1)).getDate() === d.getDate();
    
    let timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  if (loading) return <div className="p-8 text-center text-on-surface">Loading timeline...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <main className="max-w-3xl mx-auto px-container-margin py-section-gap w-full">
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-stack-sm">Symptom Timeline</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">Reviewing recent activity</p>
        </div>
        <div className="text-right">
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest hidden md:block">Source: MongoDB</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4 mb-stack-lg border border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline">calendar_month</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Showing: Last 7 Days</span>
        </div>
        <button className="font-body-sm text-body-sm text-primary flex items-center gap-1 hover:underline">
          Filter <span className="material-symbols-outlined" style={{fontSize: '16px'}}>filter_list</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center p-8 text-secondary border border-dashed border-outline-variant rounded-xl">
          No symptoms logged yet. Go to the Log tab to add one!
        </div>
      ) : (
        <div className="relative pl-2">
          {logs.map((log, index) => {
            const isLast = index === logs.length - 1;
            const style = getSeverityStyle(log.severity);
            
            return (
              <div key={log._id} className={`relative pl-12 pb-stack-lg group ${isLast ? 'last-card' : ''}`}>
                <div className="thread-line"></div>
                <div className={`absolute left-0 top-6 w-8 h-8 rounded-full bg-surface border-2 ${style.border} flex items-center justify-center z-10`}>
                  <div className={`w-3 h-3 rounded-full ${style.bg}`}></div>
                </div>
                
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant group-hover:shadow-[0_4px_30px_rgba(0,0,0,0.08)] transition-shadow">
                  <div className="flex justify-between items-start mb-stack-md">
                    <div>
                      <h3 className="font-title-sm text-title-sm text-on-surface mb-1">{log.symptomName}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(log.loggedAt)}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${style.bg} px-3 py-1 rounded-full`}>
                      <span className={`material-symbols-outlined ${style.onBg}`} style={{fontSize: '14px'}}>{style.icon}</span>
                      <span className={`font-label-caps text-label-caps ${style.onBg}`}>{style.label}</span>
                    </div>
                  </div>
                  
                  {log.notes && (
                    <p className="font-body-base text-body-base text-on-surface mb-stack-md">{log.notes}</p>
                  )}
                  
                  {log.triggers && log.triggers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-stack-md">
                      {log.triggers.map((trigger, i) => (
                        <span key={i} className="px-3 py-1 bg-surface-container-high rounded-full font-body-sm text-body-sm text-on-surface-variant border border-outline-variant">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t border-outline-variant">
                    <span className="material-symbols-outlined text-primary" style={{fontSize: '20px'}}>analytics</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Severity Score: {log.severity}/10</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {logs.length > 0 && (
        <div className="flex justify-center mt-section-gap">
          <button className="h-12 px-6 rounded-full bg-surface-container border border-outline-variant font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            Load More History
          </button>
        </div>
      )}
    </main>
  );
}

export default Timeline;
