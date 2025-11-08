import React from 'react';
import Registrarse from '../../Components/Registrarse';

function RegistrarsePage({ operacion, rol }) {
    return (
        <div className='page'>
            <h1>Alta nuevo {rol === 'empleado' ? 'empleado' : 'cliente'}</h1>
            <Registrarse operacion={operacion} rol={rol}/> {/* pueden tomar los vaslores de "nuevo o modif" y "usuario o cliente" */}
        </div>
    )
}

export default RegistrarsePage