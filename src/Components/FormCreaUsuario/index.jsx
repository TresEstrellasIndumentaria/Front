import React, { useState } from 'react';
import './formulario-usuario.css';

const FormularioUsuario = () => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        password: '',
        telefono: '',
        direccion: '',
        rol: '',
    });

    const [errors, setErrors] = useState({});

    // Validaciones simples
    const validate = (fieldValues = form) => {
        let temp = { ...errors };

        if ('nombre' in fieldValues)
            temp.nombre = fieldValues.nombre ? '' : 'El nombre es obligatorio.';

        if ('apellido' in fieldValues)
            temp.apellido = fieldValues.apellido ? '' : 'El apellido es obligatorio.';

        if ('dni' in fieldValues)
            temp.dni = /^[0-9]{7,10}$/.test(fieldValues.dni)
                ? ''
                : 'DNI debe ser numérico y tener entre 7 y 10 dígitos.';

        if ('email' in fieldValues)
            temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fieldValues.email)
                ? ''
                : 'Email inválido.';

        if ('password' in fieldValues)
            temp.password = fieldValues.password.length >= 6
                ? ''
                : 'La contraseña debe tener al menos 6 caracteres.';

        if ('telefono' in fieldValues)
            temp.telefono = /^[0-9]{7,15}$/.test(fieldValues.telefono)
                ? ''
                : 'Teléfono inválido. Solo números, 7-15 dígitos.';

        if ('direccion' in fieldValues)
            temp.direccion = fieldValues.direccion ? '' : 'La dirección es obligatoria.';

        if ('rol' in fieldValues)
            temp.rol = fieldValues.rol ? '' : 'Selecciona un rol.';

        setErrors({ ...temp });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
        validate({ [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        validate();
        const hasErrors = Object.values(errors).some(x => x !== '');
        if (!hasErrors) {
            console.log('Datos del usuario:', form);
            alert('Usuario creado con éxito!');
            setForm({
                nombre: '',
                apellido: '',
                dni: '',
                email: '',
                password: '',
                telefono: '',
                direccion: '',
                rol: '',
            });
            setErrors({});
        } else {
            alert('Por favor completa todos los campos correctamente.');
        }
    };

    return (
        <div className="form-container">
            <h2>Crear Usuario</h2>
            <form onSubmit={handleSubmit} noValidate>
                {/* Nombre */}
                <div className="form-group">
                    <label>Nombre</label>
                    <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Nombre"
                    />
                    {errors.nombre && <span className="error">{errors.nombre}</span>}
                </div>

                {/* Apellido */}
                <div className="form-group">
                    <label>Apellido</label>
                    <input
                        type="text"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        placeholder="Apellido"
                    />
                    {errors.apellido && <span className="error">{errors.apellido}</span>}
                </div>

                {/* DNI */}
                <div className="form-group">
                    <label>DNI</label>
                    <input
                        type="text"
                        name="dni"
                        value={form.dni}
                        onChange={handleChange}
                        placeholder="DNI"
                    />
                    {errors.dni && <span className="error">{errors.dni}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>

                {/* Password */}
                <div className="form-group">
                    <label>Contraseña</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Contraseña"
                    />
                    {errors.password && <span className="error">{errors.password}</span>}
                </div>

                {/* Teléfono */}
                <div className="form-group">
                    <label>Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="Teléfono"
                    />
                    {errors.telefono && <span className="error">{errors.telefono}</span>}
                </div>

                {/* Dirección */}
                <div className="form-group">
                    <label>Dirección</label>
                    <input
                        type="text"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                        placeholder="Dirección"
                    />
                    {errors.direccion && <span className="error">{errors.direccion}</span>}
                </div>

                {/* Rol */}
                <div className="form-group">
                    <label>Rol</label>
                    <select name="rol" value={form.rol} onChange={handleChange}>
                        <option value="">-- Selecciona un rol --</option>
                        <option value="cliente">Cliente</option>
                        <option value="empleado">Empleado</option>
                        <option value="administrador">Administrador</option>
                    </select>
                    {errors.rol && <span className="error">{errors.rol}</span>}
                </div>

                <button type="submit" className="btn-submit">
                    Crear Usuario
                </button>
            </form>
        </div>
    );
};

export default FormularioUsuario;
