import React, { useState } from "react";
import "./PopupCategoria.css";

function PopupCategoria({ onClose, onCreate }) {

    const [nombre, setNombre] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (nombre.trim() === "") return;

        onCreate(nombre);
        onClose(); // cerrar después de crear
    };

    return (
        <div className="popup-overlay">
            <div className="popup-contenido">
                <h3>Nueva categoría</h3>

                <form onSubmit={handleSubmit}>
                    <label>Nombre de la categoría</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Remeras, Accesorios..."
                        required
                    />

                    <div className="popup-botones">
                        <button type="button" onClick={onClose} className="btn-cancelar">
                            Cancelar
                        </button>

                        <button type="submit" className="btn-crear">
                            Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PopupCategoria;
