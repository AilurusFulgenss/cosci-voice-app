import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('student'); // 'student' หรือ 'staff'
    const [isLoading, setIsLoading] = useState(false);

    // รวม Field ทั้งหมดไว้ใน State เดียว
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        buasriId: '', 
        major: '', 
        password: '', 
        confirmPassword: ''
    });

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

        // 1. เช็ค Password
        if (formData.password !== formData.confirmPassword) {
            alert('❌ รหัสผ่านไม่ตรงกัน');
            return;
        }

        // 2. เช็คเอก (เฉพาะนิสิต)
        if (activeTab === 'student' && !formData.major) {
            alert('⚠️ กรุณาเลือกสาขาวิชา (เอก)');
            return;
        }

        setIsLoading(true);

        // 3. เตรียมข้อมูลส่ง (รวมชื่อ+นามสกุล เป็นก้อนเดียวตาม DB)
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        
        const payload = {
            userType: activeTab,
            buasriId: formData.buasriId,
            name: fullName,
            password: formData.password,
            major: activeTab === 'student' ? formData.major : null
        };

        try {
            // ยิงไปที่ Render
            const response = await axios.post('https://cosci-backend-pr6e.onrender.com/api/register', payload);

            if (response.data.success) {
                alert('✅ ลงทะเบียนเรียบร้อย! กรุณาเข้าสู่ระบบ');
                navigate('/login');
            } else {
                alert('❌ เกิดข้อผิดพลาด: ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            alert('💥 เชื่อมต่อ Server ไม่ได้');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Style เดิม: Container ดันบน pt-5
        <Container fluid className="d-flex flex-column align-items-center pt-5" style={{ minHeight: '100vh' }}>
        
        <div className="text-center text-white mb-4 mt-3">
            <h1 className="fw-bold display-5">ลงทะเบียนสมาชิกใหม่</h1>
            <p className="opacity-75 fw-light">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อยืนยันตัวตน</p>
        </div>

        {/* Style เดิม: Card 750px */}
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100 mb-5" style={{ maxWidth: '750px' }}>
            <Card.Body className="p-5">
            
            {/* เพิ่ม Tabs เลือกประเภท */}
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
                
                {/* 1. ชื่อ - นามสกุล (ใช้ร่วมกัน) */}
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

                {/* 2. Buasri ID (ใช้ร่วมกัน แต่ Placeholder ต่างกัน) */}
                <Row className="mb-3">
                    <Col md={activeTab === 'student' ? 6 : 12}>
                        <Form.Label className="fw-bold small">
                            {activeTab === 'student' ? 'บัวศรีไอดี (Buasri ID)' : 'บัวศรีไอดี (Buasri ID)'}
                        </Form.Label>
                        <Form.Control 
                            type="text" 
                            name="buasriId" 
                            placeholder={activeTab === 'student' ? "เช่น co66xxxx (ไม่ต้องมี @g.swu...)" : "เช่น porawanp"} 
                            className="rounded-pill border-secondary-subtle" 
                            onChange={handleChange} 
                            required 
                        />
                    </Col>
                    
                    {/* 3. Dropdown เอก (เฉพาะนิสิต) */}
                    {activeTab === 'student' && (
                        <Col md={6}>
                            <Form.Label className="fw-bold small">สาขาวิชา (เอก)</Form.Label>
                            <Form.Select name="major" className="rounded-pill border-secondary-subtle" onChange={handleChange} required>
                                <option value="">-- กรุณาเลือกสาขา --</option>
                                {majors.map((m, idx) => (
                                    <option key={idx} value={m}>{m}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    )}
                </Row>

                {/* 4. Password */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label className="fw-bold small">รหัสผ่าน</Form.Label>
                        <Form.Control type="password" name="password" className="rounded-pill border-secondary-subtle" onChange={handleChange} required autoComplete="new-password" />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-bold small">ยืนยันรหัสผ่าน</Form.Label>
                        <Form.Control type="password" name="confirmPassword" className="rounded-pill border-secondary-subtle" onChange={handleChange} required autoComplete="new-password" />
                    </Col>
                </Row>

                <Button type="submit" className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" style={{ backgroundColor: '#2e86ab' }} disabled={isLoading}>
                    {isLoading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
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