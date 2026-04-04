import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getAllArticulos, getUsuarioByRol } from '../../Redux/Actions';
import './styles.css';

const clientesMock = [
    {
        _id: 'cli-001',
        numeroCliente: '1001',
        razonSocial: 'Boutique Belgrano SRL',
        nombre: 'Lucia',
        apellido: 'Fernandez',
        email: 'lucia@belgranosrl.com',
        telefono: { area: '11', numero: '44556677' },
        cuit: '30-71234567-8',
    },
    {
        _id: 'cli-002',
        numeroCliente: '1002',
        razonSocial: 'Marcos Diaz',
        nombre: 'Marcos',
        apellido: 'Diaz',
        email: 'marcosdiaz@gmail.com',
        telefono: { area: '11', numero: '47889900' },
        cuit: '20-33444555-6',
    },
    {
        _id: 'cli-003',
        numeroCliente: '1003',
        razonSocial: 'Tienda Central SA',
        nombre: 'Carla',
        apellido: 'Mendoza',
        email: 'compras@tiendacentral.com',
        telefono: { area: '351', numero: '5566778' },
        cuit: '30-69888777-1',
    },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

const getNombreCompleto = (cliente) => (
    `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim()
);

const getTelefono = (cliente) => {
    const tel = cliente?.telefono;
    if (!tel) return '';
    if (typeof tel === 'string') return tel;
    return `${tel.area || ''} ${tel.numero || ''}`.trim();
};

const buildClienteOption = (cliente, index) => ({
    id: cliente?._id || `cliente-${index}`,
    numeroCliente: String(
        cliente?.numeroCliente ||
        cliente?.numero ||
        cliente?.codigoCliente ||
        cliente?.dni ||
        ''
    ),
    razonSocial: cliente?.razonSocial || cliente?.nombreFantasia || getNombreCompleto(cliente),
    nombreApellido: getNombreCompleto(cliente),
    email: cliente?.email || '',
    telefono: getTelefono(cliente),
    cuit: cliente?.cuit || cliente?.CUIT || '',
});

const emptyForm = {
    numeroCliente: '',
    razonSocial: '',
    nombreApellido: '',
    email: '',
    telefono: '',
    cuit: '',
};

const createEmptyArticulo = () => ({
    camiseta: '',
    numero: '',
    prenda: '',
    talle: '',
    observaciones: '',
});

function FormVenta() {
    const dispatch = useDispatch();
    const clientesState = useSelector((state) => state.usuariosRol || []);
    const articulosState = useSelector((state) => state.articulos || []);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [articulosVenta, setArticulosVenta] = useState([createEmptyArticulo()]);
    const [articulosErrors, setArticulosErrors] = useState({});

    useEffect(() => {
        dispatch(getUsuarioByRol('CLIENTE'));
        if (!articulosState?.length) {
            dispatch(getAllArticulos());
        }
    }, [dispatch, articulosState?.length]);

    const clientes = useMemo(() => {
        const source = Array.isArray(clientesState) && clientesState.length ? clientesState : clientesMock;
        return source.map(buildClienteOption).filter((cliente) => (
            cliente.numeroCliente || cliente.razonSocial || cliente.nombreApellido
        ));
    }, [clientesState]);

    const prendasDisponibles = useMemo(() => {
        return (articulosState || []).filter((art) => Array.isArray(art?.talles) && art.talles.length);
    }, [articulosState]);

    const applyClienteData = (cliente) => {
        setForm({
            numeroCliente: cliente.numeroCliente || '',
            razonSocial: cliente.razonSocial || '',
            nombreApellido: cliente.nombreApellido || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            cuit: cliente.cuit || '',
        });
        setErrors({});
    };

    const resolveCliente = (field, value) => {
        const normalized = normalize(value);
        if (!normalized) return null;

        const exact = clientes.find((cliente) => normalize(cliente[field]) === normalized);
        if (exact) return exact;

        const contains = clientes.filter((cliente) => normalize(cliente[field]).includes(normalized));
        return contains.length === 1 ? contains[0] : null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));

        const cliente = resolveCliente(name, value);
        if (cliente) {
            applyClienteData(cliente);
        }
    };

    const handleArticuloChange = (index, field, value) => {
        setArticulosErrors((prev) => {
            if (!prev[index]?.[field]) return prev;
            return {
                ...prev,
                [index]: {
                    ...prev[index],
                    [field]: false,
                }
            };
        });

        setArticulosVenta((prev) => prev.map((articulo, articuloIndex) => {
            if (articuloIndex !== index) return articulo;
            if (field === 'prenda') {
                return {
                    ...articulo,
                    prenda: value,
                    talle: '',
                };
            }
            return {
                ...articulo,
                [field]: value,
            };
        }));
    };

    const agregarArticulo = () => {
        setArticulosVenta((prev) => [...prev, createEmptyArticulo()]);
    };

    const eliminarArticulo = (index) => {
        setArticulosVenta((prev) => (
            prev.length === 1
                ? [createEmptyArticulo()]
                : prev.filter((_, articuloIndex) => articuloIndex !== index)
        ));

        setArticulosErrors((prev) => {
            const next = {};
            Object.entries(prev).forEach(([key, value]) => {
                const numericKey = Number(key);
                if (numericKey === index) return;
                next[numericKey > index ? numericKey - 1 : numericKey] = value;
            });
            return next;
        });
    };

    const getTallesArticulo = (articuloId) => {
        const articulo = prendasDisponibles.find((item) => item._id === articuloId);
        return Array.isArray(articulo?.talles) ? articulo.talles : [];
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.numeroCliente.trim()) nextErrors.numeroCliente = 'Completa el numero de cliente';
        if (!form.razonSocial.trim()) nextErrors.razonSocial = 'Completa la razon social';
        if (!form.nombreApellido.trim()) nextErrors.nombreApellido = 'Completa nombre y apellido';
        if (!form.email.trim()) nextErrors.email = 'Completa el email';
        if (!form.telefono.trim()) nextErrors.telefono = 'Completa el telefono';

        const nextArticulosErrors = {};
        const articulosNormalizados = articulosVenta.filter((articulo) => (
            articulo.camiseta || articulo.numero || articulo.prenda || articulo.talle || articulo.observaciones
        ));

        if (!articulosNormalizados.length) {
            nextArticulosErrors[0] = {
                camiseta: true,
                numero: true,
                prenda: true,
                talle: true,
            };
        }

        articulosVenta.forEach((articulo, index) => {
            const hasAnyValue = articulo.camiseta || articulo.numero || articulo.prenda || articulo.talle || articulo.observaciones;
            if (!hasAnyValue) return;

            const rowErrors = {};
            if (!articulo.camiseta.trim()) rowErrors.camiseta = true;
            if (!articulo.numero.trim()) rowErrors.numero = true;
            if (!articulo.prenda) rowErrors.prenda = true;
            if (!articulo.talle) rowErrors.talle = true;

            if (Object.keys(rowErrors).length) {
                nextArticulosErrors[index] = rowErrors;
            }
        });

        return { nextErrors, nextArticulosErrors };
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const { nextErrors, nextArticulosErrors } = validate();
        setErrors(nextErrors);
        setArticulosErrors(nextArticulosErrors);

        if (Object.keys(nextErrors).length || Object.keys(nextArticulosErrors).length) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Completa los campos obligatorios del cliente y de los articulos para enviar el pedido.',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Pedido listo para enviar',
            text: `Cliente seleccionado: ${form.nombreApellido || form.razonSocial}`,
            timer: 1800,
            showConfirmButton: false,
        });
    };

    return (
        <section className="form-venta-section">
            <div className="form-venta-card">
                <div className="form-venta-header">
                    <div>
                        <p className="form-venta-kicker">Nueva venta</p>
                        <h2>Datos del cliente</h2>
                        <p className="form-venta-copy">
                            Completa cualquiera de los identificadores del cliente y el resto de los campos se rellenara automaticamente.
                        </p>
                    </div>
                </div>

                <form className="form-venta" onSubmit={handleSubmit} noValidate>
                    <div className="form-venta-row">
                        <div className={`form-venta-field ${errors.numeroCliente ? 'is-error' : ''}`}>
                            <label htmlFor="numeroCliente">Numero de cliente</label>
                            <input
                                id="numeroCliente"
                                name="numeroCliente"
                                type="text"
                                list="clientes-por-numero"
                                value={form.numeroCliente}
                                onChange={handleChange}
                                placeholder="Ej. 1001"
                            />
                            {errors.numeroCliente && <span className="form-venta-error">{errors.numeroCliente}</span>}
                        </div>

                        <div className={`form-venta-field ${errors.razonSocial ? 'is-error' : ''}`}>
                            <label htmlFor="razonSocial">Razon social</label>
                            <input
                                id="razonSocial"
                                name="razonSocial"
                                type="text"
                                list="clientes-por-razon"
                                value={form.razonSocial}
                                onChange={handleChange}
                                placeholder="Ej. Boutique Belgrano SRL"
                            />
                            {errors.razonSocial && <span className="form-venta-error">{errors.razonSocial}</span>}
                        </div>

                        <div className={`form-venta-field ${errors.nombreApellido ? 'is-error' : ''}`}>
                            <label htmlFor="nombreApellido">Nombre y apellido</label>
                            <input
                                id="nombreApellido"
                                name="nombreApellido"
                                type="text"
                                list="clientes-por-nombre"
                                value={form.nombreApellido}
                                onChange={handleChange}
                                placeholder="Ej. Lucia Fernandez"
                            />
                            {errors.nombreApellido && <span className="form-venta-error">{errors.nombreApellido}</span>}
                        </div>

                        <div className={`form-venta-field ${errors.email ? 'is-error' : ''}`}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="cliente@email.com"
                            />
                            {errors.email && <span className="form-venta-error">{errors.email}</span>}
                        </div>

                        <div className={`form-venta-field ${errors.telefono ? 'is-error' : ''}`}>
                            <label htmlFor="telefono">Telefono</label>
                            <input
                                id="telefono"
                                name="telefono"
                                type="text"
                                value={form.telefono}
                                onChange={handleChange}
                                placeholder="11 44556677"
                            />
                            {errors.telefono && <span className="form-venta-error">{errors.telefono}</span>}
                        </div>

                        <div className="form-venta-field">
                            <label htmlFor="cuit">CUIT</label>
                            <input
                                id="cuit"
                                name="cuit"
                                type="text"
                                value={form.cuit}
                                onChange={handleChange}
                                placeholder="30-00000000-0"
                            />
                        </div>
                    </div>

                    <div className="form-venta-items-card">
                        <div className="form-venta-items-header">
                            <div>
                                <h3>Articulos del pedido</h3>                                
                            </div>
                            <button
                                type="button"
                                className="form-venta-add-item"
                                onClick={agregarArticulo}
                            >
                                + Agregar articulo
                            </button>
                        </div>

                        <div className="form-venta-items-grid">
                            {articulosVenta.map((articulo, index) => (
                                <div className="form-venta-item-row" key={`venta-articulo-${index}`}>
                                    <div className="form-venta-item-cell">
                                        <span className="form-venta-item-label">#</span>
                                        <div className="form-venta-item-index">{index + 1}</div>
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.camiseta ? 'is-error' : ''}`}>
                                        <label>Nombre en Camiseta (Dorsal)</label>
                                        <input
                                            type="text"
                                            value={articulo.camiseta}
                                            onChange={(e) => handleArticuloChange(index, 'camiseta', e.target.value)}
                                            placeholder="Apellido o nombre"
                                        />
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.numero ? 'is-error' : ''}`}>
                                        <label>Numero</label>
                                        <input
                                            type="text"
                                            value={articulo.numero}
                                            onChange={(e) => handleArticuloChange(index, 'numero', e.target.value)}
                                            placeholder="Ej. 10"
                                        />
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.prenda ? 'is-error' : ''}`}>
                                        <label>Prenda</label>
                                        <select
                                            value={articulo.prenda}
                                            onChange={(e) => handleArticuloChange(index, 'prenda', e.target.value)}
                                        >
                                            <option value="">Seleccionar prenda</option>
                                            {prendasDisponibles.map((prenda) => (
                                                <option key={prenda._id} value={prenda._id}>
                                                    {prenda.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.talle ? 'is-error' : ''}`}>
                                        <label>Talle</label>
                                        <select
                                            value={articulo.talle}
                                            onChange={(e) => handleArticuloChange(index, 'talle', e.target.value)}
                                            disabled={!articulo.prenda}
                                        >
                                            <option value="">Seleccionar talle</option>
                                            {getTallesArticulo(articulo.prenda).map((talle, talleIndex) => (
                                                <option key={`${articulo.prenda}-${talle?.talle || talleIndex}`} value={talle?.talle || ''}>
                                                    {talle?.talle || '-'} ({talle?.ancho || '-'} x {talle?.alto || '-'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-venta-field form-venta-item-field">
                                        <label>Observaciones</label>
                                        <input
                                            type="text"
                                            value={articulo.observaciones}
                                            onChange={(e) => handleArticuloChange(index, 'observaciones', e.target.value)}
                                            placeholder="Observaciones"
                                        />
                                    </div>

                                    <div className="form-venta-item-remove-cell">
                                        <span className="form-venta-item-label">Eliminar</span>
                                        <button
                                            type="button"
                                            className="form-venta-item-remove"
                                            onClick={() => eliminarArticulo(index)}
                                            aria-label={`Eliminar articulo ${index + 1}`}
                                            title="Eliminar articulo"
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-venta-actions">
                        <button type="submit" className="form-venta-submit">
                            Enviar pedido
                        </button>
                    </div>
                </form>

                <datalist id="clientes-por-numero">
                    {clientes.map((cliente) => (
                        <option key={`${cliente.id}-numero`} value={cliente.numeroCliente} />
                    ))}
                </datalist>

                <datalist id="clientes-por-razon">
                    {clientes.map((cliente) => (
                        <option key={`${cliente.id}-razon`} value={cliente.razonSocial} />
                    ))}
                </datalist>

                <datalist id="clientes-por-nombre">
                    {clientes.map((cliente) => (
                        <option key={`${cliente.id}-nombre`} value={cliente.nombreApellido} />
                    ))}
                </datalist>
            </div>
        </section>
    );
}

export default FormVenta;
