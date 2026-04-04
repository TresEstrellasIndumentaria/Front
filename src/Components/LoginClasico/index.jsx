import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import "./styles.css";

function LoginClasico() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});

    /* VALIDACIONES */
    const validate = () => {
        const validationErrors = {};

        if (!email) {
            validationErrors.email = "El email es obligatorio";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            validationErrors.email = "El email no es válido";
        }

        if (!password) {
            validationErrors.password = "La contraseña es obligatoria";
        } else if (password.length < 6) {
            validationErrors.password = "Debe tener al menos 6 caracteres";
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length > 0;
    };

    /* VER / OCULTAR PASSWORD */
    const onClickVerContraseña = () => {
        const input = document.getElementById("password");
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
        }
    };

    /* LOGIN */
    const handleLogin = async (e) => {
        e.preventDefault();
        if (validate()) return;

        try {
            const response = await fetch("http://localhost:3001/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    text: result.message || "Error en login",
                    icon: "error",
                });
                return;
            }

            //Guardar usuario
            localStorage.setItem("userData", JSON.stringify(result.user));

            //Notificar al resto de la app
            window.dispatchEvent(
                new CustomEvent("userChanged", { detail: result.user })
            );

            //Redirigir
            navigate("/");

        } catch (error) {
            console.error("Error login:", error);
            Swal.fire({
                text: "Error de conexión con el servidor",
                icon: "error",
            });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") e.preventDefault();
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Iniciar Sesión</h2>

            <form
                onSubmit={handleLogin}
                onKeyDown={handleKeyDown}
                className="login-form"
            >
                {/* EMAIL */}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="cont-inputPass-Y-btnVer">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? "input-error" : "input-pass"}
                        />
                        <EmailIcon className="icon-email" />
                    </div>
                    {errors.email && (
                        <p className="error-message">{errors.email}</p>
                    )}
                </div>

                {/* PASSWORD */}
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <div className="cont-inputPass-Y-btnVer">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={
                                errors.password ? "input-error" : "input-pass"
                            }
                        />
                        <button
                            type="button"
                            className="btn-viewPass-login"
                            onClick={onClickVerContraseña}
                        >
                            <VisibilityIcon />
                        </button>
                    </div>
                    {errors.password && (
                        <p className="error-message">{errors.password}</p>
                    )}
                </div>

                <button type="submit" className="login-button">
                    Login
                </button>
            </form>

            <p className="p-login">¿Olvidaste tu contraseña o email?</p>

            <button
                type="button"
                className="register-button-login"
                onClick={() => navigate("/recuperarDatosUsuario")}
            >
                Recuperar contraseña
            </button>
        </div>
    );
}

export default LoginClasico;
