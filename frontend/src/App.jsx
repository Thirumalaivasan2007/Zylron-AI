import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SharedChat from './pages/SharedChat';
import { useRecall } from './hooks/useRecall';
import Features from './pages/marketing/Features';
import MathSolver from './pages/marketing/MathSolver';
import StudyGuides from './pages/marketing/StudyGuides';
import SecureVault from './pages/marketing/SecureVault';
import Students from './pages/marketing/Students';
import Developers from './pages/marketing/Developers';
import Pricing from './pages/marketing/Pricing';
import About from './pages/marketing/About';
import TermsOfService from './pages/marketing/TermsOfService';
import Security from './pages/marketing/Security';
import MobileBlocker from './components/MobileBlocker';

// Inner component so useRecall can access Router's context
function AppRoutes() {
    const { user } = useAuth();
    useRecall(); // 🧠 OS-Level Recall — silently tracks all page views

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <Routes>
                {/* Core App Routes */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={<Navigate to="/login" />} />
                <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/share/:id" element={<SharedChat />} />
                
                {/* Marketing & SEO Routes */}
                <Route path="/features" element={<Features />} />
                <Route path="/features/math-solver" element={<MathSolver />} />
                <Route path="/features/study-guides" element={<StudyGuides />} />
                <Route path="/features/secure-vault" element={<SecureVault />} />
                <Route path="/students" element={<Students />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/security" element={<Security />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <MobileBlocker>
                <AppRoutes />
            </MobileBlocker>
        </Router>
    );
}

export default App;
