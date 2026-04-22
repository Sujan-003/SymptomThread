import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GraphView from './components/GraphView';
import SymptomForm from './components/SymptomForm';
import Timeline from './components/Timeline';
import Layout from './components/Layout';
import HomeDashboard from './pages/HomeDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="log" element={<SymptomForm />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="graph" element={<GraphView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
