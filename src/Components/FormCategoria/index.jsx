import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

function PopupCategoria({
    categorias = [],
    articulos = [],
    onClose,
    onCreate,
    onRemoveArticulo,
    modo = "crear",
    categoriaInicial = null
}) {
    const [nombre, setNombre] = useState("");
    const [esProveedor, setEsProveedor] = useState(false);
    const [error, setError] = useState("");
    const [articuloQuitando, setArticuloQuitando] = useState("");

    const esEdicion = modo === "modificar";

    useEffect(() => {
        setNombre(categoriaInicial?.nombre || "");
        setEsProveedor(Boolean(categoriaInicial?.esProveedor));
        setError("");
        setArticuloQuitando("");
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

    const articulosCategoria = useMemo(() => {
        const categoriaId = categoriaInicial?._id;
        if (!esEdicion || !categoriaId) return [];

        return articulos
            .filter((articulo) => {
                const categoriaArticulo = articulo?.categoria;
                const categoriaArticuloId = typeof categoriaArticulo === "object"
                    ? categoriaArticulo?._id
                    : categoriaArticulo;

                return categoriaArticuloId === categoriaId;
            })
            .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));
    }, [articulos, categoriaInicial?._id, esEdicion]);

    const handleRemoveArticulo = async (articulo) => {
        if (!onRemoveArticulo || articuloQuitando) return;

        setArticuloQuitando(articulo._id);
        await onRemoveArticulo(articulo);
        setArticuloQuitando("");
    };

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

                    {esEdicion && (
                        <div className="popup-articulos">
                            <div className="popup-articulos__header">
                                <span>Articulos de la categoria</span>
                                <strong>{articulosCategoria.length}</strong>
                            </div>

                            {articulosCategoria.length ? (
                                <ul className="popup-articulos__lista">
                                    {articulosCategoria.map((articulo) => (
                                        <li key={articulo._id}>
                                            <span>{articulo.nombre}</span>
                                            <button
                                                type="button"
                                                className="popup-articulos__quitar"
                                                onClick={() => handleRemoveArticulo(articulo)}
                                                disabled={Boolean(articuloQuitando)}
                                            >
                                                {articuloQuitando === articulo._id ? "Quitando..." : "Quitar"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="popup-articulos__vacio">
                                    No hay articulos vinculados a esta categoria.
                                </p>
                            )}
                        </div>
                    )}

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
