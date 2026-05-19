import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    crearRemito,
    getAllArticulos,
    getRemitoById,
    getUsuarioByRol,
    modificarRemito
} from '../../Redux/Actions';
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
    numeroArticulo: '',
    articulo: '',
    nombreArticulo: '',
    talle: '',
    cantidad: '1',
    importeUnitario: '',
});

const mapRemitoToForm = (remito) => ({
    numeroCliente: remito?.numeroCliente || '',
    razonSocial: remito?.razonSocial || '',
    nombreApellido: remito?.nombreApellido || '',
    email: remito?.email || '',
    telefono: remito?.telefono || '',
    cuit: remito?.cuit || '',
});

const getCodigoArticulo = (articulo) => (
    articulo?.codigoArticulo || articulo?.codigo || articulo?.codArticulo || ''
);

const getPrecioArticulo = (articulo, talleValue = '') => {
    const talles = Array.isArray(articulo?.talles) ? articulo.talles : [];
    if (!talles.length) return '';

    const normalizedTalle = normalize(talleValue);
    const talleSeleccionado = normalizedTalle
        ? talles.find((talle) => normalize(talle?.talle) === normalizedTalle)
        : null;
    const precio = talleSeleccionado?.precio ?? talles[0]?.precio ?? '';
    return precio === '' || precio === undefined || precio === null ? '' : String(precio);
};

const calcularImporteTotal = (articulo) => {
    const cantidad = Number(articulo?.cantidad || 0);
    const importeUnitario = Number(articulo?.importeUnitario || 0);
    return cantidad > 0 && importeUnitario >= 0 ? cantidad * importeUnitario : 0;
};

const resolveArticuloValue = (pedidoItem, articulos) => {
    const articuloValue = String(
        pedidoItem?.articulo ||
        pedidoItem?.articuloId ||
        pedidoItem?.prenda ||
        pedidoItem?.nombreArticulo ||
        ''
    ).trim();
    if (!articuloValue) return '';

    const exactId = articulos.find((articulo) => articulo?._id === articuloValue);
    if (exactId) return exactId._id;

    const normalizedArticulo = normalize(articuloValue);
    const byCode = articulos.find((articulo) => normalize(getCodigoArticulo(articulo)) === normalizedArticulo);
    if (byCode?._id) return byCode._id;

    const byName = articulos.find((articulo) => normalize(articulo?.nombre) === normalizedArticulo);
    if (byName?._id) return byName._id;

    const byContains = articulos.find((articulo) => normalize(articulo?.nombre).includes(normalizedArticulo));
    if (byContains?._id) return byContains._id;

    const containedByArticulo = articulos.find((articulo) => normalizedArticulo.includes(normalize(articulo?.nombre)));
    if (containedByArticulo?._id) return containedByArticulo._id;

    return articuloValue;
};

const mapPedidoToArticulos = (pedido, articulos) => {
    if (!Array.isArray(pedido) || !pedido.length) return [createEmptyArticulo()];

    return pedido.map((item) => {
        const articuloId = resolveArticuloValue(item, articulos);
        const articuloSeleccionado = articulos.find((articulo) => articulo?._id === articuloId);
        const cantidad = item?.cantidad ?? 1;
        const importeUnitario = item?.precioUnitario ?? item?.importeUnitario ?? getPrecioArticulo(articuloSeleccionado, item?.talle);

        return {
            numeroArticulo: item?.numeroArticulo || item?.codigoArticulo || getCodigoArticulo(articuloSeleccionado),
            articulo: articuloId,
            nombreArticulo: item?.nombreArticulo || item?.prenda || articuloSeleccionado?.nombre || '',
            talle: item?.talle || '',
            cantidad: cantidad === undefined || cantidad === null ? '' : String(cantidad),
            importeUnitario: importeUnitario === undefined || importeUnitario === null ? '' : String(importeUnitario),
        };
    });
};

const getArticuloCodigoByValue = (articulos, articuloValue, numeroArticulo = '') => {
    const articuloSeleccionado = articulos.find((item) => item._id === articuloValue);
    return getCodigoArticulo(articuloSeleccionado) || numeroArticulo || '';
};

const getOpcionesArticulo = (articulos, articuloValue, nombreArticulo = '') => {
    const existeEnCatalogo = articulos.some((articulo) => articulo._id === articuloValue);
    if (!articuloValue || existeEnCatalogo) return articulos;

    return [
        {
            _id: articuloValue,
            nombre: `${nombreArticulo || articuloValue} (guardado en remito)`,
            codigoArticulo: articuloValue,
        },
        ...articulos,
    ];
};

const getTallesArticulo = (articulo) => (
    Array.isArray(articulo?.talles)
        ? articulo.talles.map((talle) => talle?.talle).filter(Boolean)
        : []
);

function FormVenta() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const clientesState = useSelector((state) => state.usuariosRol || []);
    const articulosState = useSelector((state) => state.articulos || []);
    const loading = useSelector((state) => state.loading);
    const remitoActual = useSelector((state) => state.remitoActual);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [articulosVenta, setArticulosVenta] = useState([createEmptyArticulo()]);
    const [articulosErrors, setArticulosErrors] = useState({});
    const [remitoEnEdicion, setRemitoEnEdicion] = useState(location.state?.remito || null);
    const [clientePrecargado, setClientePrecargado] = useState(location.state?.cliente || null);
    const isEditMode = Boolean(id);

    useEffect(() => {
        dispatch(getUsuarioByRol('CLIENTE'));
        if (!articulosState?.length) {
            dispatch(getAllArticulos());
        }
        if (id) {
            dispatch(getRemitoById(id));
        }
    }, [dispatch, articulosState?.length, id]);

    useEffect(() => {
        if (location.state?.remito) {
            setRemitoEnEdicion(location.state.remito);
        }
        if (location.state?.cliente) {
            setClientePrecargado(location.state.cliente);
        }
    }, [location.state]);

    useEffect(() => {
        if (isEditMode && remitoActual?._id === id) {
            setRemitoEnEdicion(remitoActual);
        }
    }, [id, isEditMode, remitoActual]);

    const clientes = useMemo(() => {
        const source = Array.isArray(clientesState) && clientesState.length ? clientesState : clientesMock;
        return source.map(buildClienteOption).filter((cliente) => (
            cliente.numeroCliente || cliente.razonSocial || cliente.nombreApellido
        ));
    }, [clientesState]);

    useEffect(() => {
        if (!clientePrecargado || isEditMode) return;

        applyClienteData(buildClienteOption(clientePrecargado, 0));
        setClientePrecargado(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientePrecargado, isEditMode]);

    const articulosDisponibles = useMemo(() => {
        return Array.isArray(articulosState)
            ? articulosState.filter((articulo) => articulo?.itemProveedor !== true)
            : [];
    }, [articulosState]);

    const totalVenta = useMemo(() => (
        articulosVenta.reduce((total, articulo) => total + calcularImporteTotal(articulo), 0)
    ), [articulosVenta]);

    useEffect(() => {
        if (!remitoEnEdicion || !articulosDisponibles.length) return;

        setForm(mapRemitoToForm(remitoEnEdicion));
        setArticulosVenta(mapPedidoToArticulos(remitoEnEdicion.pedido, articulosDisponibles));
        setErrors({});
        setArticulosErrors({});
    }, [articulosDisponibles, remitoEnEdicion]);

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
            if (field === 'articulo') {
                const articuloSeleccionado = articulosDisponibles.find((item) => item._id === value);
                return {
                    ...articulo,
                    articulo: value,
                    nombreArticulo: articuloSeleccionado?.nombre || '',
                    numeroArticulo: getCodigoArticulo(articuloSeleccionado),
                    talle: '',
                    importeUnitario: getPrecioArticulo(articuloSeleccionado),
                };
            }
            if (field === 'talle') {
                const articuloSeleccionado = articulosDisponibles.find((item) => item._id === articulo.articulo);
                return {
                    ...articulo,
                    talle: value,
                    importeUnitario: articulo.importeUnitario || getPrecioArticulo(articuloSeleccionado, value),
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

    const validate = () => {
        const nextErrors = {};

        if (!form.numeroCliente.trim()) nextErrors.numeroCliente = 'Completa el numero de cliente';
        if (!form.razonSocial.trim()) nextErrors.razonSocial = 'Completa la razon social';
        if (!form.nombreApellido.trim()) nextErrors.nombreApellido = 'Completa nombre y apellido';
        if (!form.email.trim()) nextErrors.email = 'Completa el email';
        if (!form.telefono.trim()) nextErrors.telefono = 'Completa el telefono';

        const nextArticulosErrors = {};
        const articulosNormalizados = articulosVenta.filter((articulo) => (
            articulo.numeroArticulo ||
            articulo.articulo ||
            articulo.nombreArticulo ||
            articulo.talle ||
            articulo.cantidad ||
            articulo.importeUnitario
        ));

        if (!articulosNormalizados.length) {
            nextArticulosErrors[0] = {
                articulo: true,
                cantidad: true,
                importeUnitario: true,
            };
        }

        articulosVenta.forEach((articulo, index) => {
            const hasAnyValue = articulo.numeroArticulo ||
                articulo.articulo ||
                articulo.nombreArticulo ||
                articulo.talle ||
                articulo.cantidad ||
                articulo.importeUnitario;
            if (!hasAnyValue) return;

            const rowErrors = {};
            if (!articulo.articulo) rowErrors.articulo = true;
            if (!articulo.cantidad || Number(articulo.cantidad) <= 0) rowErrors.cantidad = true;
            if (articulo.importeUnitario === '' || Number(articulo.importeUnitario) < 0) rowErrors.importeUnitario = true;

            if (Object.keys(rowErrors).length) {
                nextArticulosErrors[index] = rowErrors;
            }
        });

        return { nextErrors, nextArticulosErrors };
    };

    const resetForm = () => {
        setForm(emptyForm);
        setErrors({});
        setArticulosVenta([createEmptyArticulo()]);
        setArticulosErrors({});
    };

    const handleSubmit = async (e) => {
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

        const pedido = articulosVenta
            .filter((articulo) => (
                articulo.numeroArticulo ||
                articulo.articulo ||
                articulo.nombreArticulo ||
                articulo.talle ||
                articulo.cantidad ||
                articulo.importeUnitario
            ))
            .map((articulo) => {
                const articuloSeleccionado = articulosDisponibles.find((item) => item._id === articulo.articulo);
                const nombreArticulo = articuloSeleccionado?.nombre || articulo.nombreArticulo || articulo.articulo;
                const numeroArticulo = getArticuloCodigoByValue(articulosDisponibles, articulo.articulo, articulo.numeroArticulo);
                const cantidad = Number(articulo.cantidad);
                const importeUnitario = Number(articulo.importeUnitario);
                const importeTotal = calcularImporteTotal(articulo);

                return {
                    numeroArticulo,
                    codigoArticulo: numeroArticulo,
                    articulo: articulo.articulo,
                    articuloId: articulo.articulo,
                    nombreArticulo,
                    prenda: nombreArticulo,
                    talle: articulo.talle.trim(),
                    cantidad,
                    precioUnitario: importeUnitario,
                    subtotal: importeTotal,
                    importeUnitario,
                    importeTotal,
                };
            });
        const importeTotal = pedido.reduce((total, item) => total + Number(item.importeTotal || 0), 0);

        const payload = {
            numeroCliente: form.numeroCliente.trim(),
            razonSocial: form.razonSocial.trim(),
            nombreApellido: form.nombreApellido.trim(),
            email: form.email.trim(),
            telefono: form.telefono.trim(),
            cuit: form.cuit.trim(),
            estado: remitoEnEdicion?.estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE',
            pedido,
            subtotal: importeTotal,
            descuento: 0,
            importeTotal,
        };

        const response = isEditMode
            ? await dispatch(modificarRemito(id, payload))
            : await dispatch(crearRemito(payload));

        if (response?.error) {
            Swal.fire({
                icon: 'error',
                title: isEditMode ? 'No se pudo actualizar el remito' : 'No se pudo crear el remito',
                text: response.message || 'Revisa los datos e intenta nuevamente.',
            });
            return;
        }

        const remito = response?.remito || response;
        Swal.fire({
            icon: 'success',
            title: isEditMode ? 'Remito actualizado correctamente' : 'Remito creado correctamente',
            text: remito?.numeroRemitoFormateado
                ? `${isEditMode ? 'Se actualizo' : 'Se genero'} ${remito.numeroRemitoFormateado} para ${form.nombreApellido || form.razonSocial}.`
                : `${isEditMode ? 'Se actualizo' : 'Se genero'} el remito para ${form.nombreApellido || form.razonSocial}.`,
        });
        if (isEditMode) {
            navigate('/listaVentas');
            return;
        }

        resetForm();
    };

    return (
        <section className="form-venta-section">
            <div className="form-venta-card">
                <div className="form-venta-header">
                    <div>
                        <p className="form-venta-kicker">Nueva venta</p>
                        <h2>{isEditMode ? 'Editar remito' : 'Datos del cliente'}</h2>
                        <p className="form-venta-copy">
                            {isEditMode
                                ? 'Modifica los datos del cliente y del pedido, luego guarda los cambios del remito.'
                                : 'Completa cualquiera de los identificadores del cliente y el resto de los campos se rellenara automaticamente.'}
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
                    
                    {/* Articulos */}
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

                                    <div className="form-venta-field form-venta-item-field">
                                        <label>N° de Art.</label>
                                        <select
                                            value={articulo.articulo}
                                            onChange={(e) => handleArticuloChange(index, 'articulo', e.target.value)}
                                        >
                                            <option value="">Seleccionar codigo</option>
                                            {getOpcionesArticulo(articulosDisponibles, articulo.articulo, articulo.nombreArticulo).map((item) => (
                                                <option key={`codigo-${item._id}`} value={item._id}>
                                                    {getCodigoArticulo(item) || getArticuloCodigoByValue(articulosDisponibles, articulo.articulo, articulo.numeroArticulo) || 'Sin codigo'} - {item.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.articulo ? 'is-error' : ''}`}>
                                        <label>Nombre. Articulo.</label>
                                        <select
                                            value={articulo.articulo}
                                            onChange={(e) => handleArticuloChange(index, 'articulo', e.target.value)}
                                        >
                                            <option value="">Seleccionar articulo</option>
                                            {getOpcionesArticulo(articulosDisponibles, articulo.articulo, articulo.nombreArticulo).map((item) => (
                                                <option key={item._id} value={item._id}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-venta-field form-venta-item-field">
                                        <label>Talle</label>
                                        {getTallesArticulo(articulosDisponibles.find((item) => item._id === articulo.articulo)).length ? (
                                            <select
                                                value={articulo.talle}
                                                onChange={(e) => handleArticuloChange(index, 'talle', e.target.value)}
                                            >
                                                <option value="">Sin talle</option>
                                                {getTallesArticulo(articulosDisponibles.find((item) => item._id === articulo.articulo)).map((talle) => (
                                                    <option key={`${articulo.articulo}-${talle}`} value={talle}>{talle}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={articulo.talle}
                                                onChange={(e) => handleArticuloChange(index, 'talle', e.target.value)}
                                                placeholder="Opcional"
                                            />
                                        )}
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.cantidad ? 'is-error' : ''}`}>
                                        <label>Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={articulo.cantidad}
                                            onChange={(e) => handleArticuloChange(index, 'cantidad', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className={`form-venta-field form-venta-item-field ${articulosErrors[index]?.importeUnitario ? 'is-error' : ''}`}>
                                        <label>Imp. Unitario</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={articulo.importeUnitario}
                                            onChange={(e) => handleArticuloChange(index, 'importeUnitario', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="form-venta-field form-venta-item-field">
                                        <label>Imp. Total</label>
                                        <input
                                            type="number"
                                            value={calcularImporteTotal(articulo)}
                                            readOnly
                                            placeholder="0"
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
                        <div className="form-venta-total">
                            <span>Total venta</span>
                            <strong>${totalVenta.toLocaleString('es-AR')}</strong>
                        </div>
                        <button type="submit" className="form-venta-submit" disabled={loading}>
                            {loading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear remito'}
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
