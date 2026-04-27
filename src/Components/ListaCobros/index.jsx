import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { eliminarRecibo, getRecibos } from '../../Redux/Actions';
import './styles.css';

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-AR').format(new Date(value));
};

function ListaCobrosComponent() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const recibos = useSelector((state) => state.recibos || []);
    const totalRecibos = useSelector((state) => state.totalRecibos || 0);
    const recibosPage = useSelector((state) => state.recibosPage || 1);
    const recibosTotalPages = useSelector((state) => state.recibosTotalPages || 1);
    const loading = useSelector((state) => state.loading);
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);
    const [query, setQuery] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        const normalizedQuery = query.trim();
        const queryEsNumerica = /^\d+$/.test(normalizedQuery);
        dispatch(getRecibos({
            page: paginaActual,
            limit: itemsPorPagina,
            desde: fechaDesde || undefined,
            hasta: fechaHasta || undefined,
            numeroCliente: queryEsNumerica ? normalizedQuery : undefined,
            nombreApellido: normalizedQuery && !queryEsNumerica ? normalizedQuery : undefined,
        }));
    }, [dispatch, fechaDesde, fechaHasta, itemsPorPagina, paginaActual, query]);

    useEffect(() => {
        setPaginaActual(1);
    }, [fechaDesde, fechaHasta, itemsPorPagina, query]);

    useEffect(() => {
        if (recibosPage && recibosPage !== paginaActual) {
            setPaginaActual(recibosPage);
        }
    }, [paginaActual, recibosPage]);

    const recibosFiltrados = useMemo(() => recibos, [recibos]);

    const resumen = useMemo(() => {
        return recibosFiltrados.reduce((acc, recibo) => {
            acc.cantidad += 1;
            acc.total += Number(recibo?.importe || 0);
            return acc;
        }, { cantidad: 0, total: 0 });
    }, [recibosFiltrados]);

    const handleEliminar = async (recibo) => {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: 'Eliminar recibo',
            text: `Se eliminara ${recibo?.numeroReciboFormateado || 'el recibo seleccionado'}.`,
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#b91c1c',
        });

        if (!confirmacion.isConfirmed) return;

        const response = await dispatch(eliminarRecibo(recibo?._id));
        if (response?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo eliminar',
                text: response.message || 'Intenta nuevamente.',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Recibo eliminado',
            text: response?.msg || 'El recibo fue eliminado correctamente.',
        });

        const targetPage = recibosFiltrados.length === 1 && paginaActual > 1
            ? paginaActual - 1
            : paginaActual;
        setPaginaActual(targetPage);

        const normalizedQuery = query.trim();
        const queryEsNumerica = /^\d+$/.test(normalizedQuery);
        dispatch(getRecibos({
            page: targetPage,
            limit: itemsPorPagina,
            desde: fechaDesde || undefined,
            hasta: fechaHasta || undefined,
            numeroCliente: queryEsNumerica ? normalizedQuery : undefined,
            nombreApellido: normalizedQuery && !queryEsNumerica ? normalizedQuery : undefined,
        }));
    };

    return (
        <section className="lista-cobros-page">
            <div className="lista-cobros-shell">
                <header className="lista-cobros-hero">
                    <div>
                        <p className="lista-cobros-kicker">Tesoreria comercial</p>
                        <h1>Lista de cobros</h1>
                        <p className="lista-cobros-subtitle">
                            Consulta recibos emitidos, filtra por fecha y revisa ingresos registrados por cliente.
                        </p>
                    </div>
                </header>

                <div className="lista-cobros-summary">
                    <article className="lista-cobros-summary-card">
                        <span>Recibos visibles</span>
                        <strong>{resumen.cantidad}</strong>
                    </article>
                    <article className="lista-cobros-summary-card">
                        <span>Total visible</span>
                        <strong>{formatMoney(resumen.total)}</strong>
                    </article>
                    <article className="lista-cobros-summary-card">
                        <span>Total recibos</span>
                        <strong>{totalRecibos}</strong>
                    </article>
                </div>

                <div className="lista-cobros-card">
                    <div className="lista-cobros-toolbar">
                        <label className="lista-cobros-search">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar por cliente, numero de recibo, numero de cliente o medio de pago"
                            />
                        </label>

                        <div className="lista-cobros-filters">
                            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                            <select value={itemsPorPagina} onChange={(e) => setItemsPorPagina(Number(e.target.value))}>
                                <option value={10}>10 por pagina</option>
                                <option value={20}>20 por pagina</option>
                                <option value={50}>50 por pagina</option>
                            </select>
                        </div>
                    </div>

                    <div className="lista-cobros-table-wrap">
                        <table className="lista-cobros-table">
                            <thead>
                                <tr>
                                    <th>Recibo</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Medio</th>
                                    <th>Importe</th>
                                    <th>Observaciones</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="7" className="lista-cobros-empty">Cargando recibos...</td>
                                    </tr>
                                )}

                                {!loading && recibosFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="lista-cobros-empty">No hay recibos para los filtros actuales.</td>
                                    </tr>
                                )}

                                {!loading && recibosFiltrados.map((recibo) => (
                                    <tr key={recibo._id || recibo.numeroRecibo}>
                                        <td>
                                            <div className="lista-cobros-code">
                                                <strong>{recibo.numeroReciboFormateado || `RC-${String(recibo.numeroRecibo || '').padStart(6, '0')}`}</strong>
                                                <span>{recibo.numeroCliente}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(recibo.fechaCobro)}</td>
                                        <td>
                                            <div className="lista-cobros-code">
                                                <strong>{recibo.nombreApellido || '-'}</strong>
                                                <span>{recibo.razonSocial || '-'}</span>
                                            </div>
                                        </td>
                                        <td>{recibo.medioPago || '-'}</td>
                                        <td className="lista-cobros-money">{formatMoney(recibo.importe)}</td>
                                        <td>{recibo.observaciones || '-'}</td>
                                        <td>
                                            <div className="lista-cobros-actions">
                                                <button
                                                    type="button"
                                                    className="lista-cobros-action-btn"
                                                    onClick={() => navigate(`/cobros/editar/${recibo._id}`)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="lista-cobros-action-btn lista-cobros-action-btn--danger"
                                                    onClick={() => handleEliminar(recibo)}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="lista-cobros-pagination">
                        <div className="lista-cobros-pagination-copy">
                            <span>Pagina {recibosPage} de {Math.max(recibosTotalPages, 1)}</span>
                            <strong>{totalRecibos} recibos</strong>
                        </div>

                        <div className="lista-cobros-pagination-actions">
                            <button
                                type="button"
                                className="lista-cobros-btn"
                                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                                disabled={loading || recibosPage <= 1}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                className="lista-cobros-btn"
                                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, recibosTotalPages || 1))}
                                disabled={loading || recibosPage >= recibosTotalPages}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ListaCobrosComponent;
