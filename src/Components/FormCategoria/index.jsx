import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

function PopupCategoria({ categorias = [], onClose, onCreate, modo = "crear", categoriaInicial = null }) {
    const [nombre, setNombre] = useState("");
    const [esProveedor, setEsProveedor] = useState(false);
    const [error, setError] = useState("");

    const esEdicion = modo === "modificar";

    useEffect(() => {
        setNombre(categoriaInicial?.nombre || "");
        setEsProveedor(Boolean(categoriaInicial?.esProveedor));
        setError("");
    }, [categoriaInicial, modo]);

    const normalizar = (str) => String(str || "").trim().toLowerCase();

    const textoTitulo = useMemo(
        () => (esEdicion ? "Modificar categoria" : "Nueva categoria"),
        [esEdicion]
    );

    const textoBoton = useMemo(
        () => (esEdicion ? "Guardar cambios" : "Crear categoria"),
        [esEdicion]
    );

    const handleSubmitCat = (e) => {
        e.preventDefault();

        const nombreNormalizado = normalizar(nombre);

        if (!nombreNormalizado) {
            setError("El nombre no puede estar vacio");
            return;
        }

        const idActual = categoriaInicial?._id;
        const existe = categorias.some(
            (cat) => normalizar(cat.nombre) === nombreNormalizado && cat._id !== idActual
        );

        if (existe) {
            setError("Ya existe una categoria con ese nombre");
            return;
        }

        onCreate({
            nombre: nombre.trim(),
            esProveedor
        });
    };

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-contenido" onClick={(e) => e.stopPropagation()}>
                <h3>{textoTitulo}</h3>

                <form onSubmit={handleSubmitCat}>
                    <label className="popup-label">Nombre de la categoria</label>

                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            setError("");
                        }}
                        placeholder="Ej: Remeras, Accesorios"
                        autoFocus
                        className={error ? "popup-input popup-input--error" : "popup-input"}
                    />

                    {error && <p className="error-text">{error}</p>}

                    <label className="popup-check-row">
                        <input
                            type="checkbox"
                            checked={esProveedor}
                            onChange={(e) => setEsProveedor(e.target.checked)}
                        />
                        <span>Es de proveedor</span>
                    </label>

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
                        >
                            {textoBoton}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PopupCategoria;
