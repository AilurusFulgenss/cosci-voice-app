/* eslint-disable no-undef */
// 👆 บรรทัดบนสุดนี้สำคัญมาก: บอก ESLint ว่า "นี่คือไฟล์ Node.js" (แก้ Error 1-4)

import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า CORS
app.use(cors());
app.use(bodyParser.json());

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
// ✅ ส่วนเชื่อมต่อ Database (แบบมี SSL + Pool กันหลุด)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    // 👇 ต้องเพิ่มก้อนนี้เข้าไปครับ เพื่อเปิด SSL
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

// ส่วนเช็ค Connection (เหมือนเดิม)
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err);
    } else {
        console.log('✅ Database Connected via Secure Pool');
        connection.release();
    }
});

// --- API Routes ---

app.get('/', (req, res) => {
    res.send('Cosci Voice API is running on Localhost!');
});

// 1. API Login (รวมระบบเช็ค Dean Dashboard)
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    let userId = email;
    if (userId.includes('@')) {
        userId = userId.split('@')[0];
    }
    console.log('🔑 Login Attempt:', userId);

    const checkExecutiveAndRespond = (foundUser, role) => {
        const sqlCheckAdmin = "SELECT * FROM major_temp WHERE staffID = ?";
        
        db.query(sqlCheckAdmin, [foundUser.id], (err, adminResults) => {
            let isExecutive = false;
            let position = '';

            if (!err && adminResults.length > 0) {
                isExecutive = true;
                position = adminResults[0].position || 'ผู้บริหาร';
                console.log(`✅ User ${foundUser.id} เป็นผู้บริหาร (${position})`);
            }

            return res.json({
                success: true,
                role: role,
                isExecutive: isExecutive,
                position: position,
                user: foundUser
            });
        });
    };

    const sqlStudent = "SELECT * FROM student WHERE stu_id = ? OR stu_buasri = ?";
    db.query(sqlStudent, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (results.length > 0) {
            const user = results[0];
            checkExecutiveAndRespond({
                id: user.stu_id,
                name: user.stu_name,
                email: user.stu_id + '@g.swu.ac.th',
                major: user.stu_major
            }, 'student');
        } else {
            const sqlStaff = "SELECT * FROM staff WHERE staff_id = ? OR staff_buasri = ?";
            db.query(sqlStaff, [userId, userId], (err, staffResults) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                if (staffResults.length > 0) {
                    const staff = staffResults[0];
                    checkExecutiveAndRespond({
                        id: staff.staff_id,
                        name: staff.staff_name,
                        email: staff.staff_email || (staff.staff_buasri + '@g.swu.ac.th')
                    }, 'staff');
                } else {
                    return res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
                }
            });
        }
    });
});

// 2. API Dashboard Stats
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

// 3. API Ticket อื่นๆ
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
    
    // 👇 แก้ Error 5: ลบตัวแปร result ออก เพราะไม่ได้ใช้
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