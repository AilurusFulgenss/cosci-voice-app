import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API = 'https://cosci-backend-pr6e.onrender.com';

const STATUS_LABELS = {
    new:           { label: 'รับเรื่องแล้ว',        color: 'primary'   },
    pending:       { label: 'กำลังพิจารณา',         color: 'warning'   },
    investigating: { label: 'กำลังดำเนินการ',       color: 'info'      },
    resolved:      { label: 'เสร็จสิ้น',            color: 'success'   },
    cancelled:     { label: 'ยกเลิก',               color: 'secondary' },
};

const GuestTrackingPage = () => {
    const navigate = useNavigate();
    const [ticketId, setTicketId] = useState('');
    const [email, setEmail] = useState('');
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setTicket(null);
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/tickets/guest-track?ticketId=${encodeURIComponent(ticketId)}&email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (data.success) {
                setTicket(data.data);
            } else {
                setError(data.message || 'ไม่พบ ticket หรืออีเมลไม่ตรงกัน');
            }
        } catch {
            setError('เชื่อมต่อ Server ไม่ได้ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    const statusInfo = ticket ? (STATUS_LABELS[ticket.status] || { label: ticket.status, color: 'secondary' }) : null;

    return (
        <Container fluid className="d-flex flex-column align-items-center pt-4 pb-5">
            <div className="text-center text-white mb-4 fade-in">
                <h5 className="opacity-75 fw-light">สำหรับบุคคลภายนอก</h5>
                <h1 className="fw-bold display-5 my-2">ติดตามเรื่องร้องเรียน</h1>
                <p className="opacity-75 fw-light">ใช้ Ticket ID และอีเมลที่ใช้ส่งเรื่องเพื่อตรวจสอบสถานะ</p>
            </div>

            <Card className="border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: '560px' }}>
                <Card.Body className="p-5">
                    <Form onSubmit={handleSearch}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Ticket ID</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="เช่น 42"
                                className="rounded-pill py-2 px-3 border-secondary-subtle"
                                value={ticketId}
                                onChange={e => setTicketId(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">อีเมลที่ใช้ส่งเรื่อง</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="example@email.com"
                                className="rounded-pill py-2 px-3 border-secondary-subtle"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Form.Group>

                        {error && <Alert variant="danger" className="py-2 text-center small">{error}</Alert>}

                        <div className="d-flex gap-2 justify-content-center">
                            <Button variant="light" className="px-4 rounded-pill" onClick={() => navigate('/')}>กลับ</Button>
                            <Button type="submit" className="px-4 rounded-pill fw-bold border-0" style={{ backgroundColor: '#2e86ab' }} disabled={loading}>
                                {loading ? <><Spinner size="sm" className="me-2" />กำลังค้นหา...</> : 'ตรวจสอบสถานะ'}
                            </Button>
                        </div>
                    </Form>

                    {ticket && (
                        <div className="mt-4 pt-4 border-top">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <span className="text-muted small">Ticket #</span>
                                    <span className="fw-bold fs-5 ms-1">{ticket.id}</span>
                                </div>
                                <Badge bg={statusInfo.color} className="px-3 py-2 rounded-pill fs-6">
                                    {statusInfo.label}
                                </Badge>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted">ประเภท</small>
                                <p className="mb-0 fw-semibold">{ticket.category}{ticket.sub_category ? ` — ${ticket.sub_category}` : ''}</p>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted">หัวข้อ</small>
                                <p className="mb-0 fw-semibold">{ticket.title}</p>
                            </div>

                            <div className="mb-2">
                                <small className="text-muted">วันที่ส่ง</small>
                                <p className="mb-0">{new Date(ticket.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>

                            {ticket.admin_reply && (
                                <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#f0f8ff', border: '1px solid #cce5ff' }}>
                                    <small className="fw-bold text-primary">ข้อความตอบกลับจากเจ้าหน้าที่</small>
                                    <p className="mb-0 mt-1">{ticket.admin_reply}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <div className="text-center mt-3">
                <small className="text-white-50">ยังไม่เคยส่งเรื่อง? </small>
                <Button variant="link" className="p-0 small text-white text-decoration-underline" onClick={() => navigate('/guest')}>
                    ร้องเรียนที่นี่
                </Button>
            </div>
        </Container>
    );
};

export default GuestTrackingPage;
