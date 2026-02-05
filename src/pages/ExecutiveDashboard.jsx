import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';

// ลงทะเบียน Component ของ Chart.js
    ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
    );

    const ExecutiveDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูลจาก API เมื่อเปิดหน้าเว็บ
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
        const response = await axios.get('https://cosci-backend-pr6e.onrender.com/api/admin/dashboard-stats');
        if (response.data.success) {
            setStats(response.data.data);
        }
        } catch (error) {
        console.error('Error fetching stats:', error);
        } finally {
        setLoading(false);
        }
    };

    if (loading) {
        return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Spinner animation="border" variant="primary" />
        </Container>
        );
    }

    if (!stats) return <div className="text-center mt-5">ไม่สามารถโหลดข้อมูลได้</div>;

    // --- เตรียมข้อมูลสำหรับกราฟ ---

    // 1. กราฟแท่ง (หมวดหมู่ปัญหา)
    const categoryData = {
        labels: stats.categories.map(c => c.category),
        datasets: [
        {
            label: 'จำนวนเรื่องร้องเรียน (เรื่อง)',
            data: stats.categories.map(c => c.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        ],
    };

    // 2. กราฟวงกลม (สัดส่วนตามสาขาวิชา)
    const majorData = {
        labels: stats.majors.map(m => m.major),
        datasets: [
        {
            data: stats.majors.map(m => m.count),
            backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
        },
        ],
    };

    // 3. กราฟเส้น (แนวโน้มตามเดือน)
    const timelineData = {
        labels: stats.timeline.map(t => t.month),
        datasets: [
        {
            label: 'จำนวนคำร้อง',
            data: stats.timeline.map(t => t.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.3,
        },
        ],
    };

    return (
        <Container fluid className="p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 className="fw-bold mb-4 text-primary">📊 Dashboard ผู้บริหาร (COSCI Voice)</h2>

        {/* --- ส่วน KPI Cards --- */}
        <Row className="mb-4">
            <Col md={3}>
            <Card className="text-white bg-primary shadow-sm h-100">
                <Card.Body className="text-center">
                <h1>{stats.kpi.total}</h1>
                <h6>เรื่องร้องเรียนทั้งหมด</h6>
                </Card.Body>
            </Card>
            </Col>
            <Col md={3}>
            <Card className="text-white bg-success shadow-sm h-100">
                <Card.Body className="text-center">
                <h1>{stats.kpi.completed}</h1>
                <h6>แก้ไขเสร็จสิ้น</h6>
                </Card.Body>
            </Card>
            </Col>
            <Col md={3}>
            <Card className="text-white bg-warning shadow-sm h-100">
                <Card.Body className="text-center">
                <h1>{stats.kpi.pending}</h1>
                <h6>กำลังดำเนินการ / รอตรวจสอบ</h6>
                </Card.Body>
            </Card>
            </Col>
            <Col md={3}>
            <Card className="text-white bg-danger shadow-sm h-100">
                <Card.Body className="text-center">
                <h1>{stats.kpi.cancelled}</h1>
                <h6>ยกเลิก</h6>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* --- ส่วนกราฟ --- */}
        <Row>
            {/* กราฟแท่ง: หมวดหมู่ */}
            <Col md={8} className="mb-4">
            <Card className="shadow-sm p-3">
                <h5 className="mb-3">📌 สถิติแยกตามหมวดหมู่</h5>
                <Bar data={categoryData} />
            </Card>
            </Col>

            {/* กราฟวงกลม: สาขา */}
            <Col md={4} className="mb-4">
            <Card className="shadow-sm p-3">
                <h5 className="mb-3">🎓 สัดส่วนคำร้องตามสาขา</h5>
                <Pie data={majorData} />
            </Card>
            </Col>

            {/* กราฟเส้น: Timeline */}
            <Col md={12} className="mb-4">
            <Card className="shadow-sm p-3">
                <h5 className="mb-3">📈 แนวโน้มคำร้องรายเดือน</h5>
                <Line data={timelineData} />
            </Card>
            </Col>
        </Row>
        </Container>
    );
    };

    export default ExecutiveDashboard;