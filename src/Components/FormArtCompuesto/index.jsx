import React, { useState, useEffect, useMemo, useRef } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Switch from "@mui/material/Switch";
import "./styles.css";

const getNumeroFinito = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : null;
};

const getArticuloCosteBase = (articulo, talle = "") => {
    if (!articulo) return 0;
    if (Array.isArray(articulo.talles) && articulo.talles.length) {
        const talleNormalizado = String(talle || "").trim().toLowerCase();
        const talleSeleccionado = talleNormalizado
            ? articulo.talles.find((t) => String(t?.talle || "").trim().toLowerCase() === talleNormalizado)
            : null;
        const talleDefault = articulo.talles.length > 1
            ? articulo.talles.find((t) => t?.talle)
            : articulo.talles[0];
        const talleParaCoste = talleSeleccionado || talleDefault;
        const costeTalle = getNumeroFinito(talleParaCoste?.ultimoCostoCompra)
            ?? getNumeroFinito(talleParaCoste?.costo)
            ?? getNumeroFinito(talleParaCoste?.coste);
        if (costeTalle !== null) return costeTalle;

        const primerTalleConCoste = articulo.talles
            .map((t) => getNumeroFinito(t?.ultimoCostoCompra) ?? getNumeroFinito(t?.costo) ?? getNumeroFinito(t?.coste))
            .find((coste) => coste !== null);
        if (primerTalleConCoste !== undefined) return primerTalleConCoste;
    }
    const costeArticulo = getNumeroFinito(articulo.ultimoCostoCompra)
        ?? getNumeroFinito(articulo.costo)
        ?? getNumeroFinito(articulo.coste)
        ?? getNumeroFinito(articulo.precio);
    if (costeArticulo !== null) return costeArticulo;
    return 0;
};

const getTallesArticulo = (articulo) => (
    Array.isArray(articulo?.talles)
        ? articulo.talles.map((t) => t?.talle).filter(Boolean)
        : []
);

const getDefaultTalleComponente = (articulo) => {
    const talles = getTallesArticulo(articulo);
    return talles.length > 1 ? talles[0] : "";
};

const normalizarComponente = (componente, articulos = []) => {
    const id = componente?.articulo?._id || componente?.articulo || componente?._id;
    const articulo = articulos.find((a) => a._id === id);
    const qty = Number(componente?.cantidad ?? 1);
    const costeTotalGuardado = Number(componente?.costeTotal ?? 0);
    const costeUnitario = Number(
        componente?.costeUnitario ??
        componente?.costo ??
        componente?.coste ??
        (qty > 0 && costeTotalGuardado > 0 ? costeTotalGuardado / qty : getArticuloCosteBase(articulo, componente?.talle))
    );

    return {
        _id: id,
        nombre: componente?.nombre || componente?.articulo?.nombre || articulo?.nombre || "Componente",
        talle: componente?.talle || getDefaultTalleComponente(articulo),
        costeUnitario,
        cantidad: qty,
        costeTotal: qty * costeUnitario,
        costeInput: String(qty * costeUnitario)
    };
};

const serializarComposicion = (componentes = []) => JSON.stringify(componentes.map((c) => ({
    articulo: c._id,
    ...(c.talle ? { talle: c.talle } : {}),
    cantidad: c.cantidad,
    costo: c.costeUnitario
})));

const serializarComponentesVista = (componentes = []) => JSON.stringify(componentes.map((c) => ({
    _id: c._id,
    nombre: c.nombre,
    talle: c.talle,
    cantidad: c.cantidad,
    costeUnitario: c.costeUnitario,
    costeTotal: c.costeTotal
})));

function InventarioCompuesto({
    articulos = [],
    componentesIniciales = [],
    onCosteChange,
    onComposicionChange
}) {
    const [articuloSeleccionado, setArticuloSeleccionado] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [componentes, setComponentes] = useState([]);
    const ultimaComposicionEnviadaRef = useRef("");
    const ultimoCosteEnviadoRef = useRef(null);
    const usuarioModificoRef = useRef(false);
    const componentesInicialesKey = JSON.stringify(componentesIniciales || []);
    const articulosKey = JSON.stringify((articulos || []).map((articulo) => ({
        _id: articulo?._id,
        nombre: articulo?.nombre,
        ultimoCostoCompra: articulo?.ultimoCostoCompra,
        costo: articulo?.costo,
        coste: articulo?.coste,
        talles: articulo?.talles
    })));
    const componentesNormalizados = useMemo(() => (
        (componentesIniciales || [])
            .map((c) => normalizarComponente(c, articulos))
            .filter((c) => c._id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [componentesInicialesKey, articulosKey]);
    const articulosOrdenados = useMemo(() => (
        [...(articulos || [])].sort((a, b) => String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es", {
            sensitivity: "base"
        }))
    ), [articulos]);

    useEffect(() => {
        if (!componentesNormalizados.length) {
            ultimaComposicionEnviadaRef.current = "[]";
            ultimoCosteEnviadoRef.current = 0;
            usuarioModificoRef.current = false;
            setComponentes((prev) => (prev.length ? [] : prev));
            return;
        }

        const costeInicial = Number(componentesNormalizados.reduce((acc, c) => acc + Number(c.costeTotal || 0), 0).toFixed(3));

        ultimaComposicionEnviadaRef.current = serializarComposicion(componentesNormalizados);
        ultimoCosteEnviadoRef.current = costeInicial;
        usuarioModificoRef.current = false;

        setComponentes((prev) => {
            return serializarComponentesVista(prev) === serializarComponentesVista(componentesNormalizados)
                ? prev
                : componentesNormalizados;
        });
    }, [componentesNormalizados]);

    const agregarComponente = () => {
        if (!articuloSeleccionado || cantidad <= 0) return;

        const articulo = articulos.find((a) => a._id === articuloSeleccionado);
        if (!articulo) return;
        const talleDefault = getDefaultTalleComponente(articulo);
        const costeUnitario = getArticuloCosteBase(articulo, talleDefault);

        usuarioModificoRef.current = true;
        setComponentes((prev) => [
            ...prev,
            {
                _id: articulo._id,
                nombre: articulo.nombre,
                talle: talleDefault,
                costeUnitario,
                cantidad,
                costeTotal: costeUnitario * cantidad,
                costeInput: String(costeUnitario * cantidad)
            }
        ]);

        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const agregarComponentePorId = (articuloId) => {
        if (!articuloId || cantidad <= 0) return;

        const articulo = articulos.find((a) => a._id === articuloId);
        if (!articulo) return;
        const talleDefault = getDefaultTalleComponente(articulo);
        const costeUnitario = getArticuloCosteBase(articulo, talleDefault);

        usuarioModificoRef.current = true;
        setComponentes((prev) => [
            ...prev,
            {
                _id: articulo._id,
                nombre: articulo.nombre,
                talle: talleDefault,
                costeUnitario,
                cantidad,
                costeTotal: costeUnitario * cantidad,
                costeInput: String(costeUnitario * cantidad)
            }
        ]);

        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const eliminarTodos = () => {
        usuarioModificoRef.current = true;
        setComponentes([]);
        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const actualizarCantidad = (id, nuevaCantidad) => {
        const qty = Math.max(0, nuevaCantidad);

        usuarioModificoRef.current = true;
        setComponentes((prev) =>
            prev.map((c) =>
                c._id === id
                    ? {
                        ...c,
                        cantidad: qty,
                        costeTotal: qty * c.costeUnitario,
                        costeInput: String(qty * c.costeUnitario)
                    }
                    : c
            )
        );
    };

    const actualizarCoste = (id, nuevoCoste) => {
        usuarioModificoRef.current = true;
        setComponentes((prev) =>
            prev.map((c) =>
                c._id === id
                    ? nuevoCoste === ""
                        ? {
                            ...c,
                            costeInput: ""
                        }
                        : {
                            ...c,
                            costeTotal: Math.max(0, Number(nuevoCoste) || 0),
                            costeUnitario: c.cantidad > 0 ? (Math.max(0, Number(nuevoCoste) || 0) / c.cantidad) : c.costeUnitario,
                            costeInput: nuevoCoste
                        }
                    : c
            )
        );
    };

    const actualizarTalle = (id, nuevoTalle) => {
        usuarioModificoRef.current = true;
        setComponentes((prev) =>
            prev.map((c) => {
                if (c._id !== id) return c;

                const articulo = articulos.find((a) => a._id === id);
                const costeUnitario = getArticuloCosteBase(articulo, nuevoTalle);

                return {
                    ...c,
                    talle: nuevoTalle,
                    costeUnitario,
                    costeTotal: c.cantidad * costeUnitario,
                    costeInput: String(c.cantidad * costeUnitario)
                };
            })
        );
    };

    const normalizarCosteAlSalir = (id) => {
        usuarioModificoRef.current = true;
        setComponentes((prev) =>
            prev.map((c) =>
                c._id === id
                    ? c.costeInput === ""
                        ? {
                            ...c,
                            costeTotal: 0,
                            costeUnitario: c.cantidad > 0 ? 0 : c.costeUnitario,
                            costeInput: "0"
                        }
                        : c
                    : c
            )
        );
    };

    const eliminarComponente = (id) => {
        usuarioModificoRef.current = true;
        setComponentes((prev) => prev.filter((c) => c._id !== id));
    };

    const totalGeneral = useMemo(
        () => componentes.reduce((acc, c) => acc + c.costeTotal, 0),
        [componentes]
    );

    const articuloPreview = useMemo(
        () => articulos.find((a) => a._id === articuloSeleccionado) || null,
        [articulos, articuloSeleccionado]
    );

    const costePreview = useMemo(
        () => getArticuloCosteBase(articuloPreview) * Number(cantidad || 0),
        [articuloPreview, cantidad]
    );

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 2,
            maximumFractionDigits: 3
        });

    useEffect(() => {
        const composicionSerializada = serializarComposicion(componentes);
        if (ultimaComposicionEnviadaRef.current === composicionSerializada) return;

        ultimaComposicionEnviadaRef.current = composicionSerializada;
        if (!usuarioModificoRef.current) return;
        onComposicionChange(JSON.parse(composicionSerializada));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componentes]);

    useEffect(() => {
        const costeNormalizado = Number(totalGeneral.toFixed(3));
        if (ultimoCosteEnviadoRef.current === costeNormalizado) return;

        ultimoCosteEnviadoRef.current = costeNormalizado;
        if (!usuarioModificoRef.current) return;
        onCosteChange(costeNormalizado);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalGeneral]);

    return (
        <div className="inventario-cont">
            <h3>Inventario</h3>

            <div className="inventario-switch-row">
                <div className="inventario-switch-label">
                    <span>Articulo compuesto</span>
                    <InfoOutlinedIcon fontSize="small" />
                </div>
                <Switch checked disabled />
            </div>

            {/* <div className="inventario-switch-row">
                <div className="inventario-switch-label">
                    <span>Usar produccion</span>
                    <InfoOutlinedIcon fontSize="small" />
                </div>
                <Switch checked={false} disabled />
            </div> */}

            <table className="tabla-compuesto">
                <thead>
                    <tr>
                        <th>Componente</th>
                        <th>Talle</th>
                        <th>Cantidad</th>
                        <th>Coste</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {componentes.map((c) => (
                        <tr key={c._id}>
                            <td>
                                <strong>{c.nombre}</strong>
                            </td>
                            <td>
                                {getTallesArticulo(articulos.find((a) => a._id === c._id)).length > 1 ? (
                                    <select
                                        value={c.talle || ""}
                                        onChange={(e) => actualizarTalle(c._id, e.target.value)}
                                    >
                                        {getTallesArticulo(articulos.find((a) => a._id === c._id)).map((talle) => (
                                            <option key={`${c._id}-${talle}`} value={talle}>{talle}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="componente-ref">{c.talle || "Unico"}</span>
                                )}
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    value={c.cantidad}
                                    onChange={(e) => actualizarCantidad(c._id, Number(e.target.value))}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.001"
                                    value={c.costeInput ?? c.costeTotal}
                                    onChange={(e) => actualizarCoste(c._id, e.target.value)}
                                    onBlur={() => normalizarCosteAlSalir(c._id)}
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="btn-trash"
                                    onClick={() => eliminarComponente(c._id)}
                                    aria-label={`Eliminar ${c.nombre}`}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="tabla-compuesto-add-row">
                        <td>
                            <select
                                className="inventario-busqueda"
                                value={articuloSeleccionado}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setArticuloSeleccionado(value);
                                    if (value) agregarComponentePorId(value);
                                }}
                            >
                                <option value="">Busqueda de articulos</option>
                                {articulosOrdenados.map((a) => (
                                    <option
                                        key={a._id}
                                        value={a._id}
                                        disabled={componentes.some((c) => c._id === a._id)}
                                    >
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td></td>
                        <td>
                            <input
                                className="inventario-add-cantidad"
                                type="number"
                                min={1}
                                value={cantidad}
                                onChange={(e) => setCantidad(Number(e.target.value))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        agregarComponente();
                                    }
                                }}
                            />
                        </td>
                        <td>
                            <div className="inventario-coste-preview">
                                {formatMoney(costePreview)}
                            </div>
                        </td>
                        <td>
                            <button
                                type="button"
                                className="inventario-clear-btn"
                                onClick={eliminarTodos}
                                disabled={!componentes.length}
                                aria-label="Eliminar todos los componentes"
                                title="Eliminar todos los componentes"
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </button>
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div className="inventario-total">
                <span>Coste total</span>
                <strong>{formatMoney(totalGeneral)}</strong>
            </div>
        </div>
    );
}

export default InventarioCompuesto;
