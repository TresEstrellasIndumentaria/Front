import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { crearRecibo, getReciboById, getUsuarioByRol, modificarRecibo } from '../../Redux/Actions';
import './styles.css';

const getNombreCompleto = (cliente) => (
    `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim()
);

const getEmptyForm = () => ({
    numeroCliente: '',
    razonSocial: '',
    nombreApellido: '',
    importe: '',
    fechaCobro: new Date().toISOString().slice(0, 10),
    medioPago: 'Transferencia',
    observaciones: '',
});

const formatDateInput = (value) => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
};

function FormCobro() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const loading = useSelector((state) => state.loading);
    const clientesState = useSelector((state) => state.usuariosRol || []);
    const isEditMode = Boolean(id);
    const [form, setForm] = useState(getEmptyForm);
    const [errors, setErrors] = useState({});
    const [query, setQuery] = useState('');
    const [loadingRecibo, setLoadingRecibo] = useState(false);

    useEffect(() => {
        dispatch(getUsuarioByRol('CLIENTE'));
    }, [dispatch]);

    useEffect(() => {
        if (!id) {
            setForm(getEmptyForm());
            setErrors({});
            return;
        }

        setLoadingRecibo(true);
        dispatch(getReciboById(id)).then((response) => {
            setLoadingRecibo(false);
            if (response?.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar el recibo',
                    text: response.message || 'Intenta nuevamente.',
                }).then(() => navigate('/listaCobros'));
                return;
            }

            setForm({
                numeroCliente: String(response?.numeroCliente || ''),
                razonSocial: response?.razonSocial || '',
                nombreApellido: response?.nombreApellido || '',
                importe: String(response?.importe ?? ''),
                fechaCobro: formatDateInput(response?.fechaCobro),
                medioPago: response?.medioPago || 'Transferencia',
                observaciones: response?.observaciones || '',
            });
        });
    }, [dispatch, id, navigate]);

    const clientes = useMemo(() => {
        return (clientesState || []).map((cliente) => ({
            id: cliente?._id,
            numeroCliente: String(cliente?.numeroCliente || cliente?.numero || cliente?.codigoCliente || cliente?.dni || ''),
            razonSocial: cliente?.razonSocial || cliente?.nombreFantasia || getNombreCompleto(cliente),
            nombreApellido: getNombreCompleto(cliente),
        })).filter((cliente) => (
            cliente.numeroCliente || cliente.razonSocial || cliente.nombreApellido
        ));
    }, [clientesState]);

    const clientesFiltrados = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return clientes.slice(0, 8);

        return clientes.filter((cliente) => (
            `${cliente.numeroCliente} ${cliente.nombreApellido} ${cliente.razonSocial}`.toLowerCase().includes(normalized)
        )).slice(0, 8);
    }, [clientes, query]);

    const applyClienteData = (cliente) => {
        setForm((prev) => ({
            ...prev,
            numeroCliente: cliente.numeroCliente || '',
            razonSocial: cliente.razonSocial || '',
            nombreApellido: cliente.nombreApellido || '',
        }));
        setErrors((prev) => ({ ...prev, numeroCliente: '', nombreApellido: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const nextErrors = {};
        if (!form.numeroCliente.trim()) nextErrors.numeroCliente = 'Completa el numero de cliente';
        if (!form.nombreApellido.trim()) nextErrors.nombreApellido = 'Completa el nombre del cliente';
        if (!String(form.importe).trim()) nextErrors.importe = 'Completa el importe';
        if (Number(form.importe) < 0 || Number.isNaN(Number(form.importe))) nextErrors.importe = 'Ingresa un importe valido';
        return nextErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validate();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Revisa los campos obligatorios del cobro.',
            });
            return;
        }

        const payload = {
            numeroCliente: form.numeroCliente.trim(),
            razonSocial: form.razonSocial.trim(),
            nombreApellido: form.nombreApellido.trim(),
            importe: Number(form.importe),
            fechaCobro: form.fechaCobro,
            medioPago: form.medioPago.trim(),
            observaciones: form.observaciones.trim(),
        };

        const response = isEditMode
            ? await dispatch(modificarRecibo(id, payload))
            : await dispatch(crearRecibo(payload));

        if (response?.error) {
            Swal.fire({
                icon: 'error',
                title: isEditMode ? 'No se pudo modificar el recibo' : 'No se pudo crear el recibo',
                text: response.message || 'Intenta nuevamente.',
            });
            return;
        }

        const recibo = response?.recibo || response;
        Swal.fire({
            icon: 'success',
            title: isEditMode ? 'Recibo actualizado correctamente' : 'Recibo creado correctamente',
            text: recibo?.numeroReciboFormateado
                ? `Se guardo ${recibo.numeroReciboFormateado} para ${payload.nombreApellido}.`
                : `Se guardo el recibo para ${payload.nombreApellido}.`,
        }).then(() => {
            if (isEditMode) {
                navigate('/listaCobros');
                return;
            }

            setForm(getEmptyForm());
            setErrors({});
            setQuery('');
        });
    };

    return (
        <section className="form-cobro">
            <div className="form-cobro-card">
                <div className="form-cobro-header">
                    <div>
                        <p className="form-cobro-kicker">{isEditMode ? 'Edicion de recibo' : 'Alta manual'}</p>
                        <h2>{isEditMode ? 'Modificar cobro' : 'Registrar cobro'}</h2>
                        <p className="form-cobro-copy">
                            {isEditMode
                                ? 'Actualiza los datos del recibo seleccionado y guarda los cambios.'
                                : 'Selecciona un cliente y registra el recibo para dejar el ingreso asentado.'}
                        </p>
                    </div>
                </div>

                <div className="form-cobro-client-picker">
                    <label className="form-cobro-field">
                        <span>Buscar cliente</span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por cliente, razon social o numero"
                        />
                    </label>

                    <div className="form-cobro-client-list">
                        {clientesFiltrados.map((cliente) => (
                            <button
                                key={cliente.id || cliente.numeroCliente}
                                type="button"
                                className="form-cobro-client-item"
                                onClick={() => applyClienteData(cliente)}
                            >
                                <strong>{cliente.nombreApellido || cliente.razonSocial}</strong>
                                <span>{cliente.numeroCliente} | {cliente.razonSocial}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form className="form-cobro-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-cobro-row">
                        <label className={`form-cobro-field ${errors.numeroCliente ? 'is-error' : ''}`}>
                            <span>Numero cliente</span>
                            <input name="numeroCliente" value={form.numeroCliente} onChange={handleChange} placeholder="Ej. 1001" />
                        </label>

                        <label className="form-cobro-field">
                            <span>Razon social</span>
                            <input name="razonSocial" value={form.razonSocial} onChange={handleChange} placeholder="Razon social" />
                        </label>
                    </div>

                    <div className="form-cobro-row">
                        <label className={`form-cobro-field ${errors.nombreApellido ? 'is-error' : ''}`}>
                            <span>Nombre y apellido</span>
                            <input name="nombreApellido" value={form.nombreApellido} onChange={handleChange} placeholder="Nombre del cliente" />
                        </label>

                        <label className={`form-cobro-field ${errors.importe ? 'is-error' : ''}`}>
                            <span>Importe</span>
                            <input name="importe" value={form.importe} onChange={handleChange} placeholder="0" />
                        </label>
                    </div>

                    <div className="form-cobro-row">
                        <label className="form-cobro-field">
                            <span>Fecha de cobro</span>
                            <input type="date" name="fechaCobro" value={form.fechaCobro} onChange={handleChange} />
                        </label>

                        <label className="form-cobro-field">
                            <span>Medio de pago</span>
                            <select name="medioPago" value={form.medioPago} onChange={handleChange}>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Debito">Debito</option>
                                <option value="Credito">Credito</option>
                                <option value="Cuenta DNI">Cuenta DNI</option>
                            </select>
                        </label>
                    </div>

                    <label className="form-cobro-field">
                        <span>Observaciones</span>
                        <textarea
                            name="observaciones"
                            value={form.observaciones}
                            onChange={handleChange}
                            placeholder="Notas internas del cobro"
                        />
                    </label>

                    <div className="form-cobro-actions">
                        {isEditMode && (
                            <button
                                type="button"
                                className="form-cobro-cancel"
                                onClick={() => navigate('/listaCobros')}
                                disabled={loading || loadingRecibo}
                            >
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="form-cobro-submit" disabled={loading || loadingRecibo}>
                            {loading || loadingRecibo
                                ? 'Guardando...'
                                : isEditMode
                                    ? 'Guardar cambios'
                                    : 'Guardar cobro'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default FormCobro;
