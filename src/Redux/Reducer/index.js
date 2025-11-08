import { REGISTRARSE, LOGIN, RESET_LOGIN, GET_ALL_USUARIOS, GET_USER_BY_ID, LOADING } from "../Actions/actionsType";

const initialState = {
    loading: true,
    dataUsuario: {},
    usuarios: [],
}

export default function rootReducer(state = initialState, action) {
    switch (action.type) {
        case LOADING:
            return{
                ...state,
                loading: action.payload
            }
        case REGISTRARSE:
            return {
                ...state,
                dataUsuario: action.payload
            }
        case LOGIN:
            return {
                ...state,
                dataUsuario: action.payload,
            }
        case RESET_LOGIN:
            return {
                ...state,
                login: null,
            }
        case GET_ALL_USUARIOS:
            return {
                ...state, 
                usuarios: action.payload,
            }
        case GET_USER_BY_ID:
            return {
                ...state,
                dataUsuario: action.payload
            }
        default:
            return state;
    }
}