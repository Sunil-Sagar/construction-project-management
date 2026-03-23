import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Advances from './pages/Advances';
import Payouts from './pages/Payouts';
import Materials from './pages/Materials';
import Milestones from './pages/Milestones';
import WIP from './pages/WIP';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/advances" element={<Advances />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/wip" element={<WIP />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
