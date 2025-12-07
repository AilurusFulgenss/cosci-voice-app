import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const AdminNavigation = () => {
    return (
        <Nav variant="pills" className="mb-4 bg-white p-2 rounded-3 shadow-sm d-inline-flex">
        <Nav.Item>
            {/* ✅ เพิ่ม className="admin-tab-link" */}
            <Nav.Link as={NavLink} to="/admin" end className="fw-bold px-4 admin-tab-link">
            📋 รายการแจ้งเรื่อง (Active)
            </Nav.Link>
        </Nav.Item>
        
        <Nav.Item>
            {/* ✅ เพิ่ม className="admin-tab-link" */}
            <Nav.Link as={NavLink} to="/admin/history" className="fw-bold px-4 admin-tab-link">
            ✅ ประวัติการดำเนินการ (History)
            </Nav.Link>
        </Nav.Item>
        </Nav>
    );
    };

export default AdminNavigation;