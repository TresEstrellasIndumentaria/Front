import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    creaArticulo,
    crearCategoria,
    getAllArticulos,
    getArticulosProveedor,
    getCategorias,
    modificaArticulo
} from "../../Redux/Actions";
import PopupCategoria from "../FormCategoria";
import InventarioCompuesto from "../FormArtCompuesto";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import Swal from "sweetalert2";
import "./styles.css";

const CATEGORIA_DEFAULT = "Sin categoria";
const createEmptyTalle = () => ({
    talle: "",
    ancho: "",
    alto: "",
    precio: "",
    coste: "",
    artCompuesto: false,
    composicion: [],
    stock: 0,
    entrantes: 0
});

const getCategoriaId = (categoria, categorias = []) => {
    if (!categoria) return CATEGORIA_DEFAULT;
    if (typeof categoria === "object" && categoria?._id) return categoria._id;
    if (typeof categoria === "string") {
        const categoriaEncontrada = categorias.find((cat) => {
            if (!cat) return false;
            if (typeof cat === "string") return cat === categoria;
            return cat._id === categoria || cat.nombre === categoria;
        });

        if (categoriaEncontrada && typeof categoriaEncontrada === "object") {
            return categoriaEncontrada._id;
        }

        return categoria;
    }
    return CATEGORIA_DEFAULT;
};

const getCategoriaLabel = (categoria) => {
    if (!categoria) return CATEGORIA_DEFAULT;
    if (typeof categoria === "string") return categoria;
    return categoria.nombre || categoria.label || CATEGORIA_DEFAULT;
};

const esCategoriaProveedor = (categoria) => {
    if (!categoria || typeof categoria === "string") return false;
    return Boolean(categoria.esProveedor);
};

function FormArticulo({ operacion = "crear", articuloInicial = null }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const esModificacion = operacion === "modificar";

    const articulos = useSelector(state => state.articulos);
    const articulosProveedor = useSelector(state => state.articulosProveedor || []);
    const categorias = useSelector(state => state.categorias);
    const categoriasArticulo = categorias.filter((cat) => !esCategoriaProveedor(cat));

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [categoriaCreada, setCategoriaCreada] = useState(null);
    const [tallesErrors, setTallesErrors] = useState({});
    const [inventarioAbiertoIndex, setInventarioAbiertoIndex] = useState(null);

    const [form, setForm] = useState({
        nombre: "",
        categoria: CATEGORIA_DEFAULT,
        descripcion: "",
        disponible: true,
        talles: [createEmptyTalle()],
        composicion: []
    });

    useEffect(() => {
        if (!articulos?.length) dispatch(getAllArticulos());
        if (!articulosProveedor?.length) dispatch(getArticulosProveedor());
        if (!categorias?.length) dispatch(getCategorias());
    }, [dispatch, articulos?.length, articulosProveedor?.length, categorias?.length]);

    useEffect(() => {
        if (!esModificacion || !articuloInicial?._id) return;

        setForm({
            nombre: articuloInicial.nombre || "",
            categoria: getCategoriaId(articuloInicial.categoria, categorias),
            descripcion: articuloInicial.descripcion || "",
            disponible: articuloInicial.disponible ?? true,
            talles: Array.isArray(articuloInicial.talles) && articuloInicial.talles.length
                ? articuloInicial.talles.map((talle) => ({
                    talle: talle?.talle || "",
                    ancho: talle?.ancho || "",
                    alto: talle?.alto || "",
                    precio: talle?.precio ?? "",
                    coste: talle?.coste ?? "",
                    artCompuesto: Boolean(talle?.artCompuesto),
                    composicion: Array.isArray(talle?.composicion) ? talle.composicion : [],
                    stock: Number(talle?.stock ?? 0),
                    entrantes: Number(talle?.entrantes ?? 0)
                }))
                : [createEmptyTalle()],
            composicion: []
        });
    }, [esModificacion, articuloInicial, categorias]);

    useEffect(() => {
        if (!esModificacion || !articuloInicial?.talles?.length) return;
        const primerCompuesto = articuloInicial.talles.findIndex((talle) => Boolean(talle?.artCompuesto));
        setInventarioAbiertoIndex(primerCompuesto >= 0 ? primerCompuesto : null);
    }, [esModificacion, articuloInicial]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                        ? value === "" ? "" : Number(value)
                        : value
        }));
    };

    const agregarCategoria = async (categoriaData) => {
        const nuevaCategoria = await dispatch(crearCategoria(categoriaData));
        const categoriaId = nuevaCategoria?._id || categoriaData?.nombre;
        const categoriaLabel = nuevaCategoria?.nombre || categoriaData?.nombre;

        setCategoriaCreada(categoriaLabel);
        setForm(prev => ({ ...prev, categoria: categoriaId }));
        setMostrarPopup(false);
    };

    const actualizarCosteTalle = (index, coste) => {
        const costeNormalizado = Number(coste || 0);

        setForm(prev => {
            if (Number(prev.talles[index]?.coste || 0) === costeNormalizado) return prev;

            return {
                ...prev,
                talles: prev.talles.map((talle, talleIndex) => (
                    talleIndex === index
                        ? { ...talle, coste: costeNormalizado }
                        : talle
                ))
            };
        });
    };

    const handleTalleChange = (index, field, value) => {
        setTallesErrors((prev) => {
            if (!prev[index]?.[field]) return prev;

            return {
                ...prev,
                [index]: {
                    ...prev[index],
                    [field]: false
                }
            };
        });

        setForm((prev) => ({
            ...prev,
            talles: prev.talles.map((talle, talleIndex) => {
                if (talleIndex !== index) return talle;

                const parsedValue = ["precio", "coste", "stock", "entrantes"].includes(field)
                    ? value === ""
                        ? ""
                        : Number(value)
                    : value;

                return {
                    ...talle,
                    [field]: parsedValue
                };
            })
        }));
    };

    const agregarTalle = () => {
        const requiredFields = ["talle", "ancho", "alto", "precio", "coste"];
        const lastIndex = form.talles.length - 1;
        const lastTalle = form.talles[lastIndex];

        const nextRowErrors = requiredFields.reduce((acc, field) => {
            const value = lastTalle?.[field];
            const isEmpty = value === "" || value === null || value === undefined;
            acc[field] = isEmpty;
            return acc;
        }, {});

        const hasErrors = Object.values(nextRowErrors).some(Boolean);

        if (hasErrors) {
            setTallesErrors((prev) => ({
                ...prev,
                [lastIndex]: {
                    ...(prev[lastIndex] || {}),
                    ...nextRowErrors
                }
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            talles: [...prev.talles, createEmptyTalle()]
        }));
        setInventarioAbiertoIndex(null);
    };

    const eliminarTalle = (index) => {
        setTallesErrors((prev) => {
            const next = {};
            Object.entries(prev).forEach(([key, value]) => {
                const numericKey = Number(key);
                if (numericKey === index) return;
                next[numericKey > index ? numericKey - 1 : numericKey] = value;
            });
            return next;
        });

        setForm((prev) => ({
            ...prev,
            talles: prev.talles.length === 1
                ? [createEmptyTalle()]
                : prev.talles.filter((_, talleIndex) => talleIndex !== index)
        }));

        setInventarioAbiertoIndex((prev) => {
            if (prev === null) return null;
            if (prev === index) return null;
            return prev > index ? prev - 1 : prev;
        });
    };

    const toggleTalleCompuesto = (index, checked) => {
        setForm((prev) => ({
            ...prev,
            talles: prev.talles.map((talle, talleIndex) => (
                talleIndex === index
                    ? {
                        ...talle,
                        artCompuesto: checked,
                        composicion: checked ? (Array.isArray(talle.composicion) ? talle.composicion : []) : []
                    }
                    : talle
            ))
        }));
        setInventarioAbiertoIndex(checked ? index : (inventarioAbiertoIndex === index ? null : inventarioAbiertoIndex));
    };

    const updateComposicionTalle = (index, composicion) => {
        setForm((prev) => {
            const composicionActual = prev.talles[index]?.composicion || [];
            if (JSON.stringify(composicionActual) === JSON.stringify(composicion || [])) return prev;

            return {
                ...prev,
                talles: prev.talles.map((talle, talleIndex) => (
                    talleIndex === index
                        ? { ...talle, composicion }
                        : talle
                ))
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            Swal.fire("Falta el nombre", "El articulo debe tener un nombre", "warning");
            return;
        }

        if (form.categoria === CATEGORIA_DEFAULT) {
            Swal.fire("Falta la categoria", "Debes seleccionar una categoria valida", "warning");
            return;
        }

        const tallesNormalizados = form.talles
            .map((talle) => ({
                talle: String(talle.talle || "").trim(),
                ancho: String(talle.ancho || "").trim(),
                alto: String(talle.alto || "").trim(),
                precio: talle.precio === "" ? "" : Number(talle.precio),
                coste: talle.coste === "" ? "" : Number(talle.coste),
                artCompuesto: Boolean(talle.artCompuesto),
                composicion: Array.isArray(talle.composicion) ? talle.composicion : [],
                stock: talle.stock === "" ? 0 : Number(talle.stock),
                entrantes: talle.entrantes === "" ? 0 : Number(talle.entrantes)
            }))
            .filter((talle) => (
                talle.talle ||
                talle.ancho ||
                talle.alto ||
                talle.precio !== "" ||
                talle.coste !== "" ||
                talle.stock !== 0 ||
                talle.entrantes !== 0
            ));

        if (!tallesNormalizados.length) {
            Swal.fire("Faltan talles", "Debes cargar al menos un talle con sus datos", "warning");
            return;
        }

        const talleInvalido = tallesNormalizados.find((talle) => (
            !talle.talle ||
            !talle.ancho ||
            !talle.alto ||
            talle.precio === "" ||
            Number(talle.precio) < 0 ||
            talle.coste === "" ||
            Number(talle.coste) < 0 ||
            (talle.artCompuesto && !talle.composicion?.length) ||
            Number(talle.stock) < 0 ||
            Number(talle.entrantes) < 0
        ));

        if (talleInvalido) {
            Swal.fire(
                "Datos de talle invalidos",
                "Cada talle debe tener talle, ancho, alto, precio, coste y cantidades validas. Si es compuesto, debe incluir componentes.",
                "warning"
            );
            return;
        }

        const data = {
            nombre: form.nombre,
            categoria: form.categoria === CATEGORIA_DEFAULT ? undefined : form.categoria,
            descripcion: form.descripcion,
            talles: tallesNormalizados,
        };

        const resp = esModificacion
            ? await dispatch(modificaArticulo(articuloInicial?._id, data))
            : await dispatch(creaArticulo(data));

        const resultMessage = String(resp?.message || resp?.msg || "");
        const isErrorResult =
            resp?.error === true ||
            resultMessage.toLowerCase().includes("error") ||
            resultMessage.toLowerCase().includes("no se encontro endpoint");

        if (isErrorResult) {
            Swal.fire("Error", resultMessage || "No se pudo guardar el articulo", "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: esModificacion ? "Articulo actualizado" : "Articulo creado",
            timer: 1500,
            showConfirmButton: false
        });

        dispatch(getAllArticulos());

        if (esModificacion) {
            navigate("/listaArticulos");
            return;
        }

        setForm({
            nombre: "",
            categoria: CATEGORIA_DEFAULT,
            descripcion: "",
            disponible: true,
            talles: [createEmptyTalle()],
            composicion: []
        });

        setTallesErrors({});
        setCategoriaCreada(null);
        setInventarioAbiertoIndex(null);
    };

    return (
        <div className="cont-creaArt">

            {mostrarPopup && (
                <PopupCategoria
                    categorias={categoriasArticulo}
                    onClose={() => setMostrarPopup(false)}
                    onCreate={agregarCategoria}
                />
            )}

            <form className="form-articulo" onSubmit={handleSubmit}>

                <div className="campo">
                    <label>Nombre</label>
                    <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="campo">
                    <label>Categoria</label>

                    {categoriaCreada ? (
                        <input
                            type="text"
                            value={categoriaCreada}
                            readOnly
                            className="input-readonly"
                        />
                    ) : (
                        <select
                            value={form.categoria}
                            onChange={(e) => {
                                if (e.target.value === "__add__") {
                                    setMostrarPopup(true);
                                    return;
                                }
                                setForm(prev => ({
                                    ...prev,
                                    categoria: e.target.value
                                }));
                            }}
                        >
                            <option value={CATEGORIA_DEFAULT}>
                                {CATEGORIA_DEFAULT}
                            </option>

                            {categoriasArticulo.map(cat => (
                                <option
                                    key={typeof cat === "string" ? cat : cat._id}
                                    value={typeof cat === "string" ? cat : cat._id}
                                >
                                    {getCategoriaLabel(cat)}
                                </option>
                            ))}

                            <option value="__add__">
                                + Agregar categoria
                            </option>
                        </select>
                    )}
                </div>

                <div className="campo">
                    <label>Descripcion</label>
                    <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                {/* <div className="checkbox-linea">
                    <input
                        type="checkbox"
                        name="disponible"
                        checked={form.disponible}
                        onChange={handleChange}
                    />
                    <span>Disponible para la venta</span>
                </div> */}

                <div className="campo">
                    <div className="talles-header">
                        <div>
                            <label>Talles del articulo</label>
                            <p>Carga talle, medidas, precio, coste, stock y entrantes en filas separadas.</p>
                        </div>
                        <button
                            type="button"
                            className="btn-agregar-talle"
                            onClick={agregarTalle}
                        >
                            + Agregar talle
                        </button>
                    </div>

                    <div className="talles-tabla-wrap">
                        <table className="talles-tabla">
                            <thead>
                                <tr>
                                    <th>Talle</th>
                                    <th>Ancho</th>
                                    <th>Alto</th>
                                    <th>Precio</th>
                                    <th>Coste</th>
                                    <th>Compuesto</th>
                                    <th>Stock</th>
                                    <th>Entrantes</th>
                                    <th>Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.talles.map((talle, index) => (
                                    <tr key={`talle-${index}`}>
                                        <td>
                                            <input
                                                type="text"
                                                className={tallesErrors[index]?.talle ? "input-error" : ""}
                                                value={talle.talle}
                                                onChange={(e) => handleTalleChange(index, "talle", e.target.value)}
                                                placeholder="Ej. M"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={tallesErrors[index]?.ancho ? "input-error" : ""}
                                                value={talle.ancho}
                                                onChange={(e) => handleTalleChange(index, "ancho", e.target.value)}
                                                placeholder="Ej. 50 cm"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={tallesErrors[index]?.alto ? "input-error" : ""}
                                                value={talle.alto}
                                                onChange={(e) => handleTalleChange(index, "alto", e.target.value)}
                                                placeholder="Ej. 72 cm"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                className={tallesErrors[index]?.precio ? "input-error" : ""}
                                                value={talle.precio}
                                                onChange={(e) => handleTalleChange(index, "precio", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                className={tallesErrors[index]?.coste ? "input-error" : ""}
                                                value={talle.coste}
                                                onChange={(e) => handleTalleChange(index, "coste", e.target.value)}
                                                readOnly={talle.artCompuesto}
                                            />
                                        </td>
                                        <td className="td-compuesto">
                                            <div className="talle-compuesto-actions">
                                                {/* <label className="talle-compuesto-toggle">                                                    
                                                    <span>Si</span>
                                                </label> */}
                                                <input
                                                        type="checkbox"
                                                        checked={Boolean(talle.artCompuesto)}
                                                        onChange={(e) => toggleTalleCompuesto(index, e.target.checked)}
                                                    />
                                                {talle.artCompuesto && (
                                                    <button
                                                        type="button"
                                                        className="btn-abrir-inventario"
                                                        onClick={() => setInventarioAbiertoIndex(index)}
                                                        aria-label={`Abrir composicion del talle ${talle.talle || index + 1}`}
                                                        title="Abrir composicion"
                                                    >
                                                        <Inventory2OutlinedIcon fontSize="small" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                value={talle.stock}
                                                onChange={(e) => handleTalleChange(index, "stock", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                value={talle.entrantes}
                                                onChange={(e) => handleTalleChange(index, "entrantes", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-eliminar-talle"
                                                onClick={() => eliminarTalle(index)}
                                                aria-label={`Eliminar talle ${index + 1}`}
                                                title="Eliminar talle"
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {form.talles.some((talle) => talle.artCompuesto) && inventarioAbiertoIndex !== null && (
                    <div className="talles-compuestos-grid">
                        {form.talles.map((talle, index) => (
                            talle.artCompuesto && inventarioAbiertoIndex === index ? (
                                <div key={`compuesto-${index}`} className="talle-compuesto-card">
                                    <div className="talle-compuesto-card-header">
                                        <h3>Composicion del talle {talle.talle || `#${index + 1}`}</h3>
                                        <div className="talle-compuesto-card-header-actions">
                                            <span>{talle.ancho || "-"} x {talle.alto || "-"}</span>
                                            <button
                                                type="button"
                                                className="btn-cerrar-inventario"
                                                onClick={() => setInventarioAbiertoIndex(null)}
                                            >
                                                Cerrar inventario
                                            </button>
                                        </div>
                                    </div>

                                    <InventarioCompuesto
                                        articulos={articulosProveedor}
                                        componentesIniciales={talle.composicion || []}
                                        onCosteChange={(coste) => actualizarCosteTalle(index, coste)}
                                        onComposicionChange={(composicion) => updateComposicionTalle(index, composicion)}
                                    />
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                <div className="botones-final">
                    <button
                        type="button"
                        className="btn-cancelar"
                        onClick={() => navigate("/listaArticulos")}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn-guardar">
                        {esModificacion ? "Actualizar articulo" : "Guardar articulo"}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default FormArticulo;
