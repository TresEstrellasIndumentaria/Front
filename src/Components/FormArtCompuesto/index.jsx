import React, { useState, useEffect, useMemo } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Switch from "@mui/material/Switch";
import "./styles.css";

const getArticuloCosteBase = (articulo) => {
    if (!articulo) return 0;
    if (Number.isFinite(Number(articulo.coste))) return Number(articulo.coste);
    if (Array.isArray(articulo.talles) && articulo.talles.length) {
        const primerTalleConCoste = articulo.talles.find((t) => Number.isFinite(Number(t?.coste)));
        if (primerTalleConCoste) return Number(primerTalleConCoste.coste);
    }
    return 0;
};

function InventarioCompuesto({
    articulos = [],
    componentesIniciales = [],
    onCosteChange,
    onComposicionChange
}) {
    const [articuloSeleccionado, setArticuloSeleccionado] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [componentes, setComponentes] = useState([]);

    useEffect(() => {
        if (!componentesIniciales?.length) return;

        const normalizados = componentesIniciales.map((c) => {
            const id = c?._id || c?.articulo?._id || c?.articulo;
            const articulo = articulos.find((a) => a._id === id);
            const qty = Number(c?.cantidad ?? 1);
            const costeTotal = Number(c?.costeTotal ?? c?.coste ?? 0);
            const costeUnitario = Number(
                c?.costeUnitario ?? (qty > 0 ? (costeTotal / qty) : articulo?.coste ?? 0)
            );

            return {
                _id: id,
                nombre: c?.nombre || c?.articulo?.nombre || articulo?.nombre || "Componente",
                costeUnitario,
                cantidad: qty,
                costeTotal: qty * costeUnitario
            };
        }).filter((c) => c._id);

        setComponentes(normalizados);
    }, [componentesIniciales, articulos]);

    const agregarComponente = () => {
        if (!articuloSeleccionado || cantidad <= 0) return;

        const articulo = articulos.find((a) => a._id === articuloSeleccionado);
        if (!articulo) return;

        setComponentes((prev) => [
            ...prev,
            {
                _id: articulo._id,
                nombre: articulo.nombre,
                costeUnitario: getArticuloCosteBase(articulo),
                cantidad,
                costeTotal: getArticuloCosteBase(articulo) * cantidad
            }
        ]);

        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const agregarComponentePorId = (articuloId) => {
        if (!articuloId || cantidad <= 0) return;

        const articulo = articulos.find((a) => a._id === articuloId);
        if (!articulo) return;

        setComponentes((prev) => [
            ...prev,
            {
                _id: articulo._id,
                nombre: articulo.nombre,
                costeUnitario: getArticuloCosteBase(articulo),
                cantidad,
                costeTotal: getArticuloCosteBase(articulo) * cantidad
            }
        ]);

        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const eliminarTodos = () => {
        setComponentes([]);
        setArticuloSeleccionado("");
        setCantidad(1);
    };

    const actualizarCantidad = (id, nuevaCantidad) => {
        const qty = Math.max(0, nuevaCantidad);

        setComponentes((prev) =>
            prev.map((c) =>
                c._id === id
                    ? {
                        ...c,
                        cantidad: qty,
                        costeTotal: qty * c.costeUnitario
                    }
                    : c
            )
        );
    };

    const eliminarComponente = (id) => {
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
            minimumFractionDigits: 2
        });

    useEffect(() => {
        const composicion = componentes.map((c) => ({
            articulo: c._id,
            cantidad: c.cantidad,
            coste: c.costeTotal
        }));

        onComposicionChange(composicion);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componentes]);

    useEffect(() => {
        onCosteChange(Number(totalGeneral.toFixed(2)));
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
                                <span className="componente-ref">REF {String(c._id).slice(-5)}</span>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    value={c.cantidad}
                                    onChange={(e) => actualizarCantidad(c._id, Number(e.target.value))}
                                />
                            </td>
                            <td>{formatMoney(c.costeTotal)}</td>
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
                                {articulos.map((a) => (
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
