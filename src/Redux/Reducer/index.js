import { REGISTRARSE, LOGIN, RESET_LOGIN } from "../Actions/actionsType";

const initialState = {
    loading: true,
    dataUsuario: {},
}

export default function rootReducer(state = initialState, action) {
    switch (action) {
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
        default:
            return state;
    }
}