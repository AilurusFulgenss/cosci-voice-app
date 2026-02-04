// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios'; // ✅ ใช้ axios แทน fetch เพื่อความง่าย

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
        // 🔥 ยิงไปที่ localhost:3000 ตรงๆ เลย (แก้ปัญหาหา Server ไม่เจอ)
        const res = await axios.post('http://localhost:3000/api/login', { 
            email: inputs.email,
            password: inputs.password 
        });

        if (res.data.success) {
            // ✅ Login สำเร็จ
            const userData = { 
                ...res.data.user, 
                role: res.data.role,
                isExecutive: res.data.isExecutive, // รับค่าจาก Backend
                position: res.data.position 
            };
            
            localStorage.setItem('user', JSON.stringify(userData));

            alert('ยินดีต้อนรับ: ' + (userData.name || userData.email));

            // 🔥 เช็คสิทธิ์และเปลี่ยนหน้า (ใช้ window.location.href เพื่อรีโหลดระบบ)
            if (userData.isExecutive) {
                // ถ้าเป็นผู้บริหาร -> ไป Dean Dashboard
                window.location.href = '/admin/dean-dashboard';
            } else if (res.data.role === 'staff' || res.data.role === 'admin') {
                // ถ้าเป็น Staff -> ไป Admin Dashboard ปกติ
                window.location.href = '/admin';
            } else {
                // ถ้าเป็นนิสิต -> ไปหน้า Profile
                window.location.href = '/profile';
            }

        } else {
            setError(res.data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

    } catch (err) {
        console.error('Login Error:', err);
        if (err.response) {
             setError(err.response.data.message || 'เกิดข้อผิดพลาดที่ Server');
        } else {
             // ถ้า Backend ไม่รัน จะเข้าเงื่อนไขนี้
             setError('ไม่สามารถเชื่อมต่อ Server (3000) ได้ - กรุณารัน node server.js');
        }
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