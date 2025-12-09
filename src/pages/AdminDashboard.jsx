import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Badge, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import AdminNavigation from '../components/AdminNavigation';

// รายชื่อสาขาสำหรับทำ Dropdown Filter
const majorsList = [
    "ทั้งหมด",
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

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับการกรองข้อมูล
    const [selectedMajor, setSelectedMajor] = useState("ทั้งหมด");

    // State สำหรับ Modal แก้ไขงาน
    const [showModal, setShowModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [updateData, setUpdateData] = useState({ status: '', admin_reply: '' });

    // ฟังก์ชันดึงข้อมูล
    const fetchTickets = useCallback(() => {
        // ไม่ต้อง setLoading(true) ตรงนี้ เพื่อกัน Loop ตอนโหลดครั้งแรก
        fetch('/api/admin/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTickets(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // ทำงานเมื่อเปิดหน้าเว็บ
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            navigate('/login');
            return;
        }
        // เช็คสิทธิ์ User ตรงนี้ได้ (ถ้าต้องการ)
        fetchTickets();
    }, [navigate, fetchTickets]);

    // ฟังก์ชันสำหรับปุ่ม Refresh
    const handleRefresh = () => {
        setLoading(true);
        fetchTickets();
    };

    // ฟังก์ชันเปิด Modal แก้ไข
    const handleEdit = (ticket) => {
        setSelectedTicket(ticket);
        setUpdateData({ 
            status: ticket.status, 
            admin_reply: ticket.admin_reply || '' 
        });
        setShowModal(true);
    };

    // ฟังก์ชันบันทึกข้อมูล
    const handleSave = async () => {
        try {
            const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            const result = await response.json();
            if (result.success) {
                alert('อัปเดตสถานะเรียบร้อย!');
                setShowModal(false);
                setLoading(true);
                fetchTickets(); // โหลดข้อมูลใหม่ทันที
            } else {
                alert('เกิดข้อผิดพลาด: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    // ตัวกรองข้อมูล (Filter Logic)
    const filteredTickets = tickets.filter(ticket => {
        // 1. กรองเอาเฉพาะงานที่ "ยังไม่จบ" (ไม่ใช่ resolved และ cancelled)
        const isActiveStatus = ticket.status !== 'resolved' && ticket.status !== 'cancelled';
        
        // 2. กรองตามสาขา (ถ้าเลือก "ทั้งหมด" ก็เอาหมด)
        const isMatchMajor = selectedMajor === "ทั้งหมด" || ticket.major === selectedMajor;

        return isActiveStatus && isMatchMajor;
    });

    // เลือกสี Badge ตามสถานะ
    const getStatusBadge = (status) => {
        const map = {
            'new': 'primary',
            'pending': 'warning',
            'investigating': 'info',
            'resolved': 'success',
            'cancelled': 'secondary'
        };
        return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <Container fluid className="p-4 p-md-5" style={{minHeight: '100vh', backgroundColor: '#f0f2f5'}}>
            
            {/* แท็บเมนู Admin */}
            <div className="d-flex justify-content-center">
                <AdminNavigation />
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm mt-3">
                {/* หัวข้อ + ตัวกรอง + ปุ่ม Refresh */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h4 className="fw-bold text-primary mb-0">รายการแจ้งเรื่องที่รอการดำเนินการ</h4>
                    
                    <div className="d-flex gap-2 align-items-center">
                        {/* Dropdown เลือกสาขา */}
                        <Form.Select 
                            value={selectedMajor} 
                            onChange={(e) => setSelectedMajor(e.target.value)}
                            style={{maxWidth: '350px'}}
                            className="shadow-sm border-primary"
                        >
                            {majorsList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                        </Form.Select>

                        <Button onClick={handleRefresh} variant="outline-primary" size="sm">Refresh</Button>
                    </div>
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
                                <th>สาขา</th>
                                <th>หัวข้อ</th>
                                <th>ผู้แจ้ง</th>
                                <th>หน่วยงาน</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td>#{ticket.id}</td>
                                        <td>{new Date(ticket.created_at).toLocaleDateString('th-TH')}</td>
                                        <td><Badge bg="light" text="dark" className="border">{ticket.major || '-'}</Badge></td>
                                        <td className="text-truncate" style={{maxWidth: '200px'}} title={ticket.title}>{ticket.title}</td>
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
                                    <td colSpan="8" className="text-center py-4 text-muted">
                                        ไม่พบรายการที่ค้างอยู่ ในสาขาที่เลือก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </div>

            {/* Modal แก้ไขงาน */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>จัดการเรื่องร้องเรียน #{selectedTicket?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>สถานะงาน</Form.Label>
                            <Form.Select 
                                value={updateData.status} 
                                onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                            >
                                <option value="new">เรื่องใหม่ (New)</option>
                                <option value="pending">รับเรื่องแล้ว (Pending)</option>
                                <option value="investigating">กำลังดำเนินการ (Investigating)</option>
                                {/* ✅ แก้ไขตรงนี้: เปลี่ยน -> เป็น - เพื่อแก้ Error */}
                                <option value="resolved">เสร็จสิ้น (Resolved) - ย้ายไปหน้าประวัติ</option>
                                <option value="cancelled">ยกเลิก (Cancelled) - ย้ายไปหน้าประวัติ</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>ข้อความตอบกลับถึงนิสิต</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={updateData.admin_reply}
                                onChange={(e) => setUpdateData({...updateData, admin_reply: e.target.value})}
                                placeholder="แจ้งผลการดำเนินการ..."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>ปิด</Button>
                    <Button variant="primary" onClick={handleSave}>บันทึกการเปลี่ยนแปลง</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;