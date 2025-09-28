import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../NavBar';
import BarraLateral from '../Barra-lateral-extendible';
import './styles.css';

const DashboardLayout = () => {
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <div className="dashboard-container">
            <Navbar toggleSidebar={toggleSidebar} />
            <BarraLateral isOpen={isOpen} />
            <main className={`dashboard-content ${isOpen ? 'open' : 'closed'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
