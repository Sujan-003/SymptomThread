import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';

function GraphView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [loadingCorrelations, setLoadingCorrelations] = useState(false);
  
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/graph-data');
      const { nodes, edges } = res.data;
      
      const visNodes = [
        ...nodes.symptoms.map(s => ({ 
          id: s._id, // like 'symptoms/demo_user_headache'
          label: s.name, 
          group: 'symptom',
          value: s.totalCount || 1, // for node sizing
          title: `Logged ${s.totalCount || 1} times`
        })),
        ...nodes.triggers.map(t => ({ 
          id: t._id, // like 'triggers/demo_user_dairy'
          label: t.name, 
          group: 'trigger',
          value: 1, // trigger nodes are fixed size or could be sized by frequency
          title: 'Trigger'
        }))
      ];

      const visEdges = [
        ...edges.triggered_by.map(e => ({ 
          from: e._from, 
          to: e._to, 
          value: e.occurrences || 1, // for edge thickness
          color: '#f59e0b',
          title: `Triggered ${e.occurrences || 1} times`
        })),
        ...edges.co_occurs_with.map(e => ({ 
          from: e._from, 
          to: e._to, 
          value: e.occurrences || 1,
          color: '#3b82f6',
          title: `Co-occurred ${e.occurrences || 1} times`,
          dashes: true
        }))
      ];

      initNetwork({ nodes: visNodes, edges: visEdges });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load graph data.');
      setLoading(false);
    }
  };

  const initNetwork = (data) => {
    if (!containerRef.current) return;

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 15,
          max: 40,
          label: { enabled: true, min: 14, max: 20 }
        },
        font: {
          color: '#f8fafc',
          face: 'Inter, sans-serif'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        scaling: { min: 1, max: 6 },
        shadow: true,
        smooth: { type: 'continuous' }
      },
      groups: {
        symptom: {
          color: { background: '#3b82f6', border: '#2563eb', highlight: { background: '#60a5fa', border: '#3b82f6' } }
        },
        trigger: {
          color: { background: '#f59e0b', border: '#d97706', highlight: { background: '#fbbf24', border: '#f59e0b' } },
          shape: 'square'
        }
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -35,
          centralGravity: 0.005,
          springLength: 200,
          springConstant: 0.18
        },
        maxVelocity: 146,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 }
      },
      interaction: { hover: true }
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new Network(containerRef.current, data, options);

    networkRef.current.on('click', async (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]; // e.g. "symptoms/demo_user_headache"
        
        // Find the node object to check its group
        const nodeObj = data.nodes.find(n => n.id === nodeId);
        
        if (nodeObj && nodeObj.group === 'symptom') {
          setSelectedNode(nodeObj.label);
          await fetchCorrelations(nodeObj.label);
        } else {
          setSelectedNode(nodeObj ? nodeObj.label : 'Trigger');
          setCorrelations(null); // Clear correlations for triggers
        }
      } else {
        setSelectedNode(null);
        setCorrelations(null);
      }
    });
  };

  const fetchCorrelations = async (symptomName) => {
    setLoadingCorrelations(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/correlations/${symptomName}`);
      setCorrelations(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingCorrelations(false);
  };

  const seedDatabase = async () => {
    try {
      if (!window.confirm("This will clear all data and insert 70 synthetic logs. Continue?")) return;
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/seed');
      alert(res.data.message);
      fetchGraphData();
    } catch (err) {
      console.error(err);
      alert('Error seeding database');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '80vh' }}>
      <div className="glass-panel" style={{ flex: '1', position: 'relative', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Network Graph</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', backgroundColor: '#1e293b', borderRadius: '4px', border: '1px solid #334155' }}>
              Source: ArangoDB
            </div>
            <button className="btn btn-secondary" onClick={seedDatabase}>Seed Demo Data</button>
            <button className="btn btn-secondary" onClick={fetchGraphData}>Refresh</button>
          </div>
        </div>
        
        <div style={{ flex: 1, position: 'relative', minHeight: '500px' }}>
          <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          
          {loading && (
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.5)' }}>Loading graph...</div>
          )}
          
          {error && (
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.5)' }}>{error}</div>
          )}
          
          {!loading && !error && (
            <div style={{ position: 'absolute', bottom: '2.5rem', right: '1rem', background: 'rgba(15,23,42,0.8)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                <span>Symptom Node</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f59e0b' }}></span>
                <span>Trigger Node</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ width: '350px', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>Node Details</h3>
        
        {!selectedNode ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '2rem' }}>
            Click a node to see correlations
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#60a5fa', marginBottom: '1.5rem' }}>{selectedNode}</h2>
            
            {loadingCorrelations ? (
              <div>Loading correlations...</div>
            ) : !correlations ? (
              <div style={{ color: '#94a3b8' }}>No correlations for trigger nodes.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                <div>
                  <h4 style={{ color: '#cbd5e1', marginBottom: '0.5rem' }}>Co-occurs with (Symptoms)</h4>
                  {correlations.coOccurring.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No significant co-occurrences found.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {correlations.coOccurring.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                          <span>{item.symptom}</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', backgroundColor: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{item.occurrences} times</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 style={{ color: '#cbd5e1', marginBottom: '0.5rem' }}>Common Triggers</h4>
                  {correlations.commonTriggers.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No known triggers logged.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {correlations.commonTriggers.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                          <span>{item.trigger}</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', backgroundColor: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{item.occurrences} times</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GraphView;
