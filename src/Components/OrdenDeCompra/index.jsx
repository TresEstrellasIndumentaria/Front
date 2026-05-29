import { useEffect, useMemo, useState } from "react";
import PopupProveedor from "../PopupProveedor";
import { useDispatch, useSelector } from "react-redux";
import {
    actualizarEstadoOrdenCompra,
    crearOrdenCompra,
    getAllArticulos,
    getOrdenCompraById,
    getUsuarioByRol,
    modificarOrdenCompra
} from "../../Redux/Actions";
import Swal from "sweetalert2";
import EditIcon from "@mui/icons-material/Edit";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import OrdenCompraPrint from "./OrdenCompraPrint";
import "./styles.css";

const ESTADOS_ORDEN = {
    DEUDOR: "Deudor",
    PAGADA: "Pagada"
};

const formatFecha = (value) => {
    if (!value) return "-";
    const fechaDia = typeof value === "string" ? value.slice(0, 10) : "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(fechaDia)
        ? new Date(`${fechaDia}T12:00:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const buildNumeroOrden = () => String(Date.now()).slice(-4);

const formatNumeroOrden = (numero) => {
    if (!numero) return "---";
    return String(numero).replace(/^PO/i, "");
};

const getFechaActualInput = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0");
    const day = String(hoy.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const toDateInputValue = (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getItemId = (item) => {
    if (!item) return "";
    if (typeof item.articulo === "object") return item.articulo?._id || "";
    return item.articulo || item._id || "";
};

const getItemNombre = (item) => {
    if (!item) return "-";
    if (item.nombre) return item.nombre;
    if (typeof item.articulo === "object") return item.articulo?.nombre || "-";
    return typeof item.articulo === "string" ? item.articulo : "-";
};

const getUltimoCostoCompra = (articulo) => {
    const costoDirecto = articulo?.ultimoCostoCompra ?? articulo?.ultimoCosto ?? articulo?.costoUltimaCompra;
    if (Number.isFinite(Number(costoDirecto))) return Number(costoDirecto);

    if (Array.isArray(articulo?.talles) && articulo.talles.length) {
        const talleConCosto = articulo.talles.find((talle) => Number.isFinite(Number(talle?.ultimoCostoCompra ?? talle?.costo ?? talle?.coste)));
        if (talleConCosto) {
            return Number(talleConCosto.ultimoCostoCompra ?? talleConCosto.costo ?? talleConCosto.coste);
        }
    }

    return 0;
};

const getTallesArticulo = (articulo) => (
    Array.isArray(articulo?.talles)
        ? articulo.talles.map((t) => t?.talle).filter(Boolean)
        : []
);

const getDefaultTalleArticulo = (articulo) => getTallesArticulo(articulo)[0] || "";

const getTalleData = (articulo, talle) => {
    const talleNormalizado = String(talle || "").trim().toUpperCase();
    return Array.isArray(articulo?.talles)
        ? articulo.talles.find((item) => String(item?.talle || "").trim().toUpperCase() === talleNormalizado)
        : null;
};

const getStockPorTalle = (articulo, talle) => {
    const talleData = getTalleData(articulo, talle);
    if (talleData) return Number(talleData.stock || 0);
    return Number(articulo?.stock || 0);
};

const getCostoPorTalle = (articulo, talle) => {
    const talleData = getTalleData(articulo, talle);
    if (talleData && Number.isFinite(Number(talleData.ultimoCostoCompra ?? talleData.costo ?? talleData.coste))) {
        return Number(talleData.ultimoCostoCompra ?? talleData.costo ?? talleData.coste);
    }
    return getUltimoCostoCompra(articulo);
};

const normalizarNumeroInput = (value) => String(value ?? "").replace(",", ".");
const esNumeroInputValido = (value) => /^\d*([.]\d*)?$/.test(value);
const limpiarCerosIniciales = (value) => String(value).replace(/^0+(?=\d)/, "");
const toNumero = (value) => {
    const numero = Number(normalizarNumeroInput(value));
    return Number.isFinite(numero) ? numero : 0;
};

export default function OrdenCompra() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const proveedoresDB = useSelector(state => state.usuariosRol || []);
    const allArticulos = useSelector(state => state.articulos || []);
    const ordenActualRedux = useSelector(state => state.ordenActual);

    const [articulosOC, setArticulosOC] = useState([]);
    const [guardando, setGuardando] = useState(false);

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [proveedorCreado, setProveedorCreado] = useState(null);
    const [, setBusqueda] = useState("");

    const [ordenActual, setOrdenActual] = useState(null);
    const [vistaDetalle, setVistaDetalle] = useState(false);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const [form, setForm] = useState({
        proveedor: "",
        fechaOrden: getFechaActualInput(),
        anotaciones: ""
    });

    const articulosNoCompuestos = allArticulos.filter(a => a.artCompuesto !== true && a.itemProveedor === true);

    useEffect(() => {
        dispatch(getUsuarioByRol("PROVEEDOR"));
        dispatch(getAllArticulos());
    }, [dispatch]);

    useEffect(() => {
        const proveedorState = location.state?.proveedor;
        const proveedorId = proveedorState?._id || proveedorState?.id;
        if (!proveedorId || id) return;

        setForm((prev) => ({ ...prev, proveedor: proveedorId }));
        setProveedorCreado(null);
    }, [id, location.state]);

    useEffect(() => {
        const cargarOrdenById = async () => {
            if (!id) return;

            setCargandoDetalle(true);
            const resp = await dispatch(getOrdenCompraById(id));
            if (resp?.error) {
                setCargandoDetalle(false);
                Swal.fire("No encontrada", resp.message || "No se pudo cargar la orden solicitada.", "warning");
                navigate("/resumenCompras");
            }
        };

        cargarOrdenById();
    }, [id, navigate, dispatch]);

    useEffect(() => {
        if (!id) return;
        if (!ordenActualRedux) return;
        setOrdenActual(ordenActualRedux);
        setVistaDetalle(true);
        setCargandoDetalle(false);
    }, [id, ordenActualRedux]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const sincronizarOrdenLocal = (orden) => {
        if (!orden) return;
        dispatch({ type: "ORDEN_COMPRA_LOCAL_UPDATE", payload: orden });
    };

    const agregarProveedor = (nuevo) => {
        setProveedorCreado(`${nuevo.nombre} ${nuevo.apellido}`);
        setForm(f => ({ ...f, proveedor: nuevo._id }));
        dispatch(getUsuarioByRol("PROVEEDOR"));
        setMostrarPopup(false);
    };

    const agregarArticulo = (art) => {
        if (articulosOC.some(a => a._id === art._id)) return;
        const talle = getDefaultTalleArticulo(art);

        setArticulosOC(prev => [
            ...prev,
            {
                ...art,
                talle,
                stock: getStockPorTalle(art, talle),
                cantidad: 1,
                costo: getCostoPorTalle(art, talle)
            }
        ]);

        setBusqueda("");
    };

    const totalArticulos = articulosOC.reduce((acc, a) => acc + toNumero(a.cantidad) * toNumero(a.costo), 0);
    const total = totalArticulos;

    const proveedorSeleccionado = useMemo(
        () => proveedoresDB.find((p) => p._id === form.proveedor),
        [proveedoresDB, form.proveedor]
    );

    const buildOrdenPayload = (estado) => ({
        numero: buildNumeroOrden(),
        estado,
        proveedor: form.proveedor,
        proveedorInfo: proveedorSeleccionado
            ? {
                nombre: proveedorSeleccionado.nombre,
                apellido: proveedorSeleccionado.apellido,
                numeroProveedor: proveedorSeleccionado.numeroProveedor || proveedorSeleccionado.numeroCliente,
                numeroCliente: proveedorSeleccionado.numeroCliente,
                email: proveedorSeleccionado.email,
                telefono: proveedorSeleccionado.telefono,
                direccion: proveedorSeleccionado.direccion
            }
            : null,
        fechaOrden: form.fechaOrden,
        anotaciones: form.anotaciones,
        articulos: articulosOC.map((a) => ({
            articulo: a._id,
            nombre: a.nombre,
            talle: a.talle || "",
            cantidad: toNumero(a.cantidad),
            costo: toNumero(a.costo),
            subtotal: toNumero(a.cantidad) * toNumero(a.costo)
        })),
        items: articulosOC.map((a) => ({
            articulo: a._id,
            talle: a.talle || "",
            stockActual: Number(getStockPorTalle(a, a.talle)),
            cantidad: toNumero(a.cantidad),
            coste: toNumero(a.costo),
            costoTotal: toNumero(a.cantidad) * toNumero(a.costo)
        })),
        totalArticulos,
        total,
        totalOrden: total,
        recibido: 0
    });

    const hydrateOrdenActual = (resp, payloadBase) => {
        const data = resp?.orden || resp?.data || resp;
        return {
            ...payloadBase,
            ...data,
            _id: data?._id || payloadBase._id || payloadBase.numero,
            numero: data?.numero || payloadBase.numero,
            estado: data?.estado || payloadBase.estado,
            articulos: data?.articulos?.length ? data.articulos : payloadBase.articulos,
            items: data?.items?.length ? data.items : payloadBase.items,
            recibido: Number(data?.recibido ?? payloadBase.recibido ?? 0)
        };
    };

    const handleCrearOrden = async () => {
        if (!form.proveedor) {
            Swal.fire("Falta proveedor", "Selecciona un proveedor para crear la orden.", "warning");
            return;
        }

        if (!form.fechaOrden) {
            Swal.fire("Falta fecha", "Completa la fecha de la orden de compra.", "warning");
            return;
        }

        if (!articulosOC.length) {
            Swal.fire("Sin articulos", "Agrega al menos un articulo a la orden.", "warning");
            return;
        }

        setGuardando(true);
        try {
            const payload = buildOrdenPayload("DEUDOR");
            const ordenId = ordenActual?._id || id;
            const resp = ordenId
                ? await dispatch(modificarOrdenCompra(ordenId, payload))
                : await dispatch(crearOrdenCompra(payload));
            const msg = String(resp?.message || resp?.msg || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo guardar la orden", "error");
                return;
            }

            const hydratedOrden = hydrateOrdenActual(resp, payload);
            setOrdenActual(hydratedOrden);
            sincronizarOrdenLocal(hydratedOrden);
            setVistaDetalle(true);

            await Swal.fire({
                icon: "success",
                title: ordenId ? "Orden modificada" : "Orden creada",
                text: ordenId ? "La orden se actualizo correctamente." : "La orden se creo con estado Deudor.",
                timer: 1500,
                showConfirmButton: false
            });
        } finally {
            setGuardando(false);
        }
    };

    const handleCambiarEstado = async (estado) => {
        if (!ordenActual?._id) {
            Swal.fire("Atencion", "No se encontro ID de la orden para actualizar estado.", "warning");
            return;
        }

        setGuardando(true);
        try {
            const resp = await dispatch(actualizarEstadoOrdenCompra(ordenActual._id, estado));
            const msg = String(resp?.msg || resp?.message || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo actualizar el estado", "error");
                return;
            }

            const updatedOrden = { ...ordenActual, estado };
            setOrdenActual(updatedOrden);
            sincronizarOrdenLocal(updatedOrden);
        } finally {
            setGuardando(false);
        }
    };

    const handleEditarDesdeDetalle = () => {
        if (!ordenActual) return;
        if (ordenActual.estado === "PAGADA") {
            Swal.fire("No disponible", "No se puede editar una orden pagada.", "info");
            return;
        }

        setForm({
            proveedor: ordenActual?.proveedor?._id || ordenActual?.proveedor || "",
            fechaOrden: toDateInputValue(ordenActual?.fechaOrden),
            anotaciones: ordenActual?.anotaciones || ""
        });

        setArticulosOC(
            (ordenActual.items || ordenActual.articulos || []).map((a) => ({
                _id: getItemId(a),
                nombre: getItemNombre(a),
                cantidad: Number(a.cantidad || 0),
                costo: Number(a.coste ?? a.costo ?? 0),
                stock: Number(a.stockActual ?? a.stock ?? 0),
                talle: a.talle || ""
            }))
        );

        if (ordenActual?.proveedorInfo?.nombre || ordenActual?.proveedorInfo?.apellido) {
            setProveedorCreado(`${ordenActual.proveedorInfo?.nombre || ""} ${ordenActual.proveedorInfo?.apellido || ""}`.trim());
        }

        setVistaDetalle(false);
    };

    if (id && cargandoDetalle) {
        return <div className="orden-compra"><div className="card"><p>Cargando orden...</p></div></div>;
    }

    if (vistaDetalle && ordenActual) {
        const items = ordenActual.items || ordenActual.articulos || [];
        const estadoLabel = ESTADOS_ORDEN[ordenActual.estado] || ordenActual.estado;
        const estadoBloqueado = ordenActual.estado === "PAGADA";
        const prov = ordenActual.proveedorInfo || ordenActual.proveedor || {};
        const telefono = prov?.telefono
            ? `${prov.telefono.area || ""} ${prov.telefono.numero || ""}`.trim()
            : "-";
        const direccion = prov?.direccion
            ? `${prov.direccion.calle || ""} ${prov.direccion.numero || ""}, ${prov.direccion.localidad || ""}, ${prov.direccion.provincia || ""}`.trim()
            : "-";

        return (
            <div className="oc-detalle">
                <OrdenCompraPrint
                    orden={ordenActual}
                    proveedor={prov}
                    direccion={direccion}
                    telefono={telefono}
                    formatFecha={formatFecha}
                />

                <div className="oc-detalle-header oc-screen-only">
                    <button className="oc-link-back" onClick={() => navigate("/resumenCompras")}>Resumen de compras</button>
                    <div className="oc-detalle-acciones">
                        <button onClick={handleEditarDesdeDetalle} disabled={guardando || estadoBloqueado} title="Editar orden" aria-label="Editar orden">
                            <EditIcon fontSize="small" />
                        </button>
                        <button onClick={() => handleCambiarEstado("PAGADA")} disabled={guardando || estadoBloqueado}>Marcar pagada</button>
                        <button onClick={() => window.print()} disabled={guardando}>Imprimir</button>
                    </div>
                </div>

                <div className="oc-resumen-card oc-screen-only">
                    <div className="oc-resumen-top">
                        <div>
                            <h2>{formatNumeroOrden(ordenActual.numero)}</h2>
                            <p className="oc-estado">{estadoLabel}</p>
                        </div>
                    </div>

	                    <div className="oc-datos-row">
	                        <p><strong>Fecha:</strong> {formatFecha(ordenActual.fechaOrden)}</p>
	                    </div>

                    <div className="oc-grid oc-grid-proveedor">
                        <div>
                            <strong>Proveedor:</strong>
                            <p>{prov?.nombre || ""} {prov?.apellido || ""}</p>
                            <p>{direccion}</p>
                            <p>{telefono}</p>
                            <p>{prov?.email || "-"}</p>
                        </div>
                    </div>

                    <div className="oc-anotaciones">
                        <strong>Anotaciones:</strong>
                        <p>{ordenActual.anotaciones || "-"}</p>
                    </div>
                </div>

                <div className="oc-resumen-card oc-screen-only">
                    <h3>Articulos</h3>
                    <table className="tabla">
                        <thead>
	                            <tr>
	                                <th className="col-art">Articulo</th>
	                                <th>Talle</th>
	                                <th>Cantidad</th>
	                                <th>Costo de compra</th>
	                                <th>Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((art, idx) => (
	                                <tr key={`${getItemId(art)}-${idx}`}>
	                                    <td>{getItemNombre(art)}</td>
	                                    <td>{art.talle || "-"}</td>
	                                    <td>{Number(art.cantidad || 0)}</td>
	                                    <td>${Number(art.coste ?? art.costo ?? 0).toLocaleString("es-AR")}</td>
	                                    <td>${Number((art.costoTotal ?? art.subtotal ?? (Number(art.cantidad || 0) * Number(art.coste ?? art.costo ?? 0))) || 0).toLocaleString("es-AR")}</td>
                                </tr>
                            ))}
                            <tr>
	                                <td colSpan="4" style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
                                <td style={{ fontWeight: 700 }}>${Number(ordenActual.totalOrden ?? ordenActual.total ?? 0).toLocaleString("es-AR")}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="orden-compra">
            <div className="card">
                <h3 className="titulo">Orden de compra</h3>

                {mostrarPopup && (
                    <PopupProveedor
                        proveedoresDB={proveedoresDB}
                        onClose={() => setMostrarPopup(false)}
                        onCreate={agregarProveedor}
                    />
                )}

                <div className="campo">
                    <label>Proveedor</label>

                    {proveedorCreado ? (
                        <input
                            value={proveedorCreado}
                            readOnly
                            className="input-readonly"
                        />
                    ) : (
                        <select
                            value={form.proveedor}
                            onChange={(e) => {
                                if (e.target.value === "__add__") {
                                    setMostrarPopup(true);
                                    return;
                                }
                                setForm(prev => ({
                                    ...prev,
                                    proveedor: e.target.value
                                }));
                            }}
                        >
                            <option value="">Selecciona un proveedor</option>

                            {proveedoresDB.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.nombre} {p.apellido}
                                </option>
                            ))}

                            <option value="__add__">+ Agregar proveedor</option>
                        </select>
                    )}
                </div>

                <div className="campo oc-campo-separado">
                    <label>Fecha de la orden de compra</label>
                    <input
                        type="date"
	                        name="fechaOrden"
	                        value={form.fechaOrden}
	                        onChange={handleChange}
	                    />
	                </div>

                <div className="campo oc-campo-separado">
                    <label>Anotaciones</label>
                    <textarea
                        className="oc-anotaciones-input"
                        maxLength={500}
                        name="anotaciones"
                        value={form.anotaciones}
                        onChange={handleChange}
                    />
                    <span className="contador">
                        {form.anotaciones.length} / 500
                    </span>
                </div>
            </div>

            <div className="card">
                <div className="titulo-row">
                    <h3 className="titulo">Articulos</h3>
                    <span className="accion">IMPORTAR</span>
                </div>

                <table className="tabla">
                    <thead>
	                        <tr>
	                            <th className="col-art">Articulo</th>
	                            <th>Talle</th>
	                            <th>Stock</th>
	                            <th>Cantidad</th>
	                            <th>Costo de compra</th>
	                            <th>Importe</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {articulosOC.map((art, i) => (
                            <tr key={art._id}>
                                <td className="col-art">
                                    <div className="art-nombre">{art.nombre}</div>
                                </td>

                                <td>
                                    {getTallesArticulo(art).length ? (
                                        <select
                                            className="select-talle"
                                            value={art.talle || ""}
                                            onChange={(e) => {
                                                const talle = e.target.value;
                                                setArticulosOC(prev =>
                                                    prev.map((a, idx) =>
                                                        idx === i
                                                            ? {
                                                                ...a,
                                                                talle,
                                                                stock: getStockPorTalle(a, talle),
                                                                costo: getCostoPorTalle(a, talle)
                                                            }
                                                            : a
                                                    )
                                                );
                                            }}
                                        >
                                            {getTallesArticulo(art).map((talle) => (
                                                <option key={`${art._id}-${talle}`} value={talle}>{talle}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </td>
		
		                                <td className="col-num">{art.stock ?? 0}</td>
	
	                                <td>
                                    <input
                                        type="number"
                                        min={1}
                                        value={art.cantidad}
                                        className="input-cantidad"
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            setArticulosOC(prev =>
                                                prev.map((a, idx) =>
                                                    idx === i
                                                        ? { ...a, cantidad: value === "" ? "" : Number(value) }
                                                        : a
                                                )
                                            );
                                        }}

                                    />
                                </td>

                                <td>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={art.costo}
                                        className="input-costo"
                                        onChange={(e) => {
                                            const v = limpiarCerosIniciales(normalizarNumeroInput(e.target.value));
                                            if (!esNumeroInputValido(v)) return;
                                            setArticulosOC(prev =>
                                                prev.map((a, idx) =>
                                                    idx === i ? { ...a, costo: v } : a
                                                )
                                            );
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={() => {
                                            setArticulosOC(prev =>
                                                prev.map((a, idx) =>
                                                    idx === i && (a.costo === "" || a.costo === ".")
                                                        ? { ...a, costo: "0" }
                                                        : a
                                                )
                                            );
                                        }}
                                    />
                                </td>

                                <td className="importe">
                                    ${(toNumero(art.cantidad) * toNumero(art.costo)).toLocaleString("es-AR")}
                                </td>

                                <td>
                                    <button
                                        className="btn-delete"
                                        onClick={() =>
                                            setArticulosOC(prev => prev.filter((_, idx) => idx !== i))
                                        }
                                    >
                                        X
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="buscador-linea">
                    <select
                        className="oc-articulo-select"
                        defaultValue=""
                        onChange={(e) => {
                            const artId = e.target.value;
                            if (!artId) return;

                            const art = articulosNoCompuestos.find(a => a._id === artId);

                            if (art) agregarArticulo(art);

                            e.target.value = "";
                        }}
                    >
                        <option value="">Seleccionar articulo</option>

                        {articulosNoCompuestos.map(a => (
                            <option key={a._id} value={a._id}>
                                {a.nombre}
                            </option>
                        ))}
	                    </select>
	                </div>

	                <div className="total">
                    <span>Total</span>
                    <strong>${total.toLocaleString("es-AR")}</strong>
                </div>

                <div className="acciones-finales">
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => navigate("/resumenCompras")}
                        disabled={guardando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-primario"
                        onClick={handleCrearOrden}
                        disabled={guardando}
                    >
                        {(ordenActual?._id || id) ? "Guardar cambios" : "Crear orden"}
                    </button>
                </div>
            </div>
        </div>
    );
}
