import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const majorsList = [
    "วิชาเอกการออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย",
    "วิชาเอกการจัดการธุรกิจไซเบอร์",
    "วิชาเอกนวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร",
    "วิชาเอกการผลิตภาพยนตร์และสื่อดิจิทัล",
    "วิชาเอกการแสดงและกำกับการแสดงภาพยนตร์",
    "วิชาเอกการออกแบบเพื่องานภาพยนตร์และสื่อดิจิทัล",
    "วิชาเอกการจัดการภาพยนตร์และสื่อดิจิทัล",
    "วิชาเอกการสื่อสารเพื่อการท่องเที่ยว",
    "วิชาเอกการสื่อสารเพื่อสุขภาพ",
    "วิชาเอกการสื่อสารเพื่อการจัดการนวัตกรรม",
    "วิชาเอกการสื่อสารเพื่อเศรษฐศาสตร์",
    "อื่นๆ"
];  

const FormPage = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    const [user] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อนแจ้งเรื่อง');
            navigate('/login');
        }
    }, [user, navigate]);

    const formConfig = {
        complaint: { title: 'ข้อร้องเรียน', hasSubCategory: true, dbValue: 'ข้อร้องเรียน' },
        help: { title: 'ขอความช่วยเหลือ', hasSubCategory: false, dbValue: 'ขอความช่วยเหลือ' },
        expectation: { title: 'ความคาดหวัง', hasSubCategory: false, dbValue: 'ความคาดหวัง' },
        suggestion: { title: 'ข้อเสนอแนะ', hasSubCategory: false, dbValue: 'ข้อเสนอแนะ' },
    };

    const currentForm = formConfig[type] || formConfig.complaint;

    const [formData, setFormData] = useState({
        major: '',
        subCategory: '',
        title: '',
        description: '',
        department: '',
        wantReply: 'no',
        consent: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false); // เพิ่มสถานะ Loading

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) return;
        setIsSubmitting(true); // เริ่มหมุน

        // เตรียมข้อมูลที่จะส่งไป Server
        const payload = {
            user_id: user.id || user.stu_buasri || user.staff_buasri, // ดึง ID ให้ชัวร์
            major: formData.major,           
            category: currentForm.dbValue,
            sub_category: formData.subCategory,
            title: formData.title,
            description: formData.description,
            department: formData.department,
            wants_reply: formData.wantReply
        };

        try {
            // 🔥 แก้จุดนี้: ใส่ URL เต็มของ Render
            const response = await fetch('https://cosci-backend-pr6e.onrender.com/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ บันทึกข้อมูลสำเร็จ! รหัสเรื่อง: ' + data.ticketId);
                navigate('/tracking'); 
            } else {
                alert('❌ เกิดข้อผิดพลาด: ' + data.message);
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('❌ เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setIsSubmitting(false); // หยุดหมุน
        }
    };

    return (
        <Container fluid className="pb-5 d-flex flex-column align-items-center">
            {/* Header */}
            <div className="text-center text-white mb-4 pt-4 fade-in">
                <h5 className="opacity-75 fw-light">แจ้งเรื่อง/ส่งเรื่อง ในหมวดหมู่</h5>
                <h1 className="fw-bold display-4 my-2 d-inline-block position-relative pb-2">
                    {currentForm.title}
                    <div style={{height: '4px', width: '60%', backgroundColor: 'white', margin: '0 auto', borderRadius: '2px', opacity: 0.5}}></div>
                </h1>
                <p className="mt-3 fs-5 fw-light opacity-75">โปรดใส่รายละเอียดและข้อมูลที่ท่านต้องการแจ้ง</p>
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{maxWidth: '900px', margin: '0 auto'}}>
                <Card.Body className="p-5">
                    <Form onSubmit={handleSubmit}>
                        
                        <Form.Group as={Row} className="mb-4 align-items-center">
                            <Form.Label column sm="3" className="fw-bold text-dark">สาขาวิชาเอกของผู้แจ้ง</Form.Label>
                            <Col sm="9">
                                <Form.Select 
                                    name="major" 
                                    className="rounded-pill py-2 px-3 border-secondary-subtle"
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- โปรดเลือกสาขา --</option>
                                    {majorsList.map((m, index) => (
                                        <option key={index} value={m}>{m}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Form.Group>

                        {currentForm.hasSubCategory && (
                        <Form.Group as={Row} className="mb-4 align-items-center">
                            <Form.Label column sm="3" className="fw-bold text-dark">เลือกหมวดหมู่ย่อย</Form.Label>
                            <Col sm="9">
                            <Form.Select 
                                name="subCategory" 
                                className="rounded-pill py-2 px-3 bg-light border-0"
                                onChange={handleChange}
                                required
                            >
                                <option value="">โปรดเลือก</option>
                                <option value="กายภาพและสาธารณูปโภค">กายภาพและสาธารณูปโภค</option>
                                <option value="กิจกรรมนิสิต">กิจกรรมนิสิต</option>
                                <option value="บริการและสวัสดิการ">บริการและสวัสดิการ</option>
                                <option value="วิชาการและการเรียนการสอน">วิชาการและการเรียนการสอน</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </Form.Select>
                            </Col>
                        </Form.Group>
                        )}

                        <Form.Group as={Row} className="mb-4 align-items-center">
                            <Form.Label column sm="3" className="fw-bold text-dark">กำหนดชื่อเรื่อง</Form.Label>
                            <Col sm="9">
                                <Form.Control 
                                type="text" 
                                name="title"
                                placeholder="ข้อความไม่ยาวมาก ให้ได้ใจความ" 
                                className="rounded-pill py-2 px-3 border-secondary-subtle"
                                onChange={handleChange}
                                required
                                />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-4">
                            <Form.Label column sm="3" className="fw-bold text-dark pt-0">รายละเอียด</Form.Label>
                            <Col sm="9">
                                <Form.Control 
                                as="textarea" 
                                name="description"
                                rows={6} 
                                className="rounded-4 border-secondary-subtle p-3"
                                onChange={handleChange}
                                required
                                />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-4 align-items-center">
                            <Form.Label column sm="3" className="fw-bold text-dark">หน่วยงานที่เกี่ยวข้อง</Form.Label>
                            <Col sm="auto">
                                <Form.Select name="department" className="rounded-pill bg-secondary bg-opacity-10 border-0" required onChange={handleChange}>
                                    <option value="">เลือก</option>
                                    <option value="งานทะเบียน">งานทะเบียน</option>
                                    <option value="งานอาคารสถานที่">งานอาคารสถานที่</option>
                                    <option value="กิจการนิสิต">กิจการนิสิต</option>
                                    <option value="ไม่ระบุ">ไม่แน่ใจ / ไม่ระบุ</option>
                                </Form.Select>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-4">
                            <Form.Label column sm="3" className="fw-bold text-dark">ต้องการข้อมูลตอบกลับ?</Form.Label>
                            <Col sm="9" className="d-flex gap-4">
                                <Form.Check type="radio" label="ต้องการ" name="wantReply" value="yes" onChange={handleChange} />
                                <Form.Check type="radio" label="ไม่ต้องการ" name="wantReply" value="no" defaultChecked onChange={handleChange} />
                            </Col>
                        </Form.Group>

                        <Form.Group className="mb-5">
                            <Form.Check 
                                type="checkbox" 
                                required
                                label={<span>ข้าพเจ้ายืนยันข้อมูลเป็นความจริงและยอมรับ <a href="#" className="fw-bold text-primary text-decoration-none">หลักเกณฑ์</a></span>}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="light" className="px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => navigate('/')}>ยกเลิก</Button>
                            <Button type="submit" className="px-5 py-2 rounded-pill fw-bold shadow-sm border-0" style={{backgroundColor: '#2e86ab'}} disabled={isSubmitting}>
                                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยัน'}
                            </Button>
                        </div>

                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default FormPage;