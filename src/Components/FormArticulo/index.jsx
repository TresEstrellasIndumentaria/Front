import React, { useState } from "react";
import PopupCategoria from "./PopupCategoria";
import "./FormularioArticulo.css";

function FormularioArticulo({ categorias = [], onCrearCategoria, onSubmit }) {

    const [mostrarPopup, setMostrarPopup] = useState(false);

    const [form, setForm] = useState({
        nombre: "",
        categoria: "Sin categoría",
        descripcion: "",
        disponible: true,
        vendidoPor: "unidad",
        precio: "",
        coste: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Detecta si seleccionó "Agregar categoría"
        if (name === "categoria" && value === "agregar_categoria") {
            setMostrarPopup(true);
            return;
        }

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(form);
    };

    // Cuando se crea una categoría nueva desde el PopUp
    const agregarCategoria = (nuevoNombre) => {
        if (onCrearCategoria) onCrearCategoria(nuevoNombre);

        // Asignar recién creada como seleccionada
        setForm({
            ...form,
            categoria: nuevoNombre
        });
    };

    return (
        <>
            {mostrarPopup && (
                <PopupCategoria
                    onClose={() => setMostrarPopup(false)}
                    onCreate={agregarCategoria}
                />
            )}

            <form className="form-articulo" onSubmit={handleSubmit}>
                
                {/* NOMBRE Y CATEGORÍA */}
                <div className="fila">
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
                        <label>Categoría</label>
                        <select
                            name="categoria"
                            value={form.categoria}
                            onChange={handleChange}
                        >
                            <option value="Sin categoría">Sin categoría</option>

                            {/* Categorías del backend / Redux */}
                            {categorias.map(cat => (
                                <option key={cat._id} value={cat.nombre}>
                                    {cat.nombre}
                                </option>
                            ))}

                            <option value="agregar_categoria">➕ Agregar categoría</option>
                        </select>
                    </div>
                </div>

                {/* DESCRIPCIÓN */}
                <div className="campo descripcion">
                    <label>Descripción</label>
                    <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                    />
                </div>

                {/* DISPONIBLE */}
                <div className="checkbox-linea">
                    <input 
                        type="checkbox"
                        name="disponible"
                        checked={form.disponible}
                        onChange={handleChange}
                    />
                    <span>El artículo está disponible para la venta</span>
                </div>

                {/* VENDIDO POR */}
                <div className="campo">
                    <label>Vendido por</label>

                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="vendidoPor"
                                value="unidad"
                                checked={form.vendidoPor === "unidad"}
                                onChange={handleChange}
                            /> Unidad
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="vendidoPor"
                                value="peso"
                                checked={form.vendidoPor === "peso"}
                                onChange={handleChange}
                            /> Peso / Volumen
                        </label>
                    </div>
                </div>

                {/* PRECIOS */}
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
                        />
                    </div>
                </div>

                <button type="submit" className="btn-guardar">
                    Guardar artículo
                </button>

            </form>
        </>
    );
}

export default FormularioArticulo;
