import React, { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../NavBar';
import BarraLateral from '../Barra-lateral-extendible';
import './styles.css';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const menuButtonRef = useRef(null);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <div className="dashboard-container">
            <Navbar
                toggleSidebar={toggleSidebar}
                menuButtonRef={menuButtonRef}
            />

            <BarraLateral
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                menuButtonRef={menuButtonRef}
            />

            <main className={`dashboard-content ${sidebarOpen ? 'open' : 'closed'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;