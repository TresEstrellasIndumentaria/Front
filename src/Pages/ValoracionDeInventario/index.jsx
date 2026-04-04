import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getAllArticulos, getCategorias } from '../../Redux/Actions';
import './styles.css';

const todayIso = new Date().toISOString().slice(0, 10);

const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const formatNumber = (value) => Number(value || 0).toLocaleString('es-AR');

const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `${Number(value).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
};

const getCategoriaNombre = (categoria) => {
    if (!categoria) return 'Sin categoria';
    if (typeof categoria === 'string') return categoria;
    return categoria.nombre || categoria.label || 'Sin categoria';
};

function ValoracionDeInventario() {
    const dispatch = useDispatch();
    const articulos = useSelector((state) => state.articulos || []);
    const categorias = useSelector((state) => state.categorias || []);

    const [fechaValoracion, setFechaValoracion] = useState(todayIso);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');

    useEffect(() => {
        if (!articulos.length) dispatch(getAllArticulos());
        if (!categorias.length) dispatch(getCategorias());
    }, [dispatch, articulos.length, categorias.length]);

    const categoriasDisponibles = useMemo(() => {
        const categoriasDesdeArticulos = articulos.map((art) => getCategoriaNombre(art?.categoria));
        const categoriasDesdeCatalogo = categorias.map((cat) => getCategoriaNombre(cat));

        return Array.from(new Set([...categoriasDesdeCatalogo, ...categoriasDesdeArticulos].filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
    }, [articulos, categorias]);

    const rows = useMemo(() => {
        return articulos
            .filter((art) => {
                if (categoriaSeleccionada === 'TODAS') return true;
                return getCategoriaNombre(art?.categoria) === categoriaSeleccionada;
            })
            .map((art) => {
                const stock = Number(art?.stock ?? 0);
                const coste = Number(art?.coste ?? 0);
                const precio = toNumberOrNull(art?.precio);
                const tienePrecioVenta = precio !== null;
                const stockParaInventario = stock > 0 ? stock : 0;
                const stockParaVenta = stock >= 0 ? stock : 0;
                const valorInventario = stockParaInventario * coste;
                const valorVenta = stock >= 0 && tienePrecioVenta ? stockParaVenta * precio : 0;
                const beneficioPotencial = stock >= 0 && tienePrecioVenta ? valorVenta - valorInventario : 0;
                const margen = valorVenta > 0 ? (beneficioPotencial / valorVenta) * 100 : null;

                return {
                    id: art?._id || art?.id || art?.nombre,
                    nombre: art?.nombre || 'Sin nombre',
                    categoria: getCategoriaNombre(art?.categoria),
                    stock,
                    coste,
                    precio,
                    valorInventario,
                    valorVenta,
                    beneficioPotencial,
                    margen,
                };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [articulos, categoriaSeleccionada]);

    const resumen = useMemo(() => {
        return rows.reduce((acc, row) => {
            acc.valorInventarioTotal += row.valorInventario;
            acc.valorVentaTotal += row.valorVenta;
            acc.beneficioPotencial += row.beneficioPotencial;
            return acc;
        }, {
            valorInventarioTotal: 0,
            valorVentaTotal: 0,
            beneficioPotencial: 0,
        });
    }, [rows]);

    const margenTotal = resumen.valorVentaTotal > 0
        ? (resumen.beneficioPotencial / resumen.valorVentaTotal) * 100
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
                <p>La fecha es de referencia visual. La valoracion se calcula con el stock actual porque no hay corte historico en frontend.</p>
            </div>

            <div className="valoracion-summary-grid">
                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Valor de inventario total</span>
                        <Inventory2OutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumen.valorInventarioTotal)}</strong>
                    <p>Coste multiplicado por stock, excluyendo stock negativo.</p>
                </article>

                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Valor de venta total</span>
                        <LocalOfferOutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumen.valorVentaTotal)}</strong>
                    <p>Precio por stock, sin considerar stock negativo ni precio vacio.</p>
                </article>

                <article className="valoracion-summary-card">
                    <div className="valoracion-summary-head">
                        <span>Beneficio potencial</span>
                        <SavingsOutlinedIcon fontSize="small" />
                    </div>
                    <strong>{formatMoney(resumen.beneficioPotencial)}</strong>
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

                <div className="valoracion-table-wrap">
                    <table className="valoracion-table">
                        <thead>
                            <tr>
                                <th>Articulo</th>
                                <th>Categoria</th>
                                <th>En stock</th>
                                <th>Coste</th>
                                <th>Precio</th>
                                <th>Valor de inventario</th>
                                <th>Valor de venta</th>
                                <th>Beneficio potencial</th>
                                <th>Margen</th>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!rows.length && (
                    <div className="valoracion-empty">
                        <h3>No hay articulos para mostrar</h3>
                        <p>Proba cambiando la categoria seleccionada o cargando articulos en el sistema.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default ValoracionDeInventario;
