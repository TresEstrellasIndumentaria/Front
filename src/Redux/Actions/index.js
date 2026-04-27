import axios from "axios";
import { URL } from "../../Urls";
import {
    LOGIN, RESET_USER, GET_USER_BY_DNI, GET_ALL_USUARIOS, REGISTRARSE, CREA_CATEGORIA,
    MODIFICA_USUARIO, GET_USER_BY_ID, LOADING, GET_USUARIOS_BY_ROL, GET_ARTICULOS, CREA_ARTICULO, MODIFICA_ARTICULO,
    CREA_ARTICULO_PROVEEDOR, GET_ARTICULOS_PROVEEDOR,
    AJUSTE_STOCK_SUCCESS, GET_HISTORIAL_INVENTARIO_REQUEST, GET_HISTORIAL_INVENTARIO_SUCCESS, GET_HISTORIAL_INVENTARIO_FAIL,
    CLEAR_HISTORIAL_INVENTARIO_ERROR, REMITOS_REQUEST, GET_REMITOS_SUCCESS,
    GET_REMITO_BY_ID_SUCCESS, CREA_REMITO_SUCCESS, REMITOS_FAIL,
    RECIBOS_REQUEST, GET_RECIBOS_SUCCESS, GET_RECIBO_BY_ID_SUCCESS, CREA_RECIBO_SUCCESS, RECIBOS_FAIL
} from "./actionsType";

const getAuthConfig = () => {
    let data = null;
    try {
        data = JSON.parse(localStorage.getItem('dataUser') || localStorage.getItem('userData') || 'null');
    } catch (error) {
        data = null;
    }

    const token =
        data?.token ||
        data?.accessToken ||
        data?.authToken ||
        data?.user?.token ||
        data?.user?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken;
    if (!token) return {};

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

const normalizarMotivoInventarioParaApi = (motivo) => {
    if (motivo === 'DAÑADO') return 'DANADO';
    return motivo;
};


// =================================
// USUARIOS
// =================================
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

//registrarse
//action con manejo de errores
export const registrarse = (data) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/registrarse`, data);
            dispatch({ type: REGISTRARSE, payload: resp.data });
            return resp.data; // ðŸ‘‰ el back deberÃ­a enviar algo como { message: "success" }
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

//trea todos las personas
export const getAllUsuarios = () => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/personas`);
        dispatch({ type: GET_ALL_USUARIOS, payload: resp.data });
    }
}

//trae por rol
export const getUsuarioByRol = (rol) => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/personas/rol/${rol}`);
        dispatch({ type: GET_USUARIOS_BY_ROL, payload: resp.data });
    }
};

//trae usuario por id
export const getUsuarioById = (id) => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/personas/${id}`);
        //localStorage.setItem('dataUser', JSON.stringify(resp.data));
        dispatch({ type: GET_USER_BY_ID, payload: resp.data });
        return resp.data;
    }
}

//trae usuario por DNI
export const getUsuarioByDNI = (dni) => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/personas/dni/${dni}`);
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
    return async function (dispatch) {
        console.log("idF: ", id)
        try {
            const resp = await axios.put(`${URL}/personas/modifica/${id}`, data);
            dispatch({ type: MODIFICA_USUARIO, payload: resp.data });
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

//modifica contrasena
export const modificaContrasena = (id, password) => {
    return async function (dispatch) {
        const resp = await axios.put(`${URL}/personas/modificaPass/${id}`, { password });
        console.log('resp.data', resp.data);
        dispatch({ type: 'MODIFICA_CONTRASENA', payload: resp.data });
    }
}

// Eliminar usuario
export const eliminaUsuario = (id) => {
    return async function () {
        try {
            const resp = await axios.delete(`${URL}/personas/eliminar/${id}`);
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
    return {
        type: LOADING,
        payload: false
    }
};

// =================================
// ARTICULO
// =================================
//trae todos
export const getAllArticulos = () => {
    return async function (dispatch) {
        const resp = await axios.get(`${URL}/articulos`);
        dispatch({ type: GET_ARTICULOS, payload: resp.data });
    }
};

//crea art
export const creaArticulo = (data) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/articulos`, data);
            dispatch({ type: CREA_ARTICULO, payload: resp.data });
            return resp.data; // ðŸ‘‰ el back deberÃ­a enviar algo como { message: "success" }
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

// =================================
// ARTICULOS PROVEEDOR
// =================================
export const getArticulosProveedor = () => {
    return async function (dispatch) {
        try {
            const resp = await axios.get(`${URL}/articulosProveedor`);
            dispatch({ type: GET_ARTICULOS_PROVEEDOR, payload: resp.data });
            return resp.data;
        } catch (error) {
            return {
                error: true,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.msg ||
                    error.response?.data ||
                    "Error al obtener articulos del proveedor.",
            };
        }
    };
};

export const creaArticuloProveedor = (data) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/articulosProveedor`, data);
            dispatch({ type: CREA_ARTICULO_PROVEEDOR, payload: resp.data });
            return resp.data;
        } catch (error) {
            return {
                error: true,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.msg ||
                    error.response?.data ||
                    "Error al registrar el articulo del proveedor.",
            };
        }
    };
};

//modifica art (intenta endpoints compatibles)
export const modificaArticulo = (id, data) => {
    return async function (dispatch) {
        const endpoints = [
            `${URL}/articulos/modifica/${id}`,
        ];

        for (const endpoint of endpoints) {
            try {
                const resp = await axios.put(endpoint, data);
                dispatch({ type: MODIFICA_ARTICULO, payload: resp.data });
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                // Si el endpoint existe pero falla por validacion, cortar y devolver error real
                if (status && ![404, 405].includes(status)) {
                    return {
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al modificar el articulo.",
                    };
                }
            }
        }

        return {
            message: "No se encontro endpoint de modificacion de articulos en el backend.",
        };
    };
};

const getSessionUser = () => {
    try {
        return JSON.parse(localStorage.getItem('dataUser') || localStorage.getItem('userData') || 'null');
    } catch (error) {
        return null;
    }
};

//ajuste de stock (requiere endpoint de inventario en backend)
export const ajustarStockArticulos = (data) => {
    return async function (dispatch) {
        const config = getAuthConfig();
        const sessionUser = getSessionUser();
        const motivo = normalizarMotivoInventarioParaApi(data?.motivo);
        const colaboradorId =
            sessionUser?._id ||
            sessionUser?.user?.id ||
            sessionUser?.user?._id ||
            sessionUser?.id ||
            sessionUser?.userId ||
            null;
        const tienda =
            sessionUser?.tienda ||
            sessionUser?.sucursal ||
            sessionUser?.local ||
            sessionUser?.user?.tienda ||
            sessionUser?.user?.sucursal ||
            'Liz';

        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) {
            return { error: true, message: "No hay items para ajustar." };
        }

        const articulosActualizados = [];

        for (const item of items) {
            const articuloId = item?.articulo || item?.id;
            const stock = Number(item?.stockFinal ?? item?.stock);

            if (!articuloId || !Number.isFinite(stock) || stock < 0) {
                return {
                    error: true,
                    message: "Hay items con articulo o stock final invalido.",
                };
            }

            const endpoints = [
                { method: "put", url: `${URL}/articulos/${articuloId}/stock` },
                { method: "patch", url: `${URL}/articulos/${articuloId}/stock` },
            ];

            let actualizado = null;
            let ultimoError = null;

            for (const endpoint of endpoints) {
                try {
                    const resp = await axios[endpoint.method](
                        endpoint.url,
                        {
                            stock,
                            motivo,
                            anotaciones: data?.anotaciones || "",
                            coste: item?.coste,
                            colaborador: colaboradorId,
                            tienda
                        },
                        config
                    );

                    actualizado = resp?.data?.articulo || resp?.data?.data || resp?.data;
                    break;
                } catch (error) {
                    ultimoError = error;
                    const status = error?.response?.status;
                    if (status && ![404, 405].includes(status)) break;
                }
            }

            if (!actualizado) {
                return {
                    error: true,
                    message:
                        ultimoError?.response?.data?.message ||
                        ultimoError?.response?.data?.msg ||
                        ultimoError?.response?.data?.error ||
                        `No se pudo ajustar stock para el articulo ${articuloId}.`,
                };
            }

            articulosActualizados.push(actualizado);
        }

        dispatch({ type: AJUSTE_STOCK_SUCCESS, payload: articulosActualizados });
        return {
            msg: "Ajuste de stock realizado correctamente.",
            articulosActualizados
        };
    };
};

//HISTORIAL INVENTARIO
export const getHistorialInventario = (params = {}) => {
    return async function (dispatch) {
        dispatch({ type: GET_HISTORIAL_INVENTARIO_REQUEST });
        const config = getAuthConfig();
        const normalizedParams = {
            ...params,
            motivo: normalizarMotivoInventarioParaApi(params?.motivo),
        };
        if (!normalizedParams.motivo || normalizedParams.motivo === 'TODOS') {
            delete normalizedParams.motivo;
        }
        const query = new URLSearchParams(normalizedParams).toString();
        const endpoints = [
            `${URL}/articulos/historial-inventario`,
            `${URL}/inventario/historial`,
        ].map((base) => (query ? `${base}?${query}` : base));

        for (const endpoint of endpoints) {
            try {
                const resp = await axios.get(endpoint, config);
                const data = resp?.data;
                const historial = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.movimientos)
                        ? data.movimientos
                        : Array.isArray(data?.historial)
                            ? data.historial
                            : [];

                dispatch({ type: GET_HISTORIAL_INVENTARIO_SUCCESS, payload: historial });
                return data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    dispatch({
                        type: GET_HISTORIAL_INVENTARIO_FAIL,
                        payload:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            (status === 403
                                ? "No tenes permisos para ver el historial de inventario."
                                : "Error al obtener historial de inventario."),
                    });
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al obtener historial de inventario.",
                    };
                }
            }
        }

        dispatch({ type: GET_HISTORIAL_INVENTARIO_FAIL });
        return {
            error: true,
            message: "No se encontro endpoint de historial de inventario.",
        };
    };
};

export const clearHistorialInventarioError = () => ({
    type: CLEAR_HISTORIAL_INVENTARIO_ERROR,
});

//elimina ART
export const eliminarArt = (id) => {
    return async function (dispatch) {
        try {
            const resp = await axios.delete(`${URL}/articulos/eliminar/${id}`);

            return resp.data; // <-- devuelve msg correctamente
        } catch (error) {
            return {
                msg: error.response?.data?.msg || 'Error al eliminar articulo'
            };
        }
    };
};

// =================================
// CATEGORIA
// =================================

//GET TODAS
export const getCategorias = () => {
    return async function (dispatch) {
        try {
            const resp = await axios.get(`${URL}/categorias`);
            dispatch({ type: "GET_CATEGORIAS", payload: resp.data });
        } catch (error) {
            console.log("Error al obtener categorÃ­as:", error);
        }
    };
};

//CREAR
export const crearCategoria = (categoriaData) => {
    return async (dispatch) => {
        try {
            const payload = typeof categoriaData === "string"
                ? { nombre: categoriaData }
                : categoriaData;
            const resp = await axios.post(`${URL}/categorias`, payload);

            dispatch({
                type: CREA_CATEGORIA,
                payload: resp.data,
            });

            return resp.data;
        } catch (error) {
            return {
                error: true,
                message: error.response?.data?.message || "Error al crear categorÃ­a",
            };
        }
    };
};

//EDITAR
export const editarCategoria = (id, categoriaData) => {
    return async function () {
        try {
            const payload = typeof categoriaData === "string"
                ? { nombre: categoriaData }
                : categoriaData;
            const resp = await axios.put(`${URL}/categorias/${id}`, payload);
            return resp.data;
        } catch (error) {
            return {
                msg: error.response?.data?.msg || "Error al editar categorÃ­a"
            };
        }
    };
};

//ELIMINAR
export const eliminarCategoria = (id) => {
    return async function () {
        try {
            const resp = await axios.delete(`${URL}/categorias/${id}`);
            return resp.data;
        } catch (error) {
            return {
                msg: error.response?.data?.msg || "Error al eliminar categorÃ­a"
            };
        }
    };
};

// =================================
// PROVEEDORES
// =================================

//CREA PROVEEDOR
//action con manejo de errores
export const creaProveedor = (data) => {
    return async function (dispatch) {
        try {
            const resp = await axios.post(`${URL}/proveedor`, data);
            //dispatch({type: REGISTRARSE, payload: resp.data});
            return resp.data; // ðŸ‘‰ el back deberÃ­a enviar algo como { message: "success" }
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


//==================================
//ORDENES DE COMPRA
//==================================

//trae con paginaciÃ³n y filtros
//crear orden de compra (con fallback de endpoints)
export const crearOrdenCompra = (data) => {
    return async function () {
        const config = getAuthConfig();
        const endpoints = [
            `${URL}/ordenesCompraProv`,
        ];

        for (const endpoint of endpoints) {
            try {
                const resp = await axios.post(endpoint, data, config);
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al crear orden de compra.",
                    };
                }
            }
        }

        return {
            error: true,
            message: "No se encontro endpoint para crear ordenes de compra.",
        };
    };
};

//actualiza estado de orden de compra
export const actualizarEstadoOrdenCompra = (id, estado, extra = {}) => {
    return async function () {
        const config = getAuthConfig();
        const endpoints = [
            { method: "put", url: `${URL}/ordenesCompraProv/${id}/estado` },
            { method: "patch", url: `${URL}/ordenesCompraProv/${id}/estado` },
            { method: "put", url: `${URL}/ordenesCompraProv/${id}` },
        ];
        const payload = { estado, ...extra };

        for (const endpoint of endpoints) {
            try {
                const resp = await axios[endpoint.method](endpoint.url, payload, config);
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al actualizar estado de la orden.",
                    };
                }
            }
        }

        return {
            error: true,
            message: "No se encontro endpoint para actualizar estado de orden.",
        };
    };
};

export const recibirOrdenCompra = (id, data = {}) => {
    return async function () {
        const config = getAuthConfig();
        const endpoints = [
            { method: "put", url: `${URL}/ordenesCompraProv/${id}/recibir` },
            { method: "patch", url: `${URL}/ordenesCompraProv/${id}/recibir` },
        ];

        for (const endpoint of endpoints) {
            try {
                const resp = await axios[endpoint.method](endpoint.url, data, config);
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al recibir la orden.",
                    };
                }
            }
        }

        return {
            error: true,
            message: "No se encontro endpoint para recibir orden.",
        };
    };
};

export const cancelarOrdenCompra = (id) => {
    return async function () {
        const config = getAuthConfig();
        const endpoints = [
            { method: "put", url: `${URL}/ordenesCompraProv/${id}/cancelar` },
            { method: "patch", url: `${URL}/ordenesCompraProv/${id}/cancelar` },
            { method: "put", url: `${URL}/ordenesCompraProv/${id}/estado` },
        ];

        for (const endpoint of endpoints) {
            try {
                const body = endpoint.url.endsWith("/estado") ? { estado: "CANCELADA" } : {};
                const resp = await axios[endpoint.method](endpoint.url, body, config);
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al cancelar la orden.",
                    };
                }
            }
        }

        return {
            error: true,
            message: "No se encontro endpoint para cancelar orden.",
        };
    };
};

export const getOrdenesCompra = (params = {}) => async (dispatch) => {
    dispatch({ type: 'ORDENES_REQUEST' });
    const config = getAuthConfig();

    const query = new URLSearchParams(params).toString();
    const endpoints = [
        `${URL}/ordenesCompraProv`,
    ].map((base) => (query ? `${base}?${query}` : base));

    for (const endpoint of endpoints) {
        try {
            const resp = await axios.get(endpoint, config);
            const ordenes = Array.isArray(resp.data)
                ? resp.data
                : Array.isArray(resp.data?.ordenes)
                    ? resp.data.ordenes
                    : [];

            dispatch({
                type: 'ORDENES_SUCCESS',
                payload: {
                    ordenes,
                    total: resp.data?.total ?? ordenes.length,
                    page: resp.data?.page ?? 1,
                    totalPages: resp.data?.totalPages ?? 1
                }
            }); console.log("Ordenes:", ordenes);
            return resp.data;
        } catch (error) {
            const status = error?.response?.status;
            if (status && ![404, 405].includes(status)) {
                dispatch({ type: 'ORDENES_FAIL', payload: error.message });
                return {
                    error: true,
                    message:
                        error.response?.data?.message ||
                        error.response?.data?.msg ||
                        'Error al obtener ordenes de compra.',
                };
            }
        }
    }

    dispatch({ type: 'ORDENES_FAIL', payload: 'No se encontro endpoint de ordenes.' });
    return { error: true, message: 'No se encontro endpoint de ordenes de compra.' };
};

export const getOrdenCompraById = (id) => async (dispatch) => {
    dispatch({ type: 'ORDENES_REQUEST' });
    const config = getAuthConfig();

    const endpoints = [
        `${URL}/ordenesCompraProv/${id}`,
        `${URL}/ordenesCompraProv/id/${id}`,
        `${URL}/ordenes-compra/${id}`,
        `${URL}/ordenesDeCompras/${id}`,
        `${URL}/ordenes-de-compra/${id}`,
        `${URL}/ordenesDeCompra/${id}`,
    ];

    for (const endpoint of endpoints) {
        try {
            const resp = await axios.get(endpoint, config);
            const orden =
                resp?.data?.orden ||
                resp?.data?.ordenCompra ||
                resp?.data?.item ||
                resp?.data?.data ||
                resp?.data;
            dispatch({ type: 'ORDEN_COMPRA_BY_ID_SUCCESS', payload: orden });
            dispatch({ type: LOADING, payload: false });
            return orden;
        } catch (error) {
            const status = error?.response?.status;
            if (status && ![404, 405].includes(status)) {
                dispatch({ type: 'ORDENES_FAIL', payload: error.message });
                return {
                    error: true,
                    message:
                        error.response?.data?.message ||
                        error.response?.data?.msg ||
                        'Error al obtener la orden.',
                };
            }
        }
    }

    dispatch({ type: 'ORDENES_FAIL', payload: 'No se encontro endpoint por id.' });
    return { error: true, message: 'No se encontro endpoint de detalle de orden.' };
};

// =================================
// REMITOS / VENTAS
// =================================
export const crearRemito = (data) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.post(`${URL}/remitos`, data, config);
            dispatch({ type: CREA_REMITO_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al crear remito.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRemitos = (params = {}) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();
        const query = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') acc[key] = value;
                return acc;
            }, {})
        ).toString();

        try {
            const endpoint = query ? `${URL}/remitos?${query}` : `${URL}/remitos`;
            const resp = await axios.get(endpoint, config);
            dispatch({ type: GET_REMITOS_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener remitos.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRemitoById = (id) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.get(`${URL}/remitos/${id}`, config);
            dispatch({ type: GET_REMITO_BY_ID_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener el remito.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRemitoPorNumero = (numeroRemito) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.get(`${URL}/remitos/numero/${numeroRemito}`, config);
            dispatch({ type: GET_REMITO_BY_ID_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener el remito.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const actualizarEstadoRemito = (id, estado) => {
    return async function (dispatch) {
        const config = getAuthConfig();
        const endpoints = [
            { method: "patch", url: `${URL}/remitos/${id}/estado` },
            { method: "put", url: `${URL}/remitos/${id}/estado` },
        ];

        for (const endpoint of endpoints) {
            try {
                const resp = await axios[endpoint.method](endpoint.url, { estado }, config);
                const remito = resp?.data?.remito || resp?.data;
                dispatch({ type: GET_REMITO_BY_ID_SUCCESS, payload: remito });
                return resp.data;
            } catch (error) {
                const status = error?.response?.status;
                if (status && ![404, 405].includes(status)) {
                    return {
                        error: true,
                        message:
                            error.response?.data?.message ||
                            error.response?.data?.msg ||
                            "Error al actualizar estado del remito.",
                    };
                }
            }
        }

        return {
            error: true,
            message: "No se encontro endpoint para actualizar estado del remito.",
        };
    };
};

export const modificarRemito = (id, data) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.put(`${URL}/remitos/modifica/${id}`, data, config);
            dispatch({ type: GET_REMITO_BY_ID_SUCCESS, payload: resp.data?.remito || resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al modificar remito.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRemitosPorCliente = (numeroCliente) => {
    return async function (dispatch) {
        dispatch({ type: REMITOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.get(`${URL}/remitos/cliente/${numeroCliente}`, config);
            dispatch({ type: LOADING, payload: false });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener remitos del cliente.";

            dispatch({ type: REMITOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

// =================================
// RECIBOS / COBROS
// =================================
export const crearRecibo = (data) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.post(`${URL}/recibos`, data, config);
            dispatch({ type: CREA_RECIBO_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al crear recibo.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRecibos = (params = {}) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();
        const query = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') acc[key] = value;
                return acc;
            }, {})
        ).toString();

        try {
            const endpoint = query ? `${URL}/recibos?${query}` : `${URL}/recibos`;
            const resp = await axios.get(endpoint, config);
            dispatch({ type: GET_RECIBOS_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener recibos.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getReciboById = (id) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.get(`${URL}/recibos/${id}`, config);
            dispatch({ type: GET_RECIBO_BY_ID_SUCCESS, payload: resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener el recibo.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const getRecibosPorCliente = (numeroCliente) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.get(`${URL}/recibos/cliente/${numeroCliente}`, config);
            dispatch({ type: LOADING, payload: false });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al obtener recibos del cliente.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const modificarRecibo = (id, data) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.put(`${URL}/recibos/modifica/${id}`, data, config);
            dispatch({ type: GET_RECIBO_BY_ID_SUCCESS, payload: resp.data?.recibo || resp.data });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al modificar recibo.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};

export const eliminarRecibo = (id) => {
    return async function (dispatch) {
        dispatch({ type: RECIBOS_REQUEST });
        const config = getAuthConfig();

        try {
            const resp = await axios.delete(`${URL}/recibos/eliminar/${id}`, config);
            dispatch({ type: LOADING, payload: false });
            return resp.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                "Error al eliminar recibo.";

            dispatch({ type: RECIBOS_FAIL, payload: message });
            return { error: true, message };
        }
    };
};


