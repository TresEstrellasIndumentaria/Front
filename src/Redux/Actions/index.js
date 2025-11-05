import axios from "axios";
import { URL } from "../../Urls";
import { 
    LOGIN,  GET_USER, RESET_USER, GET_USER_BY_DNI,
    GET_ALL_USUARIOS,    
} from "./actionsType";
//-------usuario-----------------------------
export const login = (data) => {
    return async function(dispatch) {
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
    return async function(dispatch) {
        try {
            const resp = await axios.post(`${URL}/auth/login/google`, { tokenId: credential });
            //guardo data en localstorage
            localStorage.setItem('dataUser', JSON.stringify(resp.data));
            dispatch({type: LOGIN, payload: resp.data});
        } catch (error) {
            console.error("Error logging in", error.response?.data || error.message);
        }
    }
}

//-------registrarse-------
export const registrarse = (data) => {
    return async function(dispatch) { 
        const resp = await axios.post(`${URL}/registrarse`, data);
        return resp.data;
    }
}

//-----usuario--------------------
export const getAllUsuarios = () => {
    return async function(dispatch){
        const resp = await axios.get(`${URL}/usuario`);
        dispatch({type: GET_ALL_USUARIOS, payload: resp.data});
    }
}

//trae usuario por id
export const getUsuarioById = (id) => {
    return async function(dispatch) {  
        const resp = await axios.get(`${URL}/usuario/${id}`); 
        //localStorage.setItem('dataUser', JSON.stringify(resp.data));
        dispatch({type: GET_USER, payload: resp.data});
    }
}

//trae usuario por DNI
export const getUsuarioByDNI = (dni) => { 
    return async function(dispatch){
        const resp = await axios.get(`${URL}/usuario/dni/${dni}`);
        dispatch({type: GET_USER_BY_DNI, payload: resp.data});
        return resp.data;
    }
}

//reset usuario
export const resetUsuario = () => {
    return {
        type: RESET_USER,
    }
}

//modifica usuario
export const modificaUsuario = (id, data) => {console.log("idA:",id)
    return async function() {
        const resp = await axios.put(`${URL}/usuario/modificarUser/${id}`, data);
        return resp.data;
    }
}

//modifica contraseña
export const modificaContraseña = (id, password) => { 
    return async function(dispatch) {
        const resp = await axios.put(`${URL}/usuario/modificaPass/${id}`, {password});
        console.log('resp.data', resp.data);
        dispatch({type: 'MODIFICA_CONTRASEÑA', payload: resp.data}); 
    }
}