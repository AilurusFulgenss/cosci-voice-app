import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const RegisterPage = () => {
    const [activeTab, setActiveTab] = useState('student'); // 'student' หรือ 'staff'
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        major: '' // เพิ่มช่องเก็บสาขา
    });
    const navigate = useNavigate();

    // รายชื่อสาขาวิชา (Hardcode ไว้ให้เลือกง่ายๆ)
    const majors = [
        "การออกแบบสื่อปฏิสัมพันธ์และมัลติมีเดีย (Multimedia)",
        "การจัดการภาพยนตร์และสื่อดิจิทัล (Film Management)",
        "การสื่อสารเพื่อเศรษฐศาสตร์ (Econ Comm)",
        "การสื่อสารเพื่อการท่องเที่ยว (Tourism)",
        "การสื่อสารเพื่อสุขภาพ (Health Comm)",
        "นวัตกรรมคอมพิวเตอร์เพื่อการสื่อสาร (Computer Innovation)",
        "การแสดงและกำกับการแสดงภาพยนตร์ (Acting)",
        "การผลิตภาพยนตร์และสื่อดิจิทัล (Cinema Production)",
        "การออกแบบเพื่องานภาพยนตร์ (Production Design)",
        "อื่นๆ"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // เช็ค validation
        if (activeTab === 'student' && !formData.major) {
            alert('กรุณาเลือกสาขาวิชา (เอก)');
            return;
        }

        try {
            const payload = {
                userType: activeTab,
                id: formData.id,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                major: activeTab === 'student' ? formData.major : null // ส่งสาขาเฉพาะนิสิต
            };

            // ยิงไปที่ Render
            const response = await axios.post('https://cosci-backend-pr6e.onrender.com/api/register', payload);

            if (response.data.success) {
                alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
                navigate('/login');
            } else {
                alert('เกิดข้อผิดพลาด: ' + response.data.message);
            }
        } catch (error) {
            console.error(error);
            alert('เชื่อมต่อ Server ไม่ได้');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>ลงทะเบียนเข้าใช้งาน</h2>
                
                {/* 🔹 ส่วน Tab เลือกประเภท */}
                <div className="tab-group">
                    <button 
                        className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                        onClick={() => setActiveTab('student')}
                    >
                        นิสิต
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                        onClick={() => setActiveTab('staff')}
                    >
                        อาจารย์และบุคลากร
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                    
                    {/* 🔹 ฟอร์มสำหรับนิสิต */}
                    {activeTab === 'student' && (
                        <>
                            <div className="form-group">
                                <label>รหัสนิสิต *</label>
                                <input name="id" type="text" placeholder="661xxxxxxxx" onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>ชื่อ-นามสกุล *</label>
                                <input name="name" type="text" placeholder="ชื่อ นามสกุล" onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>สาขาวิชา (เอก) *</label>
                                <select name="major" onChange={handleChange} required className="form-select">
                                    <option value="">-- กรุณาเลือกสาขา --</option>
                                    {majors.map((m, index) => (
                                        <option key={index} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* 🔹 ฟอร์มสำหรับบุคลากร */}
                    {activeTab === 'staff' && (
                        <>
                            <div className="form-group">
                                <label>Buasri ID *</label>
                                <input name="id" type="text" placeholder="เช่น somchai.j" onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>ชื่อ-นามสกุล *</label>
                                <input name="name" type="text" placeholder="ชื่อ นามสกุล" onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>อีเมล (G.swu / Official) *</label>
                                <input name="email" type="email" placeholder="email@g.swu.ac.th" onChange={handleChange} required />
                            </div>
                        </>
                    )}

                    {/* 🔹 ส่วน Password (ใช้ร่วมกัน) */}
                    <div className="form-group">
                        <label>รหัสผ่าน *</label>
                        <input name="password" type="password" placeholder="ตั้งรหัสผ่าน" onChange={handleChange} required />
                    </div>

                    <button type="submit" className="auth-btn">ยืนยันการสมัคร</button>
                </form>

                <div className="auth-footer">
                    <p className="toggle-text">
                        มีบัญชีอยู่แล้ว? 
                        <span className="toggle-link" onClick={() => navigate('/login')}> เข้าสู่ระบบ</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;