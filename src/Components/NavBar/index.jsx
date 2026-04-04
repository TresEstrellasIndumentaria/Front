import React, { useEffect, useState, } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { userData, logout } from "../../LocalStorage";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import Swal from "sweetalert2";
import "./styles.css";


function Navbar({ toggleSidebar, menuButtonRef }) {

    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const readLocalUser = () => {
        const saved = userData();
        if (!saved) return null;
        return saved.user ?? saved;
    };

    useEffect(() => {
        setUser(readLocalUser());

        const onUserChanged = (e) => {
            setUser(e.detail ?? readLocalUser());
        };

        const onStorage = (e) => {
            if (e.key === "userData") {
                setUser(e.newValue ? JSON.parse(e.newValue) : null);
            }
        };

        window.addEventListener("userChanged", onUserChanged);
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener("userChanged", onUserChanged);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const handleLogOut = () => {
        Swal.fire({
            title: "¿Salir del sistema?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, salir",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                setUser(null);

                window.dispatchEvent(
                    new CustomEvent("userChanged", { detail: null })
                );

                navigate("/");
            }
        });
    };

    return (
        <div className="cont-navbar">
            <div className="subCont-navbar">
                <div className="cont-menu-hambur">
                    <div
                        ref={menuButtonRef}
                        className="toggle-button"
                        onClick={toggleSidebar}
                    >
                        <div className="linea-menuHamburguesa"></div>
                        <div className="linea-menuHamburguesa"></div>
                        <div className="linea-menuHamburguesa"></div>
                    </div>
                </div>

                <div className="cont-login-logout">
                    {user ? (
                        <>
                            <span className="nombre-usuario">
                                Hola, {user.nombre}
                            </span>
                            <LogoutIcon
                                onClick={handleLogOut}
                                sx={{ cursor: "pointer" }}
                            />
                        </>
                    ) : (
                        <NavLink to="/login" className="navlink-login">
                            <LoginIcon sx={{ cursor: "pointer" }} />
                        </NavLink>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Navbar;
