import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import Exceptions from './pages/Exceptions';
import Logs from './pages/Logs';
import Schedule from './pages/Schedule';
import HttpClient from './pages/HttpClient';
import Redis from './pages/Redis';
import Sessions from './pages/Sessions';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/exceptions" element={<Exceptions />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/http-client" element={<HttpClient />} />
        <Route path="/redis" element={<Redis />} />
        <Route path="/sessions" element={<Sessions />} />
      </Routes>
    </Layout>
  );
}

export default App;
