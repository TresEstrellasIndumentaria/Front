import { useState } from "react";

export default function PopupProveedor({ onClose, onCreate }) {
    const [nombre, setNombre] = useState("");

    const handleCrear = () => {
        if (!nombre.trim()) return;

        onCreate({
            id: Date.now(),
            nombre,
        });
    };

    return (
        <div className="overlay">
            <div className="popup">
                <h3>Nuevo proveedor</h3>

                <input
                    placeholder="Nombre del proveedor"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />

                <div className="acciones">
                    <button onClick={onClose}>Cancelar</button>
                    <button className="btn-verde" onClick={handleCrear}>
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
}
