// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('student'); // 'student' หรือ 'staff'
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        major: ''
    });

    // รายชื่อสาขา (เอก)
    const majors = [
        "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย (Multimedia)",
        "การจัดการภาพยนตร์และสื่อดิจิทัล (Film Management)",
        "การสื่อสารเพื่อเศรษฐศาสตร์ (Econ Comm)",
        "การสื่อสารเพื่อการท่องเที่ยว (Tourism)",
        "การสื่อสารเพื่อสุขภาพ (Health Comm)",
        "นวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร (Computer Innovation)",
        "การแสดงและกำกับการแสดงภาพยนตร์ (Acting)",
        "การผลิตภาพยนตร์และสื่อดิจิทัล (Cinema Production)",
        "การออกแบบเพื่องานภาพยนตร์ (Production Design)",
        "อื่นๆ"
    ];

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. เช็ค Password ตรงกันไหม
        if (formData.password !== formData.confirmPassword) {
            alert('❌ รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
            return;
        }

        // 2. เช็คการเลือกเอก (เฉพาะนิสิต)
        if (activeTab === 'student' && !formData.major) {
            alert('⚠️ กรุณาเลือกสาขาวิชา (เอก)');
            return;
        }

        setIsLoading(true);

        try {
            // เตรียมข้อมูลส่งหลังบ้าน
            const payload = {
                userType: activeTab,
                id: formData.id,
                name: formData.name, // ใช้ชื่อรวม (Database เราเก็บเป็นก้อนเดียว)
                email: formData.email,
                password: formData.password,
                major: activeTab === 'student' ? formData.major : null
            };

            // ยิง API ไปที่ Render
            const response = await axios.post('https://cosci-backend-pr6e.onrender.com/api/register', payload);

            if (response.data.success) {
                alert('✅ ลงทะเบียนสำเร็จ! กำลังพาท่านไปหน้าเข้าสู่ระบบ...');
                navigate('/login');
            } else {
                alert('❌ เกิดข้อผิดพลาด: ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            alert('💥 เชื่อมต่อ Server ไม่ได้ (ลองตรวจสอบอินเทอร์เน็ต หรือรอสักครู่)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex flex-column align-items-center justify-content-center py-5" 
            style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1c2331 0%, #2e86ab 100%)' }}>
            
            <div className="text-center text-white mb-4">
                <h1 className="fw-bold display-5">ลงทะเบียนสมาชิกใหม่</h1>
                <p className="opacity-75 fw-light">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อยืนยันตัวตน</p>
            </div>

            <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100 mb-5" style={{ maxWidth: '600px' }}>
                <Card.Body className="p-4 p-md-5">
                    
                    {/* ปุ่มเลือกประเภท (Tabs) */}
                    <div className="d-flex justify-content-center mb-4">
                        <ButtonGroup className="w-100 shadow-sm rounded-pill overflow-hidden border">
                            <Button 
                                variant={activeTab === 'student' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('student')}
                                className="fw-bold py-2"
                                style={activeTab === 'student' ? { backgroundColor: '#2e86ab', borderColor: '#2e86ab' } : {}}
                            >
                                🎓 นิสิต
                            </Button>
                            <Button 
                                variant={activeTab === 'staff' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('staff')}
                                className="fw-bold py-2"
                                style={activeTab === 'staff' ? { backgroundColor: '#2e86ab', borderColor: '#2e86ab' } : {}}
                            >
                                👔 อาจารย์/บุคลากร
                            </Button>
                        </ButtonGroup>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        
                        {/* ส่วนที่ 1: ID และ ชื่อ */}
                        <Row className="mb-3">
                            <Col md={12} className="mb-3">
                                <Form.Label className="fw-bold small">
                                    {activeTab === 'student' ? 'รหัสนิสิต (Student ID)' : 'บัวศรีไอดี (Buasri ID)'} <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="id" 
                                    placeholder={activeTab === 'student' ? "เช่น 66130010xxx" : "เช่น somchai.j"} 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange} 
                                    required 
                                />
                            </Col>
                            <Col md={12}>
                                <Form.Label className="fw-bold small">ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="name" 
                                    placeholder="ภาษาไทย หรือ ภาษาอังกฤษ" 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange} 
                                    required 
                                />
                            </Col>
                        </Row>

                        {/* ส่วนที่ 2: เฉพาะทาง (เอก หรือ อีเมล) */}
                        {activeTab === 'student' ? (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">สาขาวิชา (เอก) <span className="text-danger">*</span></Form.Label>
                                <Form.Select 
                                    name="major" 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- กรุณาเลือกสาขาวิชา --</option>
                                    {majors.map((m, idx) => (
                                        <option key={idx} value={m}>{m}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        ) : (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">อีเมลทางการ (@g.swu.ac.th) <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="email" 
                                    name="email" 
                                    placeholder="email@g.swu.ac.th" 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange} 
                                    required 
                                />
                            </Form.Group>
                        )}

                        {/* ส่วนที่ 3: รหัสผ่าน */}
                        <Row className="mb-4">
                            <Col md={6} className="mb-3 mb-md-0">
                                <Form.Label className="fw-bold small">รหัสผ่าน <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="password" 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange} 
                                    required 
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-bold small">ยืนยันรหัสผ่าน <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="confirmPassword" 
                                    className="rounded-pill border-secondary-subtle py-2 px-3" 
                                    onChange={handleChange} 
                                    required 
                                />
                            </Col>
                        </Row>

                        <Button 
                            type="submit" 
                            className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" 
                            style={{ backgroundColor: '#2e86ab' }}
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳ กำลังบันทึกข้อมูล...' : 'ลงทะเบียน'}
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