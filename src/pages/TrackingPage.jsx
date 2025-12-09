// src/pages/TrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Timeline Component (เหมือนเดิม)
const Timeline = ({ currentStep }) => {
    const steps = ['รอรับเรื่อง', 'กำลังดำเนินการ', 'ตรวจสอบข้อมูล', 'เสร็จสิ้น'];
    // คำนวณ % ความกว้างของเส้นสีฟ้า
    // ถ้า step เป็น -1 (ยกเลิก/ไม่มีสถานะ) ให้เป็น 0
    const safeStep = currentStep < 0 ? 0 : currentStep; 
    const progress = (safeStep / (steps.length - 1)) * 100;

    return (
        <div className="timeline-wrapper">
            <div className="timeline-line-bg"></div>
            <div className="timeline-line-progress" style={{ width: `${progress}%` }}></div>
            <div className="timeline-steps-container">
                {steps.map((step, index) => (
                    <div key={index} className={`timeline-step-item ${index <= safeStep ? 'active' : ''}`}>
                        <div className="timeline-circle"></div>
                        <div className="timeline-text">{step}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrackingPage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);

    // แปลงสถานะจาก Database (text) เป็น ตัวเลข (0-3) เพื่อใส่ใน Timeline
    const getStatusStep = (status) => {
        switch(status) {
            case 'new': return 0;
            case 'pending': return 1;
            case 'investigating': return 2;
            case 'resolved': return 3;
            default: return 0;
        }
    };

    // ดึงข้อมูลเมื่อเข้าหน้าเว็บ
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            navigate('/login');
            return;
        }
        const user = JSON.parse(savedUser);

        fetch(`/api/tickets/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // กรองเอาเฉพาะงานที่ "ยังไม่จบ" (ไม่ใช่ resolved หรือ cancelled)
                    const activeTickets = data.data.filter(t => t.status !== 'resolved' && t.status !== 'cancelled');
                    setTickets(activeTickets);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching tickets:", err);
                setLoading(false);
            });
    }, [navigate]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // ฟังก์ชันแปลงวันที่ให้สวยงาม
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Container fluid className="pb-5 d-flex flex-column align-items-center" style={{minHeight: '100vh'}}>
            <div className="text-center text-white mb-5 pt-4">
                <h2 className="fw-bold">ติดตามเรื่องที่แจ้ง</h2>
                <p className="opacity-75 fw-light small">แสดงรายการทั้งหมดที่กำลังดำเนินการอยู่</p>
            </div>

            {loading ? (
                 <div className="text-white">กำลังโหลดข้อมูล...</div>
            ) : tickets.length === 0 ? (
                 <div className="text-white opacity-75 mt-5">ไม่พบรายการที่กำลังดำเนินการ</div>
            ) : (
                tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-0 shadow rounded-4 mb-4 overflow-hidden w-100" style={{maxWidth: '900px'}}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3" onClick={() => toggleExpand(ticket.id)} style={{cursor: 'pointer'}}>
                                <div>
                                    <h5 className="fw-bold mb-1 text-primary">{ticket.title}</h5>
                                    <small className="text-muted">แจ้งเมื่อ: {formatDate(ticket.created_at)}</small>
                                </div>
                                <div className="text-primary d-flex align-items-center gap-1">
                                    <small>{expandedId === ticket.id ? 'ซ่อน' : 'ดู'}</small> 
                                    {expandedId === ticket.id ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </div>

                            {/* Timeline แสดงสถานะ */}
                            <Timeline currentStep={getStatusStep(ticket.status)} />

                            {expandedId === ticket.id && (
                                <div className="mt-4 pt-3 border-top fade-in">
                                    <Row>
                                        <Col md={12}>
                                            <small className="text-muted d-block mb-1">หมวดหมู่</small>
                                            <h6 className="fw-bold mb-3">{ticket.category} {ticket.sub_category ? `(${ticket.sub_category})` : ''}</h6>
                                            
                                            <small className="text-muted d-block mb-1">รายละเอียด</small>
                                            <p className="mb-3 text-dark opacity-75 small bg-light p-3 rounded-3">
                                                {ticket.description}
                                            </p>

                                            <small className="text-muted d-block mb-1">หน่วยงานที่รับผิดชอบ</small>
                                            <span className="badge bg-info text-dark">{ticket.department}</span>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                ))
            )}
        </Container>
    );
};

export default TrackingPage;