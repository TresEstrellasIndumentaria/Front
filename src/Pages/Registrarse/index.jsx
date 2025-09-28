import React from 'react';
import Registrarse from '../../Components/Registrarse';

function RegistrarsePage() {
    return (
        <div className='page'>
            <h1>Alta nuevo usuario</h1>
            <Registrarse operacion="nuevo" tipo='usuario'/> {/* pueden tomar los vaslores de "nuevo o modif" y "usuario o cliente" */}
        </div>
    )
}

export default RegistrarsePage