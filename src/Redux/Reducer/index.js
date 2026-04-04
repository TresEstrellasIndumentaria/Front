import {
    REGISTRARSE, LOGIN, RESET_LOGIN, GET_ALL_USUARIOS,
    GET_USER_BY_ID, LOADING, GET_USUARIOS_BY_ROL,
    GET_ARTICULOS, GET_CATEGORIAS, GET_ARTICULOS_PROVEEDOR, CREA_ARTICULO_PROVEEDOR,
    CREA_CATEGORIA, MODIFICA_ARTICULO, AJUSTE_STOCK_SUCCESS,
    GET_HISTORIAL_INVENTARIO_REQUEST, GET_HISTORIAL_INVENTARIO_SUCCESS, GET_HISTORIAL_INVENTARIO_FAIL,
    CLEAR_HISTORIAL_INVENTARIO_ERROR
} from "../Actions/actionsType";

const initialState = {
    loading: false,
    dataUsuario: {},
    usuarios: [],
    usuariosRol: [],
    articulos: [],
    articulosProveedor: [],
    categorias: [],
    categoriaAct: {},
    ordenes: [],
    ordenActual: null,
    totalOrdenes: 0,
    page: 1,
    totalPages: 1,
    historialInventario: [],
    historialInventarioLoading: false,
    historialInventarioError: null,
}

export default function rootReducer(state = initialState, action) {
    switch (action.type) {
        case LOADING:
            return {
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
        case GET_USUARIOS_BY_ROL:
            return {
                ...state,
                usuariosRol: action.payload,
            }
        case GET_USER_BY_ID:
            return {
                ...state,
                dataUsuario: action.payload
            }
        case GET_ARTICULOS:
            return {
                ...state,
                articulos: action.payload
            }
        case GET_ARTICULOS_PROVEEDOR:
            return {
                ...state,
                articulosProveedor: Array.isArray(action.payload) ? action.payload : []
            }
        case CREA_ARTICULO_PROVEEDOR:
            return {
                ...state,
                articulosProveedor: [
                    ...(state.articulosProveedor || []),
                    action.payload?.articuloProveedor || action.payload?.articulo || action.payload
                ]
            }
        case MODIFICA_ARTICULO:
            return {
                ...state,
                articulos: state.articulos.map((art) =>
                    art._id === action.payload?._id ? action.payload : art
                )
            }
        case AJUSTE_STOCK_SUCCESS: {
            const updates = Array.isArray(action.payload) ? action.payload : [];
            if (!updates.length) return state;

            const updatesMap = new Map(
                updates
                    .filter((item) => item?._id || item?.id)
                    .map((item) => [item._id || item.id, item])
            );

            return {
                ...state,
                articulos: state.articulos.map((art) => {
                    const id = art?._id || art?.id;
                    return updatesMap.has(id) ? { ...art, ...updatesMap.get(id) } : art;
                })
            };
        }
        case GET_HISTORIAL_INVENTARIO_REQUEST:
            return {
                ...state,
                historialInventarioLoading: true,
                historialInventarioError: null
            };
        case GET_HISTORIAL_INVENTARIO_SUCCESS:
            return {
                ...state,
                historialInventarioLoading: false,
                historialInventarioError: null,
                historialInventario: Array.isArray(action.payload) ? action.payload : []
            };
        case GET_HISTORIAL_INVENTARIO_FAIL:
            return {
                ...state,
                historialInventarioLoading: false,
                historialInventarioError: action.payload || "No se pudo cargar el historial de inventario."
            };
        case CLEAR_HISTORIAL_INVENTARIO_ERROR:
            return {
                ...state,
                historialInventarioError: null
            };
        case GET_CATEGORIAS:
            return {
                ...state,
                categorias: action.payload
            };
        case CREA_CATEGORIA:
            return {
                ...state,
                categorias: [...state.categorias, action.payload]
            }
        case 'ORDENES_REQUEST':
            return { ...state, loading: true };
        case 'ORDENES_SUCCESS':
            return {
                ...state,
                loading: false,
                ordenes: action.payload.ordenes || [],
                totalOrdenes: action.payload.total || 0,
                page: action.payload.page || 1,
                totalPages: action.payload.totalPages || 1
            };
        case 'ORDEN_COMPRA_BY_ID_SUCCESS':
            return {
                ...state,
                ordenActual: action.payload
            };
        case 'ORDEN_COMPRA_LOCAL_UPDATE': {
            const orden = action.payload;
            const ordenId = orden?._id || orden?.id || orden?.numero;
            const updatedOrdenes = state.ordenes.some((o) => (o?._id || o?.id || o?.numero) === ordenId)
                ? state.ordenes.map((o) => ((o?._id || o?.id || o?.numero) === ordenId ? { ...o, ...orden } : o))
                : [orden, ...state.ordenes];

            return {
                ...state,
                ordenActual: orden,
                ordenes: updatedOrdenes
            };
        }
        case 'ORDENES_FAIL':
            return { ...state, loading: false };
        default:
            return state;
    }
}
