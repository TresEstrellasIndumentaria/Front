import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { getInformeFinanciero } from '../../Redux/Actions';
import './styles.css';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, index) => currentYear - index);

const SERIES = {
    flujo: [
        { key: 'ingresos', label: 'Ingresos', className: 'informe-financiero-bar--ingresos' },
        { key: 'egresos', label: 'Egresos', className: 'informe-financiero-bar--egresos' },
        { key: 'neto', label: 'Neto', className: 'informe-financiero-bar--neto' },
    ],
    facturacion: [
        { key: 'ventasFacturadas', label: 'Ventas', className: 'informe-financiero-bar--ventas' },
        { key: 'comprasGeneradas', label: 'Compras', className: 'informe-financiero-bar--compras' },
        { key: 'rentabilidadBruta', label: 'Rentabilidad', className: 'informe-financiero-bar--rentabilidad' },
    ],
    todo: [
        { key: 'ingresos', label: 'Ingresos', className: 'informe-financiero-bar--ingresos' },
        { key: 'egresos', label: 'Egresos', className: 'informe-financiero-bar--egresos' },
        { key: 'ventasFacturadas', label: 'Ventas', className: 'informe-financiero-bar--ventas' },
        { key: 'comprasGeneradas', label: 'Compras', className: 'informe-financiero-bar--compras' },
    ],
};

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const formatPercent = (value) => `${Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}%`;

function InformeFinanciero() {
    const dispatch = useDispatch();
    const [year, setYear] = useState(currentYear);
    const [modo, setModo] = useState('flujo');
    const [data, setData] = useState({ meses: [], resumen: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        dispatch(getInformeFinanciero({ year })).then((response) => {
            if (!active) return;
            setLoading(false);

            if (response?.error) {
                setError(response.message || 'No se pudo cargar el informe financiero.');
                setData({ meses: [], resumen: {} });
                return;
            }

            setData({
                meses: Array.isArray(response?.meses) ? response.meses : [],
                resumen: response?.resumen || {},
            });
        });

        return () => {
            active = false;
        };
    }, [dispatch, year]);

    const series = SERIES[modo] || SERIES.flujo;

    const maxValue = useMemo(() => {
        const values = (data.meses || []).flatMap((mes) => (
            series.map((serie) => Math.abs(Number(mes?.[serie.key] || 0)))
        ));
        return Math.max(...values, 1);
    }, [data.meses, series]);

    const resumen = data.resumen || {};

    return (
        <section className="informe-financiero-page">
            <div className="informe-financiero-shell">
                <header className="informe-financiero-hero">
                    <p className="informe-financiero-kicker">Informes</p>
                    <h1>Informe financiero</h1>
                    <p className="informe-financiero-subtitle">
                        Comparacion mensual de cobros, pagos, ventas y compras del ano seleccionado.
                    </p>
                </header>

                <div className="informe-financiero-toolbar">
                    <label className="informe-financiero-filter">
                        <CalendarTodayIcon fontSize="small" />
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {years.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <KeyboardArrowDownIcon fontSize="small" />
                    </label>

                    <label className="informe-financiero-filter">
                        <TrendingUpOutlinedIcon fontSize="small" />
                        <select value={modo} onChange={(e) => setModo(e.target.value)}>
                            <option value="flujo">Flujo real</option>
                            <option value="facturacion">Facturacion</option>
                            <option value="todo">Vista completa</option>
                        </select>
                        <KeyboardArrowDownIcon fontSize="small" />
                    </label>
                </div>

                <div className="informe-financiero-summary">
                    <article className="informe-financiero-summary-card">
                        <span>Ingresos cobrados</span>
                        <strong>{formatMoney(resumen.ingresos)}</strong>
                        <PaymentsOutlinedIcon fontSize="small" />
                    </article>
                    <article className="informe-financiero-summary-card">
                        <span>Egresos pagados</span>
                        <strong>{formatMoney(resumen.egresos)}</strong>
                        <ReceiptLongOutlinedIcon fontSize="small" />
                    </article>
                    <article className="informe-financiero-summary-card informe-financiero-summary-card--neto">
                        <span>Resultado neto</span>
                        <strong>{formatMoney(resumen.neto)}</strong>
                        <AccountBalanceWalletOutlinedIcon fontSize="small" />
                    </article>
                    <article className="informe-financiero-summary-card">
                        <span>Margen bruto</span>
                        <strong>{formatPercent(resumen.margenBruto)}</strong>
                        <SavingsOutlinedIcon fontSize="small" />
                    </article>
                </div>

                <section className="informe-financiero-card">
                    <div className="informe-financiero-card-head">
                        <div>
                            <h2>Evolucion mensual</h2>
                            <p>{modo === 'flujo' ? 'Cobros y pagos reales' : 'Actividad generada en ventas y compras'}</p>
                        </div>
                        <div className="informe-financiero-legend">
                            {series.map((serie) => (
                                <span key={serie.key}>
                                    <i className={serie.className}></i>
                                    {serie.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="informe-financiero-empty">
                            <h3>No se pudo cargar el informe</h3>
                            <p>{error}</p>
                        </div>
                    )}

                    {!error && (
                        <div className="informe-financiero-chart" aria-label="Grafico mensual de informe financiero">
                            {(data.meses || []).map((mes) => (
                                <div className="informe-financiero-month" key={mes.mes}>
                                    <div className="informe-financiero-bars">
                                        {series.map((serie) => {
                                            const value = Number(mes?.[serie.key] || 0);
                                            const height = Math.max(2, (Math.abs(value) / maxValue) * 100);

                                            return (
                                                <div
                                                    key={`${mes.mes}-${serie.key}`}
                                                    className={`informe-financiero-bar ${serie.className} ${value < 0 ? 'informe-financiero-bar--negative' : ''}`}
                                                    style={{ height: `${height}%` }}
                                                    title={`${serie.label}: ${formatMoney(value)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <span>{mes.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {!error && loading && (
                        <div className="informe-financiero-empty">
                            <h3>Cargando informe...</h3>
                        </div>
                    )}
                </section>

                <section className="informe-financiero-table-card">
                    <div className="informe-financiero-card-head">
                        <div>
                            <h2>Detalle por mes</h2>
                            <p>Cobros, pagos y actividad comercial del periodo.</p>
                        </div>
                    </div>

                    <div className="informe-financiero-table-wrap">
                        <table className="informe-financiero-table">
                            <thead>
                                <tr>
                                    <th>Mes</th>
                                    <th>Ingresos</th>
                                    <th>Egresos</th>
                                    <th>Neto</th>
                                    <th>Ventas</th>
                                    <th>Compras</th>
                                    <th>Rentabilidad</th>
                                    <th>Movimientos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.meses || []).map((mes) => (
                                    <tr key={`row-${mes.mes}`}>
                                        <td>{mes.label}</td>
                                        <td>{formatMoney(mes.ingresos)}</td>
                                        <td>{formatMoney(mes.egresos)}</td>
                                        <td className={Number(mes.neto || 0) < 0 ? 'informe-financiero-negative' : 'informe-financiero-positive'}>
                                            {formatMoney(mes.neto)}
                                        </td>
                                        <td>{formatMoney(mes.ventasFacturadas)}</td>
                                        <td>{formatMoney(mes.comprasGeneradas)}</td>
                                        <td>{formatMoney(mes.rentabilidadBruta)}</td>
                                        <td>{Number(mes.cantidadCobros || 0) + Number(mes.cantidadPagos || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td>Total</td>
                                    <td>{formatMoney(resumen.ingresos)}</td>
                                    <td>{formatMoney(resumen.egresos)}</td>
                                    <td className={Number(resumen.neto || 0) < 0 ? 'informe-financiero-negative' : 'informe-financiero-positive'}>
                                        {formatMoney(resumen.neto)}
                                    </td>
                                    <td>{formatMoney(resumen.ventasFacturadas)}</td>
                                    <td>{formatMoney(resumen.comprasGeneradas)}</td>
                                    <td>{formatMoney(resumen.rentabilidadBruta)}</td>
                                    <td>{Number(resumen.cantidadCobros || 0) + Number(resumen.cantidadPagos || 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                <section className="informe-financiero-help">
                    <div>
                        <h2>Criterio del informe</h2>
                        <p>
                            Flujo real muestra dinero efectivamente cobrado o pagado. Facturacion muestra operaciones generadas, aunque no esten cobradas o pagadas por completo.
                        </p>
                    </div>

                    <div className="informe-financiero-help-grid">
                        <article>
                            <strong>Ingresos</strong>
                            <span>Plata cobrada</span>
                            <small>Recibos</small>
                        </article>
                        <article>
                            <strong>Ventas</strong>
                            <span>Remitos emitidos</span>
                            <small>Remitos</small>
                        </article>
                        <article>
                            <strong>Egresos</strong>
                            <span>Plata pagada</span>
                            <small>Pagos a proveedor</small>
                        </article>
                        <article>
                            <strong>Compras</strong>
                            <span>Compras generadas</span>
                            <small>Ordenes de compra</small>
                        </article>
                    </div>
                </section>
            </div>
        </section>
    );
}

export default InformeFinanciero;
