import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { creaArticuloProveedor, crearCategoria, getCategorias } from '../../Redux/Actions';
import PopupCategoria from '../FormCategoria';
import './styles.css';

const CATEGORIA_DEFAULT = 'Sin categoria';

const getCategoriaId = (categoria, categorias = []) => {
    if (!categoria) return CATEGORIA_DEFAULT;
    if (typeof categoria === 'object' && categoria?._id) return categoria._id;
    if (typeof categoria === 'string') {
        const categoriaEncontrada = categorias.find((cat) => {
            if (!cat) return false;
            if (typeof cat === 'string') return cat === categoria;
            return cat._id === categoria || cat.nombre === categoria;
        });

        if (categoriaEncontrada && typeof categoriaEncontrada === 'object') {
            return categoriaEncontrada._id;
        }
        return categoria;
    }
    return CATEGORIA_DEFAULT;
};

const getCategoriaLabel = (categoria) => {
    if (!categoria) return CATEGORIA_DEFAULT;
    if (typeof categoria === 'string') return categoria;
    return categoria.nombre || categoria.label || CATEGORIA_DEFAULT;
};

const esCategoriaProveedor = (categoria) => {
    if (!categoria || typeof categoria === 'string') return false;
    return Boolean(categoria.esProveedor);
};

function FormArticuloProveedor() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const categorias = useSelector((state) => state.categorias || []);
    const categoriasProveedor = categorias.filter((cat) => esCategoriaProveedor(cat));

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [categoriaCreada, setCategoriaCreada] = useState(null);
    const [form, setForm] = useState({
        nombre: '',
        categoria: CATEGORIA_DEFAULT,
        descripcion: '',
        precio: ''
    });

    useEffect(() => {
        if (!categorias?.length) {
            dispatch(getCategorias());
        }
    }, [dispatch, categorias?.length]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'precio'
                ? (value === '' ? '' : Number(value))
                : value
        }));
    };

    const agregarCategoria = async (categoriaData) => {
        const nuevaCategoria = await dispatch(crearCategoria(categoriaData));
        const categoriaId = nuevaCategoria?._id || categoriaData?.nombre;
        const categoriaLabel = nuevaCategoria?.nombre || categoriaData?.nombre;

        setCategoriaCreada(categoriaLabel);
        setForm((prev) => ({ ...prev, categoria: categoriaId }));
        setMostrarPopup(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            Swal.fire('Falta el nombre', 'El articulo debe tener un nombre.', 'warning');
            return;
        }

        if (form.categoria === CATEGORIA_DEFAULT) {
            Swal.fire('Falta la categoria', 'Debes seleccionar una categoria valida.', 'warning');
            return;
        }

        if (form.precio === '' || Number(form.precio) < 0) {
            Swal.fire('Precio invalido', 'Debes informar un precio valido.', 'warning');
            return;
        }

        const data = {
            nombre: form.nombre.trim(),
            categoria: getCategoriaId(form.categoria, categorias),
            descripcion: form.descripcion.trim(),
            precio: Number(form.precio)
        };

        const resp = await dispatch(creaArticuloProveedor(data));
        const resultMessage = String(resp?.message || resp?.msg || '');
        const isErrorResult =
            resp?.error === true ||
            resultMessage.toLowerCase().includes('error') ||
            resultMessage.toLowerCase().includes('no se encontro endpoint');

        if (isErrorResult) {
            Swal.fire('Error', resultMessage || 'No se pudo guardar el articulo de proveedor.', 'error');
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Articulo de proveedor creado',
            timer: 1500,
            showConfirmButton: false
        });

        navigate('/listaArticulos');
    };

    return (
        <div className="cont-articulo-prov">
            {mostrarPopup && (
                <PopupCategoria
                    categorias={categoriasProveedor}
                    onClose={() => setMostrarPopup(false)}
                    onCreate={agregarCategoria}
                />
            )}

            <form className="form-articulo-prov" onSubmit={handleSubmit}>
                <div className="articulo-prov-head">
                    <div>
                        <p className="articulo-prov-kicker">Proveedor</p>
                        <h2>Nuevo articulo comprado</h2>
                        <p>
                            Este alta genera el articulo base que luego aparece en la busqueda de inventario
                            para componer articulos con talle.
                        </p>
                    </div>
                </div>

                <div className="articulo-prov-grid">
                    <div className="articulo-prov-field">
                        <label>Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Tela frizada negra"
                        />
                    </div>

                    <div className="articulo-prov-field">
                        <label>Categoria</label>
                        {categoriaCreada ? (
                            <input type="text" value={categoriaCreada} readOnly className="articulo-prov-readonly" />
                        ) : (
                            <select
                                value={form.categoria}
                                onChange={(e) => {
                                    if (e.target.value === '__add__') {
                                        setMostrarPopup(true);
                                        return;
                                    }
                                    setForm((prev) => ({ ...prev, categoria: e.target.value }));
                                }}
                            >
                                <option value={CATEGORIA_DEFAULT}>{CATEGORIA_DEFAULT}</option>
                                {categoriasProveedor.map((cat) => (
                                    <option
                                        key={typeof cat === 'string' ? cat : cat._id}
                                        value={typeof cat === 'string' ? cat : cat._id}
                                    >
                                        {getCategoriaLabel(cat)}
                                    </option>
                                ))}
                                <option value="__add__">+ Agregar categoria</option>
                            </select>
                        )}
                    </div>

                    <div className="articulo-prov-field articulo-prov-field--full">
                        <label>Descripcion</label>
                        <textarea
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Detalle breve del articulo comprado al proveedor"
                        />
                    </div>

                    <div className="articulo-prov-field articulo-prov-field--price">
                        <label>Precio</label>
                        <input
                            type="number"
                            name="precio"
                            min="0"
                            value={form.precio}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="articulo-prov-actions">
                    <button
                        type="button"
                        className="btn-articulo-prov-secondary"
                        onClick={() => navigate('/listaProveedores')}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn-articulo-prov-primary">
                        Guardar articulo
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormArticuloProveedor;
