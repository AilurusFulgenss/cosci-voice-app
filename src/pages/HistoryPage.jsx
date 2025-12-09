// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Badge } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaTimesCircle, FaBan } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);

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
                    // กรองเอาเฉพาะงานที่ "จบแล้ว" หรือ "ยกเลิก"
                    const historyItems = data.data.filter(t => t.status === 'resolved' || t.status === 'cancelled');
                    setTickets(historyItems);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [navigate]);

    // กรองตามปี (ใช้ปี ค.ศ. จาก created_at)
    const filteredTickets = tickets.filter(t => {
        const ticketYear = new Date(t.created_at).getFullYear();
        return ticketYear === parseInt(selectedYear);
    });

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const getStatusBadge = (status) => {
        if (status === 'resolved') return <Badge bg="success" className="rounded-pill px-3"><FaCheckCircle className="me-1"/> เสร็จสิ้น</Badge>;
        if (status === 'cancelled') return <Badge bg="secondary" className="rounded-pill px-3"><FaBan className="me-1"/> ถูกยกเลิก</Badge>;
        return <Badge bg="warning" className="text-dark rounded-pill px-3">ไม่ทราบสถานะ</Badge>;
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <Container fluid className="pb-5 d-flex flex-column align-items-center" style={{minHeight: '100vh'}}>
            
            <div className="w-100 d-flex justify-content-between align-items-end mb-4 pt-4" style={{maxWidth: '900px'}}>
                <div className="text-white">
                    <h2 className="fw-bold mb-0">ประวัติการแจ้งเรื่อง</h2>
                    <p className="opacity-75 fw-light small mb-0">รายการที่ดำเนินการเสร็จสิ้นแล้ว</p>
                </div>
                
                <div className="d-flex align-items-center bg-white rounded-pill px-3 py-1 shadow-sm">
                    <span className="text-muted small me-2 text-nowrap">ปี:</span>
                    <Form.Select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="border-0 py-0 shadow-none text-primary fw-bold"
                        style={{width: 'auto', cursor: 'pointer'}}
                    >
                        <option value="2025">2568</option>
                        <option value="2024">2567</option>
                        <option value="2023">2566</option>
                    </Form.Select>
                </div>
            </div>

            {loading ? (
                <div className="text-white">กำลังโหลด...</div>
            ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden w-100" style={{maxWidth: '900px'}}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start" onClick={() => toggleExpand(ticket.id)} style={{cursor: 'pointer'}}>
                                <div>
                                    <h5 className="fw-bold mb-2 text-dark">{ticket.title}</h5>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        {getStatusBadge(ticket.status)}
                                        <small className="text-muted">| {ticket.category}</small>
                                    </div>
                                    <small className="text-secondary" style={{fontSize: '0.8rem'}}>แจ้งเมื่อ: {formatDate(ticket.created_at)}</small>
                                </div>
                                <div className="text-primary">
                                    {expandedId === ticket.id ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </div>

                            {expandedId === ticket.id && (
                                <div className="mt-4 pt-3 border-top fade-in">
                                    <p className="mb-3 text-dark">
                                        <strong>รายละเอียด: </strong><br/>
                                        <span className="opacity-75">{ticket.description}</span>
                                    </p>
                                    
                                    {/* ส่วนแสดงคำตอบจากเจ้าหน้าที่ (ถ้ามี) */}
                                    {ticket.admin_reply ? (
                                        <div className="bg-light rounded-3 p-3 border border-success border-opacity-25">
                                            <strong className="text-success d-block mb-1"><FaCheckCircle/> การดำเนินการ:</strong>
                                            <p className="mb-0 text-dark">{ticket.admin_reply}</p>
                                            <small className="text-muted d-block text-end mt-2">อัปเดตเมื่อ: {formatDate(ticket.updated_at)}</small>
                                        </div>
                                    ) : (
                                        <div className="alert alert-light text-center small text-muted">
                                            ยังไม่มีบันทึกการตอบกลับในระบบ
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <div className="text-white text-center mt-5 opacity-50">
                    <h4>ไม่พบประวัติในปี {parseInt(selectedYear) + 543}</h4>
                </div>
            )}
        </Container>
    );
};

export default HistoryPage;