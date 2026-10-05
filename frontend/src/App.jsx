import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Browse from "./pages/Browse.jsx";
import PGDetails from "./pages/PGDetails.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import DigitalKey from "./pages/DigitalKey.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import AddPG from "./pages/AddPG.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import StudentPGDashboard from "./pages/StudentPGDashboard";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/my-pg/:id" element={<ProtectedRoute role="student"><StudentPGDashboard /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/pg/:id" element={<PGDetails />} />
        <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/digital-key/:bookingId" element={<ProtectedRoute role="student"><DigitalKey /></ProtectedRoute>} />
        <Route path="/owner/dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/add-pg" element={<ProtectedRoute role="owner"><AddPG /></ProtectedRoute>} />
      </Routes>
      <footer className="footer">Roomly — Map data © OpenStreetMap contributors.</footer>
      <ChatWidget />
    </div>
  );
}