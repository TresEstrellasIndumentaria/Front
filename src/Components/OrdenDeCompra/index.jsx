import { useEffect, useMemo, useState } from "react";
import PopupProveedor from "../PopupProveedor";
import { useDispatch, useSelector } from "react-redux";
import {
    actualizarEstadoOrdenCompra,
    cancelarOrdenCompra,
    crearOrdenCompra,
    getAllArticulos,
    getOrdenCompraById,
    getUsuarioByRol,
    recibirOrdenCompra
} from "../../Redux/Actions";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import "./styles.css";

const ESTADOS_ORDEN = {
    BORRADOR: "Borrador",
    ENVIADA: "Pendiente",
    RECIBIDA: "Recibida",
    CANCELADA: "Cancelada"
};

const formatFecha = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const buildNumeroOrden = () => `PO${String(Date.now()).slice(-4)}`;

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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function OrdenCompra() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const proveedoresDB = useSelector(state => state.usuariosRol || []);
    const allArticulos = useSelector(state => state.articulos || []);
    const ordenActualRedux = useSelector(state => state.ordenActual);

    const [articulosOC, setArticulosOC] = useState([]);
    const [costosAdicionales, setCostosAdicionales] = useState([]);
    const [guardando, setGuardando] = useState(false);

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [proveedorCreado, setProveedorCreado] = useState(null);
    const [, setBusqueda] = useState("");

    const [ordenActual, setOrdenActual] = useState(null);
    const [vistaDetalle, setVistaDetalle] = useState(false);
    const [vistaRecepcion, setVistaRecepcion] = useState(false);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [recepcionItems, setRecepcionItems] = useState([]);

    const [form, setForm] = useState({
        proveedor: "",
        fechaOrden: "",
        fechaEsperada: "",
        anotaciones: ""
    });

    const articulosNoCompuestos = allArticulos.filter(a => a.artCompuesto !== true);

    useEffect(() => {
        dispatch(getUsuarioByRol("PROVEEDOR"));
        dispatch(getAllArticulos());
    }, [dispatch]);

    useEffect(() => {
        const cargarOrdenById = async () => {
            if (!id) return;

            setCargandoDetalle(true);
            const resp = await dispatch(getOrdenCompraById(id));
            if (resp?.error) {
                setCargandoDetalle(false);
                Swal.fire("No encontrada", resp.message || "No se pudo cargar la orden solicitada.", "warning");
                navigate("/ordenesDeCompras");
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

        setArticulosOC(prev => [
            ...prev,
            {
                ...art,
                cantidad: 1,
                costo: art.coste || 0
            }
        ]);

        setBusqueda("");
    };

    const agregarCostoAdicional = () => {
        setCostosAdicionales(prev => [...prev, { nombre: "", valor: 0 }]);
    };

    const totalArticulos = articulosOC.reduce((acc, a) => acc + a.cantidad * a.costo, 0);
    const totalCostos = costosAdicionales.reduce((acc, c) => acc + Number(c.valor || 0), 0);
    const total = totalArticulos + totalCostos;

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
                email: proveedorSeleccionado.email,
                telefono: proveedorSeleccionado.telefono,
                direccion: proveedorSeleccionado.direccion
            }
            : null,
        fechaOrden: form.fechaOrden,
        fechaEsperada: form.fechaEsperada,
        anotaciones: form.anotaciones,
        articulos: articulosOC.map((a) => ({
            articulo: a._id,
            nombre: a.nombre,
            cantidad: Number(a.cantidad || 0),
            costo: Number(a.costo || 0),
            subtotal: Number(a.cantidad || 0) * Number(a.costo || 0)
        })),
        items: articulosOC.map((a) => ({
            articulo: a._id,
            stockActual: Number(a.stock || 0),
            entrantes: Number(a.entrantes || 0),
            cantidad: Number(a.cantidad || 0),
            coste: Number(a.costo || 0),
            costoTotal: Number(a.cantidad || 0) * Number(a.costo || 0)
        })),
        costosAdicionales: costosAdicionales.map((c) => ({
            nombre: c.nombre,
            valor: Number(c.valor || 0)
        })),
        totalArticulos,
        totalCostos,
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

    const handleGuardarBorrador = async () => {
        setGuardando(true);
        try {
            const payload = buildOrdenPayload("BORRADOR");
            const resp = await dispatch(crearOrdenCompra(payload));
            const msg = String(resp?.message || resp?.msg || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo guardar el borrador", "error");
                return;
            }

            const hydratedOrden = hydrateOrdenActual(resp, payload);
            setOrdenActual(hydratedOrden);
            sincronizarOrdenLocal(hydratedOrden);
            setVistaDetalle(true);

            await Swal.fire({
                icon: "success",
                title: "Borrador guardado",
                text: "La orden se guardo con estado BORRADOR.",
                timer: 1500,
                showConfirmButton: false
            });
        } finally {
            setGuardando(false);
        }
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
            const payload = buildOrdenPayload("ENVIADA");
            const resp = await dispatch(crearOrdenCompra(payload));
            const msg = String(resp?.message || resp?.msg || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo crear la orden", "error");
                return;
            }

            const hydratedOrden = hydrateOrdenActual(resp, payload);
            setOrdenActual(hydratedOrden);
            sincronizarOrdenLocal(hydratedOrden);
            setVistaDetalle(true);

            await Swal.fire({
                icon: "success",
                title: "Orden creada",
                text: "La orden se envio con estado ENVIADA.",
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

            const recibido = estado === "RECIBIDA"
                ? (ordenActual.items || ordenActual.articulos || []).reduce((acc, a) => acc + Number(a.cantidad || 0), 0)
                : Number(ordenActual.recibido || 0);

            const updatedOrden = { ...ordenActual, estado, recibido };
            setOrdenActual(updatedOrden);
            sincronizarOrdenLocal(updatedOrden);
        } finally {
            setGuardando(false);
        }
    };

    const iniciarRecepcion = () => {
        if (!ordenActual) return;
        if (["RECIBIDA", "CANCELADA"].includes(ordenActual.estado)) return;

        const itemsBase = (ordenActual.items || ordenActual.articulos || []).map((item, idx) => {
            const ordenado = Number(item.cantidad || 0);
            const recibidoPrevio = clamp(Number(item.recibido ?? item.cantidadRecibida ?? 0), 0, ordenado);
            return {
                key: `${getItemId(item) || "item"}-${idx}`,
                original: item,
                ordenado,
                recibidoPrevio,
                aRecibir: 0
            };
        });

        setRecepcionItems(itemsBase);
        setVistaRecepcion(true);
    };

    const handleRecepcionCantidad = (index, value) => {
        setRecepcionItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== index) return item;
                const pendiente = Math.max(item.ordenado - item.recibidoPrevio, 0);
                const parsed = Number(value);
                const safe = Number.isNaN(parsed) ? 0 : clamp(parsed, 0, pendiente);
                return { ...item, aRecibir: safe };
            })
        );
    };

    const marcarTodosComoRecibidos = () => {
        setRecepcionItems((prev) =>
            prev.map((item) => {
                const pendiente = Math.max(item.ordenado - item.recibidoPrevio, 0);
                return { ...item, aRecibir: pendiente };
            })
        );
    };

    const confirmarRecepcion = async () => {
        if (!ordenActual?._id) {
            Swal.fire("Atencion", "No se encontro ID de la orden para actualizar estado.", "warning");
            return;
        }

        const recepciones = recepcionItems
            .map((row) => ({
                articulo: getItemId(row.original),
                cantidad: Number(row.aRecibir || 0)
            }))
            .filter((row) => row.articulo && row.cantidad > 0);

        const totalIngreso = recepciones.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
        if (!recepciones.length || !totalIngreso) {
            Swal.fire("Sin cambios", "Ingresa una cantidad para recibir.", "info");
            return;
        }

        const updatedItems = recepcionItems.map((row) => {
            const recibidoLinea = recepciones.find((r) => r.articulo === getItemId(row.original));
            const recibidoTotal = Number(row.recibidoPrevio || 0) + Number(recibidoLinea?.cantidad || 0);
            return {
                ...row.original,
                cantidadRecibida: recibidoTotal
            };
        });

        const totalRecibido = updatedItems.reduce((acc, item) => acc + Number(item.cantidadRecibida || 0), 0);
        const totalOrdenado = updatedItems.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
        const estadoDestino = totalRecibido >= totalOrdenado && totalOrdenado > 0 ? "RECIBIDA" : "ENVIADA";

        setGuardando(true);
        try {
            const payloadRecepcion = { items: recepciones };
            const resp = await dispatch(recibirOrdenCompra(ordenActual._id, payloadRecepcion));
            const msg = String(resp?.msg || resp?.message || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo actualizar la recepcion", "error");
                return;
            }

            const ordenBackend = resp?.orden || resp?.data?.orden || null;
            const updatedOrden = ordenBackend
                ? {
                    ...ordenActual,
                    ...ordenBackend,
                    estado: ordenBackend.estado || estadoDestino,
                    items: ordenBackend.items || updatedItems
                }
                : {
                    ...ordenActual,
                    estado: estadoDestino,
                    recibido: totalRecibido,
                    items: updatedItems
                };
            setOrdenActual(updatedOrden);
            sincronizarOrdenLocal(updatedOrden);
            setVistaRecepcion(false);

            Swal.fire(
                "Recepcion registrada",
                estadoDestino === "RECIBIDA"
                    ? "La orden quedo completamente recibida."
                    : "La orden quedo parcialmente recibida.",
                "success"
            );
        } finally {
            setGuardando(false);
        }
    };

    const handleCancelarOrden = async () => {
        if (!ordenActual?._id) {
            Swal.fire("Atencion", "No se encontro ID de la orden para actualizar estado.", "warning");
            return;
        }

        if (["CANCELADA", "RECIBIDA"].includes(ordenActual.estado)) return;

        const result = await Swal.fire({
            title: "Cancelar orden",
            text: "Esta accion cambiara el estado a CANCELADA. Deseas continuar?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si, cancelar",
            cancelButtonText: "Volver"
        });

        if (!result.isConfirmed) return;

        setGuardando(true);
        try {
            const resp = await dispatch(cancelarOrdenCompra(ordenActual._id));
            const msg = String(resp?.message || resp?.msg || "");

            if (resp?.error || msg.toLowerCase().includes("error")) {
                Swal.fire("Error", msg || "No se pudo cancelar la orden", "error");
                return;
            }

            const updatedOrden = { ...ordenActual, estado: "CANCELADA" };
            setOrdenActual(updatedOrden);
            sincronizarOrdenLocal(updatedOrden);
        } finally {
            setGuardando(false);
        }
    };

    const handleEditarDesdeDetalle = () => {
        if (!ordenActual) return;
        if (["RECIBIDA", "CANCELADA"].includes(ordenActual.estado)) {
            Swal.fire("No disponible", "No se puede editar una orden recibida o cancelada.", "info");
            return;
        }

        setForm({
            proveedor: ordenActual?.proveedor?._id || ordenActual?.proveedor || "",
            fechaOrden: ordenActual?.fechaOrden ? String(ordenActual.fechaOrden).slice(0, 10) : "",
            fechaEsperada: ordenActual?.fechaEsperada ? String(ordenActual.fechaEsperada).slice(0, 10) : "",
            anotaciones: ordenActual?.anotaciones || ""
        });

        setArticulosOC(
            (ordenActual.items || ordenActual.articulos || []).map((a) => ({
                _id: getItemId(a),
                nombre: getItemNombre(a),
                cantidad: Number(a.cantidad || 0),
                costo: Number(a.coste ?? a.costo ?? 0),
                stock: Number(a.stockActual ?? a.stock ?? 0),
                entrantes: Number(a.entrantes || 0)
            }))
        );

        setCostosAdicionales(
            (ordenActual.costosAdicionales || []).map((c) => ({
                nombre: c.nombre || "",
                valor: Number(c.valor || 0)
            }))
        );

        if (ordenActual?.proveedorInfo?.nombre || ordenActual?.proveedorInfo?.apellido) {
            setProveedorCreado(`${ordenActual.proveedorInfo?.nombre || ""} ${ordenActual.proveedorInfo?.apellido || ""}`.trim());
        }

        setVistaRecepcion(false);
        setVistaDetalle(false);
    };

    if (id && cargandoDetalle) {
        return <div className="orden-compra"><div className="card"><p>Cargando orden...</p></div></div>;
    }

    if (vistaDetalle && vistaRecepcion && ordenActual) {
        return (
            <div className="oc-recepcion-wrap">
                <div className="oc-recepcion-header">
                    <h2>Recibir articulos</h2>
                </div>

                <div className="oc-recepcion-card">
                    <div className="oc-recepcion-top">
                        <h3>Articulos</h3>
                        <button type="button" onClick={marcarTodosComoRecibidos} disabled={guardando}>
                            Marcar todos como recibidos
                        </button>
                    </div>

                    <table className="oc-recepcion-table">
                        <thead>
                            <tr>
                                <th>Articulo</th>
                                <th className="ta-right">Ordenado</th>
                                <th className="ta-right">Recibido</th>
                                <th className="ta-right">A recibir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recepcionItems.map((row, idx) => {
                                const pendiente = Math.max(row.ordenado - row.recibidoPrevio, 0);
                                return (
                                    <tr key={row.key}>
                                        <td>
                                            <strong>{getItemNombre(row.original)}</strong>
                                            <div className="oc-recepcion-ref">REF {getItemId(row.original) || "-"}</div>
                                        </td>
                                        <td className="ta-right">{row.ordenado}</td>
                                        <td className="ta-right">{row.recibidoPrevio}</td>
                                        <td className="ta-right">
                                            <input
                                                type="number"
                                                min={0}
                                                max={pendiente}
                                                value={row.aRecibir}
                                                onChange={(e) => handleRecepcionCantidad(idx, e.target.value)}
                                                disabled={guardando}
                                                className="oc-recepcion-input"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="oc-recepcion-actions">
                        <button type="button" className="btn-ghost" onClick={() => setVistaRecepcion(false)} disabled={guardando}>
                            Cancelar
                        </button>
                        <button type="button" className="btn-primario" onClick={confirmarRecepcion} disabled={guardando}>
                            Recibir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (vistaDetalle && ordenActual) {
        const items = ordenActual.items || ordenActual.articulos || [];
        const totalUnidades = items.reduce((acc, a) => acc + Number(a.cantidad || 0), 0);
        const recibido = Number(ordenActual.recibido || 0);
        const estadoLabel = ESTADOS_ORDEN[ordenActual.estado] || ordenActual.estado;
        const estadoBloqueado = ["RECIBIDA", "CANCELADA"].includes(ordenActual.estado);
        const prov = ordenActual.proveedorInfo || ordenActual.proveedor || {};
        const telefono = prov?.telefono
            ? `${prov.telefono.area || ""} ${prov.telefono.numero || ""}`.trim()
            : "-";
        const direccion = prov?.direccion
            ? `${prov.direccion.calle || ""} ${prov.direccion.numero || ""}, ${prov.direccion.localidad || ""}, ${prov.direccion.provincia || ""}`.trim()
            : "-";

        return (
            <div className="oc-detalle">
                <div className="oc-detalle-header">
                    <button className="oc-link-back" onClick={() => navigate("/ordenesDeCompras")}>Ordenes de compra</button>
                    <div className="oc-detalle-acciones">
                        <button onClick={iniciarRecepcion} disabled={guardando || estadoBloqueado}>Recibir</button>
                        <button onClick={handleEditarDesdeDetalle} disabled={guardando || estadoBloqueado}>Editar</button>
                        <button onClick={() => handleCambiarEstado("ENVIADA")} disabled={guardando || estadoBloqueado || ordenActual.estado === "ENVIADA"}>Enviar</button>
                        <button className="btn-danger" onClick={handleCancelarOrden} disabled={guardando || estadoBloqueado}>Cancelar</button>
                        <button onClick={() => window.print()} disabled={guardando}>Guardar como PDF</button>
                    </div>
                </div>

                <div className="oc-resumen-card">
                    <div className="oc-resumen-top">
                        <div>
                            <h2>{ordenActual.numero || "PO---"}</h2>
                            <p className="oc-estado">{estadoLabel}</p>
                        </div>
                        <div className="oc-progreso">
                            <progress max={Math.max(totalUnidades, 1)} value={Math.min(recibido, Math.max(totalUnidades, 1))} />
                            <span>Recibido {recibido} de {totalUnidades}</span>
                        </div>
                    </div>

                    <div className="oc-datos-row">
                        <p><strong>Fecha:</strong> {formatFecha(ordenActual.fechaOrden)}</p>
                        <p><strong>Esperado para:</strong> {formatFecha(ordenActual.fechaEsperada)}</p>
                    </div>

                    <div className="oc-grid">
                        <div>
                            <strong>Proveedor:</strong>
                            <p>{prov?.nombre || ""} {prov?.apellido || ""}</p>
                            <p>{direccion}</p>
                            <p>{telefono}</p>
                            <p>{prov?.email || "-"}</p>
                        </div>
                        <div>
                            <strong>Tienda de destino:</strong>
                            <p>Liz</p>
                        </div>
                    </div>

                    <div className="oc-anotaciones">
                        <strong>Anotaciones:</strong>
                        <p>{ordenActual.anotaciones || "-"}</p>
                    </div>
                </div>

                <div className="oc-resumen-card">
                    <h3>Articulos</h3>
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th className="col-art">Articulo</th>
                                <th>Cantidad</th>
                                <th>Costo de compra</th>
                                <th>Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((art, idx) => (
                                <tr key={`${getItemId(art)}-${idx}`}>
                                    <td>{getItemNombre(art)}</td>
                                    <td>{Number(art.cantidad || 0)}</td>
                                    <td>${Number(art.coste ?? art.costo ?? 0).toLocaleString("es-AR")}</td>
                                    <td>${Number((art.costoTotal ?? art.subtotal ?? (Number(art.cantidad || 0) * Number(art.coste ?? art.costo ?? 0))) || 0).toLocaleString("es-AR")}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="3" style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
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

                <div className="fila">
                    <div className="campo">
                        <label>Fecha de la orden de compra</label>
                        <input
                            type="date"
                            name="fechaOrden"
                            value={form.fechaOrden}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="campo">
                        <label>Esperado para</label>
                        <input
                            type="date"
                            name="fechaEsperada"
                            value={form.fechaEsperada}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="campo">
                    <label>Anotaciones</label>
                    <textarea
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
                            <th>Stock</th>
                            <th>Entrantes</th>
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

                                <td className="col-num">{art.stock ?? 0}</td>
                                <td className="col-num">{art.entrantes ?? 0}</td>

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
                                        type="number"
                                        value={art.costo}
                                        className="input-costo"
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setArticulosOC(prev =>
                                                prev.map((a, idx) =>
                                                    idx === i ? { ...a, costo: v } : a
                                                )
                                            );
                                        }}
                                    />
                                </td>

                                <td className="importe">
                                    ${(art.cantidad * art.costo).toLocaleString("es-AR")}
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

                <div className="costos">
                    <div className="costos-header">
                        <span>Coste adicional</span>
                        <span>Cantidad</span>
                    </div>

                    {costosAdicionales.map((c, i) => (
                        <div className="costo-row" key={i}>
                            <input
                                placeholder="Nombre del costo"
                                value={c.nombre}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCostosAdicionales(prev =>
                                        prev.map((x, idx) =>
                                            idx === i ? { ...x, nombre: v } : x
                                        )
                                    );
                                }}
                            />

                            <input
                                type="number"
                                placeholder="$0"
                                value={c.valor}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setCostosAdicionales(prev =>
                                        prev.map((x, idx) =>
                                            idx === i ? { ...x, valor: v } : x
                                        )
                                    );
                                }}
                            />

                            <button
                                className="btn-delete"
                                onClick={() =>
                                    setCostosAdicionales(prev => prev.filter((_, idx) => idx !== i))
                                }
                            >
                                X
                            </button>
                        </div>
                    ))}

                    <button
                        className="btn-add-costo"
                        onClick={agregarCostoAdicional}
                    >
                        + ANADIR COSTES ADICIONALES
                    </button>
                </div>

                <div className="total">
                    <span>Total</span>
                    <strong>${total.toLocaleString("es-AR")}</strong>
                </div>

                <div className="acciones-finales">
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => navigate("/ordenesDeCompras")}
                        disabled={guardando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-borrador"
                        onClick={handleGuardarBorrador}
                        disabled={guardando}
                    >
                        Guardar como borrador
                    </button>
                    <button
                        type="button"
                        className="btn-primario"
                        onClick={handleCrearOrden}
                        disabled={guardando}
                    >
                        Crear orden
                    </button>
                </div>
            </div>
        </div>
    );
}
