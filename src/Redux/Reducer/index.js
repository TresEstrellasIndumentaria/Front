import {
    REGISTRARSE, LOGIN, RESET_LOGIN, GET_ALL_USUARIOS,
    GET_USER_BY_ID, LOADING, GET_USUARIOS_BY_ROL,
    GET_ARTICULOS, GET_CATEGORIAS, GET_ARTICULOS_PROVEEDOR, CREA_ARTICULO_PROVEEDOR,
    CREA_CATEGORIA, MODIFICA_ARTICULO, AJUSTE_STOCK_SUCCESS,
    GET_HISTORIAL_INVENTARIO_REQUEST, GET_HISTORIAL_INVENTARIO_SUCCESS, GET_HISTORIAL_INVENTARIO_FAIL,
    CLEAR_HISTORIAL_INVENTARIO_ERROR, REMITOS_REQUEST, GET_REMITOS_SUCCESS,
    GET_REMITO_BY_ID_SUCCESS, CREA_REMITO_SUCCESS, REMITOS_FAIL,
    RECIBOS_REQUEST, GET_RECIBOS_SUCCESS, GET_RECIBO_BY_ID_SUCCESS, CREA_RECIBO_SUCCESS, RECIBOS_FAIL
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
    remitos: [],
    remitoActual: null,
    totalRemitos: 0,
    remitosPage: 1,
    remitosTotalPages: 1,
    remitosError: null,
    recibos: [],
    reciboActual: null,
    totalRecibos: 0,
    recibosPage: 1,
    recibosTotalPages: 1,
    recibosError: null,
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
        case REMITOS_REQUEST:
            return {
                ...state,
                loading: true,
                remitosError: null
            };
        case GET_REMITOS_SUCCESS:
            return {
                ...state,
                loading: false,
                remitos: Array.isArray(action.payload?.remitos) ? action.payload.remitos : [],
                totalRemitos: action.payload?.total || 0,
                remitosPage: action.payload?.page || 1,
                remitosTotalPages: action.payload?.totalPages || 1
            };
        case GET_REMITO_BY_ID_SUCCESS: {
            const remito = action.payload?.remito || action.payload;
            const remitoId = remito?._id || remito?.id;
            const remitosActualizados = remitoId
                ? (state.remitos || []).some((item) => (item?._id || item?.id) === remitoId)
                    ? state.remitos.map((item) => ((item?._id || item?.id) === remitoId ? { ...item, ...remito } : item))
                    : [remito, ...(state.remitos || [])]
                : state.remitos;

            return {
                ...state,
                loading: false,
                remitoActual: remito,
                remitos: remitosActualizados
            };
        }
        case CREA_REMITO_SUCCESS: {
            const remito = action.payload?.remito || action.payload;
            return {
                ...state,
                loading: false,
                remitoActual: remito,
                remitos: remito ? [remito, ...(state.remitos || [])] : state.remitos,
                totalRemitos: remito ? (state.totalRemitos || 0) + 1 : state.totalRemitos
            };
        }
        case REMITOS_FAIL:
            return {
                ...state,
                loading: false,
                remitosError: action.payload || "No se pudo completar la operacion con remitos."
            };
        case RECIBOS_REQUEST:
            return {
                ...state,
                loading: true,
                recibosError: null
            };
        case GET_RECIBOS_SUCCESS:
            return {
                ...state,
                loading: false,
                recibos: Array.isArray(action.payload?.recibos) ? action.payload.recibos : [],
                totalRecibos: action.payload?.total || 0,
                recibosPage: action.payload?.page || 1,
                recibosTotalPages: action.payload?.totalPages || 1
            };
        case GET_RECIBO_BY_ID_SUCCESS: {
            const recibo = action.payload?.recibo || action.payload;
            const reciboId = recibo?._id || recibo?.id;
            const recibosActualizados = reciboId
                ? (state.recibos || []).some((item) => (item?._id || item?.id) === reciboId)
                    ? state.recibos.map((item) => ((item?._id || item?.id) === reciboId ? { ...item, ...recibo } : item))
                    : [recibo, ...(state.recibos || [])]
                : state.recibos;

            return {
                ...state,
                loading: false,
                reciboActual: recibo,
                recibos: recibosActualizados
            };
        }
        case CREA_RECIBO_SUCCESS: {
            const recibo = action.payload?.recibo || action.payload;
            return {
                ...state,
                loading: false,
                reciboActual: recibo,
                recibos: recibo ? [recibo, ...(state.recibos || [])] : state.recibos,
                totalRecibos: recibo ? (state.totalRecibos || 0) + 1 : state.totalRecibos
            };
        }
        case RECIBOS_FAIL:
            return {
                ...state,
                loading: false,
                recibosError: action.payload || "No se pudo completar la operacion con recibos."
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
