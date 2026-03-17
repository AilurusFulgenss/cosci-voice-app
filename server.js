/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Resend } from 'resend';

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

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { userType, buasriId } = req.body;
    
    // ตรวจสอบข้อมูลเบื้องต้น
    if (!buasriId) return res.json({ success: false, message: 'กรุณากรอก Buasri ID' });

    if (userType === 'student') {
        // นิสิต: บันทึก ID, ชื่อ=ID (ชั่วคราว), สาขา=ไม่ระบุ
        const sql = "INSERT INTO student (stu_buasri, stu_name, major) VALUES (?, ?, 'ไม่ระบุ')";
        // เราใช้ buasriId เป็นชื่อไปก่อน เพราะหน้าลงทะเบียนไม่ถามชื่อ
        db.query(sql, [buasriId, buasriId], (err) => {
            if (err) {
                console.error(err);
                // ถ้า Error มักจะแปลว่า ID ซ้ำ (Duplicate Key)
                return res.json({ success: false, message: 'Buasri ID นี้มีอยู่ในระบบแล้ว (กรุณาไปที่หน้าเข้าสู่ระบบ)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
        });
    } else {
        // บุคลากร: บันทึก ID, ชื่อ=ID (ชั่วคราว)
        const sql = "INSERT INTO staff (staff_buasri, staff_name) VALUES (?, ?)";
        db.query(sql, [buasriId, buasriId], (err) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'Buasri ID นี้มีอยู่ในระบบแล้ว (กรุณาไปที่หน้าเข้าสู่ระบบ)' });
            }
            res.json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
        });
    }
});

// ==========================================
// 3. API Ticket Management (จัดการคำร้อง)
// ==========================================

// ==========================================
// 5. Guest OTP Endpoints
// ==========================================

// 5.1 ส่ง OTP ไปที่อีเมล Guest
app.post('/api/guest/send-otp', (req, res) => {
    const { email, name } = req.body;

    // ตรวจ format อีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ-นามสกุล' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ลบ OTP เก่าของอีเมลนี้ก่อน แล้วแทรกใหม่
    db.query("DELETE FROM otp_temp WHERE email = ?", [email], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });

        const sql = "INSERT INTO otp_temp (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))";
        db.query(sql, [email, otp], async (err) => {
            if (err) return res.status(500).json({ success: false, message: 'DB Error' });

            // ส่งอีเมล
            try {
                await resend.emails.send({
                    from: 'COSCI Voice <onboarding@resend.dev>',
                    to: email,
                    subject: 'รหัส OTP สำหรับการร้องเรียน COSCI Voice',
                    html: `
                        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 12px;">
                            <h2 style="color: #2e86ab; margin-top: 0;">COSCI Voice</h2>
                            <p>สวัสดีคุณ <strong>${name.trim()}</strong></p>
                            <p>รหัส OTP ของคุณสำหรับการยืนยันตัวตนเพื่อส่งเรื่องร้องเรียนคือ:</p>
                            <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 0.3rem; color: #2e86ab; text-align: center; padding: 16px; background: #f0f8ff; border-radius: 8px; margin: 16px 0;">
                                ${otp}
                            </div>
                            <p style="color: #666; font-size: 0.9rem;">รหัสนี้จะหมดอายุใน <strong>10 นาที</strong> กรุณาอย่าเปิดเผยรหัสนี้แก่ผู้อื่น</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                            <p style="color: #999; font-size: 0.8rem;">หากคุณไม่ได้ทำรายการนี้ กรุณาละเว้นอีเมลฉบับนี้</p>
                        </div>
                    `
                });
                res.json({ success: true, message: 'ส่ง OTP ไปที่อีเมลแล้ว' });
            } catch (mailErr) {
                console.error("Send OTP Mail Error:", mailErr);
                res.status(500).json({ success: false, message: 'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบ EMAIL_USER และ EMAIL_PASS ใน .env' });
            }
        });
    });
});

// 5.2 ยืนยัน OTP
app.post('/api/guest/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });

    const sql = "SELECT * FROM otp_temp WHERE email = ? AND otp = ? AND expires_at > NOW() AND verified = 0";
    db.query(sql, [email, otp], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP ไม่ถูกต้องหรือหมดอายุแล้ว' });
        }
        db.query("UPDATE otp_temp SET verified = 1 WHERE email = ?", [email], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'DB Error' });
            res.json({ success: true, verified: true });
        });
    });
});

// 5.3 ติดตาม Ticket สำหรับ Guest
app.get('/api/tickets/guest-track', (req, res) => {
    const { ticketId, email } = req.query;
    if (!ticketId || !email) return res.status(400).json({ success: false, message: 'กรุณาระบุ Ticket ID และอีเมล' });

    const sql = "SELECT id, category, sub_category, title, status, admin_reply, created_at FROM tickets WHERE id = ? AND guest_email = ?";
    db.query(sql, [ticketId, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบ ticket หรืออีเมลไม่ตรงกัน' });
        res.json({ success: true, data: results[0] });
    });
});

// 3.1 สร้าง Ticket ใหม่ (Create) — รองรับทั้ง student/staff/guest
app.post('/api/tickets', (req, res) => {
    const { user_id, guest_name, guest_email, user_type, major, category, sub_category, title, description, department, wants_reply } = req.body;

    const resolvedUserType = user_type || 'student';

    // สำหรับ guest: ตรวจว่ายืนยัน OTP แล้วหรือยัง
    if (resolvedUserType === 'guest') {
        if (!guest_email) return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมล' });

        const checkSql = "SELECT * FROM otp_temp WHERE email = ? AND verified = 1";
        db.query(checkSql, [guest_email], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'DB Error' });
            if (results.length === 0) return res.status(401).json({ success: false, message: 'กรุณายืนยัน OTP ก่อน' });

            insertTicket();
        });
    } else {
        insertTicket();
    }

    function insertTicket() {
        const sql = `INSERT INTO tickets (user_id, guest_name, guest_email, user_type, major, category, sub_category, title, description, department, wants_reply, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`;
        const replyVal = (wants_reply === 'yes' || wants_reply === true) ? 1 : 0;

        db.query(sql, [user_id || null, guest_name || null, guest_email || null, resolvedUserType, major || 'ไม่ระบุ', category, sub_category, title, description, department, replyVal], async (err, result) => {
            if (err) {
                console.error("Create Ticket Error:", err);
                return res.status(500).json({ success: false, message: err.message });
            }

            const ticketId = result.insertId;

            // ส่งอีเมลแจ้ง ticket ID ให้ guest
            if (resolvedUserType === 'guest' && guest_email) {
                try {
                    await resend.emails.send({
                        from: 'COSCI Voice <onboarding@resend.dev>',
                        to: guest_email,
                        subject: 'ได้รับเรื่องร้องเรียนของคุณแล้ว — COSCI Voice',
                        html: `
                            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 12px;">
                                <h2 style="color: #2e86ab; margin-top: 0;">COSCI Voice</h2>
                                <p>สวัสดีคุณ <strong>${guest_name || ''}</strong></p>
                                <p>ระบบได้รับเรื่องร้องเรียนของคุณแล้ว กรุณาจดบันทึก <strong>Ticket ID</strong> นี้ไว้เพื่อติดตามสถานะ:</p>
                                <div style="font-size: 2rem; font-weight: bold; color: #2e86ab; text-align: center; padding: 16px; background: #f0f8ff; border-radius: 8px; margin: 16px 0;">
                                    #${ticketId}
                                </div>
                                <p>คุณสามารถติดตามสถานะได้ที่หน้า <strong>"ติดตามเรื่องร้องเรียน (บุคคลภายนอก)"</strong> บนเว็บไซต์ โดยใช้ Ticket ID และอีเมลนี้</p>
                                <p style="color: #666; font-size: 0.9rem;">หัวข้อที่ส่ง: <em>${title}</em></p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                                <p style="color: #999; font-size: 0.8rem;">ขอบคุณที่ร่วมพัฒนาคณะ COSCI</p>
                            </div>
                        `
                    });
                } catch (mailErr) {
                    console.error("Send Ticket Confirmation Mail Error:", mailErr);
                    // ไม่ return error เพราะ ticket ถูกบันทึกแล้ว แค่แจ้ง warning
                }

                // ลบ OTP หลังใช้งานแล้ว
                db.query("DELETE FROM otp_temp WHERE email = ?", [guest_email], () => {});
            }

            res.json({ success: true, message: 'ส่งเรื่องร้องเรียนสำเร็จ', ticketId });
        });
    }
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
               CASE
                   WHEN tickets.user_type = 'guest' THEN COALESCE(tickets.guest_name, 'บุคคลภายนอก')
                   ELSE COALESCE(student.stu_name, staff.staff_name, 'Unknown')
               END AS reporter_name
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