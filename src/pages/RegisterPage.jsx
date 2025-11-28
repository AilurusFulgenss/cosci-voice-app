// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

    const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', studentId: '', faculty: 'COSCI', email: '', password: '', confirmPassword: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
        alert('รหัสผ่านไม่ตรงกัน');
        return;
        }
        console.log('Register:', formData);
        alert('สมัครสมาชิกเรียบร้อย (จำลอง)');
        navigate('/login');
    };

    return (
        // 1. แก้ที่ Container: ดันขึ้นบนด้วย pt-5
        <Container fluid className="d-flex flex-column align-items-center pt-5" style={{ minHeight: '100vh' }}>
        
        <div className="text-center text-white mb-4 mt-3">
            <h1 className="fw-bold display-5">ลงทะเบียนสมาชิกใหม่</h1>
            <p className="opacity-75 fw-light">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อยืนยันตัวตน</p>
        </div>

        {/* 2. แก้ที่ Card: ขยายเป็น 750px */}
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100 mb-5" style={{ maxWidth: '750px' }}>
            <Card.Body className="p-5">
            <Form onSubmit={handleSubmit}>
                
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Label className="fw-bold small">ชื่อจริง</Form.Label>
                        <Form.Control type="text" name="firstName" className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-bold small">นามสกุล</Form.Label>
                        <Form.Control type="text" name="lastName" className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Label className="fw-bold small">รหัสนิสิต</Form.Label>
                        <Form.Control type="text" name="studentId" placeholder="เช่น co66..." className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-bold small">คณะ / วิทยาลัย</Form.Label>
                        <Form.Select name="faculty" className="rounded-pill border-secondary-subtle" onChange={handleChange}>
                            <option value="COSCI">วิทยาลัยนวัตกรรมสื่อสารสังคม</option>
                            <option value="Other">อื่นๆ</option>
                        </Form.Select>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Email มหาวิทยาลัย (@g.swu.ac.th)</Form.Label>
                <Form.Control type="email" name="email" className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                </Form.Group>

                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label className="fw-bold small">รหัสผ่าน</Form.Label>
                        <Form.Control type="password" name="password" className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-bold small">ยืนยันรหัสผ่าน</Form.Label>
                        <Form.Control type="password" name="confirmPassword" className="rounded-pill border-secondary-subtle" onChange={handleChange} required />
                    </Col>
                </Row>

                <Button type="submit" className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" style={{ backgroundColor: '#2e86ab' }}>
                ลงทะเบียน
                </Button>

                <div className="text-center">
                <small className="text-muted">มีบัญชีอยู่แล้ว? </small>
                <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#005b8e' }}>เข้าสู่ระบบ</Link>
                </div>

            </Form>
            </Card.Body>
        </Card>
        </Container>
    );
    };

export default RegisterPage;