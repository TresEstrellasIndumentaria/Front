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
    RECIBIR_ARTICULOS: 'Recibir articulos',
    RECUENTO_INVENTARIO: 'Recuento de inventario',
    PERDIDA: 'Perdida',
    DANADO: 'Dañado',
    'DAÑADO': 'Dañado',
};

const normalizarMotivo = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

const formatFecha = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const todayIso = new Date().toISOString().slice(0, 10);
const monthAgoIso = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)).toISOString().slice(0, 10);

function HistorialDeInventario() {
    const dispatch = useDispatch();
    const movimientos = useSelector((state) => state.historialInventario || []);
    const loading = useSelector((state) => state.historialInventarioLoading);
    const error = useSelector((state) => state.historialInventarioError);

    const [desde, setDesde] = useState(monthAgoIso);
    const [hasta, setHasta] = useState(todayIso);
    const [colaborador, setColaborador] = useState('TODOS');
    const [motivo, setMotivo] = useState('TODOS');

    useEffect(() => {
        const params = { desde, hasta };
        if (colaborador !== 'TODOS') params.colaborador = colaborador;
        if (motivo !== 'TODOS') params.motivo = motivo;
        dispatch(getHistorialInventario(params));

        return () => {
            dispatch(clearHistorialInventarioError());
        };
    }, [dispatch, desde, hasta, colaborador, motivo]);

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
            const motivoMovimiento = normalizarMotivo(m?.motivo);
            const motivoFiltro = normalizarMotivo(motivo);
            const motivoOk = motivo === 'TODOS' ? true : motivoMovimiento === motivoFiltro;
            return desdeOk && hastaOk && colaboradorOk && motivoOk;
        });
    }, [movimientos, desde, hasta, colaborador, motivo]);

    const exportarCSV = () => {
        if (!rows.length) return;

        const headers = ['Fecha', 'Articulo', 'Tienda', 'Empleado', 'Motivo', 'Ajuste', 'Stock final'];
        const data = rows.map((r) => ([
            formatFecha(r.fecha),
            r.articuloNombre || r.articulo || '-',
            r.tienda || 'Liz',
            r.empleadoNombre || r.empleado || r.colaborador || '-',
            MOTIVO_LABEL[r.motivo] || MOTIVO_LABEL[normalizarMotivo(r.motivo)] || r.motivo || '-',
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
                <td>${r.tienda || 'Liz'}</td>
                <td>${r.empleadoNombre || r.empleado || r.colaborador || '-'}</td>
                <td>${MOTIVO_LABEL[r.motivo] || MOTIVO_LABEL[normalizarMotivo(r.motivo)] || r.motivo || '-'}</td>
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
                                <th>Fecha</th><th>Articulo</th><th>Tienda</th><th>Empleado</th><th>Motivo</th><th>Ajuste</th><th>Stock final</th>
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
                        <option value="RECIBIR_ARTICULOS">Recibir articulos</option>
                        <option value="RECUENTO_INVENTARIO">Recuento de inventario</option>
                        <option value="PERDIDA">Perdida</option>
                        <option value="DAÑADO">Dañado</option>
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
                                <th>Tienda</th>
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
                                    <td>{r.tienda || 'Liz'}</td>
                                    <td>{r.empleadoNombre || r.empleado || r.colaborador || '-'}</td>
                                    <td>{MOTIVO_LABEL[r.motivo] || MOTIVO_LABEL[normalizarMotivo(r.motivo)] || r.motivo || '-'}</td>
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
                            Este historial se alimenta cuando se modifica stock (ajustes, recepciones, perdidas, dañado).
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
