import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import GraphView from './components/GraphView';
import SymptomForm from './components/SymptomForm';
import Timeline from './components/Timeline';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="logo">SymptomThread</div>
          <div className="nav-links">
            <NavLink to="/log" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Log</NavLink>
            <NavLink to="/timeline" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Timeline</NavLink>
            <NavLink to="/graph" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Graph</NavLink>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/log" replace />} />
            <Route path="/log" element={<SymptomForm />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/graph" element={<GraphView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
