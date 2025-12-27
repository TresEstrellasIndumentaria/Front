import React, { useState, useEffect, useMemo } from "react";
import "./styles.css";

function InventarioCompuesto({ articulos = [], onCosteChange }) {
    const [componentes, setComponentes] = useState([]);
    const [articuloSeleccionado, setArticuloSeleccionado] = useState("");

    // 👉 Agregar componente
    const agregarComponente = (articuloId) => {
        if (!articuloId) return;

        const articulo = articulos.find(a => a._id === articuloId);
        if (!articulo) return;

        setComponentes(prev => {
            if (prev.some(c => c._id === articulo._id)) return prev;

            return [
                ...prev,
                {
                    _id: articulo._id,
                    nombre: articulo.nombre,
                    costeUnitario: Number(articulo.coste) || 0,
                    cantidad: 1,
                    costeTotal: Number(articulo.coste) || 0
                }
            ];
        });

        setArticuloSeleccionado("");
    };

    // 👉 Actualizar cantidad
    const actualizarCantidad = (id, cantidad) => {
        const qty = Math.max(0, cantidad);

        setComponentes(prev =>
            prev.map(c =>
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

    // 👉 Eliminar componente
    const eliminarComponente = (id) => {
        setComponentes(prev => prev.filter(c => c._id !== id));
    };

    // 👉 Total general
    const totalGeneral = useMemo(() => {
        return componentes.reduce((acc, c) => acc + c.costeTotal, 0);
    }, [componentes]);

    // 👉 Enviar coste total al padre
    useEffect(() => {
        onCosteChange?.(Number(totalGeneral.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalGeneral]);

    return (
        <div className="inventario-cont">
            <h3>Inventario</h3>

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
                    {/* COMPONENTES */}
                    {componentes.map(c => (
                        <tr key={c._id}>
                            <td><strong>{c.nombre}</strong></td>

                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    value={c.cantidad}
                                    onChange={(e) =>
                                        actualizarCantidad(
                                            c._id,
                                            Number(e.target.value)
                                        )
                                    }
                                    className="input-cantidad"
                                />
                            </td>

                            <td>${c.costeTotal.toFixed(2)}</td>

                            <td>
                                <button
                                    type="button"
                                    className="btn-trash"
                                    onClick={() => eliminarComponente(c._id)}
                                >
                                    🗑
                                </button>
                            </td>
                        </tr>
                    ))}

                    {/* SELECT */}
                    <tr>
                        <td colSpan="4">
                            <select
                                className="select-articulo"
                                value={articuloSeleccionado}
                                onChange={(e) => {
                                    setArticuloSeleccionado(e.target.value);
                                    agregarComponente(e.target.value);
                                }}
                            >
                                <option value="">➕ Agregar componente</option>

                                {articulos.map(a => (
                                    <option
                                        key={a._id}
                                        value={a._id}
                                        disabled={componentes.some(c => c._id === a._id)}
                                    >
                                        {a.nombre} - $
                                        {Number(a.coste || 0).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </td>
                    </tr>
                </tbody>

                <tfoot>
                    <tr>
                        <td colSpan="2"></td>
                        <td><strong>Total</strong></td>
                        <td>
                            <strong>${totalGeneral.toFixed(2)}</strong>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default InventarioCompuesto;
