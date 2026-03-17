import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API = 'https://cosci-backend-pr6e.onrender.com';

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
    "อื่นๆ / ไม่ระบุ"
];

const COMPLAINT_TYPES = [
    { key: 'complaint',   label: 'ข้อร้องเรียน',     hasSubCategory: true  },
    { key: 'help',        label: 'ขอความช่วยเหลือ', hasSubCategory: false },
    { key: 'expectation', label: 'ความคาดหวัง',      hasSubCategory: false },
    { key: 'suggestion',  label: 'ข้อเสนอแนะ',       hasSubCategory: false },
];

const OTP_RESEND_SECONDS = 60;

const GuestPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = ข้อมูล, 2 = OTP, 3 = Form

    // Step 1
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');

    // Step 2
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const countdownRef = useRef(null);

    // Step 3
    const [complaintType, setComplaintType] = useState('complaint');
    const [formData, setFormData] = useState({
        major: '', subCategory: '', title: '', description: '', department: '', wantReply: 'no', consent: false
    });

    // Shared
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState(null);

    // cleanup countdown on unmount
    useEffect(() => () => clearInterval(countdownRef.current), []);

    const startCountdown = () => {
        setCountdown(OTP_RESEND_SECONDS);
        clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // -------- Step 1: ส่ง OTP --------
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/guest/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: guestEmail, name: guestName })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                startCountdown();
            } else {
                setError(data.message || 'เกิดข้อผิดพลาด');
            }
        } catch {
            setError('เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    // -------- Step 2: ยืนยัน OTP --------
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/guest/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: guestEmail, otp })
            });
            const data = await res.json();
            if (data.success) {
                setStep(3);
            } else {
                setError(data.message || 'OTP ไม่ถูกต้อง');
            }
        } catch {
            setError('เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/guest/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: guestEmail, name: guestName })
            });
            const data = await res.json();
            if (data.success) {
                startCountdown();
                setOtp('');
            } else {
                setError(data.message || 'เกิดข้อผิดพลาด');
            }
        } catch {
            setError('เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    // -------- Step 3: Submit Form --------
    const currentType = COMPLAINT_TYPES.find(t => t.key === complaintType) || COMPLAINT_TYPES[0];

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            user_id: null,
            guest_name: guestName,
            guest_email: guestEmail,
            user_type: 'guest',
            major: formData.major,
            category: currentType.label,
            sub_category: formData.subCategory,
            title: formData.title,
            description: formData.description,
            department: formData.department,
            wants_reply: formData.wantReply,
        };

        try {
            const res = await fetch(`${API}/api/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setTicketId(data.ticketId);
                setSubmitted(true);
            } else {
                setError(data.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
            }
        } catch {
            setError('เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    // -------- Success Screen --------
    if (submitted) {
        return (
            <Container fluid className="d-flex flex-column align-items-center pt-5">
                <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '560px', width: '100%' }}>
                    <div style={{ fontSize: '3.5rem' }}>✅</div>
                    <h3 className="fw-bold mt-3">ส่งเรื่องร้องเรียนสำเร็จ!</h3>
                    <p className="text-muted mt-2">
                        Ticket ID ของคุณคือ <strong className="text-primary fs-4">#{ticketId}</strong>
                    </p>
                    <Alert variant="info" className="text-start rounded-3 mt-2">
                        <strong>เช็ค inbox ของ {guestEmail}</strong><br />
                        เราได้ส่ง Ticket ID ไปในอีเมลแล้ว กรุณาเก็บไว้เพื่อติดตามสถานะ
                    </Alert>
                    <div className="d-flex gap-2 justify-content-center mt-3">
                        <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => navigate('/guest-tracking')}>
                            ติดตามสถานะ
                        </Button>
                        <Button variant="secondary" className="rounded-pill px-4" onClick={() => navigate('/')}>
                            กลับหน้าแรก
                        </Button>
                    </div>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="pb-5 d-flex flex-column align-items-center">
            {/* Header */}
            <div className="text-center text-white mb-4 pt-4 fade-in">
                <h5 className="opacity-75 fw-light">ร้องเรียนในฐานะ</h5>
                <h1 className="fw-bold display-4 my-2 d-inline-block position-relative pb-2">
                    บุคคลภายนอก
                    <div style={{ height: '4px', width: '60%', backgroundColor: 'white', margin: '0 auto', borderRadius: '2px', opacity: 0.5 }}></div>
                </h1>
                <p className="mt-3 fs-5 fw-light opacity-75">ยืนยันตัวตนผ่าน OTP ก่อนส่งเรื่อง</p>
            </div>

            {/* Step Indicator */}
            <div className="d-flex align-items-center gap-2 mb-4">
                {['ข้อมูลผู้ร้อง', 'ยืนยัน OTP', 'กรอกเรื่องร้อง'].map((label, i) => {
                    const s = i + 1;
                    const active = step === s;
                    const done = step > s;
                    return (
                        <React.Fragment key={s}>
                            <div className="d-flex align-items-center gap-1">
                                <div className="rounded-circle d-flex justify-content-center align-items-center fw-bold"
                                    style={{ width: 32, height: 32, fontSize: '0.85rem', backgroundColor: done ? '#198754' : active ? '#2e86ab' : '#ced4da', color: 'white' }}>
                                    {done ? '✓' : s}
                                </div>
                                <span className={`d-none d-md-inline small fw-semibold ${active ? 'text-white' : 'text-white-50'}`}>{label}</span>
                            </div>
                            {s < 3 && <div style={{ width: 32, height: 2, backgroundColor: step > s ? '#198754' : '#ced4da' }} />}
                        </React.Fragment>
                    );
                })}
            </div>

            <Card className="border-0 shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: '680px' }}>
                <Card.Body className="p-5">
                    {error && <Alert variant="danger" className="py-2 text-center small">{error}</Alert>}

                    {/* ============ STEP 1 ============ */}
                    {step === 1 && (
                        <Form onSubmit={handleSendOtp}>
                            <h5 className="fw-bold mb-4 text-dark">ข้อมูลผู้ร้องเรียน</h5>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="กรอกชื่อ-นามสกุลจริง"
                                    className="rounded-pill py-2 px-3 border-secondary-subtle"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">อีเมล <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="example@email.com"
                                    className="rounded-pill py-2 px-3 border-secondary-subtle"
                                    value={guestEmail}
                                    onChange={e => setGuestEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted ms-2">OTP และ Ticket ID จะถูกส่งไปยังอีเมลนี้</Form.Text>
                            </Form.Group>
                            <div className="d-flex gap-2 justify-content-center">
                                <Button variant="light" className="px-4 rounded-pill" onClick={() => navigate('/login')}>ยกเลิก</Button>
                                <Button type="submit" className="px-4 rounded-pill fw-bold border-0" style={{ backgroundColor: '#2e86ab' }} disabled={loading}>
                                    {loading ? <><Spinner size="sm" className="me-2" />กำลังส่ง...</> : 'ส่ง OTP ไปที่อีเมล'}
                                </Button>
                            </div>
                        </Form>
                    )}

                    {/* ============ STEP 2 ============ */}
                    {step === 2 && (
                        <Form onSubmit={handleVerifyOtp}>
                            <h5 className="fw-bold mb-2 text-dark">ยืนยัน OTP</h5>
                            <p className="text-muted mb-4 small">
                                ระบบส่ง OTP 6 หลักไปที่ <strong>{guestEmail}</strong> แล้ว (หมดอายุใน 10 นาที)
                            </p>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">รหัส OTP <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="กรอก 6 หลัก"
                                    className="rounded-pill py-2 px-3 border-secondary-subtle text-center fs-4 fw-bold ls-wide"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    disabled={loading}
                                    style={{ letterSpacing: '0.4rem' }}
                                />
                            </Form.Group>
                            <div className="d-flex gap-2 justify-content-center mb-3">
                                <Button variant="light" className="px-4 rounded-pill" onClick={() => { setStep(1); setOtp(''); setError(''); }}>ย้อนกลับ</Button>
                                <Button type="submit" className="px-4 rounded-pill fw-bold border-0" style={{ backgroundColor: '#2e86ab' }} disabled={loading || otp.length !== 6}>
                                    {loading ? <><Spinner size="sm" className="me-2" />กำลังยืนยัน...</> : 'ยืนยัน OTP'}
                                </Button>
                            </div>
                            <div className="text-center">
                                <small className="text-muted">ไม่ได้รับอีเมล? </small>
                                <Button variant="link" className="p-0 small text-decoration-none" onClick={handleResendOtp} disabled={countdown > 0 || loading}>
                                    {countdown > 0 ? `ส่งอีกครั้งใน ${countdown}s` : 'ส่ง OTP อีกครั้ง'}
                                </Button>
                            </div>
                        </Form>
                    )}

                    {/* ============ STEP 3 ============ */}
                    {step === 3 && (
                        <Form onSubmit={handleSubmit}>
                            <h5 className="fw-bold mb-1 text-dark">กรอกเรื่องร้องเรียน</h5>
                            <p className="text-muted small mb-4">ผู้ร้อง: <strong>{guestName}</strong> ({guestEmail})</p>

                            {/* เลือกประเภท */}
                            <Form.Group as={Row} className="mb-4 align-items-center">
                                <Form.Label column sm="3" className="fw-bold text-dark">ประเภทเรื่อง</Form.Label>
                                <Col sm="9">
                                    <Form.Select
                                        value={complaintType}
                                        onChange={e => { setComplaintType(e.target.value); setFormData(p => ({ ...p, subCategory: '' })); }}
                                        className="rounded-pill py-2 px-3 border-secondary-subtle"
                                    >
                                        {COMPLAINT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                    </Form.Select>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-4 align-items-center">
                                <Form.Label column sm="3" className="fw-bold text-dark">สาขาที่เกี่ยวข้อง</Form.Label>
                                <Col sm="9">
                                    <Form.Select name="major" className="rounded-pill py-2 px-3 border-secondary-subtle" onChange={handleFormChange} required>
                                        <option value="">-- โปรดเลือก --</option>
                                        {majorsList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Col>
                            </Form.Group>

                            {currentType.hasSubCategory && (
                                <Form.Group as={Row} className="mb-4 align-items-center">
                                    <Form.Label column sm="3" className="fw-bold text-dark">หมวดหมู่ย่อย</Form.Label>
                                    <Col sm="9">
                                        <Form.Select name="subCategory" className="rounded-pill py-2 px-3 bg-light border-0" onChange={handleFormChange} required>
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
                                <Form.Label column sm="3" className="fw-bold text-dark">ชื่อเรื่อง</Form.Label>
                                <Col sm="9">
                                    <Form.Control type="text" name="title" placeholder="ข้อความสั้นๆ ให้ได้ใจความ" className="rounded-pill py-2 px-3 border-secondary-subtle" onChange={handleFormChange} required />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-4">
                                <Form.Label column sm="3" className="fw-bold text-dark pt-0">รายละเอียด</Form.Label>
                                <Col sm="9">
                                    <Form.Control as="textarea" name="description" rows={5} className="rounded-4 border-secondary-subtle p-3" onChange={handleFormChange} required />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-4 align-items-center">
                                <Form.Label column sm="3" className="fw-bold text-dark">หน่วยงานที่เกี่ยวข้อง</Form.Label>
                                <Col sm="auto">
                                    <Form.Select name="department" className="rounded-pill bg-secondary bg-opacity-10 border-0" required onChange={handleFormChange}>
                                        <option value="">เลือก</option>
                                        <option value="งานทะเบียน">งานทะเบียน</option>
                                        <option value="งานอาคารสถานที่">งานอาคารสถานที่</option>
                                        <option value="กิจการนิสิต">กิจการนิสิต</option>
                                        <option value="ไม่ระบุ">ไม่แน่ใจ / ไม่ระบุ</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-4">
                                <Form.Label column sm="3" className="fw-bold text-dark">ต้องการตอบกลับ?</Form.Label>
                                <Col sm="9" className="d-flex gap-4">
                                    <Form.Check type="radio" label="ต้องการ" name="wantReply" value="yes" onChange={handleFormChange} />
                                    <Form.Check type="radio" label="ไม่ต้องการ" name="wantReply" value="no" defaultChecked onChange={handleFormChange} />
                                </Col>
                            </Form.Group>

                            <Form.Group className="mb-5">
                                <Form.Check
                                    type="checkbox"
                                    name="consent"
                                    required
                                    label={<span>ข้าพเจ้ายืนยันว่าข้อมูลเป็นความจริงและยอมรับ <a href="#" className="fw-bold text-primary text-decoration-none">หลักเกณฑ์</a></span>}
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-center gap-3">
                                <Button variant="light" className="px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={() => navigate('/')}>ยกเลิก</Button>
                                <Button type="submit" className="px-5 py-2 rounded-pill fw-bold shadow-sm border-0" style={{ backgroundColor: '#2e86ab' }} disabled={loading}>
                                    {loading ? <><Spinner size="sm" className="me-2" />กำลังส่ง...</> : 'ส่งเรื่องร้องเรียน'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GuestPage;
