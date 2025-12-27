import { useState } from "react";
import ProveedorSelect from "../ProveedorSelect";
import PopupProveedor from "../PopupProveedor";
import "./styles.css";

export default function OrdenCompra() {
    const [proveedores, setProveedores] = useState([]);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
    const [mostrarPopup, setMostrarPopup] = useState(false);

    const agregarProveedor = (nuevo) => {
        setProveedores((prev) => [...prev, nuevo]);
        setProveedorSeleccionado(nuevo);
        setMostrarPopup(false);
    };

    return (
        <div className="card">
            <h3 className="titulo">Proveedor</h3>

            <ProveedorSelect
                proveedores={proveedores}
                value={proveedorSeleccionado}
                onSelect={setProveedorSeleccionado}
                onNuevoProveedor={() => setMostrarPopup(true)}
            />

            <div className="fila">
                <div className="campo">
                    <label>Fecha de la orden de compra</label>
                    <input type="date" />
                </div>

                <div className="campo">
                    <label>Esperado para</label>
                    <input type="date" />
                </div>
            </div>

            <div className="campo">
                <label>Anotaciones</label>
                <textarea maxLength={500} />
                <span className="contador">0 / 500</span>
            </div>

            {mostrarPopup && (
                <PopupProveedor
                    onClose={() => setMostrarPopup(false)}
                    onCreate={agregarProveedor}
                />
            )}
        </div>
    );
}
