import { useState, useEffect } from 'react';
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

  const getSeverityColor = (severity) => {
    if (severity <= 3) return '#10b981'; // Green
    if (severity <= 6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading timeline...</div>;
  if (error) return <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '2rem' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Your Symptom Timeline</h2>
        <div style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', backgroundColor: '#1e293b', borderRadius: '4px', border: '1px solid #334155' }}>
          Source: MongoDB
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
          No symptoms logged yet. Go to the Log tab to add one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {logs.map(log => (
            <div key={log._id} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', 
                backgroundColor: getSeverityColor(log.severity) 
              }} />
              
              <div style={{ paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>{log.symptomName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(log.loggedAt).toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ 
                    backgroundColor: getSeverityColor(log.severity) + '33', 
                    color: getSeverityColor(log.severity),
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    Severity: {log.severity}/10
                  </span>
                </div>

                {log.triggers && log.triggers.length > 0 && (
                  <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginRight: '0.5rem' }}>Triggers:</span>
                    {log.triggers.map((trigger, i) => (
                      <span key={i} style={{ 
                        backgroundColor: '#334155', 
                        color: '#cbd5e1', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem' 
                      }}>
                        {trigger}
                      </span>
                    ))}
                  </div>
                )}

                {log.notes && (
                  <div style={{ fontSize: '0.9rem', color: '#cbd5e1', backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '4px' }}>
                    <em>"{log.notes}"</em>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Timeline;
