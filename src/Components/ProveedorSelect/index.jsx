import { useState } from "react";
import "./styles.css";

export default function ProveedorSelect({
    proveedores = [],
    value,
    onSelect,
    onNuevoProveedor
}) {
    const [abierto, setAbierto] = useState(false);

    return (
        <div className="proveedor-select">
            <label>Proveedor</label>

            <div className="input-con-boton">
                <input
                    type="text"
                    readOnly
                    value={value ? value.nombre : ""}
                    placeholder="Seleccionar proveedor"
                    onClick={() => setAbierto(!abierto)}
                />

                <button
                    type="button"
                    className="btn-nuevo"
                    onClick={onNuevoProveedor}
                >
                    + Nuevo
                </button>
            </div>

            {abierto && (
                <ul className="dropdown">
                    {proveedores.length === 0 && (
                        <li className="vacio">No hay proveedores</li>
                    )}

                    {proveedores.map((prov) => (
                        <li
                            key={prov._id}
                            onClick={() => {
                                onSelect(prov);
                                setAbierto(false);
                            }}
                        >
                            {prov.nombre}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
