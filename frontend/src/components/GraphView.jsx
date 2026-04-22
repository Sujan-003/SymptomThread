import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';

function GraphView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeType, setNodeType] = useState(null); // 'symptom' or 'trigger'
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
          id: s._id,
          label: s.name, 
          group: 'symptom',
          value: s.totalCount || 1,
          title: `Logged ${s.totalCount || 1} times`
        })),
        ...nodes.triggers.map(t => ({ 
          id: t._id,
          label: t.name, 
          group: 'trigger',
          value: 1,
          title: 'Trigger'
        }))
      ];

      const visEdges = [
        ...edges.triggered_by.map(e => ({ 
          from: e._from, 
          to: e._to, 
          value: e.occurrences || 1,
          color: '#475569', // Darkened relationship color
          title: `Triggered ${e.occurrences || 1} times`
        })),
        ...edges.co_occurs_with.map(e => ({ 
          from: e._from, 
          to: e._to, 
          value: e.occurrences || 1,
          color: '#475569', // Darkened relationship color
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
          label: { enabled: true, min: 16, max: 24 }
        },
        font: {
          color: '#0d1c2d', // Dark text for light canvas
          size: 18, // Increased font size
          face: 'Manrope, sans-serif',
          strokeWidth: 3, // White outline for contrast
          strokeColor: '#ffffff',
          bold: 'true'
        },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 10,
          x: 0,
          y: 4
        }
      },
      edges: {
        scaling: { min: 1, max: 6 },
        smooth: { type: 'continuous' }
      },
      groups: {
        symptom: {
          color: { background: '#4648d4', border: '#e1e0ff', highlight: { background: '#6063ee', border: '#4648d4' } }
        },
        trigger: {
          color: { background: '#904900', border: '#ffdcc5', highlight: { background: '#b55d00', border: '#904900' } },
          shape: 'square'
        }
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -150,
          centralGravity: 0.001,
          springLength: 350,
          springConstant: 0.05
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
        const nodeId = params.nodes[0];
        const nodeObj = data.nodes.find(n => n.id === nodeId);
        
        if (nodeObj && nodeObj.group === 'symptom') {
          setSelectedNode(nodeObj.label);
          setNodeType('symptom');
          await fetchCorrelations(nodeObj.label);
        } else {
          setSelectedNode(nodeObj ? nodeObj.label : 'Trigger');
          setNodeType('trigger');
          setCorrelations(null);
        }
      } else {
        setSelectedNode(null);
        setNodeType(null);
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
    <main className="flex-1 flex flex-col md:flex-row w-full h-[calc(100vh-64px)] max-w-[1600px] mx-auto overflow-hidden">
      {/* Left Panel: Graph Visualization (65%) */}
      <section className="flex-1 md:w-[65%] relative bg-white flex flex-col h-full">
        {/* Graph Header & Actions */}
        <div className="w-full p-6 pb-12 flex justify-between items-start z-10 pointer-events-none relative">
          <div className="pointer-events-auto bg-white/80 p-2 rounded backdrop-blur-sm">
            <h1 className="font-headline-md text-headline-md text-on-surface mb-1">Correlation Network</h1>
            <p className="font-body-sm text-body-sm text-secondary">Mapping symptoms and triggers.</p>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={seedDatabase}
              className="h-10 px-4 rounded-lg border border-outline-variant text-on-surface font-title-sm text-title-sm bg-white hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">data_array</span>
              <span className="hidden md:inline">Seed Demo Data</span>
            </button>
            <button 
              onClick={fetchGraphData}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm hover:bg-surface-tint transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Graph Canvas Area */}
        <div className="flex-1 w-full relative bg-background overflow-hidden min-h-[500px]" style={{ height: '100%' }}>
          <div ref={containerRef} className="absolute inset-0 z-0" style={{ height: '100%', width: '100%' }} />
          
          {loading && (
             <div className="absolute inset-0 z-20 flex justify-center items-center bg-white/50 backdrop-blur-sm">
               <span className="text-primary font-title-sm">Loading graph...</span>
             </div>
          )}
          
          {error && (
             <div className="absolute inset-0 z-20 flex justify-center items-center bg-white/50 backdrop-blur-sm">
               <span className="text-error font-title-sm">{error}</span>
             </div>
          )}

          {/* Source Label */}
          <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Source: ArangoDB</span>
          </div>
        </div>
      </section>

      {/* Right Panel: Detail Panel (35%) */}
      <aside className="md:w-[35%] bg-surface-container-lowest border-t md:border-t-0 md:border-l border-surface-variant flex flex-col z-20 shadow-[-4px_0_20px_rgba(0,0,0,0.02)] h-[40vh] md:h-full overflow-y-auto">
        {!selectedNode ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">touch_app</span>
            <p className="font-body-base">Select a node on the graph to view its correlations and details.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-surface-variant bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${nodeType === 'symptom' ? 'bg-primary' : 'bg-tertiary rounded-lg'}`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {nodeType === 'symptom' ? 'coronavirus' : 'bolt'}
                  </span>
                </div>
                <div>
                  <h2 className="font-display-lg text-display-lg text-on-surface">{selectedNode}</h2>
                  <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded-full uppercase tracking-wide ${nodeType === 'symptom' ? 'text-primary bg-primary-fixed' : 'text-tertiary bg-tertiary-fixed'}`}>
                    {nodeType === 'symptom' ? 'Primary Symptom' : 'Trigger'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {nodeType === 'trigger' ? (
                <p className="text-secondary font-body-base">Select a symptom node to view its specific correlations and triggers. Triggers represent environmental or behavioral factors.</p>
              ) : (
                <>
                  {loadingCorrelations ? (
                    <div className="text-center text-secondary p-4">Loading correlations...</div>
                  ) : correlations ? (
                    <>
                      {/* Co-occurs with Section */}
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-secondary">hub</span>
                          <h3 className="font-title-sm text-title-sm text-on-surface">Co-occurs with</h3>
                        </div>
                        <div className="space-y-3">
                          {correlations.coOccurring.length === 0 ? (
                            <p className="text-secondary font-body-sm bg-surface-container-low p-4 rounded-xl">No significant co-occurrences found.</p>
                          ) : (
                            correlations.coOccurring.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-xl p-4 border border-surface-variant shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                                    <span className="material-symbols-outlined text-[20px]">coronavirus</span>
                                  </div>
                                  <div>
                                    <h4 className="font-title-sm text-body-base text-on-surface">{item.symptom}</h4>
                                    <p className="font-body-sm text-body-sm text-secondary">{item.occurrences} times</p>
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-outline">chevron_right</span>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      {/* Common Triggers Section */}
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-tertiary">bolt</span>
                          <h3 className="font-title-sm text-title-sm text-on-surface">Common triggers</h3>
                        </div>
                        <div className="space-y-3">
                          {correlations.commonTriggers.length === 0 ? (
                            <p className="text-secondary font-body-sm bg-surface-container-low p-4 rounded-xl">No known triggers logged.</p>
                          ) : (
                            correlations.commonTriggers.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-xl p-4 border border-surface-variant shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-tertiary/30 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                                  </div>
                                  <div>
                                    <h4 className="font-title-sm text-body-base text-on-surface">{item.trigger}</h4>
                                    <p className="font-body-sm text-body-sm text-secondary">Precedes in {item.occurrences} logs</p>
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-outline">chevron_right</span>
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

export default GraphView;
