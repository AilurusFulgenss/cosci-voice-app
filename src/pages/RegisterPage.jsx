import React, { useState } from 'react';
import { Container, Card, Form, Button, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('student'); // 'student' หรือ 'staff'
    const [buasriId, setBuasriId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!buasriId) {
            alert('กรุณากรอก Buasri ID');
            return;
        }

        setIsLoading(true);

        const payload = {
            userType: activeTab,
            buasriId: buasriId.trim()
        };

        try {
            // ยิงไปที่ Render
            const response = await axios.post('https://cosci-backend-pr6e.onrender.com/api/register', payload);

            if (response.data.success) {
                alert('✅ ลงทะเบียนเรียบร้อย! คุณสามารถเข้าสู่ระบบได้แล้ว');
                navigate('/login');
            } else {
                alert('❌ ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            alert('❌ เชื่อมต่อ Server ไม่ได้');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // ✅ ใช้ Container ตัวเดิมของคุณ (เอา background ออก เพื่อให้ใช้ Global CSS ของคุณ)
        <Container fluid className="d-flex flex-column align-items-center pt-5" style={{ minHeight: '100vh' }}>
            
            {/* Header ข้อความสีขาวตามเดิม */}
            <div className="text-center text-white mb-4 mt-3">
                <h1 className="fw-bold display-5">ยืนยันตัวตน (Registration)</h1>
                <p className="opacity-75 fw-light">กรุณากรอก Buasri ID เพื่อตรวจสอบสิทธิ์การใช้งาน</p>
            </div>

            {/* ✅ Card ปรับขนาดให้พอดีกับเนื้อหา (ลดความกว้างลงนิดนหน่อยเพราะช่องกรอกน้อยลง) */}
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100 mb-5" style={{ maxWidth: '600px' }}>
                <Card.Body className="p-4 p-md-5">
                    
                    {/* ปุ่มเลือกประเภท (Tabs) */}
                    <div className="d-flex justify-content-center mb-4">
                        <ButtonGroup className="w-100 shadow-sm rounded-pill overflow-hidden border">
                            <Button 
                                variant={activeTab === 'student' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('student')}
                                className="fw-bold py-2"
                                style={activeTab === 'student' ? { backgroundColor: '#2e86ab', borderColor: '#2e86ab', color: 'white' } : { color: '#666' }}
                            >
                                นิสิต
                            </Button>
                            <Button 
                                variant={activeTab === 'staff' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('staff')}
                                className="fw-bold py-2"
                                style={activeTab === 'staff' ? { backgroundColor: '#2e86ab', borderColor: '#2e86ab', color: 'white' } : { color: '#666' }}
                            >
                                อาจารย์/บุคลากร
                            </Button>
                        </ButtonGroup>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold text-dark">
                                {activeTab === 'student' ? 'Buasri ID (นิสิต)' : 'Buasri ID (บุคลากร)'}
                            </Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder={activeTab === 'student' ? "เช่น co66xxxx" : "buasriid"} 
                                className="rounded-pill border-secondary-subtle py-2 px-3" 
                                value={buasriId}
                                onChange={(e) => setBuasriId(e.target.value)} 
                                required 
                                autoFocus
                            />
                            <Form.Text className="text-muted ps-2">
                                * กรอกเฉพาะ ID ไม่ต้องมี @g.swu.ac.th
                            </Form.Text>
                        </Form.Group>

                        <Button 
                            type="submit" 
                            className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 mb-3" 
                            style={{ backgroundColor: '#2e86ab' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบและลงทะเบียน'}
                        </Button>

                        <div className="text-center">
                            <small className="text-muted">เคยลงทะเบียนแล้ว? </small>
                            <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#005b8e' }}>เข้าสู่ระบบ</Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RegisterPage;