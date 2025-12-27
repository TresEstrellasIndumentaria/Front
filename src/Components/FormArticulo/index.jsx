import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { creaArticulo, crearCategoria, getAllArticulos } from "../../Redux/Actions";
import PopupCategoria from "../FormCategoria";
import InventarioCompuesto from "../FormArtCompuesto";
import Switch from "@mui/material/Switch";
import Swal from "sweetalert2";
import "./styles.css";

const CATEGORIA_DEFAULT = "Sin categoría";

function FormArticulo() {
    const dispatch = useDispatch();

    const articulos = useSelector(state => state.articulos);
    const categorias = useSelector(state => state.categorias);

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [esCompuesto, setEsCompuesto] = useState(false);
    const [categoriaCreada, setCategoriaCreada] = useState(null);

    const [form, setForm] = useState({
        nombre: "",
        categoria: CATEGORIA_DEFAULT,
        descripcion: "",
        disponible: true,
        vendidoPor: "unidad",
        precio: "",
        coste: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox"
                ? checked
                : type === "number"
                    ? Number(value)
                    : value
        }));
    };

    const handleChangeProdCompuesto = (e) => {
        const checked = e.target.checked;
        setEsCompuesto(checked);

        if (checked) {
            setForm(prev => ({ ...prev, coste: "" }));
        }
    };

    const agregarCategoria = async (nombre) => {
        await dispatch(crearCategoria(nombre));

        setCategoriaCreada(nombre);
        setForm(prev => ({ ...prev, categoria: nombre }));
        setMostrarPopup(false);
    };

    const actualizarCoste = (coste) => {
        setForm(prev => ({ ...prev, coste }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            Swal.fire("Falta el nombre", "El artículo debe tener un nombre", "warning");
            return;
        }

        if (!form.precio || Number(form.precio) <= 0) {
            Swal.fire("Precio inválido", "El precio debe ser mayor a 0", "warning");
            return;
        }

        if (!form.coste || Number(form.coste) <= 0) {
            Swal.fire(
                "Coste inválido",
                esCompuesto
                    ? "El artículo compuesto debe tener componentes"
                    : "El coste debe ser mayor a 0",
                "warning"
            );
            return;
        }

        const data = {
            ...form,
            precio: Number(form.precio),
            coste: Number(form.coste),
            esCompuesto,
        };

        const resp = await dispatch(creaArticulo(data));

        if (resp?.message && resp.message !== "success") {
            Swal.fire("Error", resp.message, "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Artículo creado",
            timer: 1500,
            showConfirmButton: false,
        });

        setForm({
            nombre: "",
            categoria: CATEGORIA_DEFAULT,
            descripcion: "",
            disponible: true,
            vendidoPor: "unidad",
            precio: "",
            coste: "",
        });

        setCategoriaCreada(null);
        setEsCompuesto(false);
        dispatch(getAllArticulos());
    };

    return (
        <div className="cont-creaArt">

            {mostrarPopup && (
                <PopupCategoria
                    categorias={categorias}
                    onClose={() => setMostrarPopup(false)}
                    onCreate={agregarCategoria}
                />
            )}

            <form className="form-articulo" onSubmit={handleSubmit}>

                {/* Nombre */}
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

                {/* Categoría */}
                <div className="campo">
                    <label>Categoría</label>

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
                            <option value="Sin categoría">Sin categoría</option>

                            {categorias.map(cat => (
                                <option key={cat._id} value={cat.nombre}>
                                    {cat.nombre}
                                </option>
                            ))}

                            <option value="__add__">➕ Agregar categoría</option>
                        </select>
                    )}
                </div>

                {/* Descripción */}
                <div className="campo">
                    <label>Descripción</label>
                    <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                {/* Disponible */}
                <div className="checkbox-linea">
                    <input
                        type="checkbox"
                        name="disponible"
                        checked={form.disponible}
                        onChange={handleChange}
                    />
                    <span>Disponible para la venta</span>
                </div>

                {/* Precio / Coste */}
                <div className="fila">
                    <div className="campo">
                        <label>Precio</label>
                        <input
                            type="number"
                            name="precio"
                            value={form.precio}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="campo">
                        <label>Coste</label>
                        <input
                            type="number"
                            name="coste"
                            value={form.coste}
                            onChange={handleChange}
                            readOnly={esCompuesto}
                        />
                    </div>
                </div>

                {/* Compuesto */}
                <div className="campo">
                    <label>Artículo compuesto</label>
                    <Switch
                        checked={esCompuesto}
                        onChange={handleChangeProdCompuesto}
                    />
                </div>

                {esCompuesto && (
                    <InventarioCompuesto
                        articulos={articulos}
                        onCosteChange={actualizarCoste}
                    />
                )}

                <button type="submit" className="btn-guardar">
                    Guardar artículo
                </button>

            </form>
        </div>
    );
}

export default FormArticulo;
