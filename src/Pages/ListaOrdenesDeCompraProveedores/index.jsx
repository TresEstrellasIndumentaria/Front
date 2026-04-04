import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getOrdenesCompra } from '../../Redux/Actions';
import './styles.css';

const ESTADO_LABEL = {
    BORRADOR: 'Borrador',
    ENVIADA: 'Pendiente',
    PARCIALMENTE_RECIBIDA: 'Parcialmente recibida',
    RECIBIDA: 'Recibida',
    CANCELADA: 'Cancelada',
};

const formatFecha = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getProveedorNombre = (orden) => {
    if (orden?.proveedorInfo?.nombre || orden?.proveedorInfo?.apellido) {
        return `${orden.proveedorInfo?.nombre || ''} ${orden.proveedorInfo?.apellido || ''}`.trim();
    }
    if (orden?.proveedor?.nombre || orden?.proveedor?.apellido) {
        return `${orden.proveedor?.nombre || ''} ${orden.proveedor?.apellido || ''}`.trim();
    }
    return orden?.proveedorNombre || 'Sin proveedor';
};

const getTotalOrdenado = (orden) => {
    const articulos = orden?.items || orden?.articulos || [];
    return articulos.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0);
};

const getTotalRecibido = (orden) => {
    const articulos = orden?.items || orden?.articulos || [];
    const recibidoPorItems = articulos.reduce(
        (acc, item) => acc + Number(item?.cantidadRecibida ?? item?.recibido ?? 0),
        0
    );
    if (recibidoPorItems > 0) return recibidoPorItems;
    return Number(orden?.recibido || 0);
};

function ListaOrdenesDeCompraProveedores() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ordenes = useSelector((state) => state.ordenes || []);
    const [filtroEstado, setFiltroEstado] = useState('TODO');
    const [filtroProveedor, setFiltroProveedor] = useState('TODOS');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getOrdenesCompra());
    }, [dispatch]);

    const proveedores = useMemo(() => {
        const map = new Map();
        ordenes.forEach((o) => {
            const nombre = getProveedorNombre(o);
            if (nombre && !map.has(nombre)) map.set(nombre, nombre);
        });
        return Array.from(map.values());
    }, [ordenes]);

    const ordenesFiltradas = useMemo(() => {
        return ordenes.filter((o) => {
            const estadoOk = filtroEstado === 'TODO' ? true : o.estado === filtroEstado;
            const proveedorNombre = getProveedorNombre(o);
            const proveedorOk = filtroProveedor === 'TODOS' ? true : proveedorNombre === filtroProveedor;
            return estadoOk && proveedorOk;
        });
    }, [ordenes, filtroEstado, filtroProveedor]);

    const totalPages = Math.max(1, Math.ceil(ordenesFiltradas.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * rowsPerPage;
    const rows = ordenesFiltradas.slice(start, start + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [filtroEstado, filtroProveedor, rowsPerPage]);

    return (
        <div className="oc-list">
            <div className="oc-list-card">
                <div className="oc-list-toolbar">
                    <button
                        className="oc-add-btn"
                        onClick={() => navigate('/ordenesDeCompras/nueva')}
                    >
                        + Anadir orden de compra
                    </button>

                    <div className="oc-filters">
                        <div className="oc-filter-group">
                            <label>Estado</label>
                            <div className="oc-filter-select">
                                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                    <option value="TODO">Todo</option>
                                    <option value="BORRADOR">Borrador</option>
                                    <option value="ENVIADA">Pendiente</option>
                                    <option value="PARCIALMENTE_RECIBIDA">Parcialmente recibida</option>
                                    <option value="RECIBIDA">Recibida</option>
                                    <option value="CANCELADA">Cancelada</option>
                                </select>
                                <KeyboardArrowDownIcon fontSize="small" />
                            </div>
                        </div>

                        <div className="oc-filter-group">
                            <label>Proveedor</label>
                            <div className="oc-filter-select">
                                <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)}>
                                    <option value="TODOS">Todos los proveedores</option>
                                    {proveedores.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <KeyboardArrowDownIcon fontSize="small" />
                            </div>
                        </div>

                        <button className="oc-search-btn" type="button" aria-label="Buscar">
                            <SearchIcon />
                        </button>
                    </div>
                </div>

                <table className="oc-table">
                    <thead>
                        <tr>
                            <th>Orden de compra #</th>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Tienda</th>
                            <th>Estado</th>
                            <th>Recibido</th>
                            <th>Esperado para</th>
                            <th className="ta-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="8" className="oc-empty">No hay ordenes para mostrar.</td>
                            </tr>
                        )}

                        {rows.map((o) => {
                            const totalItems = getTotalOrdenado(o);
                            const recibido = getTotalRecibido(o);
                            const ordenId = o._id || o.id;
                            return (
                                <tr
                                    key={o._id || o.id || o.numero}
                                    className={ordenId ? 'oc-row-click' : ''}
                                    onClick={() => ordenId && navigate(`/ordenesDeCompras/${ordenId}`)} /* detalle */
                                >
                                    <td>{o.numero || '-'}</td>
                                    <td>{formatFecha(o.fechaOrden)}</td>
                                    <td>{getProveedorNombre(o)}</td>
                                    <td>{o.tiendaDestino || 'Liz'}</td>
                                    <td>{ESTADO_LABEL[o.estado] || o.estado || '-'}</td>
                                    <td>
                                        <div className="oc-recibido">
                                            <progress max={Math.max(totalItems, 1)} value={Math.min(recibido, Math.max(totalItems, 1))} />
                                            <span>{recibido} de {totalItems}</span>
                                        </div>
                                    </td>
                                    <td>{formatFecha(o.fechaEsperada)}</td>
                                    <td className="ta-right">
                                        ${Number(o.totalOrden ?? o.total ?? 0).toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="oc-pagination">
                    <div className="oc-page-arrows">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                            <KeyboardArrowLeftIcon />
                        </button>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            <KeyboardArrowRightIcon />
                        </button>
                    </div>

                    <div className="oc-page-info">
                        <span>Pagina:</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => setPage(Math.max(1, Math.min(totalPages, Number(e.target.value || 1))))}
                        />
                        <span>de {totalPages}</span>
                    </div>

                    <div className="oc-page-size">
                        <span>Filas por pagina:</span>
                        <div className="oc-filter-select compact">
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <KeyboardArrowDownIcon fontSize="small" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ListaOrdenesDeCompraProveedores;
