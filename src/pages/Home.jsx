// src/pages/Home.jsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUniversity, FaBrain, FaLightbulb, FaComments } from 'react-icons/fa';
import { Link } from 'react-router-dom';

    const MenuCard = ({ title, desc, icon, link }) => (
    <Link to={link} style={{ textDecoration: 'none' }}>
        <Card className="home-card">
        <Card.Body className="d-flex flex-column align-items-start text-start p-0">
            <div className="home-card-icon">{icon}</div>
            <h4 className="fw-bold text-dark mb-2">{title}</h4>
            <p className="text-secondary mb-0 fw-light" style={{lineHeight: '1.6'}}>{desc}</p>
        </Card.Body>
        </Card>
    </Link>
    );

    const Home = () => {
    return (
        // ✅ แก้ตรงนี้: เอา fluid ออก และใส่ maxWidth
        <Container className="d-flex flex-column justify-content-center" style={{minHeight: '80vh', maxWidth: '1450px'}}>
        
        {/* Header Section */}
        <Row className="align-items-center mb-5 gx-5">
            <Col lg={6} className="text-white">
            <h1 className="fw-bold mb-2 display-4">สวัสดี</h1>
            <h2 className="fw-bold mb-4 lh-base">
                ยินดีต้อนรับเข้าสู่เว็บไซต์รับ<br />
                ข้อเสนอแนะและเรื่องร้องเรียน<br />
                วิทยาลัยนวัตกรรมสื่อสารสังคม
            </h2>
            <p className="fw-light opacity-75 fs-5">
                หากท่านต้องการแจ้งเรื่องต่อวิทยาลัย<br />
                โปรดเลือกหมวดหมู่ด้านล่าง
            </p>
            </Col>
            
            <Col lg={6} className="d-none d-lg-block text-end">
                <div className="bg-white rounded-4 shadow-sm" 
                    style={{
                    height: '350px', 
                    width: '90%', 
                    marginLeft: 'auto',
                    transform: 'rotate(-2deg)',
                    // ✅ แก้ลิงก์ตรงนี้ครับ
                    backgroundImage: 'url("https://placehold.co/800x600")', 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                    }}>
                </div>
            </Col>
        </Row>

        {/* Cards Section */}
        <Row className="g-4 pb-5 mt-4">
            <Col md={6} lg={3}>
            <MenuCard 
                title="ข้อร้องเรียน" 
                desc="แจ้งปัญหาที่เกิดขึ้นกับระบบ บริการ หรือบุคลากร" 
                icon={<FaUniversity />} 
                link="/form/complaint"
            />
            </Col>
            <Col md={6} lg={3}>
            <MenuCard 
                title="ขอความช่วยเหลือ" 
                desc="ขอคำปรึกษาหรือความช่วยเหลือเฉพาะกรณี" 
                icon={<FaBrain />} 
                link="/form/help"
            />
            </Col>
            <Col md={6} lg={3}>
            <MenuCard 
                title="ความคาดหวัง" 
                desc="แสดงความคิดเห็น หรือสิ่งที่อยากให้พัฒนา" 
                icon={<FaLightbulb />} 
                link="/form/expectation"
            />
            </Col>
            <Col md={6} lg={3}>
            <MenuCard 
                title="ข้อเสนอแนะ" 
                desc="เสนอแนวคิดหรือแนวทางปรับปรุงกิจกรรม" 
                icon={<FaComments />} 
                link="/form/suggestion"
            />
            </Col>
        </Row>
        </Container>
    );
    };

export default Home;