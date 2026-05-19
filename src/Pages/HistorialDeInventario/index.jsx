import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HistoryIcon from '@mui/icons-material/History';
import { clearHistorialInventarioError, getHistorialInventario } from '../../Redux/Actions';
import './styles.css';

const MOTIVO_LABEL = {
    RECIBIR_ARTICULOS: 'Compra',
    RECEPCION_COMPRA: 'Compra',
    ORDEN_COMPRA: 'Compra',
    COMPRA: 'Compra',
    VENTA_REMITO: 'Venta',
    VENTA: 'Venta',
    AJUSTE_REMITO: 'Ajuste',
    RECUENTO_INVENTARIO: 'Ajuste',
    AJUSTE_STOCK: 'Ajuste',
    AJUSTE: 'Ajuste',
    ELIMINACION_REMITO: 'Eliminacion',
    PERDIDA: 'Perdida',
    DANADO: 'Danado',
};

const normalizarMotivo = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_');

const formatFecha = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getMotivoLabel = (movimiento) => {
    const motivoNormalizado = normalizarMotivo(movimiento?.motivo);
    if (MOTIVO_LABEL[motivoNormalizado]) return MOTIVO_LABEL[motivoNormalizado];

    const anotaciones = normalizarMotivo(movimiento?.anotaciones);
    if (anotaciones.includes('REMITO')) {
        return Number(movimiento?.ajuste || 0) < 0 ? 'Venta' : 'Ajuste';
    }

    if (Number(movimiento?.ajuste || 0) > 0) return 'Compra';
    if (Number(movimiento?.ajuste || 0) < 0) return 'Venta';
    return movimiento?.motivo || 'Ajuste';
};

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMesActualRange = () => {
    const today = new Date();
    return {
        desde: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
        hasta: toDateInputValue(today),
    };
};

function HistorialDeInventario() {
    const dispatch = useDispatch();
    const movimientos = useSelector((state) => state.historialInventario || []);
    const loading = useSelector((state) => state.historialInventarioLoading);
    const error = useSelector((state) => state.historialInventarioError);
    const mesActual = useMemo(() => getMesActualRange(), []);

    const [desde, setDesde] = useState(mesActual.desde);
    const [hasta, setHasta] = useState(mesActual.hasta);
    const [colaborador, setColaborador] = useState('TODOS');
    const [motivo, setMotivo] = useState('TODOS');

    useEffect(() => {
        const params = { desde, hasta };
        if (colaborador !== 'TODOS') params.colaborador = colaborador;
        dispatch(getHistorialInventario(params));

        return () => {
            dispatch(clearHistorialInventarioError());
        };
    }, [dispatch, desde, hasta, colaborador]);

    const colaboradores = useMemo(() => {
        const map = new Map();
        movimientos.forEach((m) => {
            const nombre = m?.empleadoNombre || m?.empleado || m?.colaborador;
            if (nombre) map.set(nombre, nombre);
        });
        return Array.from(map.values());
    }, [movimientos]);

    const rows = useMemo(() => {
        return movimientos.filter((m) => {
            const fecha = m?.fecha ? new Date(m.fecha) : null;
            const desdeOk = fecha ? fecha >= new Date(`${desde}T00:00:00`) : true;
            const hastaOk = fecha ? fecha <= new Date(`${hasta}T23:59:59`) : true;
            const colaboradorNombre = m?.empleadoNombre || m?.empleado || m?.colaborador;
            const colaboradorOk = colaborador === 'TODOS' ? true : colaboradorNombre === colaborador;
            const motivoOk = motivo === 'TODOS' ? true : getMotivoLabel(m) === motivo;
            return desdeOk && hastaOk && colaboradorOk && motivoOk;
        });
    }, [movimientos, desde, hasta, colaborador, motivo]);

    const exportarCSV = () => {
        if (!rows.length) return;

        const headers = ['Fecha', 'Articulo', 'Empleado', 'Motivo', 'Ajuste', 'Stock final'];
        const data = rows.map((r) => ([
            formatFecha(r.fecha),
            r.articuloNombre || r.articulo || '-',
            r.empleadoNombre || r.empleado || r.colaborador || '-',
            getMotivoLabel(r),
            Number(r.ajuste || 0),
            Number(r.stockFinal ?? 0),
        ]));

        const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [headers, ...data].map((row) => row.map(escapeCsv).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_inventario_${desde}_${hasta}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportarPDF = () => {
        if (!rows.length) return;
        const htmlRows = rows.map((r) => `
            <tr>
                <td>${formatFecha(r.fecha)}</td>
                <td>${r.articuloNombre || r.articulo || '-'}</td>
                <td>${r.empleadoNombre || r.empleado || r.colaborador || '-'}</td>
                <td>${getMotivoLabel(r)}</td>
                <td>${Number(r.ajuste || 0)}</td>
                <td>${Number(r.stockFinal ?? 0)}</td>
            </tr>
        `).join('');

        const w = window.open('', '_blank');
        if (!w) return;

        w.document.write(`
            <html>
                <head>
                    <title>Historial de inventario</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 16px; }
                        h2 { margin: 0 0 12px; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h2>Historial de inventario (${desde} a ${hasta})</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th><th>Articulo</th><th>Empleado</th><th>Motivo</th><th>Ajuste</th><th>Stock final</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                </body>
            </html>
        `);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <div className="hist-page">
            <div className="hist-filters">
                <div className="hist-filter hist-date-range">
                    <KeyboardArrowLeftIcon className="muted" />
                    <CalendarTodayIcon className="muted" fontSize="small" />
                    <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                    <span className="muted">-</span>
                    <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                    <KeyboardArrowRightIcon className="muted" />
                </div>

                <div className="hist-filter">
                    <PersonIcon className="muted" fontSize="small" />
                    <select value={colaborador} onChange={(e) => setColaborador(e.target.value)}>
                        <option value="TODOS">Todos los colaboradores</option>
                        {colaboradores.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <KeyboardArrowDownIcon className="muted" fontSize="small" />
                </div>

                <div className="hist-filter">
                    <FilterListIcon className="muted" fontSize="small" />
                    <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                        <option value="TODOS">Todos los motivos</option>
                        <option value="Venta">Venta</option>
                        <option value="Compra">Compra</option>
                        <option value="Ajuste">Ajuste</option>
                        <option value="Eliminacion">Eliminacion</option>
                        <option value="Perdida">Perdida</option>
                        <option value="Danado">Danado</option>
                    </select>
                    <KeyboardArrowDownIcon className="muted" fontSize="small" />
                </div>
            </div>

            <div className="hist-card">
                <div className="hist-toolbar">
                    <div className="hist-export-group">
                        <button type="button" className="hist-export-btn" onClick={exportarCSV} disabled={!rows.length}>
                            Exportar CSV
                        </button>
                        <button type="button" className="hist-export-btn" onClick={exportarPDF} disabled={!rows.length}>
                            Exportar PDF
                        </button>
                    </div>
                </div>

                {error && !loading && (
                    <div className="hist-empty">
                        <h3>No se pudo cargar el historial</h3>
                        <p>{error}</p>
                    </div>
                )}

                {!error && (
                    <table className="hist-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Articulo</th>
                                <th>Empleado</th>
                                <th>Motivo</th>
                                <th>Ajuste</th>
                                <th>Stock final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, idx) => (
                                <tr key={`${r?._id || 'mov'}-${idx}`}>
                                    <td>{formatFecha(r.fecha)}</td>
                                    <td>{r.articuloNombre || r.articulo || '-'}</td>
                                    <td>{r.empleadoNombre || r.empleado || r.colaborador || '-'}</td>
                                    <td>{getMotivoLabel(r)}</td>
                                    <td>{Number(r.ajuste || 0) > 0 ? `+${r.ajuste}` : Number(r.ajuste || 0)}</td>
                                    <td>{r.stockFinal ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!error && !loading && rows.length === 0 && (
                    <div className="hist-empty">
                        <div className="hist-empty-icon">
                            <HistoryIcon />
                        </div>
                        <h3>No hay datos disponibles</h3>
                        <p>No hay movimientos de stock en el periodo de tiempo seleccionado</p>
                        <p className="hist-empty-help">
                            Este historial se alimenta cuando se modifica stock por ventas, compras y ajustes.
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="hist-empty">
                        <h3>Cargando historial...</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistorialDeInventario;
