import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import PaidIcon from '@mui/icons-material/Paid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import './styles.css';

const ventasMock = [
    {
        id: 'VTA-0001',
        cliente: 'Lucia Fernandez',
        fecha: '03/04/2026',
        total: 185000,
        estado: 'PAGADA',
        metodoPago: 'Transferencia',
        vendedor: 'Florencia',
        items: 5,
    },
    {
        id: 'VTA-0002',
        cliente: 'Marcos Diaz',
        fecha: '02/04/2026',
        total: 94350,
        estado: 'DEUDOR',
        metodoPago: 'Cuenta corriente',
        vendedor: 'Sofia',
        items: 3,
    },
    {
        id: 'VTA-0003',
        cliente: 'Tienda Belgrano',
        fecha: '01/04/2026',
        total: 412900,
        estado: 'PAGADA',
        metodoPago: 'Efectivo',
        vendedor: 'Florencia',
        items: 11,
    },
    {
        id: 'VTA-0004',
        cliente: 'Carla Mendoza',
        fecha: '31/03/2026',
        total: 128700,
        estado: 'DEUDOR',
        metodoPago: 'Seña + saldo',
        vendedor: 'Luciano',
        items: 4,
    },
    {
        id: 'VTA-0005',
        cliente: 'Juan Pablo Rios',
        fecha: '30/03/2026',
        total: 76990,
        estado: 'PAGADA',
        metodoPago: 'Debito',
        vendedor: 'Sofia',
        items: 2,
    },
];

const formatMoney = (value) => (
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(value || 0)
);

function ListaVentas() {
    const [query, setQuery] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('TODOS');

    const ventasFiltradas = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return ventasMock.filter((venta) => {
            const matchEstado = estadoFiltro === 'TODOS' ? true : venta.estado === estadoFiltro;
            const matchQuery = !normalizedQuery
                ? true
                : `${venta.id} ${venta.cliente} ${venta.metodoPago} ${venta.vendedor}`
                    .toLowerCase()
                    .includes(normalizedQuery);

            return matchEstado && matchQuery;
        });
    }, [estadoFiltro, query]);

    const resumen = useMemo(() => {
        return ventasFiltradas.reduce((acc, venta) => {
            acc.total += venta.total;
            acc.cantidad += 1;
            if (venta.estado === 'PAGADA') acc.pagadas += 1;
            if (venta.estado === 'DEUDOR') acc.deudores += 1;
            return acc;
        }, {
            total: 0,
            cantidad: 0,
            pagadas: 0,
            deudores: 0,
        });
    }, [ventasFiltradas]);

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
                        <span>Total visible</span>
                        <strong>{formatMoney(resumen.total)}</strong>
                    </article>
                    <article className="ventas-summary-card">
                        <span>Pagadas</span>
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
                                placeholder="Buscar por cliente, codigo, vendedor o pago"
                            />
                        </label>

                        <div className="ventas-filters">
                            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                                <option value="TODOS">Todos los estados</option>
                                <option value="PAGADA">Pagadas</option>
                                <option value="DEUDOR">Deudores</option>
                            </select>
                        </div>
                    </div>

                    <div className="ventas-table-wrap">
                        <table className="ventas-table">
                            <thead>
                                <tr>
                                    <th>Venta</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Pago</th>
                                    <th>Items</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="ventas-empty">
                                            No hay ventas que coincidan con los filtros actuales.
                                        </td>
                                    </tr>
                                )}

                                {ventasFiltradas.map((venta) => (
                                    <tr key={venta.id}>
                                        <td>
                                            <div className="ventas-code">
                                                <strong>{venta.id}</strong>
                                                <span>{venta.vendedor}</span>
                                            </div>
                                        </td>
                                        <td>{venta.cliente}</td>
                                        <td>{venta.fecha}</td>
                                        <td className="ventas-total-cell">
                                            <PaidIcon fontSize="small" />
                                            <span>{formatMoney(venta.total)}</span>
                                        </td>
                                        <td>
                                            <span className={`ventas-status ventas-status--${venta.estado.toLowerCase()}`}>
                                                {venta.estado === 'PAGADA' ? 'Pagada' : 'Deudor'}
                                            </span>
                                        </td>
                                        <td>{venta.metodoPago}</td>
                                        <td>{venta.items}</td>
                                        <td>
                                            <div className="ventas-actions">
                                                <button type="button" className="ventas-btn ventas-btn--edit">
                                                    <EditIcon fontSize="inherit" />
                                                    Editar
                                                </button>
                                                <button type="button" className="ventas-btn ventas-btn--receipt">
                                                    <DescriptionIcon fontSize="inherit" />
                                                    Remito
                                                </button>
                                                <button type="button" className="ventas-btn ventas-btn--ghost">
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
                </div>
            </div>
        </section>
    );
}

export default ListaVentas;
