// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate เพื่อเปลี่ยนหน้า

const LoginPage = () => {
  const [inputs, setInputs] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 🟡 เพิ่มสถานะ Loading
  const navigate = useNavigate(); // ใช้สำหรับเปลี่ยนหน้า

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
    setIsLoading(true); // เริ่มหมุน

    try {
        // 🔥 แก้ไข URL ให้ยิงไปที่ Render โดยตรง (สำคัญมาก!)
        const response = await fetch('https://cosci-backend-pr6e.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputs)
        });

        const data = await response.json();

        if (data.success) {
            // บันทึกข้อมูล
            const userWithRole = { ...data.user, role: data.role };
            localStorage.setItem('user', JSON.stringify(userWithRole));
            
            // alert('ยินดีต้อนรับ: ' + (data.user.name || data.user.stu_name || data.user.staff_name)); // แสดงชื่อจริงถ้ามี
            
            // เปลี่ยนหน้า (ใช้ navigate ของ React Router ดีกว่า window.location)
            if (data.role === 'staff' || data.role === 'admin' || data.isExecutive) {
               // ถ้าเป็นผู้บริหาร หรือ staff ให้ไปหน้า admin (หรือ dashboard ผู้บริหาร)
               navigate(data.isExecutive ? '/admin-dashboard' : '/admin');
            } else {
               navigate('/dashboard');
            }
            
        } else {
            setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (err) {
        console.error('Error:', err);
        setError('เชื่อมต่อ Server ไม่ได้ (Server อาจกำลังตื่น กรุณากดใหม่อีกครั้ง)');
    } finally {
        setIsLoading(false); // หยุดหมุนเสมอ
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
                placeholder="เช่น 66130010123" 
                className="rounded-pill py-2 px-3 border-secondary-subtle"
                onChange={handleChange}
                required
                disabled={isLoading} // ล็อกช่องตอนโหลด
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
                disabled={isLoading} // ล็อกช่องตอนโหลด
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