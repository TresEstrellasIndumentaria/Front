import React, { useState } from "react";
import "./styles.css";

function PopupCategoria({ categorias = [], onClose, onCreate }) {
    const [nombre, setNombre] = useState("");
    const [error, setError] = useState("");

    const normalizar = (str) => str.trim().toLowerCase();

    const handleSubmitCat = (e) => {
        e.preventDefault();

        const nombreNormalizado = normalizar(nombre);

        if (!nombreNormalizado) {
            setError("El nombre no puede estar vacío");
            return;
        }

        const existe = categorias.some(
            cat => normalizar(cat.nombre) === nombreNormalizado
        );

        if (existe) {
            setError("Ya existe una categoría con ese nombre");
            return;
        }

        onCreate(nombre.trim());
    };

    return (
        <div className="popup-overlay">
            <div className="popup-contenido">
                <h3>Nueva categoría</h3>

                <form onSubmit={handleSubmitCat}>
                    <label>Nombre de la categoría</label>

                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            setError("");
                        }}
                        placeholder="Ej: Remeras, Accesorios..."
                        autoFocus
                    />

                    {error && <p className="error-text">{error}</p>}

                    <div className="popup-botones">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancelar"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="btn-crear"
                            disabled={!!error}
                        >
                            Crear
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}

export default PopupCategoria;
