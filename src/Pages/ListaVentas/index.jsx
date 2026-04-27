import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import { actualizarEstadoRemito, getRemitos } from '../../Redux/Actions';
import './styles.css';

const estadoLabel = {
    PENDIENTE: 'Pendiente',
    DEUDOR: 'Deudor',
    PAGADO: 'Pagado',
    CANCELADO: 'Cancelado',
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-AR').format(new Date(value));
};

function ListaVentas() {
    const dispatch = useDispatch();
    const remitos = useSelector((state) => state.remitos || []);
    const totalRemitos = useSelector((state) => state.totalRemitos || 0);
    const remitosPage = useSelector((state) => state.remitosPage || 1);
    const remitosTotalPages = useSelector((state) => state.remitosTotalPages || 1);
    const loading = useSelector((state) => state.loading);
    const [query, setQuery] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);
    const [estadoDrafts, setEstadoDrafts] = useState({});
    const [actualizandoId, setActualizandoId] = useState(null);

    useEffect(() => {
        dispatch(getRemitos({
            page: paginaActual,
            limit: itemsPorPagina,
            estado: estadoFiltro === 'TODOS' ? undefined : estadoFiltro,
        }));
    }, [dispatch, estadoFiltro, itemsPorPagina, paginaActual]);

    useEffect(() => {
        setPaginaActual(1);
    }, [estadoFiltro, itemsPorPagina]);

    useEffect(() => {
        if (remitosPage && remitosPage !== paginaActual) {
            setPaginaActual(remitosPage);
        }
    }, [paginaActual, remitosPage]);

    const ventasFiltradas = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return remitos.filter((venta) => {
            const matchQuery = !normalizedQuery
                ? true
                : `${venta.numeroRemitoFormateado || venta.numeroRemito || ''} ${venta.nombreApellido || ''} ${venta.razonSocial || ''} ${venta.numeroCliente || ''} ${venta.estado || ''}`
                    .toLowerCase()
                    .includes(normalizedQuery);

            return matchQuery;
        });
    }, [query, remitos]);

    const resumen = useMemo(() => {
        return ventasFiltradas.reduce((acc, venta) => {
            acc.cantidad += 1;
            if (venta.estado === 'PAGADO') acc.pagadas += 1;
            if (venta.estado === 'DEUDOR') acc.deudores += 1;
            if (venta.estado === 'PENDIENTE') acc.pendientes += 1;
            return acc;
        }, {
            cantidad: 0,
            pagadas: 0,
            deudores: 0,
            pendientes: 0,
        });
    }, [ventasFiltradas]);

    const verRemito = (venta) => {
        const items = Array.isArray(venta?.pedido) ? venta.pedido : [];
        const detalle = items.length
            ? items.map((item, index) => `${index + 1}. ${item.prenda} - ${item.talle}`).join('<br />')
            : 'Sin items';

        Swal.fire({
            title: venta?.numeroRemitoFormateado || `Remito ${venta?.numeroRemito || ''}`,
            html: `
                <div style="text-align:left">
                    <p><strong>Cliente:</strong> ${venta?.nombreApellido || '-'}</p>
                    <p><strong>Razon social:</strong> ${venta?.razonSocial || '-'}</p>
                    <p><strong>Numero cliente:</strong> ${venta?.numeroCliente || '-'}</p>
                    <p><strong>Estado:</strong> ${estadoLabel[venta?.estado] || venta?.estado || '-'}</p>
                    <p><strong>Items:</strong><br />${detalle}</p>
                </div>
            `,
            confirmButtonText: 'Cerrar',
        });
    };

    const getEstadoDraft = (venta) => (
        estadoDrafts[venta._id] || venta.estado || 'PENDIENTE'
    );

    const handleEstadoDraftChange = (remitoId, estado) => {
        setEstadoDrafts((prev) => ({
            ...prev,
            [remitoId]: estado,
        }));
    };

    const handleActualizarEstado = async (venta) => {
        const remitoId = venta?._id;
        const nextEstado = getEstadoDraft(venta);
        if (!remitoId || !nextEstado || nextEstado === venta.estado) return;

        setActualizandoId(remitoId);
        const response = await dispatch(actualizarEstadoRemito(remitoId, nextEstado));
        setActualizandoId(null);

        if (response?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo actualizar el estado',
                text: response.message || 'Intenta nuevamente.',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `${venta.numeroRemitoFormateado || 'El remito'} ahora esta en ${estadoLabel[nextEstado] || nextEstado}.`,
            timer: 1600,
            showConfirmButton: false,
        });
    };

    return (
        <section className="ventas-page">
            <div className="ventas-shell">
                <header className="ventas-hero">
                    <div>
                        <p className="ventas-kicker">Gestion comercial</p>
                        <h1>Lista de ventas</h1>
                        <p className="ventas-subtitle">
                            Controla operaciones, saldos pendientes y accesos rapidos a remitos desde una sola vista.
                        </p>
                    </div>

                    <NavLink to="/ventas/nueva" className="ventas-add-link">
                        <button type="button" className="ventas-add-btn">
                            <AddIcon fontSize="small" />
                            Agregar venta
                        </button>
                    </NavLink>
                </header>

                <div className="ventas-summary">
                    <article className="ventas-summary-card">
                        <span>Ventas visibles</span>
                        <strong>{resumen.cantidad}</strong>
                    </article>
                    <article className="ventas-summary-card">
                        <span>Total remitos</span>
                        <strong>{totalRemitos}</strong>
                    </article>
                    <article className="ventas-summary-card">
                        <span>Pagados</span>
                        <strong>{resumen.pagadas}</strong>
                    </article>
                    <article className="ventas-summary-card ventas-summary-card--warn">
                        <span>Deudores</span>
                        <strong>{resumen.deudores}</strong>
                    </article>
                </div>

                <div className="ventas-card">
                    <div className="ventas-toolbar">
                        <label className="ventas-search">
                            <SearchIcon fontSize="small" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar por cliente, numero de remito, estado o numero de cliente"
                            />
                        </label>

                        <div className="ventas-filters">
                            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                                <option value="TODOS">Todos los estados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="DEUDOR">Deudores</option>
                                <option value="PAGADO">Pagados</option>
                                <option value="CANCELADO">Cancelados</option>
                            </select>
                            <select value={itemsPorPagina} onChange={(e) => setItemsPorPagina(Number(e.target.value))}>
                                <option value={10}>10 por pagina</option>
                                <option value={20}>20 por pagina</option>
                                <option value={50}>50 por pagina</option>
                            </select>
                        </div>
                    </div>

                    <div className="ventas-table-wrap">
                        <table className="ventas-table">
                            <thead>
                                <tr>
                                    <th>Remito</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Cliente Nro.</th>
                                    <th>Items</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="7" className="ventas-empty">
                                            Cargando remitos...
                                        </td>
                                    </tr>
                                )}

                                {!loading && ventasFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="ventas-empty">
                                            No hay ventas que coincidan con los filtros actuales.
                                        </td>
                                    </tr>
                                )}

                                {!loading && ventasFiltradas.map((venta) => (
                                    <tr key={venta._id || venta.numeroRemito}>
                                        <td>
                                            <div className="ventas-code">
                                                <strong>{venta.numeroRemitoFormateado || `R-${String(venta.numeroRemito || '').padStart(6, '0')}`}</strong>
                                                <span>{venta.razonSocial || '-'}</span>
                                            </div>
                                        </td>
                                        <td>{venta.nombreApellido || '-'}</td>
                                        <td>{formatDate(venta.createdAt)}</td>
                                        <td>
                                            <div className="ventas-status-stack">
                                                <span className={`ventas-status ventas-status--${String(venta.estado || '').toLowerCase()}`}>
                                                    {estadoLabel[venta.estado] || venta.estado || '-'}
                                                </span>
                                                <div className="ventas-estado-editor">
                                                    <select
                                                        value={getEstadoDraft(venta)}
                                                        onChange={(e) => handleEstadoDraftChange(venta._id, e.target.value)}
                                                        disabled={actualizandoId === venta._id}
                                                    >
                                                        <option value="PENDIENTE">Pendiente</option>
                                                        <option value="DEUDOR">Deudor</option>
                                                        <option value="PAGADO">Pagado</option>
                                                        <option value="CANCELADO">Cancelado</option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="ventas-btn ventas-btn--state"
                                                        onClick={() => handleActualizarEstado(venta)}
                                                        disabled={actualizandoId === venta._id || getEstadoDraft(venta) === venta.estado}
                                                    >
                                                        {actualizandoId === venta._id ? 'Guardando...' : 'Actualizar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{venta.numeroCliente || '-'}</td>
                                        <td>{Array.isArray(venta.pedido) ? venta.pedido.length : 0}</td>
                                        <td>
                                            <div className="ventas-actions">
                                                <NavLink
                                                    to={`/ventas/editar/${venta._id}`}
                                                    state={{ remito: venta }}
                                                    className="ventas-action-link"
                                                >
                                                    <button type="button" className="ventas-btn ventas-btn--edit">
                                                        <EditIcon fontSize="inherit" />
                                                        Editar
                                                    </button>
                                                </NavLink>
                                                <button type="button" className="ventas-btn ventas-btn--receipt" onClick={() => verRemito(venta)}>
                                                    <ReceiptLongIcon fontSize="inherit" />
                                                    Remito
                                                </button>
                                                <button type="button" className="ventas-btn ventas-btn--ghost" onClick={() => verRemito(venta)}>
                                                    <VisibilityIcon fontSize="inherit" />
                                                    Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="ventas-pagination">
                        <div className="ventas-pagination-copy">
                            <span>Pagina {remitosPage} de {Math.max(remitosTotalPages, 1)}</span>
                            <strong>{totalRemitos} remitos</strong>
                        </div>

                        <div className="ventas-pagination-actions">
                            <button
                                type="button"
                                className="ventas-btn ventas-btn--ghost"
                                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                                disabled={loading || remitosPage <= 1}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                className="ventas-btn ventas-btn--ghost"
                                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, remitosTotalPages || 1))}
                                disabled={loading || remitosPage >= remitosTotalPages}
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

export default ListaVentas;
