/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อ Database
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

// --- API Routes ---

// 1. API Login (Logic ใหม่: เช็ค Buasri -> ตัดนามสกุล -> เช็คผู้บริหาร)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; // email ในที่นี้คือ input ที่ user กรอก (Buasri ID)
    const loginId = email.trim(); // ตัดช่องว่างหน้าหลังออก

    console.log('🔑 Login Attempt with Buasri ID:', loginId);

    // Step 1: เช็คว่าเป็น "นิสิต" หรือไม่? (ดูจาก stu_buasri)
    const sqlStudent = "SELECT * FROM student WHERE stu_buasri = ?";
    db.query(sqlStudent, [loginId], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error (Student)' });

        if (results.length > 0) {
            // ✅ เจอนิสิต
            const user = results[0];
            // เช็คระหัสผ่าน
            const match = await bcrypt.compare(password, user.stu_password);
            if (!match) return res.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });

            return res.json({
                success: true,
                role: 'student',
                isExecutive: false,
                user: {
                    id: user.stu_buasri,
                    name: user.stu_name,
                    major: user.major // ส่งเอกไปด้วย
                }
            });
        } else {
            // ❌ ไม่เจอนิสิต -> Step 2: ไปเช็ค "บุคลากร" (ดูจาก staff_buasri)
            const sqlStaff = "SELECT * FROM staff WHERE staff_buasri = ?";
            db.query(sqlStaff, [loginId], async (err, staffResults) => {
                if (err) return res.status(500).json({ success: false, message: 'DB Error (Staff)' });

                if (staffResults.length > 0) {
                    // ✅ เจอบุคลากร
                    const staff = staffResults[0];
                    // เช็คระหัสผ่าน
                    const match = await bcrypt.compare(password, staff.staff_password);
                    if (!match) return res.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });

                    // Step 3 & 4: เอาชื่อมาตัดนามสกุลออก
                    // ตัวอย่าง: "ผศ.ดร.ปรวัน แพทยานนท์" -> split(' ') -> ["ผศ.ดร.ปรวัน", "แพทยานนท์"]
                    const fullName = staff.staff_name || '';
                    const nameOnly = fullName.split(' ')[0]; // เอาแค่ก้อนแรก

                    console.log(`Staff Found: ${fullName} -> Checking Executive as: ${nameOnly}`);

                    // Step 5: เอาชื่อที่ตัดแล้ว ไปเช็คใน major_temp
                    const sqlCheckAdmin = "SELECT * FROM major_temp WHERE Name = ?";
                    db.query(sqlCheckAdmin, [nameOnly], (err, adminResults) => {
                        let isExecutive = false;
                        let position = '';

                        if (!err && adminResults.length > 0) {
                            // ✅ เจอใน major_temp = ผู้บริหาร
                            isExecutive = true;
                            position = adminResults[0].position || 'ผู้บริหาร';
                            console.log('✅ Matches Executive list!');
                        } else {
                            console.log('ℹ️ Normal Staff (Not in Executive list)');
                        }

                        // Step 6: ส่งผลลัพธ์กลับ
                        return res.json({
                            success: true,
                            role: 'staff',
                            isExecutive: isExecutive,
                            position: position,
                            user: {
                                id: staff.staff_buasri,
                                name: staff.staff_name,
                                email: staff.staff_email
                            }
                        });
                    });

                } else {
                    // ❌ ไม่เจออะไรเลย
                    return res.json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
                }
            });
        }
    });
});

// 2. API Register (รองรับการแยกประเภท)
app.post('/api/register', async (req, res) => {
    const { userType, buasriId, name, password, major } = req.body;
    
    // Encrypt Password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
        console.error("Encryption Error:", error);
        return res.json({ success: false, message: 'Password Encryption Failed' });
    }

    if (userType === 'student') {
        // นิสิต: เก็บ stu_buasri, stu_name, stu_password, major
        const sql = "INSERT INTO student (stu_buasri, stu_name, stu_password, major) VALUES (?, ?, ?, ?)";
        db.query(sql, [buasriId, name, hashedPassword, major], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'ลงทะเบียนไม่สำเร็จ (Buasri ID ซ้ำหรือระบบขัดข้อง)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนนิสิตสำเร็จ!' });
        });
    } else {
        // บุคลากร: เก็บ staff_buasri, staff_name, staff_password
        const sql = "INSERT INTO staff (staff_buasri, staff_name, staff_password) VALUES (?, ?, ?)";
        db.query(sql, [buasriId, name, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'ลงทะเบียนไม่สำเร็จ (Buasri ID ซ้ำหรือระบบขัดข้อง)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนบุคลากรสำเร็จ!' });
        });
    }
});

// 3. API Dashboard Stats
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const [kpiResult, categoryResult, majorResult, timelineResult] = await Promise.all([
            new Promise((resolve, reject) => {
                db.query(`SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status IN ('new', 'pending', 'investigating') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM tickets`, (err, res) => err ? reject(err) : resolve(res[0]));
            }),
            new Promise((resolve, reject) => {
                db.query(`SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC`, 
                (err, res) => err ? reject(err) : resolve(res));
            }),
            new Promise((resolve, reject) => {
                db.query(`SELECT major, COUNT(*) as count FROM tickets WHERE major IS NOT NULL GROUP BY major ORDER BY count DESC`, 
                (err, res) => err ? reject(err) : resolve(res));
            }),
            new Promise((resolve, reject) => {
                db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM tickets GROUP BY month ORDER BY month ASC LIMIT 12`, 
                (err, res) => err ? reject(err) : resolve(res));
            })
        ]);

        res.json({ success: true, data: { kpi: kpiResult, categories: categoryResult, majors: majorResult, timeline: timelineResult } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// 4. API Ticket อื่นๆ
app.get('/api/admin/tickets', (req, res) => {
    const sql = `
        SELECT DISTINCT tickets.*, 
               COALESCE(student.stu_name, staff.staff_name, 'Unknown') AS reporter_name 
        FROM tickets 
        LEFT JOIN student ON tickets.user_id = student.stu_id 
        LEFT JOIN staff ON tickets.user_id = staff.staff_id 
        GROUP BY tickets.id
        ORDER BY tickets.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        res.json({ success: true, data: results });
    });
});

app.post('/api/tickets', (req, res) => {
    const { user_id, major, category, sub_category, title, description, department, wants_reply } = req.body;
    const sql = `INSERT INTO tickets (user_id, major, category, sub_category, title, description, department, wants_reply, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`;
    const values = [user_id, major || 'ไม่ระบุ', category, sub_category || '', title, description, department, wants_reply === 'yes' ? 1 : 0];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'ส่งเรื่องเรียบร้อยแล้ว!', ticketId: result.insertId });
    });
});

app.put('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const { status, admin_reply } = req.body; 
    const sql = "UPDATE tickets SET status = ?, admin_reply = ? WHERE id = ?";
    
    db.query(sql, [status, admin_reply, ticketId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'อัปเดตข้อมูลไม่สำเร็จ' });
        res.json({ success: true, message: 'บันทึกการดำเนินการเรียบร้อย' });
    });
});

app.get('/api/tickets/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});