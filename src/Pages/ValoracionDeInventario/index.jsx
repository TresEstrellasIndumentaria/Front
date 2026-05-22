import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getValoracionInventario } from '../../Redux/Actions';
import './styles.css';

const todayIso = new Date().toISOString().slice(0, 10);

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const formatNumber = (value) => Number(value || 0).toLocaleString('es-AR');

const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${Number(value).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
};

function ValoracionDeInventario() {
    const dispatch = useDispatch();
    const [fechaValoracion, setFechaValoracion] = useState(todayIso);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
    const [data, setData] = useState({ rows: [], resumen: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        dispatch(getValoracionInventario({ fecha: fechaValoracion })).then((response) => {
            if (!active) return;
            setLoading(false);

            if (response?.error) {
                setError(response.message || 'No se pudo cargar la valoracion.');
                setData({ rows: [], resumen: {} });
                return;
            }

            setData({
                rows: Array.isArray(response?.rows) ? response.rows : [],
                resumen: response?.resumen || {},
            });
        });

        return () => {
            active = false;
        };
    }, [dispatch, fechaValoracion]);

    const categoriasDisponibles = useMemo(() => (
        Array.from(new Set((data.rows || []).map((row) => row.categoria || 'Sin categoria')))
            .sort((a, b) => a.localeCompare(b, 'es'))
    ), [data.rows]);

    const rows = useMemo(() => {
        return (data.rows || []).filter((row) => {
            if (categoriaSeleccionada === 'TODAS') return true;
            return row.categoria === categoriaSeleccionada;
        });
    }, [data.rows, categoriaSeleccionada]);

    const resumenVisible = useMemo(() => rows.reduce((acc, row) => {
        acc.valorInventarioTotal += Number(row.valorInventario || 0);
        acc.valorVentaTotal += Number(row.valorVenta || 0);
        acc.beneficioPotencial += Number(row.beneficioPotencial || 0);
        return acc;
    }, {
        valorInventarioTotal: 0,
        valorVentaTotal: 0,
        beneficioPotencial: 0,
    }), [rows]);

    const margenTotal = resumenVisible.valorVentaTotal > 0
        ? (resumenVisible.beneficioPotencial / resumenVisible.valorVentaTotal) * 100
        : 0;

    return (
        <div className="valoracion-page">
            <div className="valoracion-toolbar">
                <div className="valoracion-filter">
                    <CalendarTodayIcon className="muted" fontSize="small" />
                    <input
                        type="date"
                        value={fechaValoracion}
                        onChange={(e) => setFechaValoracion(e.target.value)}
                    />
                </div>

                <div className="valoracion-filter valoracion-filter--select">
                    <CategoryOutlinedIcon className="muted" fontSize="small" />
                    <select
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    >
                        <option value="TODAS">Todas las categorias</option>
                        {categoriasDisponibles.map((categoria) => (
                            <option key={categoria} value={categoria}>
                                {categoria}
                            </option>
                        ))}
                    </select>
                    <KeyboardArrowDownIcon className="muted" fontSize="small" />
                </div>
            </div>

            <div className="valoracion-note">
                <InfoOutlinedIcon fontSize="small" />
                <p>
                    La valoracion usa movimientos de inventario hasta la fecha seleccionada. Los articulos sin movimientos historicos usan stock actual hasta que el sistema acumule historial productivo.
                </p>
            </div>

            <div className="valoracion-summary-grid">
                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Valor de inventario total</span>
                        <Inventory2OutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumenVisible.valorInventarioTotal)}</strong>
                    <p>Costo multiplicado por stock a la fecha seleccionada.</p>
                </article>

                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Valor de venta total</span>
                        <LocalOfferOutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumenVisible.valorVentaTotal)}</strong>
                    <p>Precio de venta multiplicado por stock valorizable.</p>
                </article>

                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Beneficio potencial</span>
                        <SavingsOutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumenVisible.beneficioPotencial)}</strong>
                    <p>Diferencia entre valor de venta total y valor de inventario total.</p>
                </article>

                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Margen</span>
                        <PercentOutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatPercent(margenTotal)}</strong>
                    <p>Beneficio potencial dividido por el valor de venta total.</p>
                </article>
            </div>

            <section className="valoracion-table-card">
                <div className="valoracion-table-head">
                    <div>
                        <h2>Detalle por articulo</h2>
                        <p>{rows.length} articulos considerados</p>
                    </div>
                </div>

                {error && (
                    <div className="valoracion-empty">
                        <h3>No se pudo cargar la valoracion</h3>
                        <p>{error}</p>
                    </div>
                )}

                {!error && (
                    <div className="valoracion-table-wrap">
                        <table className="valoracion-table">
                            <thead>
                                <tr>
                                    <th>Articulo</th>
                                    <th>Categoria</th>
                                    <th>En stock</th>
                                    <th>Costo</th>
                                    <th>Precio</th>
                                    <th>Valor de inventario</th>
                                    <th>Valor de venta</th>
                                    <th>Beneficio potencial</th>
                                    <th>Margen</th>
                                    <th>Fuente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.nombre}</td>
                                        <td>{row.categoria}</td>
                                        <td className={row.stock < 0 ? 'valoracion-stock-negativo' : ''}>
                                            {formatNumber(row.stock)}
                                        </td>
                                        <td>{formatMoney(row.coste)}</td>
                                        <td>{row.precio === null ? 'Precio variable' : formatMoney(row.precio)}</td>
                                        <td>{formatMoney(row.valorInventario)}</td>
                                        <td>{formatMoney(row.valorVenta)}</td>
                                        <td>{formatMoney(row.beneficioPotencial)}</td>
                                        <td>{formatPercent(row.margen)}</td>
                                        <td>{row.usaStockActualFallback ? 'Stock actual' : 'Historico'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!error && !loading && rows.length === 0 && (
                    <div className="valoracion-empty">
                        <h3>No hay articulos para mostrar</h3>
                        <p>Proba cambiando la categoria seleccionada o cargando articulos en el sistema.</p>
                    </div>
                )}

                {loading && (
                    <div className="valoracion-empty">
                        <h3>Cargando valoracion...</h3>
                    </div>
                )}
            </section>
        </div>
    );
}

export default ValoracionDeInventario;
