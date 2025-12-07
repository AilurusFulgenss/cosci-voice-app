// src/pages/AdminHistory.jsx
import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Form, Spinner } from 'react-bootstrap'; // เพิ่ม Spinner
import AdminNavigation from '../components/AdminNavigation';

const AdminHistory = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetch('http://localhost:3000/api/admin/tickets')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const historyTickets = data.data.filter(t => t.status === 'resolved' || t.status === 'cancelled');
                    setTickets(historyTickets);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredTickets = tickets.filter(t => {
        const ticketYear = new Date(t.created_at).getFullYear();
        return ticketYear === parseInt(selectedYear);
    });

    return (
        <Container fluid className="p-4 p-md-5" style={{minHeight: '100vh', backgroundColor: '#f0f2f5'}}>
            
            <div className="d-flex justify-content-center">
                <AdminNavigation />
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm mt-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold text-secondary mb-0">ประวัติการดำเนินการที่เสร็จสิ้น</h4>
                    
                    <div className="d-flex align-items-center bg-light rounded-pill px-3 py-1 border">
                        <span className="text-muted small me-2">ปี:</span>
                        <Form.Select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border-0 bg-transparent py-0 shadow-none fw-bold text-dark"
                            style={{width: 'auto', cursor: 'pointer'}}
                        >
                            <option value="2025">2568</option>
                            <option value="2024">2567</option>
                            <option value="2023">2566</option>
                        </Form.Select>
                    </div>
                </div>

                {/* ✅ เพิ่มส่วนแสดง Loading ตรงนี้ */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="secondary" />
                        <p className="mt-2 text-muted">กำลังโหลดประวัติ...</p>
                    </div>
                ) : (
                    <Table responsive hover className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>ID</th>
                                <th>วันที่แจ้ง</th>
                                <th>วันที่จบงาน</th>
                                <th>หัวข้อ</th>
                                <th>ผู้แจ้ง</th>
                                <th>สถานะ</th>
                                <th>การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td className="text-muted">#{ticket.id}</td>
                                        <td>{new Date(ticket.created_at).toLocaleDateString('th-TH')}</td>
                                        <td>{new Date(ticket.updated_at).toLocaleDateString('th-TH')}</td>
                                        <td className="text-truncate" style={{maxWidth: '200px'}} title={ticket.title}>{ticket.title}</td>
                                        <td>{ticket.reporter_name}</td>
                                        <td>
                                            {ticket.status === 'resolved' 
                                                ? <Badge bg="success">เสร็จสิ้น</Badge> 
                                                : <Badge bg="secondary">ยกเลิก</Badge>}
                                        </td>
                                        <td className="small text-muted">{ticket.admin_reply || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">ไม่พบประวัติในปี {parseInt(selectedYear)+543}</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )}
            </div>
        </Container>
    );
};

export default AdminHistory;