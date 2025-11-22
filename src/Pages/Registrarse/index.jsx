import React from 'react';
import Registrarse from '../../Components/Registrarse';

function RegistrarsePage({ operacion, rol }) {
    return (
        <div className='registrarse page'>
            <h1>Alta nuevo {rol}</h1>
            <Registrarse operacion={operacion} rol={rol}/> {/* pueden tomar los valores de "nuevo o modif" y "usuario/cliente/proveedor" */}
        </div>
    )
}

export default RegistrarsePage