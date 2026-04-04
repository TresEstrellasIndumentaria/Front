import React, { useState } from 'react';
import axios from 'axios';
import { userData } from '../../LocalStorage';
import { URL } from '../../Urls';
import './styles.css';

const ModifDatosPersonales = () => {
    const user = userData();

    const [email] = useState(user.email || '');
    const [passwordActual, setPasswordActual] = useState('');
    const [passwordNueva, setPasswordNueva] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [showActual, setShowActual] = useState(false);
    const [showNueva, setShowNueva] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        if (passwordNueva && passwordNueva !== passwordConfirm) {
            return setError('Las contraseñas no coinciden');
        }

        try {
            await axios.put(
                `${URL}/personas/mis-datos`,
                { email, passwordActual, passwordNueva },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            setMensaje('Datos actualizados correctamente');
            setPasswordActual('');
            setPasswordNueva('');
            setPasswordConfirm('');
            setShowActual(false);
            setShowNueva(false);
            setShowConfirm(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al actualizar los datos');
        }
    };

    return (
        <div className="modif-datos-container">
            <h2>Mis datos personales</h2>

            <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    readOnly
                    className="input-readonly"
                />

                <hr />

                {/* PASSWORD ACTUAL */}
                <label>Contraseña actual</label>
                <div className="password-field">
                    <input
                        type={showActual ? 'text' : 'password'}
                        value={passwordActual}
                        onChange={(e) => setPasswordActual(e.target.value)}
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowActual(!showActual)}
                    >
                        {showActual ? 'Ocultar' : 'Ver'}
                    </button>
                </div>

                {/* NUEVA PASSWORD */}
                <label>Nueva contraseña</label>
                <div className="password-field">
                    <input
                        type={showNueva ? 'text' : 'password'}
                        value={passwordNueva}
                        onChange={(e) => setPasswordNueva(e.target.value)}
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowNueva(!showNueva)}
                    >
                        {showNueva ? 'Ocultar' : 'Ver'}
                    </button>
                </div>

                {/* CONFIRMACION */}
                <label>Confirmar nueva contraseña</label>
                <div className="password-field">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? 'Ocultar' : 'Ver'}
                    </button>
                </div>

                {error && <p className="error">{error}</p>}
                {mensaje && <p className="success">{mensaje}</p>}

                <button type="submit">Guardar cambios</button>
            </form>
        </div>
    );
};

export default ModifDatosPersonales;