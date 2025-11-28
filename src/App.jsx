import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { NavDropdown, Container, Navbar, Nav } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

// Import Pages
import Home from './pages/Home';
import FormPage from './pages/FormPage';
import TrackingPage from './pages/TrackingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HistoryPage from './pages/HistoryPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 

function App() {
  // อ่านข้อมูล User จาก LocalStorage ตอนเปิดเว็บ
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="wave-background"></div>
      <Navbar expand="lg" variant="dark" className="pt-3 pb-3 mb-3" style={{backgroundColor: 'transparent'}}>
        <Container fluid className="px-5">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center fw-bold fs-4" to="/">
             <div className="bg-white text-primary rounded-circle d-flex justify-content-center align-items-center me-2 fw-bold" 
                  style={{width: 40, height: 40, fontSize: '1.2rem'}}>C</div>
             COSCI VOICE
          </Link>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-lg-4">
              
              {/* เมนูหลัก */}
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link fw-bold text-white" : "nav-link text-white opacity-75"}>
                แจ้งเรื่อง
              </NavLink>
              
              {/* เมนูที่ต้อง Login ถึงจะเห็น */}
              {user && (
                <>
                  <NavLink to="/tracking" className="nav-link text-white opacity-75">
                    ติดตามเรื่อง
                  </NavLink>
                  <NavLink to="/history" className="nav-link text-white opacity-75">
                    ประวัติ
                  </NavLink>
                </>
              )}

              {/* --- Logic เปลี่ยนปุ่ม Login เป็น Profile --- */}
              {!user ? (
                <Link to="/login" className="btn btn-danger px-4 rounded-1 fw-bold ms-2">
                   Login &rarr;
                </Link>
              ) : (
                // ✅ ปรับแก้: แสดงแค่ Icon เป็นปุ่มกด
                <NavDropdown 
                  title={
                    <FaUserCircle size={32} className="text-white" />
                  } 
                  id="user-dropdown" 
                  align="end"
                  menuVariant="dark" // ธีมสีเข้ม
                >
                  {/* ส่วนหัว Dropdown: แสดงชื่อ และ Email ที่นี่แทน */}
                  <div className="px-3 py-2 border-bottom mb-2">
                    <div className="fw-bold text-white text-nowrap" style={{fontSize: '1rem'}}>
                        {user.name}
                    </div>
                    <small className="text-white-50 d-block">
                        {user.email}
                    </small>
                  </div>
                  
                  {/* เมนูย่อย */}
                  <NavDropdown.Item as={Link} to="/profile">ข้อมูลส่วนตัว</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/usage-info">ข้อมูลการใช้งาน</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/about">เกี่ยวกับเรา</NavDropdown.Item>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item onClick={handleLogout} className="text-danger fw-bold">
                      Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}

            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form/:type" element={<FormPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Placeholder Pages */}
        <Route path="/profile" element={<div className="text-white text-center mt-5"><h1>ข้อมูลส่วนตัว (Coming Soon)</h1></div>} />
        <Route path="/usage-info" element={<div className="text-white text-center mt-5"><h1>คู่มือการใช้งาน (Coming Soon)</h1></div>} />
        <Route path="/about" element={<div className="text-white text-center mt-5"><h1>เกี่ยวกับเรา (Coming Soon)</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;