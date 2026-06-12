import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SharedChat from './pages/SharedChat';
import { useRecall } from './hooks/useRecall';

// Inner component so useRecall can access Router's context
function AppRoutes() {
    const { user } = useAuth();
    useRecall(); // 🧠 OS-Level Recall — silently tracks all page views

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={<Navigate to="/login" />} />
                <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/share/:id" element={<SharedChat />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;
