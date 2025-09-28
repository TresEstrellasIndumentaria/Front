import React, { useEffect } from 'react';
import LoginClasico from '../../Components/LoginClasico';
import LoginGoogle from '../../Components/LoginGoogle';
import './styles.css';

function LoginPage() {

    //efecto para iniciar la pagina desde la parte SUPERIOR
    useEffect(() => {
        // Desplaza la página hacia la parte superior cuando el componente se monta
        window.scrollTo(0, 0);
    }, []); // El array vacío asegura que se ejecute solo al montar el componente

    return (
        <div className='cont-login-page'>
            <div className='cont-login-clasico-page'>
                <LoginClasico />
            </div>
            
            <div className='cont-login-google-page'>
                <LoginGoogle />
            </div>
        </div>
    )
}

export default LoginPage