import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import Exceptions from './pages/Exceptions';
import Logs from './pages/Logs';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/exceptions" element={<Exceptions />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Layout>
  );
}

export default App;

