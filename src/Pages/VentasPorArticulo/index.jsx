import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import { getRemitos } from '../../Redux/Actions';
import './styles.css';

const estadoLabel = {
  PENDIENTE: 'Pendiente',
  DEUDOR: 'Deudor',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
};

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const normalizeText = (value) => String(value || '').trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase() || 'sin-articulo';

const getNombreCliente = (venta) => (
  venta?.nombreApellido?.trim() || venta?.razonSocial?.trim() || 'Sin cliente'
);

const getItemsPedido = (venta) => (
  Array.isArray(venta?.pedido)
    ? venta.pedido.filter((item) => normalizeText(item?.prenda))
    : []
);

function VentasPorArticulo() {
  const dispatch = useDispatch();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [talleFiltro, setTalleFiltro] = useState('TODOS');
  const [orden, setOrden] = useState('UNIDADES_DESC');

  useEffect(() => {
    let active = true;

    const cargarVentas = async () => {
      setLoading(true);
      setError('');

      const limite = 100;
      const primeraPagina = await dispatch(getRemitos({ page: 1, limit: limite }));

      if (!active) return;

      if (primeraPagina?.error) {
        setLoading(false);
        setError(primeraPagina.message || 'No se pudieron cargar las ventas por articulo.');
        return;
      }

      const totalPages = Number(primeraPagina?.totalPages || 1);
      const coleccion = Array.isArray(primeraPagina?.remitos) ? [...primeraPagina.remitos] : [];

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await dispatch(getRemitos({ page, limit: limite }));
        if (!active) return;

        if (response?.error) {
          setLoading(false);
          setError(response.message || 'No se pudo completar la carga de ventas.');
          return;
        }

        if (Array.isArray(response?.remitos)) {
          coleccion.push(...response.remitos);
        }
      }

      const ventasUnicas = Array.from(
        new Map(coleccion.map((venta) => [venta?._id || venta?.numeroRemito, venta])).values()
      );

      setVentas(ventasUnicas);
      setLoading(false);
    };

    cargarVentas();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((venta) => {
      const fecha = String(venta?.createdAt || '').slice(0, 10);
      const matchEstado = estadoFiltro === 'TODOS' ? true : venta?.estado === estadoFiltro;
      const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
      const matchHasta = fechaHasta ? fecha <= fechaHasta : true;

      return matchEstado && matchDesde && matchHasta;
    });
  }, [estadoFiltro, fechaDesde, fechaHasta, ventas]);

  const tallesDisponibles = useMemo(() => {
    const talles = new Set();

    ventasFiltradas.forEach((venta) => {
      getItemsPedido(venta).forEach((item) => {
        if (normalizeText(item?.talle)) talles.add(normalizeText(item.talle));
      });
    });

    return Array.from(talles).sort((a, b) => a.localeCompare(b, 'es'));
  }, [ventasFiltradas]);

  const ventasPorArticulo = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const acumulado = new Map();

    ventasFiltradas.forEach((venta) => {
      const items = getItemsPedido(venta);
      const importePorItem = items.length ? Number(venta?.importeTotal || 0) / items.length : 0;
      const cliente = getNombreCliente(venta);

      items.forEach((item) => {
        const articulo = normalizeText(item?.prenda) || 'Sin articulo';
        const talle = normalizeText(item?.talle) || 'Sin talle';
        const key = normalizeKey(articulo);

        if (talleFiltro !== 'TODOS' && talle !== talleFiltro) return;

        if (!acumulado.has(key)) {
          acumulado.set(key, {
            key,
            articulo,
            unidades: 0,
            importeEstimado: 0,
            remitos: new Set(),
            clientes: new Set(),
            talles: new Map(),
          });
        }

        const row = acumulado.get(key);
        row.unidades += 1;
        row.importeEstimado += importePorItem;
        row.remitos.add(venta?._id || venta?.numeroRemito);
        row.clientes.add(cliente);
        row.talles.set(talle, (row.talles.get(talle) || 0) + 1);
      });
    });

    return Array.from(acumulado.values())
      .map((row) => ({
        ...row,
        remitosCantidad: row.remitos.size,
        clientesCantidad: row.clientes.size,
        tallesDetalle: Array.from(row.talles.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
      }))
      .filter((row) => (
        normalizedQuery
          ? `${row.articulo} ${row.tallesDetalle.map(([talle]) => talle).join(' ')}`.toLowerCase().includes(normalizedQuery)
          : true
      ))
      .sort((a, b) => {
        if (orden === 'UNIDADES_ASC') return a.unidades - b.unidades;
        if (orden === 'IMPORTE_DESC') return b.importeEstimado - a.importeEstimado;
        if (orden === 'IMPORTE_ASC') return a.importeEstimado - b.importeEstimado;
        if (orden === 'ARTICULO_ASC') return a.articulo.localeCompare(b.articulo, 'es');
        return b.unidades - a.unidades;
      });
  }, [orden, query, talleFiltro, ventasFiltradas]);

  const resumen = useMemo(() => {
    const unidades = ventasPorArticulo.reduce((acc, row) => acc + row.unidades, 0);
    const importeEstimado = ventasPorArticulo.reduce((acc, row) => acc + row.importeEstimado, 0);
    const articuloTop = ventasPorArticulo[0]?.articulo || '-';

    return {
      articulos: ventasPorArticulo.length,
      unidades,
      importeEstimado,
      articuloTop,
    };
  }, [ventasPorArticulo]);

  const limpiarFiltros = () => {
    setQuery('');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoFiltro('TODOS');
    setTalleFiltro('TODOS');
    setOrden('UNIDADES_DESC');
  };

  return (
    <section className="ventas-articulo-page">
      <div className="ventas-articulo-shell">
        <header className="ventas-articulo-hero">
          <div>
            <p className="ventas-articulo-kicker">Informes</p>
            <h1>Ventas por articulo</h1>
            <p className="ventas-articulo-subtitle">
              Revisa que prendas se mueven mas, cuantos remitos las incluyen y como se distribuyen por talle.
            </p>
          </div>
        </header>

        <div className="ventas-articulo-summary">
          <article className="ventas-articulo-summary-card">
            <span>Articulos vendidos</span>
            <strong>{resumen.articulos}</strong>
          </article>
          <article className="ventas-articulo-summary-card">
            <span>Unidades visibles</span>
            <strong>{resumen.unidades}</strong>
          </article>
          <article className="ventas-articulo-summary-card">
            <span>Importe estimado</span>
            <strong>{formatMoney(resumen.importeEstimado)}</strong>
          </article>
          <article className="ventas-articulo-summary-card ventas-articulo-summary-card--top">
            <span>Mas vendido</span>
            <strong>{resumen.articuloTop}</strong>
          </article>
        </div>

        <div className="ventas-articulo-card">
          <div className="ventas-articulo-toolbar">
            <label className="ventas-articulo-search">
              <SearchIcon fontSize="small" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por articulo o talle"
              />
            </label>

            <div className="ventas-articulo-filters">
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="DEUDOR">Deudores</option>
                <option value="PAGADO">Pagados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
              <select value={talleFiltro} onChange={(e) => setTalleFiltro(e.target.value)}>
                <option value="TODOS">Todos los talles</option>
                {tallesDisponibles.map((talle) => (
                  <option key={talle} value={talle}>{talle}</option>
                ))}
              </select>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="UNIDADES_DESC">Mas unidades</option>
                <option value="UNIDADES_ASC">Menos unidades</option>
                <option value="IMPORTE_DESC">Mayor importe</option>
                <option value="IMPORTE_ASC">Menor importe</option>
                <option value="ARTICULO_ASC">Articulo A-Z</option>
              </select>
              <button type="button" className="ventas-articulo-btn ventas-articulo-btn--ghost" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="ventas-articulo-note">
            El importe por articulo se calcula prorrateando el total del remito entre sus prendas porque el pedido actual no guarda precio por linea.
          </div>

          <div className="ventas-articulo-table-wrap">
            <table className="ventas-articulo-table">
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>Unidades</th>
                  <th>Remitos</th>
                  <th>Clientes</th>
                  <th>Talles vendidos</th>
                  <th>Importe estimado</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="ventas-articulo-empty">Cargando ventas por articulo...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="6" className="ventas-articulo-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && ventasPorArticulo.length === 0 && (
                  <tr>
                    <td colSpan="6" className="ventas-articulo-empty">No hay articulos para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loading && !error && ventasPorArticulo.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <div className="ventas-articulo-name">
                        <strong>{row.articulo}</strong>
                        <span>{row.unidades === 1 ? '1 prenda vendida' : `${row.unidades} prendas vendidas`}</span>
                      </div>
                    </td>
                    <td>{row.unidades}</td>
                    <td>{row.remitosCantidad}</td>
                    <td>{row.clientesCantidad}</td>
                    <td>
                      <div className="ventas-articulo-sizes">
                        {row.tallesDetalle.slice(0, 6).map(([talle, cantidad]) => (
                          <span key={`${row.key}-${talle}`}>{talle}: {cantidad}</span>
                        ))}
                      </div>
                    </td>
                    <td className="ventas-articulo-money">{formatMoney(row.importeEstimado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="ventas-articulo-total-label">Totales visibles</td>
                  <td>{resumen.unidades}</td>
                  <td colSpan="3">{ventasFiltradas.length} ventas filtradas</td>
                  <td className="ventas-articulo-money">{formatMoney(resumen.importeEstimado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="ventas-articulo-footer">
            <span>{ventas.length} ventas cargadas en total</span>
            <strong>{estadoLabel[estadoFiltro] || 'Todos los estados'}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VentasPorArticulo;
