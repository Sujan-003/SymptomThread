import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const HomeDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/timeline');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregation Logic
  const getWeeklySnapshot = () => {
    const days = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
    // Just a mock calculation based on logs for demo purposes. 
    // Realistically, you'd filter by current week. Here we just distribute logs.
    logs.slice(0, 20).forEach((log, index) => {
      const dayKeys = Object.keys(days);
      const randomDay = dayKeys[index % 5]; // Fake distribution for demo
      days[randomDay]++;
    });
    return days;
  };

  const getCommonTriggers = () => {
    const triggerCounts = {};
    logs.forEach(log => {
      log.triggers?.forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
    });
    return Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const getRecentPattern = () => {
    if (logs.length === 0) return null;
    // Just grabbing the most frequent symptom and its most frequent trigger
    const symCounts = {};
    logs.forEach(l => symCounts[l.symptomName] = (symCounts[l.symptomName] || 0) + 1);
    const topSym = Object.keys(symCounts).sort((a,b) => symCounts[b] - symCounts[a])[0];
    
    const triggerCounts = {};
    logs.filter(l => l.symptomName === topSym).forEach(l => {
      l.triggers?.forEach(t => {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
    });
    const topTrig = Object.keys(triggerCounts).sort((a,b) => triggerCounts[b] - triggerCounts[a])[0];
    
    return { symptom: topSym, trigger: topTrig, count: symCounts[topSym] };
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface">Loading Dashboard...</div>;
  }

  const weeklySnapshot = getWeeklySnapshot();
  const commonTriggers = getCommonTriggers();
  const recentPattern = getRecentPattern();
  const thisWeekCount = Object.values(weeklySnapshot).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto px-container-margin py-section-gap w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 md:p-12 mb-12 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-3xl translate-y-1/2 opacity-60 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display-lg text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight">
            Understand Your Body's Story
          </h1>
          <p className="font-body-base text-lg text-secondary mb-8 leading-relaxed max-w-xl">
            SymptomThread helps you track symptoms, uncover hidden patterns, and identify triggers through clear, intelligent data insights.
          </p>
          <NavLink to="/log" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-title-sm py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>add</span>
            Quick Log
          </NavLink>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-display-lg text-2xl font-bold text-on-surface mb-1">Welcome back, Taylor</h2>
        <p className="font-body-base text-secondary">Here is your symptom summary for the week.</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Pattern Card */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <h3 className="font-title-sm text-lg font-semibold text-on-surface">Recent Pattern</h3>
          </div>
          
          <div className="flex-1">
            {recentPattern ? (
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 border-4 border-white dark:border-slate-800 -ml-3">
                    <span className="material-symbols-outlined text-[14px]">coronavirus</span>
                  </div>
                  <span className="font-title-sm text-on-surface font-semibold">{recentPattern.symptom}</span>
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-4 border-white dark:border-slate-800 -ml-3">
                    <span className="material-symbols-outlined text-[14px]">bed</span>
                  </div>
                  <span className="font-body-base text-secondary">{recentPattern.trigger || 'Unknown Trigger'}</span>
                </div>
              </div>
            ) : (
              <p className="text-secondary text-sm">Not enough data to find a pattern yet.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="font-body-sm text-secondary text-xs">
              {recentPattern ? `Co-occurred frequently this month.` : `Log more symptoms to see patterns.`}
            </p>
          </div>
        </div>

        {/* Weekly Snapshot Card */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <h3 className="font-title-sm text-lg font-semibold text-on-surface">Weekly Snapshot</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            {Object.entries(weeklySnapshot).map(([day, count]) => {
              // Mock max value for bar width calculation
              const maxCount = Math.max(...Object.values(weeklySnapshot), 1); 
              const percentage = Math.max((count / maxCount) * 100, 5); // at least 5% so it's visible

              return (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-8 font-label-caps text-[10px] font-bold text-secondary">{day.toUpperCase()}</span>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${count > 0 ? 'bg-primary' : 'bg-transparent'}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="font-body-sm text-on-surface text-xs font-medium">
              <span className="font-bold">{thisWeekCount} logs</span> recorded this week.
            </p>
          </div>
        </div>

        {/* Common Triggers Card */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <h3 className="font-title-sm text-lg font-semibold text-on-surface">Common Triggers</h3>
          </div>
          
          <div className="flex-1 space-y-3">
            {commonTriggers.length > 0 ? commonTriggers.map(([trigger, count], i) => (
              <div key={trigger} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${i===0 ? 'bg-orange-500' : i===1 ? 'bg-slate-500' : 'bg-blue-300'}`}></div>
                  <span className="font-body-sm font-medium text-on-surface">{trigger}</span>
                </div>
                <span className="font-label-caps text-[10px] font-bold text-secondary bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-600">
                  {count} TIMES
                </span>
              </div>
            )) : (
              <p className="text-secondary text-sm">No triggers found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeDashboard;
