// Login.js
import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginGoogle } from "../../Redux/Actions";


const Login = () => {
    
    const usuarioLog = useSelector(state => state.dataUsuario); //datos del usuario
    const dispatch = useDispatch();
    const navigate = useNavigate(); 

    const handleSuccess = async (credentialResponse) => {
        const { credential } = credentialResponse;
        dispatch(loginGoogle(credential));
        if(usuarioLog?.message === 'ok') {
                navigate('/home'); //redirijo a la pagina principal
            }
    };

    const handleFailure = () => {
        console.error("Google Login failed");
    };

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <div className="flex items-center justify-center h-screen">
                <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
