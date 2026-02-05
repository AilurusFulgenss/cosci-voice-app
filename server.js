/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Config Database (SSL: false เพื่อความชัวร์ ป้องกัน Error 502)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
});

// เช็คการเชื่อมต่อ Database
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err);
    } else {
        console.log('✅ Database Connected successfully');
        connection.release();
    }
});

// --- API Routes ---

// 0. Root Route (สำหรับเช็คว่า Server ตื่นหรือยัง)
app.get('/', (req, res) => {
    res.send('✅ COSCI Voice API is Running!');
});

// ==========================================
// 1. API Login (Logic ใหม่: เช็ค Buasri ID)
// ==========================================
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    const loginId = email.trim(); 
    console.log('🔑 Login Attempt:', loginId);

    // 1.1 เช็คในตารางนิสิต (Student)
    db.query("SELECT * FROM student WHERE stu_buasri = ?", [loginId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error (Student)' });
        
        if (results.length > 0) {
            // เจอเป็นนิสิต
            const user = results[0];
            return res.json({
                success: true, role: 'student', isExecutive: false,
                user: { id: user.stu_buasri, name: user.stu_name, major: user.major }
            });
        }

        // 1.2 ถ้าไม่เจอ ไปเช็คในตารางบุคลากร (Staff)
        db.query("SELECT * FROM staff WHERE staff_buasri = ?", [loginId], (err, staffRes) => {
            if (err) return res.status(500).json({ success: false, message: 'DB Error (Staff)' });

            if (staffRes.length > 0) {
                // เจอเป็นบุคลากร
                const staff = staffRes[0];
                const fullName = staff.staff_name || '';
                const firstName = fullName.split(' ')[0]; // ตัดนามสกุลออกเพื่อเช็คผู้บริหาร

                // 1.3 เช็คว่าเป็นผู้บริหารหรือไม่ (Major Temp)
                db.query("SELECT * FROM major_temp WHERE Name = ?", [firstName], (err, adminRes) => {
                    const isExec = (!err && adminRes.length > 0);
                    return res.json({
                        success: true, role: 'staff', isExecutive: isExec,
                        user: { id: staff.staff_buasri, name: staff.staff_name }
                    });
                });
            } else {
                return res.json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ (กรุณาลงทะเบียนก่อน)' });
            }
        });
    });
});

// ==========================================
// 2. API Register (แยกประเภท นิสิต/บุคลากร)
// ==========================================
app.post('/api/register', (req, res) => {
    const { userType, buasriId, name, major } = req.body;

    if (userType === 'student') {
        const sql = "INSERT INTO student (stu_buasri, stu_name, major) VALUES (?, ?, ?)";
        db.query(sql, [buasriId, name, major], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'ลงทะเบียนไม่สำเร็จ (ID อาจจะซ้ำ)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนนิสิตสำเร็จ' });
        });
    } else {
        const sql = "INSERT INTO staff (staff_buasri, staff_name) VALUES (?, ?)";
        db.query(sql, [buasriId, name], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'ลงทะเบียนไม่สำเร็จ (ID อาจจะซ้ำ)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนบุคลากรสำเร็จ' });
        });
    }
});

// ==========================================
// 3. API Ticket Management (จัดการคำร้อง)
// ==========================================

// 3.1 สร้าง Ticket ใหม่ (Create)
app.post('/api/tickets', (req, res) => {
    const { user_id, major, category, sub_category, title, description, department, wants_reply } = req.body;
    
    // Status เริ่มต้นเป็น 'new'
    const sql = `INSERT INTO tickets (user_id, major, category, sub_category, title, description, department, wants_reply, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`;
    
    // แปลง wants_reply เป็น 0 หรือ 1
    const replyVal = (wants_reply === 'yes' || wants_reply === true) ? 1 : 0;

    db.query(sql, [user_id, major || 'ไม่ระบุ', category, sub_category, title, description, department, replyVal], (err, result) => {
        if (err) {
            console.error("Create Ticket Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'ส่งเรื่องร้องเรียนสำเร็จ', ticketId: result.insertId });
    });
});

// 3.2 ดึง Ticket ของ User คนนั้นๆ (User History)
app.get('/api/tickets/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC";
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        res.json({ success: true, data: results });
    });
});

// 3.3 ดึง Ticket ทั้งหมดสำหรับ Admin (Admin List)
// 🔥 สำคัญ: Join กับตาราง student/staff ด้วย Buasri ID เพื่อให้ได้ชื่อคนแจ้ง
app.get('/api/admin/tickets', (req, res) => {
    const sql = `
        SELECT tickets.*, 
               COALESCE(student.stu_name, staff.staff_name, 'Unknown') AS reporter_name 
        FROM tickets 
        LEFT JOIN student ON tickets.user_id = student.stu_buasri 
        LEFT JOIN staff ON tickets.user_id = staff.staff_buasri 
        ORDER BY tickets.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Admin Tickets Error:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, data: results });
    });
});

// 3.4 อัปเดตสถานะ Ticket (Update Status)
app.put('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const { status, admin_reply } = req.body; 
    
    const sql = "UPDATE tickets SET status = ?, admin_reply = ? WHERE id = ?";
    
    db.query(sql, [status, admin_reply, ticketId], (err) => {
        if (err) {
            console.error("Update Ticket Error:", err);
            return res.status(500).json({ success: false, message: 'อัปเดตข้อมูลไม่สำเร็จ' });
        }
        res.json({ success: true, message: 'บันทึกการดำเนินการเรียบร้อย' });
    });
});

// ==========================================
// 4. API Dashboard Stats (สำหรับกราฟผู้บริหาร)
// ==========================================
app.get('/api/admin/dashboard-stats', async (req, res) => {
    console.log("📊 Requesting Dashboard Stats...");
    try {
        const [kpi, categories, majors, timeline] = await Promise.all([
            // 4.1 KPI Cards (ยอดรวมแยกตามสถานะ)
            new Promise((resolve) => db.query(`SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status IN ('new', 'pending', 'investigating') THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM tickets`, (err, res) => resolve(res[0]))),
            
            // 4.2 กราฟแท่ง (แยกตามหมวดหมู่)
            new Promise((resolve) => db.query(`SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC`, 
            (err, res) => resolve(res || []))),

            // 4.3 กราฟวงกลม (แยกตามสาขา)
            new Promise((resolve) => db.query(`SELECT major, COUNT(*) as count FROM tickets WHERE major IS NOT NULL GROUP BY major`, 
            (err, res) => resolve(res || []))),

            // 4.4 กราฟเส้น (Timeline รายเดือน)
            new Promise((resolve) => db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM tickets GROUP BY month ORDER BY month ASC LIMIT 12`, 
            (err, res) => resolve(res || [])))
        ]);

        console.log("✅ Stats Fetched Successfully");
        res.json({ success: true, data: { kpi, categories, majors, timeline } });
    } catch (error) {
        console.error("❌ Stats Error:", error);
        res.status(500).json({ success: false });
    }
});

// เริ่มต้น Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});