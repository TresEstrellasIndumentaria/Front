import React from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import './styles.css';

const FormularioUsuario = ({
    nombre, apellido, dni, email, password,
    area, numTel, calle, numero, piso, depto,
    codigoPostal, provincia, localidad,
    errors, onClickVerContraseña,
    limpiarCampos, handleChange,
    handleSubmit, operacion, rol,
}) => {

    //función asigna rol al crear empleado/cliente/proveedor
    return (
        <form onSubmit={handleSubmit} noValidate className='form-container'>
            <div className='items-A'>
                {/* Nombre */}
                <div className="form-group">
                    <label>Nombre</label>
                    <input id="nombre" type="text" value={nombre} onChange={handleChange} placeholder="Nombre" />
                    {errors.nombre && <span className="error">El nombre {errors.nombre}</span>}
                </div>

                {/* Apellido */}
                <div className="form-group">
                    <label>Apellido</label>
                    <input id="apellido" type="text" value={apellido} onChange={handleChange} placeholder="Apellido" />
                    {errors.apellido && <span className="error">El apellido {errors.apellido}</span>}
                </div>

                {/* DNI */}
                <div className="form-group">
                    <label>DNI</label>
                    <input id="dni" type="text" value={dni} onChange={handleChange} placeholder="DNI" />
                    {errors.dni && <span className="error">El DNI {errors.dni}</span>}
                </div>

                {/* Email */}
                <div className="form-group">
                    <label>Email</label>
                    <input id="email" type="email" value={email} onChange={handleChange} placeholder="Email" />
                    {errors.email && <span className="error">El email {errors.email}</span>}
                </div>
            </div>

            <div className='items-B'>
                {/* Password */}
                <div className="form-group">
                    <label>Contraseña</label>
                    <div className="password-container">
                        <input id="password" type="password" value={password} onChange={handleChange} placeholder="Contraseña" />
                        <button type="button" className="btn-ver" onClick={onClickVerContraseña} aria-label="Ver contraseña">
                            <VisibilityIcon fontSize="small" />
                        </button>
                    </div>
                    {errors.password && <span className="error">La contraseña {errors.password}</span>}
                </div>

                {/* Teléfono */}
                <div className="form-group telefono-group">
                    <label>Teléfono</label>
                    <div className="tel-inputs">
                        <input id="area" type="text" value={area} onChange={handleChange} placeholder="Área" className="input-area" />
                        <input id="numTel" type="text" value={numTel} onChange={handleChange} placeholder="Número" className="input-num" />
                    </div>
                    {(errors.area || errors.numTel) && <span className="error">Teléfono {errors.area || errors.numTel}</span>}
                </div>

                {/* Dirección */}
                <div className="form-group">
                    <label>Dirección</label>
                    <div className="direccion-inputs">
                        <input id="calle" type="text" value={calle} onChange={handleChange} placeholder="Calle" />
                        <input id="numero" type="text" value={numero} onChange={handleChange} placeholder="Número" />
                        <input id="piso" type="text" value={piso} onChange={handleChange} placeholder="Piso" />
                        <input id="depto" type="text" value={depto} onChange={handleChange} placeholder="Depto" />
                    </div>
                    {(errors.calle || errors.numero) && <span className="error">Dirección incompleta</span>}
                </div>

                {/* Ubicación */}
                <div className="form-group">
                    <label>Ubicación</label>
                    <div className="ubicacion-inputs">
                        <input id="codigoPostal" type="text" value={codigoPostal} onChange={handleChange} placeholder="Código Postal" />
                        <input id="provincia" type="text" value={provincia} onChange={handleChange} placeholder="Provincia" />
                        <input id="localidad" type="text" value={localidad} onChange={handleChange} placeholder="Localidad" />
                    </div>
                    {(errors.codigoPostal || errors.provincia || errors.localidad) &&
                        <span className="error">Datos de ubicación incompletos</span>}
                </div>

                {/* Botones */}
                <div className="buttons">
                    <button type="submit" className="btn-submit">
                        {
                            operacion === 'crear' ? `Crear ${rol}` : `Modificar ${rol}`
                        }
                    </button>

                    <button type="button" onClick={limpiarCampos} className="btn-reset">
                        Limpiar
                    </button>
                </div>
            </div>
        </form>
    );
};

export default FormularioUsuario;
