import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
    creaArticulo,
    crearCategoria,
    getAllArticulos,
    getCategorias,
    getSiguienteCodigoArticulo,
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
    precio: "",
    coste: "",
    artCompuesto: false,
    composicion: []
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

const getTotalStockArticulo = (articulo) => {
    if (Array.isArray(articulo?.talles) && articulo.talles.length) {
        return articulo.talles.reduce((total, talle) => total + Number(talle?.stock || 0), 0);
    }

    return Number(articulo?.stock || 0);
};

const normalizarTexto = (value) => String(value || "").trim().toLowerCase();

const formatearCodigoArticulo = (value) => String(Number(value || 0)).padStart(4, "0");

const calcularSiguienteCodigoArticulo = (articulos = []) => {
    const ultimoNumero = articulos.reduce((max, articulo) => {
        const numero = Number(String(articulo?.codigoArticulo || articulo?.codigo || articulo?.codArticulo || "").replace(/\D/g, ""));
        return Number.isFinite(numero) && numero > max ? numero : max;
    }, 0);

    return formatearCodigoArticulo(ultimoNumero + 1);
};

const buildFormFromArticulo = (articulo, categorias = []) => ({
    codigoArticulo: articulo.codigoArticulo || articulo.codigo || articulo.codArticulo || "",
    nombre: articulo.nombre || "",
    categoria: getCategoriaId(articulo.categoria, categorias),
    descripcion: articulo.descripcion || "",
    itemProveedor: Boolean(articulo.itemProveedor),
    disponible: articulo.disponible ?? true,
    talles: Array.isArray(articulo.talles) && articulo.talles.length
        ? articulo.talles.map((talle) => ({
            talle: talle?.talle || "",
            precio: talle?.precio ?? "",
            coste: talle?.ultimoCostoCompra ?? talle?.costo ?? talle?.coste ?? articulo?.ultimoCostoCompra ?? "",
            artCompuesto: Boolean(talle?.artCompuesto),
            composicion: Array.isArray(talle?.composicion) ? talle.composicion : [],
            stock: Number(talle?.stock ?? 0)
        }))
        : [createEmptyTalle()],
    composicion: []
});

const formsSonIguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const calcularCostoComposicion = (composicion = []) => (
    composicion.reduce((total, item) => {
        const cantidad = Number(item?.cantidad || 0);
        const costoUnitario = Number(item?.costo ?? item?.coste ?? 0);
        return total + (cantidad * costoUnitario);
    }, 0)
);

const getComponenteArticuloId = (componente) => {
    const articulo = componente?.articulo;
    if (typeof articulo === "object" && articulo !== null) {
        return articulo._id || articulo.id || "";
    }

    return articulo || componente?._id || componente?.id || "";
};

const normalizarComposicionParaGuardar = (composicion = []) => (
    (Array.isArray(composicion) ? composicion : [])
        .map((componente) => ({
            articulo: getComponenteArticuloId(componente),
            talle: componente?.talle || "",
            cantidad: Number(componente?.cantidad ?? 1),
            costo: Number(componente?.costo ?? componente?.costeUnitario ?? componente?.coste ?? 0)
        }))
        .filter((componente) => componente.articulo)
);

function FormArticulo({ operacion = "crear", articuloInicial = null }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const esModificacion = operacion === "modificar";
    const articuloDuplicado = !esModificacion ? location.state?.duplicarArticulo : null;

    const articulos = useSelector(state => state.articulos);
    const categorias = useSelector(state => state.categorias);
    const categoriasArticulo = categorias;
    const componentesProveedor = useMemo(
        () => (articulos || []).filter((articulo) => articulo?.itemProveedor === true),
        [articulos]
    );

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [categoriaCreada, setCategoriaCreada] = useState(null);
    const [tallesErrors, setTallesErrors] = useState({});
    const [inventarioAbiertoIndex, setInventarioAbiertoIndex] = useState(null);
    const articuloHidratadoRef = useRef(null);
    const inventarioAutoAbiertoRef = useRef(null);
    const duplicadoHidratadoRef = useRef(null);

    const [form, setForm] = useState({
        codigoArticulo: "",
        nombre: "",
        categoria: CATEGORIA_DEFAULT,
        descripcion: "",
        itemProveedor: false,
        disponible: true,
        talles: [createEmptyTalle()],
        composicion: []
    });

    useEffect(() => {
        if (!articulos?.length) dispatch(getAllArticulos());
        if (!categorias?.length) dispatch(getCategorias());
    }, [dispatch, articulos?.length, categorias?.length]);

    useEffect(() => {
        if (esModificacion || form.codigoArticulo) return;

        let active = true;
        dispatch(getSiguienteCodigoArticulo()).then((codigo) => {
            if (!active) return;
            const siguienteCodigo = codigo || calcularSiguienteCodigoArticulo(articulos);
            if (!siguienteCodigo) return;
            setForm((prev) => prev.codigoArticulo ? prev : { ...prev, codigoArticulo: siguienteCodigo });
        });

        return () => {
            active = false;
        };
    }, [dispatch, esModificacion, form.codigoArticulo, articulos]);

    useEffect(() => {
        if (!esModificacion || !articuloInicial?._id) return;

        const nextForm = buildFormFromArticulo(articuloInicial, categorias);
        const hydrationKey = `${articuloInicial._id}-${articuloInicial.updatedAt || ''}-${nextForm.categoria}`;

        setForm((prev) => {
            if (articuloHidratadoRef.current === hydrationKey || formsSonIguales(prev, nextForm)) {
                articuloHidratadoRef.current = hydrationKey;
                return prev;
            }

            articuloHidratadoRef.current = hydrationKey;
            return nextForm;
        });
    }, [esModificacion, articuloInicial, categorias]);

    useEffect(() => {
        if (!articuloDuplicado?._id) return;
        if (duplicadoHidratadoRef.current === articuloDuplicado._id) return;

        const nextForm = {
            ...buildFormFromArticulo(articuloDuplicado, categorias),
            codigoArticulo: calcularSiguienteCodigoArticulo(articulos)
        };

        duplicadoHidratadoRef.current = articuloDuplicado._id;
        setForm(nextForm);
    }, [articuloDuplicado, categorias, articulos]);

    useEffect(() => {
        if (!esModificacion || !articuloInicial?.talles?.length) return;
        if (inventarioAutoAbiertoRef.current === articuloInicial._id) return;

        const primerCompuesto = articuloInicial.talles.findIndex((talle) => Boolean(talle?.artCompuesto));
        setInventarioAbiertoIndex(primerCompuesto >= 0 ? primerCompuesto : null);
        inventarioAutoAbiertoRef.current = articuloInicial._id;
    }, [esModificacion, articuloInicial]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => {
            const nextValue = type === "checkbox"
                ? checked
                : type === "number"
                    ? value === "" ? "" : Number(value)
                    : value;

            if (name === "itemProveedor") {
                setTallesErrors({});
                setInventarioAbiertoIndex(null);

                return {
                    ...prev,
                    itemProveedor: checked,
                    talles: [
                        {
                            ...createEmptyTalle(),
                            precio: checked ? (prev.talles[0]?.precio ?? "") : "",
                            coste: checked ? (prev.talles[0]?.coste ?? "") : ""
                        }
                    ]
                };
            }

            return {
                ...prev,
                [name]: nextValue
            };
        });
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

                const parsedValue = ["precio", "coste"].includes(field)
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
        const requiredFields = ["talle", "precio", "coste"];
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

    const duplicarTalle = () => {
        const lastIndex = form.talles.length - 1;
        const talleBase = form.talles[lastIndex];

        if (!talleBase) {
            setForm((prev) => ({
                ...prev,
                talles: [createEmptyTalle()]
            }));
            return;
        }

        const requiredFields = ["talle", "precio", "coste"];
        const baseErrors = requiredFields.reduce((acc, field) => {
            const value = talleBase?.[field];
            const isEmpty = value === "" || value === null || value === undefined;
            acc[field] = isEmpty;
            return acc;
        }, {});

        if (Object.values(baseErrors).some(Boolean)) {
            setTallesErrors((prev) => ({
                ...prev,
                [lastIndex]: {
                    ...(prev[lastIndex] || {}),
                    ...baseErrors
                }
            }));
            return;
        }

        const talleDuplicado = {
            ...talleBase,
            talle: "",
            composicion: Array.isArray(talleBase.composicion)
                ? JSON.parse(JSON.stringify(talleBase.composicion))
                : []
        };

        setForm((prev) => ({
            ...prev,
            talles: [...prev.talles, talleDuplicado]
        }));
        setInventarioAbiertoIndex(talleDuplicado.artCompuesto ? lastIndex + 1 : null);
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
        const esItemProveedor = Boolean(form.itemProveedor);

        if (!form.nombre.trim()) {
            Swal.fire("Falta el nombre", "El articulo debe tener un nombre", "warning");
            return;
        }

        if (!form.codigoArticulo.trim()) {
            Swal.fire("Falta el codigo", "El codigoArticulo es obligatorio para crear o modificar articulos.", "warning");
            return;
        }

        if (form.categoria === CATEGORIA_DEFAULT) {
            Swal.fire("Falta la categoria", "Debes seleccionar una categoria valida", "warning");
            return;
        }

        const itemProveedorExistenteConStock = (articulos || []).find((articulo) => {
            if (esModificacion && articulo?._id === articuloInicial?._id) return false;
            if (!articulo?.itemProveedor) return false;

            const mismoCodigo = normalizarTexto(articulo.codigoArticulo || articulo.codigo || articulo.codArticulo) === normalizarTexto(form.codigoArticulo);
            const mismoNombre = normalizarTexto(articulo.nombre) === normalizarTexto(form.nombre);

            return (mismoCodigo || mismoNombre) && getTotalStockArticulo(articulo) > 0;
        });

        if (esItemProveedor && itemProveedorExistenteConStock) {
            Swal.fire(
                "Articulo existente",
                "Ya existe un articulo de proveedor con ese codigo o nombre y stock cargado. Edita el articulo existente para ajustar el stock.",
                "warning"
            );
            return;
        }

        const tallesNormalizados = esItemProveedor
            ? [{
                talle: "",
                precio: form.talles[0]?.precio === "" ? 0 : Number(form.talles[0]?.precio || 0),
                costo: form.talles[0]?.coste === "" ? "" : Number(form.talles[0]?.coste),
                artCompuesto: false,
                composicion: []
            }]
            : form.talles
            .map((talle) => {
                const composicion = normalizarComposicionParaGuardar(talle.composicion);
                const artCompuesto = Boolean(talle.artCompuesto);
                const costoCalculado = artCompuesto ? calcularCostoComposicion(composicion) : 0;

                return {
                    talle: String(talle.talle || "").trim(),
                    precio: talle.precio === "" ? "" : Number(talle.precio),
                    costo: talle.coste === "" ? (artCompuesto ? Number(costoCalculado.toFixed(3)) : "") : Number(talle.coste),
                    artCompuesto,
                    composicion
                };
            })
            .filter((talle) => (
                talle.talle ||
                talle.precio !== "" ||
                talle.costo !== "" ||
                talle.artCompuesto ||
                talle.composicion.length
            ));

        const talleInvalido = tallesNormalizados.find((talle) => {
            if (esItemProveedor) {
                return (
                    (talle.precio !== "" && Number(talle.precio) < 0) ||
                    talle.costo === "" ||
                    Number(talle.costo) < 0
                );
            }

            return (
                talle.precio === "" ||
                Number(talle.precio) < 0 ||
                talle.costo === "" ||
                Number(talle.costo) < 0 ||
                (talle.artCompuesto && !talle.composicion?.length)
            );
        });

        if (talleInvalido) {
            Swal.fire(
                esItemProveedor ? "Datos invalidos" : "Datos de talle invalidos",
                esItemProveedor
                    ? "El costo es obligatorio. Precio puede quedar vacio, pero no puede ser negativo."
                    : "Cada fila cargada debe tener precio y coste validos. Si es compuesto, tambien debe tener composicion.",
                "warning"
            );
            return;
        }

        const data = {
            codigoArticulo: form.codigoArticulo.trim(),
            nombre: form.nombre,
            categoria: form.categoria === CATEGORIA_DEFAULT ? undefined : form.categoria,
            descripcion: form.descripcion,
            itemProveedor: Boolean(form.itemProveedor),
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

        const siguienteCodigo = await dispatch(getSiguienteCodigoArticulo());

        setForm({
            codigoArticulo: siguienteCodigo || "",
            nombre: "",
            categoria: CATEGORIA_DEFAULT,
            descripcion: "",
            itemProveedor: false,
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
                    <label>Cod Art</label>
                    <input
                        type="text"
                        name="codigoArticulo"
                        value={form.codigoArticulo}
                        onChange={handleChange}
                        placeholder="Ej. 0001"
                        required
                    />
                </div>

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
                        className="descripcion-articulo"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                <label className="checkbox-linea articulo-proveedor-check">
                    <input
                        type="checkbox"
                        name="itemProveedor"
                        checked={Boolean(form.itemProveedor)}
                        onChange={handleChange}
                    />
                    <span>Articulo de Proveedor</span>
                </label>

                {/* <div className="checkbox-linea">
                    <input
                        type="checkbox"
                        name="disponible"
                        checked={form.disponible}
                        onChange={handleChange}
                    />
                    <span>Disponible para la venta</span>
                </div> */}

                {form.itemProveedor ? (
                    <div className="campo proveedor-fields">
                        <div className="talles-header proveedor-fields-header">
                            <div>
                                <label>Datos del articulo proveedor</label>
                                <p>Carga costo obligatorio. Precio es opcional.</p>
                            </div>
                        </div>

                        <div className="proveedor-fields-grid">
                            <div className="campo">
                                <label>Precio</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.talles[0]?.precio ?? ""}
                                    onChange={(e) => handleTalleChange(0, "precio", e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="campo">
                                <label>Costo</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    className={tallesErrors[0]?.coste ? "input-error" : ""}
                                    value={form.talles[0]?.coste ?? ""}
                                    onChange={(e) => handleTalleChange(0, "coste", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                <div className="campo">
                    <div className="talles-header">
                        <div>
                            <label>Talles del articulo</label>
                            <p>Carga talle, precio, coste y compuesto en filas separadas.</p>
                        </div>
                        <div className="talles-header-actions">
                            <button
                                type="button"
                                className="btn-agregar-talle"
                                onClick={agregarTalle}
                            >
                                + Agregar talle
                            </button>
                            <button
                                type="button"
                                className="btn-agregar-talle btn-duplicar-talle"
                                onClick={duplicarTalle}
                            >
                                Duplicar talle
                            </button>
                        </div>
                    </div>

                    <div className="talles-tabla-wrap">
                        <table className="talles-tabla">
                            <thead>
                                <tr>
                                    <th>Talle</th>
                                    <th>Precio</th>
                                    <th>Costo</th>
                                    <th>Compuesto</th>
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
                                                step="0.001"
                                                className={tallesErrors[index]?.coste ? "input-error" : ""}
                                                value={talle.coste}
                                                onChange={(e) => handleTalleChange(index, "coste", e.target.value)}
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
                )}

                {!form.itemProveedor && form.talles.some((talle) => talle.artCompuesto) && inventarioAbiertoIndex !== null && (
                    <div className="talles-compuestos-grid">
                        {form.talles.map((talle, index) => (
                            talle.artCompuesto && inventarioAbiertoIndex === index ? (
                                <div key={`compuesto-${index}`} className="talle-compuesto-card">
                                    <div className="talle-compuesto-card-header">
                                        <h3>Composicion del talle {talle.talle || `#${index + 1}`}</h3>
                                        <div className="talle-compuesto-card-header-actions">
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
                                        articulos={componentesProveedor}
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
