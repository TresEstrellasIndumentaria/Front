import React, { useEffect, useState } from 'react';
import { userData, logout } from '../../LocalStorage';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import Swal from 'sweetalert2';
import './styles.css'
import { NavLink } from 'react-router-dom';

function Navbar({ toggleSidebar }) {
    const [user, setUser] = useState(null);
    //const [isOpen, setIsOpen] = useState(false);

    //const toggleSidebar = () => setIsOpen(v => !v);

    // Normaliza lo que hay en localStorage:
    const readLocalUser = () => {
        const saved = userData(); // tu helper
        if (!saved) return null;
        // si guardaste todo el resultado: { message: 'ok', user: { ... } }
        // o si guardaste directamente el user: { id:..., nombre:... }
        return saved.user ?? saved;
    };

    useEffect(() => {
        // al montar leo lo actual
        setUser(readLocalUser());

        // listener para cambios emitidos en el mismo tab
        const onUserChanged = (e) => {
            // si el emisor envía detail con la respuesta completa, lo uso; sino releo localStorage
            const detail = e?.detail;
            setUser(detail?.user ?? readLocalUser());
        };

        // listener para cambios en localStorage desde OTRAS pestañas (evento storage)
        const onStorage = (e) => {
            if (e.key === 'userData') {
                setUser(e.newValue ? (JSON.parse(e.newValue).user ?? JSON.parse(e.newValue)) : null);
            }
        };

        window.addEventListener('userChanged', onUserChanged);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('userChanged', onUserChanged);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // logout
    const handleLogOut = () => {
        Swal.fire({
            title: "Salir?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si!"
        }).then((result) => {
            if (result.isConfirmed) {
                logout();          // tu helper borra 'userData'
                setUser(null);     // actualizo estado local
                // aviso a otros componentes en este tab
                window.dispatchEvent(new CustomEvent('userChanged'));
                window.location.href = '/'; // redirijo a home
            }
        });
    };

    return (
        <div className='cont-navbar'>
            <div className='subCont-navbar'>
                <div className='cont-menu-hambur'>
                    <div className='cont-btn-menu'>
                        <div className="toggle-button" onClick={toggleSidebar}>
                            <div className='linea-menuHamburguesa'></div>
                            <div className='linea-menuHamburguesa'></div>
                            <div className='linea-menuHamburguesa'></div>
                        </div>
                    </div>
                </div>

                <div className='cont-login-logout'>
                    <div className='cont-icono-log'>
                        {user ? (
                            <>
                                <span className="nombre-usuario">Hola, {user.nombre}</span>
                                <LogoutIcon onClick={handleLogOut} sx={{ cursor: 'pointer' }} />
                            </>
                        ) : (
                            <NavLink to={'/login'} className={'navlink-login'}>
                                <LoginIcon sx={{ cursor: 'pointer' }} />
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
