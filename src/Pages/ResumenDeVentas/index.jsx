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

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(value));
};

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const getCantidadPrendas = (pedido) => (
  Array.isArray(pedido)
    ? pedido.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0)
    : 0
);

const getNombreCliente = (venta) => (
  venta?.nombreApellido?.trim() || venta?.razonSocial?.trim() || 'Sin cliente'
);

function ResumenDeVentas() {
  const dispatch = useDispatch();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [orden, setOrden] = useState('FECHA_DESC');
  const [importeMinimo, setImporteMinimo] = useState('');

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
        setError(primeraPagina.message || 'No se pudo cargar el resumen de ventas.');
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
    const normalizedQuery = query.trim().toLowerCase();
    const minimo = importeMinimo === '' ? null : Number(importeMinimo);

    return [...ventas]
      .filter((venta) => {
        const fecha = String(venta?.createdAt || '').slice(0, 10);
        const importeTotal = Number(venta?.importeTotal || 0);
        const textoBusqueda = [
          venta?.numeroRemitoFormateado,
          venta?.numeroRemito,
          venta?.nombreApellido,
          venta?.razonSocial,
          venta?.numeroCliente,
          venta?.estado,
        ].join(' ').toLowerCase();

        const matchQuery = normalizedQuery ? textoBusqueda.includes(normalizedQuery) : true;
        const matchEstado = estadoFiltro === 'TODOS' ? true : venta?.estado === estadoFiltro;
        const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
        const matchHasta = fechaHasta ? fecha <= fechaHasta : true;
        const matchImporte = minimo !== null && !Number.isNaN(minimo) ? importeTotal >= minimo : true;

        return matchQuery && matchEstado && matchDesde && matchHasta && matchImporte;
      })
      .sort((a, b) => {
        if (orden === 'FECHA_ASC') {
          return new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime();
        }

        if (orden === 'IMPORTE_DESC') {
          return Number(b?.importeTotal || 0) - Number(a?.importeTotal || 0);
        }

        if (orden === 'IMPORTE_ASC') {
          return Number(a?.importeTotal || 0) - Number(b?.importeTotal || 0);
        }

        if (orden === 'CLIENTE_ASC') {
          return getNombreCliente(a).localeCompare(getNombreCliente(b), 'es');
        }

        return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
      });
  }, [estadoFiltro, fechaDesde, fechaHasta, importeMinimo, orden, query, ventas]);

  const resumen = useMemo(() => {
    const base = ventasFiltradas.reduce((acc, venta) => {
      const total = Number(venta?.importeTotal || 0);
      acc.cantidad += 1;
      acc.totalFacturado += total;
      acc.prendas += getCantidadPrendas(venta?.pedido);
      if (venta?.estado === 'PAGADO') acc.pagadas += 1;
      if (venta?.estado === 'DEUDOR') acc.deudores += 1;
      if (venta?.estado === 'PENDIENTE') acc.pendientes += 1;
      return acc;
    }, {
      cantidad: 0,
      totalFacturado: 0,
      prendas: 0,
      pagadas: 0,
      deudores: 0,
      pendientes: 0,
    });

    return {
      ...base,
      ticketPromedio: base.cantidad ? base.totalFacturado / base.cantidad : 0,
    };
  }, [ventasFiltradas]);

  const limpiarFiltros = () => {
    setQuery('');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoFiltro('TODOS');
    setOrden('FECHA_DESC');
    setImporteMinimo('');
  };

  return (
    <section className="resumen-ventas-page">
      <div className="resumen-ventas-shell">
        <header className="resumen-ventas-hero">
          <div>
            <p className="resumen-ventas-kicker">Gestion comercial</p>
            <h1>Resumen de ventas</h1>
            <p className="resumen-ventas-subtitle">
              Analiza ventas cerradas, identifica clientes deudores y controla la facturacion visible con filtros por cliente, fecha, estado e importe.
            </p>
          </div>
        </header>

        <div className="resumen-ventas-summary">
          <article className="resumen-ventas-summary-card">
            <span>Ventas visibles</span>
            <strong>{resumen.cantidad}</strong>
          </article>
          <article className="resumen-ventas-summary-card">
            <span>Facturacion visible</span>
            <strong>{formatMoney(resumen.totalFacturado)}</strong>
          </article>
          <article className="resumen-ventas-summary-card">
            <span>Ticket promedio</span>
            <strong>{formatMoney(resumen.ticketPromedio)}</strong>
          </article>
          <article className="resumen-ventas-summary-card resumen-ventas-summary-card--warn">
            <span>Clientes deudores</span>
            <strong>{resumen.deudores}</strong>
          </article>
        </div>

        <div className="resumen-ventas-card">
          <div className="resumen-ventas-toolbar">
            <label className="resumen-ventas-search">
              <SearchIcon fontSize="small" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cliente, remito, estado o numero de cliente"
              />
            </label>

            <div className="resumen-ventas-filters">
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="DEUDOR">Deudores</option>
                <option value="PAGADO">Pagados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
              <input
                type="number"
                min="0"
                value={importeMinimo}
                onChange={(e) => setImporteMinimo(e.target.value)}
                placeholder="Importe minimo"
              />
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="FECHA_DESC">Mas recientes</option>
                <option value="FECHA_ASC">Mas antiguas</option>
                <option value="IMPORTE_DESC">Mayor importe</option>
                <option value="IMPORTE_ASC">Menor importe</option>
                <option value="CLIENTE_ASC">Cliente A-Z</option>
              </select>
              <button type="button" className="resumen-ventas-btn resumen-ventas-btn--ghost" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="resumen-ventas-table-wrap">
            <table className="resumen-ventas-table">
              <thead>
                <tr>
                  <th>Remito</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Cliente Nro.</th>
                  <th>Prendas</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="resumen-ventas-empty">Cargando resumen de ventas...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="7" className="resumen-ventas-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && ventasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="resumen-ventas-empty">No hay ventas para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loading && !error && ventasFiltradas.map((venta) => (
                  <tr key={venta._id || venta.numeroRemito}>
                    <td>
                      <div className="resumen-ventas-code">
                        <strong>{venta.numeroRemitoFormateado || `R-${String(venta.numeroRemito || '').padStart(6, '0')}`}</strong>
                        <span>{venta.razonSocial || '-'}</span>
                      </div>
                    </td>
                    <td>{formatDate(venta.createdAt)}</td>
                    <td>
                      <div className="resumen-ventas-code">
                        <strong>{getNombreCliente(venta)}</strong>
                        <span>{venta.razonSocial || 'Consumidor final'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`resumen-ventas-status resumen-ventas-status--${String(venta.estado || '').toLowerCase()}`}>
                        {estadoLabel[venta.estado] || venta.estado || '-'}
                      </span>
                    </td>
                    <td>{venta.numeroCliente || '-'}</td>
                    <td>{getCantidadPrendas(venta.pedido)}</td>
                    <td className="resumen-ventas-money">{formatMoney(venta.importeTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" className="resumen-ventas-total-label">Totales visibles</td>
                  <td>{resumen.prendas}</td>
                  <td className="resumen-ventas-money">{formatMoney(resumen.totalFacturado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="resumen-ventas-footer">
            <span>{ventas.length} ventas cargadas en total</span>
            <strong>{resumen.pagadas} pagadas, {resumen.pendientes} pendientes</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResumenDeVentas;
