// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 
import axios from 'axios'; // ✅ ใช้ axios แทน fetch เพื่อความเสถียร

const LoginPage = () => {
  const [inputs, setInputs] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ⚡️ แอบปลุก Server ทันทีที่เปิดหน้าเว็บ
  useEffect(() => {
    fetch('https://cosci-backend-pr6e.onrender.com/')
      .then(() => console.log('✅ Server is awake'))
      .catch(() => console.log('💤 Server is waking up...'));
  }, []);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // เตรียมข้อมูลส่ง (ตัดช่องว่างออกกันพลาด)
    const payload = {
        email: inputs.email.trim(),
        password: inputs.password
    };

    try {
        // 🔥 ยิงไปที่ Render
        const response = await axios.post('https://cosci-backend-pr6e.onrender.com/api/login', payload);

        if (response.data.success) {
            // ✅ Login สำเร็จ: บันทึกข้อมูล
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('isExecutive', response.data.isExecutive);
            
            // 🚀 แยกทางตาม Logic ใหม่ (ใช้ window.location.href เพื่อรีเฟรช Navbar)
            if (response.data.isExecutive) {
               window.location.href = '/admin-dashboard'; // ผู้บริหาร -> กราฟ
            } else if (response.data.role === 'staff') {
               window.location.href = '/admin'; // เจ้าหน้าที่ -> รายการคำร้อง
            } else {
               window.location.href = '/'; // ✅ นิสิต -> หน้าแรก (Home)
            }
            
        } else {
            setError(response.data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (err) {
        console.error('Error:', err);
        setError('เชื่อมต่อ Server ไม่ได้ (Server อาจกำลังตื่น กรุณากดใหม่อีกครั้ง)');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Container fluid className="d-flex flex-column align-items-center pt-5" style={{ minHeight: '100vh' }}>
      
      <div className="text-center text-white mb-4 mt-4">
        <h1 className="fw-bold display-5">เข้าสู่ระบบ</h1>
        <p className="opacity-75 fw-light">COSCI Voice of Customer</p>
      </div>

      <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: '650px' }}>
        <Card.Body className="p-5">
          <Form onSubmit={handleLogin}>
            
            {error && <div className="alert alert-danger text-center py-2 mb-3 small">{error}</div>}

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-dark">Email หรือ รหัสนิสิต / Buasri ID</Form.Label>
              <Form.Control 
                type="text" 
                name="email"
                placeholder="เช่น 66130010123 หรือ somchai.p" 
                className="rounded-pill py-2 px-3 border-secondary-subtle"
                onChange={handleChange}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-dark">รหัสผ่าน</Form.Label>
              <Form.Control 
                type="password" 
                name="password"
                placeholder="••••••••" 
                className="rounded-pill py-2 px-3 border-secondary-subtle"
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Form.Check type="checkbox" label={<small>จำรหัสผ่าน</small>} />
              <Link to="#" style={{ fontSize: '0.9rem', color: '#005b8e', textDecoration: 'none' }}>ลืมรหัสผ่าน?</Link>
            </div>

            <Button 
                type="submit" 
                className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" 
                style={{ backgroundColor: '#dc3545' }}
                disabled={isLoading}
            >
              {isLoading ? '⏳ กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ'}
            </Button>

            <div className="text-center">
              <small className="text-muted">ยังไม่มีบัญชีใช่ไหม? </small>
              <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#005b8e' }}>ลงทะเบียนที่นี่</Link>
            </div>

          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginPage;