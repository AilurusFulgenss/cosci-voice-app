/* eslint-disable */
// @ts-nocheck

import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(bodyParser.json());

// --- การเชื่อมต่อ Database (TiDB Cloud / Vercel) ---
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

// Test Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to database:', err);
    } else {
        console.log('✅ Connected to TiDB MySQL Database!');
        connection.release();
    }
});

// --- API Routes ---

// 1. API Login
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    let userId = email;
    if (userId.includes('@')) {
        userId = userId.split('@')[0];
    }

    const sqlStudent = "SELECT * FROM student WHERE stu_id = ? OR stu_buasri = ?";
    
    db.query(sqlStudent, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (results.length > 0) {
            const user = results[0];
            return res.json({
                success: true,
                role: 'student',
                user: {
                    id: user.stu_id,
                    name: user.stu_name,
                    email: user.stu_id + '@g.swu.ac.th',
                    major: user.stu_major
                }
            });
        } else {
            const sqlStaff = "SELECT * FROM staff WHERE staff_id = ? OR staff_buasri = ?";
            db.query(sqlStaff, [userId, userId], (err, staffResults) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                if (staffResults.length > 0) {
                    const staff = staffResults[0];
                    return res.json({
                        success: true,
                        role: 'staff',
                        user: {
                            id: staff.staff_id,
                            name: staff.staff_name,
                            email: staff.staff_email || (staff.staff_buasri + '@g.swu.ac.th')
                        }
                    });
                } else {
                    return res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
                }
            });
        }
    });
});

// 2. API Admin: Get All Tickets
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
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        res.json({ success: true, data: results });
    });
});

// 3. API: Create Ticket
app.post('/api/tickets', (req, res) => {
    const { user_id, major, category, sub_category, title, description, department, wants_reply } = req.body;

    const sql = `
        INSERT INTO tickets 
        (user_id, major, category, sub_category, title, description, department, wants_reply, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `;

    const values = [
        user_id, 
        major || 'ไม่ระบุ', 
        category, 
        sub_category || '', 
        title, 
        description, 
        department, 
        wants_reply === 'yes' ? 1 : 0 
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
            return res.status(500).json({ success: false, message: 'บันทึกข้อมูลไม่สำเร็จ: ' + err.message });
        }
        res.json({ success: true, message: 'ส่งเรื่องเรียบร้อยแล้ว!', ticketId: result.insertId });
    });
});

// 4. API: Update Ticket Status & Reply
app.put('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const { status, admin_reply } = req.body; 

    const sql = "UPDATE tickets SET status = ?, admin_reply = ? WHERE id = ?";

    db.query(sql, [status, admin_reply, ticketId], (err, result) => {
        if (err) {
            console.error('Update Error:', err);
            return res.status(500).json({ success: false, message: 'อัปเดตข้อมูลไม่สำเร็จ' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบรหัสเรื่องที่ระบุ' });
        }
        res.json({ success: true, message: 'บันทึกการดำเนินการเรียบร้อย' });
    });
});

// 5. API: Get User History
app.get('/api/tickets/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// เริ่มรัน Server (เฉพาะ Local)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running locally on http://localhost:${PORT}`);
    });
}

export default app;