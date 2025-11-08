import axios from "axios";
import { URL } from "../../Urls";
import {
    LOGIN, RESET_USER, GET_USER_BY_DNI, GET_ALL_USUARIOS, REGISTRARSE,
    MODIFICA_USUARIO, GET_USER_BY_ID,
    LOADING,
} from "./actionsType";
//-------usuario-----------------------------
export const login = (data) => {
    return async function (dispatch) {
        const resp = await axios.post(`${URL}/auth/login`, data); console.log("resp: ", resp.data)
        localStorage.setItem('dataUser', JSON.stringify(resp.data));
        //dispatch({type: LOGIN, payload: resp.data.user});
    }
}

export const resetLogin = () => {
    return {
        type: 'RESET_LOGIN',
    }
}

//login google
export const loginGoogle = (credential) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/auth/login/google`, { tokenId: credential });
            //guardo data en localstorage
            localStorage.setItem('dataUser', JSON.stringify(resp.data));
            dispatch({ type: LOGIN, payload: resp.data });
        } catch (error) {
            console.error("Error logging in", error.response?.data || error.message);
        }
    }
}

//-------registrarse-------
//action con manejo de errores
export const registrarse = (data) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/registrarse`, data);
            dispatch({type: REGISTRARSE, payload: resp.data});
            return resp.data; // 👉 el back debería enviar algo como { message: "success" }
        } catch (error) {
            console.error("Error en registrarse:", error);

            // Capturamos y devolvemos el mensaje del backend (si existe)
            return {
                message:
                    error.response?.data?.message ||
                    error.response?.data ||
                    "Error al registrar el usuario.",
            };
        }
    };
};

//-----usuario--------------------
export const getAllUsuarios = () => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/usuario`);
        dispatch({ type: GET_ALL_USUARIOS, payload: resp.data });
    }
}

//trae usuario por id
export const getUsuarioById = (id) => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/usuario/${id}`);
        //localStorage.setItem('dataUser', JSON.stringify(resp.data));
        dispatch({ type: GET_USER_BY_ID, payload: resp.data });
    }
}

//trae usuario por DNI
export const getUsuarioByDNI = (dni) => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/usuario/dni/${dni}`);
        dispatch({ type: GET_USER_BY_DNI, payload: resp.data });
        return resp.data;
    }
}

//reset usuario
export const resetUsuario = () => {
    return {
        type: RESET_USER,
    }
}

//modifica usuario - con manejo de errores
export const modificaUsuario = (id, data) => {
    return async function (dispatch) {  console.log("idF: ", id)
        try {
            const resp = await axios.put(`${URL}/usuario/modifica/${id}`, data);
            dispatch({type: MODIFICA_USUARIO, payload: resp.data});
            return resp.data;
        } catch (error) {
            console.error("Error en modificaUsuario:", error);

            return {
                message:
                    error.response?.data?.message ||
                    error.response?.data ||
                    "Error al modificar el usuario.",
            };
        }
    };
};

//modifica contraseña
export const modificaContraseña = (id, password) => {
    return async function (dispatch) {
        const resp = await axios.put(`${URL}/usuario/modificaPass/${id}`, { password });
        console.log('resp.data', resp.data);
        dispatch({ type: 'MODIFICA_CONTRASEÑA', payload: resp.data });
    }
}

// Eliminar usuario
export const eliminaUsuario = (id) => {
    return async function () {
        try {
            const resp = await axios.delete(`${URL}/usuario/eliminar/${id}`);
            return resp.data; // contiene { message: 'Usuario eliminado correctamente' }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            return {
                message: error.response?.data?.message || 'Error al eliminar usuario'
            };
        }
    };
};

//-----------------------------------
//Paso LOADING a FALSE
export const ActualizoLoading = () => {
    return{
        type: LOADING,
        payload: false
    }
};