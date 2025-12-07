// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Badge, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import AdminNavigation from '../components/AdminNavigation';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    // ค่าเริ่มต้นเป็น true อยู่แล้ว (โหลดครั้งแรกจะขึ้นหมุนๆ ทันที)
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [updateData, setUpdateData] = useState({ status: '', admin_reply: '' });

    // ✅ แก้ไข: ลบ setLoading(true) ออกจากที่นี่ เพื่อไม่ให้ชนกับ useEffect
    const fetchTickets = useCallback(() => {
        fetch('http://localhost:3000/api/admin/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const activeTickets = data.data.filter(t => t.status !== 'resolved' && t.status !== 'cancelled');
                    setTickets(activeTickets);
                }
                setLoading(false); // ปิด Loading เมื่อเสร็จ
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            navigate('/login');
            return;
        }
        fetchTickets();
    }, [navigate, fetchTickets]);

    // ✅ เพิ่มฟังก์ชันสำหรับปุ่ม Refresh โดยเฉพาะ
    const handleRefresh = () => {
        setLoading(true); // สั่งหมุนเฉพาะตอนกดปุ่มเอง
        fetchTickets();
    };

    const handleEdit = (ticket) => {
        setSelectedTicket(ticket);
        setUpdateData({ status: ticket.status, admin_reply: ticket.admin_reply || '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const result = await response.json();
            if (result.success) {
                alert('อัปเดตสถานะเรียบร้อย!');
                setShowModal(false);
                setLoading(true); // สั่งโหลดใหม่
                fetchTickets();
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    const getStatusBadge = (status) => {
        const map = { 'new': 'primary', 'pending': 'warning', 'investigating': 'info' };
        return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <Container fluid className="p-4 p-md-5" style={{minHeight: '100vh', backgroundColor: '#f0f2f5'}}>
            
            <div className="d-flex justify-content-center">
                <AdminNavigation />
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm mt-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold text-primary mb-0">รายการแจ้งเรื่องที่รอการดำเนินการ</h4>
                    {/* ✅ ใช้ handleRefresh แทน */}
                    <Button onClick={handleRefresh} variant="outline-primary" size="sm">Refresh</Button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : (
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>ID</th>
                                <th>วันที่</th>
                                <th>หัวข้อ</th>
                                <th>ผู้แจ้ง</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td>#{ticket.id}</td>
                                        <td>{new Date(ticket.created_at).toLocaleDateString('th-TH')}</td>
                                        <td className="text-truncate" style={{maxWidth: '250px'}} title={ticket.title}>{ticket.title}</td>
                                        <td>{ticket.reporter_name}</td>
                                        <td>{ticket.department}</td>
                                        <td>{getStatusBadge(ticket.status)}</td>
                                        <td>
                                            <Button variant="light" size="sm" onClick={() => handleEdit(ticket)}>
                                                <FaEdit color="orange"/> แก้ไข
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">ไม่พบรายการที่ค้างอยู่</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </div>

            {/* Modal (เหมือนเดิม) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>จัดการงาน #{selectedTicket?.id}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>สถานะ</Form.Label>
                            <Form.Select value={updateData.status} onChange={(e) => setUpdateData({...updateData, status: e.target.value})}>
                                <option value="new">เรื่องใหม่</option>
                                <option value="pending">รับเรื่องแล้ว</option>
                                <option value="investigating">กำลังดำเนินการ</option>
                                <option value="resolved">เสร็จสิ้น (ย้ายไปหน้าประวัติ)</option>
                                <option value="cancelled">ยกเลิก (ย้ายไปหน้าประวัติ)</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>ข้อความตอบกลับ</Form.Label>
                            <Form.Control as="textarea" rows={3} value={updateData.admin_reply} onChange={(e) => setUpdateData({...updateData, admin_reply: e.target.value})} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>ปิด</Button>
                    <Button variant="primary" onClick={handleSave}>บันทึก</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;