// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [inputs, setInputs] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); 

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputs)
        });

        const data = await response.json();

        if (data.success) {
            // Login สำเร็จ
            
            // 🔥🔥🔥 แก้ไขตรงนี้ครับ 🔥🔥🔥
            // เดิม: localStorage.setItem('user', JSON.stringify(data.user)); 
            // เปลี่ยนเป็น: เอา role จาก data.role มารวมกับ data.user ก่อนบันทึก
            
            const userWithRole = { ...data.user, role: data.role };
            localStorage.setItem('user', JSON.stringify(userWithRole));
            
            // 🔥🔥🔥 จบส่วนแก้ไข 🔥🔥🔥

            alert('ยินดีต้อนรับ: ' + data.user.name);
            
            if (data.role === 'staff' || data.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
            
        } else {
            setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (err) {
        console.error('Error:', err);
        setError('เชื่อมต่อ Server ไม่ได้ (ตรวจสอบว่ารัน node server.js หรือยัง)');
    }
  };

  return (
    // 1. แก้ที่ Container: เอา justify-content-center ออก, เพิ่ม pt-5 เพื่อเว้นระยะจาก Navbar
    <Container fluid className="d-flex flex-column align-items-center pt-5" style={{ minHeight: '100vh' }}>
      
      <div className="text-center text-white mb-4 mt-4">
        <h1 className="fw-bold display-5">เข้าสู่ระบบ</h1>
        <p className="opacity-75 fw-light">COSCI Voice of Customer</p>
      </div>

      {/* 2. แก้ที่ Card: เพิ่ม maxWidth เป็น 650px */}
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: '650px' }}>
        <Card.Body className="p-5">
          <Form onSubmit={handleLogin}>
            
            {error && <div className="alert alert-danger text-center py-2 mb-3 small">{error}</div>}

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-dark">Email หรือ รหัสนิสิต</Form.Label>
              <Form.Control 
                type="text" 
                name="email"
                placeholder="เช่น co66..." 
                className="rounded-pill py-2 px-3 border-secondary-subtle"
                onChange={handleChange}
                required
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
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Form.Check type="checkbox" label={<small>จำรหัสผ่าน</small>} />
              <Link to="#" style={{ fontSize: '0.9rem', color: '#005b8e', textDecoration: 'none' }}>ลืมรหัสผ่าน?</Link>
            </div>

            <Button type="submit" className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" style={{ backgroundColor: '#dc3545' }}>
              เข้าสู่ระบบ
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