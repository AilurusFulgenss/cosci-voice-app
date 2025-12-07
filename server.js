// server.js (ฉบับแก้ไข - รองรับ ES Modules)
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cosci_system' 
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database!');
});

// --- API Login ---
app.post('/api/login', (req, res) => {
    // รับแค่ email พอ (เพราะ password เรายังไม่ได้เอาไปเช็คอะไรตอนนี้)
    const { email } = req.body;

    console.log('มีการพยายามล็อกอิน:', email);

    let userId = email;
    if (userId.includes('@')) {
        userId = userId.split('@')[0];
    }

// 1. เช็คในตารางนิสิต
    const sqlStudent = "SELECT * FROM student WHERE stu_id = ? OR stu_buasri = ?";
    
    db.query(sqlStudent, [userId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่ Server' });
        }

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
            // 2. ถ้าไม่เจอนิสิต ลองเช็คในตารางบุคลากร
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

app.post('/api/tickets', (req, res) => {
    const { user_id, category, sub_category, title, description, department, wants_reply } = req.body;

    console.log('ได้รับข้อมูล Ticket:', req.body);

    const sql = `
        INSERT INTO tickets 
        (user_id, category, sub_category, title, description, department, wants_reply, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `;

    const values = [
        user_id, 
        category, 
        sub_category || '', // ถ้าไม่มีหมวดหมู่ย่อย ให้ใส่ค่าว่าง
        title, 
        description, 
        department, 
        wants_reply === 'yes' ? 1 : 0 // แปลงค่า 'yes' เป็น 1 (True), 'no' เป็น 0 (False)
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
            return res.status(500).json({ success: false, message: 'บันทึกข้อมูลไม่สำเร็จ: ' + err.message });
        }

        console.log('บันทึก Ticket สำเร็จ ID:', result.insertId);
        res.json({ success: true, message: 'ส่งเรื่องเรียบร้อยแล้ว!', ticketId: result.insertId });
    });
});

app.get('/api/tickets/:userId', (req, res) => {
    const userId = req.params.userId;

    // ดึงข้อมูล เรียงจากใหม่ไปเก่า (DESC)
    const sql = "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/api/admin/tickets', (req, res) => {
    // ✅ แก้ไข: เพิ่ม DISTINCT เพื่อป้องกันข้อมูลซ้ำ และ GROUP BY ticket.id เพื่อความชัวร์
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

// --- API: Admin อัปเดตสถานะและตอบกลับ ---
app.put('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const { status, admin_reply } = req.body; 

    const sql = "UPDATE tickets SET status = ?, admin_reply = ? WHERE id = ?";

    db.query(sql, [status, admin_reply, ticketId], (err, result) => {
        if (err) {
            console.error('Update Error:', err);
            return res.status(500).json({ success: false, message: 'อัปเดตข้อมูลไม่สำเร็จ' });
        }

        // ✅ แก้ตรงนี้: เอา result มาเช็คว่ามีแถวไหนถูกกระทบไหม (ถ้า 0 แปลว่าหา ID ไม่เจอ)
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบรหัสเรื่องที่ระบุ' });
        }

        res.json({ success: true, message: 'บันทึกการดำเนินการเรียบร้อย' });
    });
});

app.post('/api/tickets', (req, res) => {
    // ✅ เพิ่ม major เข้ามารับค่า
    const { user_id, major, category, sub_category, title, description, department, wants_reply } = req.body;

    console.log('ได้รับข้อมูล Ticket:', req.body);

    const sql = `
        INSERT INTO tickets 
        (user_id, major, category, sub_category, title, description, department, wants_reply, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `;

    const values = [
        user_id, 
        major || 'ไม่ระบุ', // ✅ เพิ่ม major ลงใน values
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
        console.log('บันทึก Ticket สำเร็จ ID:', result.insertId);
        res.json({ success: true, message: 'ส่งเรื่องเรียบร้อยแล้ว!', ticketId: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});