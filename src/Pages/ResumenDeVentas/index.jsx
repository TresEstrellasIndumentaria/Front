import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import { actualizarEstadoRemito, eliminarRemito, getRemitos } from '../../Redux/Actions';
import './styles.css';

const estadoLabel = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
};

const normalizeEstadoVenta = (estado) => (estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE');

const normalizeRemitoVenta = (venta) => (
  venta ? { ...venta, estado: normalizeEstadoVenta(venta.estado) } : venta
);

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(value));
};

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const getTotalCosto = (venta) => {
  if (Number.isFinite(Number(venta?.totalCosto))) return Number(venta.totalCosto);

  return Array.isArray(venta?.pedido)
    ? venta.pedido.reduce((acc, item) => acc + Number(item?.costoTotal || 0), 0)
    : 0;
};

const getRentabilidad = (venta) => {
  if (Number.isFinite(Number(venta?.rentabilidad))) return Number(venta.rentabilidad);
  return Number(venta?.importeTotal || 0) - getTotalCosto(venta);
};

const escapeHtml = (value) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getItemNombre = (item) => (
  item?.nombreArticulo || item?.prenda || item?.articulo?.nombre || item?.articulo || '-'
);

const buildItemsTable = (items = []) => {
  if (!items.length) return '<p>Sin items</p>';

  const rows = items.map((item) => {
    const cantidad = Number(item?.cantidad || 0);
    const precioUnitario = Number(item?.precioUnitario ?? item?.importeUnitario ?? 0);
    const total = Number(item?.subtotal ?? item?.importeTotal ?? (cantidad * precioUnitario));
    const costoTotal = Number(item?.costoTotal ?? (cantidad * Number(item?.costoUnitario || 0)));
    const rentabilidad = total - costoTotal;

    return `
      <tr>
        <td>${escapeHtml(getItemNombre(item))}</td>
        <td>${escapeHtml(item?.talle || '-')}</td>
        <td style="text-align:right">${cantidad}</td>
        <td style="text-align:right">${formatMoney(precioUnitario)}</td>
        <td style="text-align:right">${formatMoney(costoTotal)}</td>
        <td style="text-align:right">${formatMoney(rentabilidad)}</td>
        <td style="text-align:right">${formatMoney(total)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="overflow-x:auto; margin-top:8px">
      <table style="width:100%; border-collapse:collapse; font-size:13px">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #d8d8d8">ART</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #d8d8d8">Talle</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Cant.</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Precio</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Costo</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Rentab.</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const getCantidadPrendas = (pedido) => (
  Array.isArray(pedido)
    ? pedido.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0)
    : 0
);

const getImporteDebe = (venta) => (
  normalizeEstadoVenta(venta?.estado) === 'PENDIENTE' ? Number(venta?.importeTotal || 0) : 0
);

const getNombreCliente = (venta) => (
  venta?.nombreApellido?.trim() || venta?.razonSocial?.trim() || 'Sin cliente'
);

const getClienteCuentaCorriente = (venta) => ({
  _id: venta?.cliente || venta?.clienteId || venta?.idCliente || venta?.numeroCliente,
  nombre: venta?.nombreApellido || '',
  apellido: '',
  razonSocial: venta?.razonSocial || '',
  email: venta?.email || '',
  telefono: venta?.telefono || '',
  numeroCliente: venta?.numeroCliente || '',
});

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMesActualRange = () => {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    desde: toDateInputValue(desde),
    hasta: toDateInputValue(hasta),
  };
};

const getProyeccionMesActual = (totalFacturado) => {
  const now = new Date();
  const diasTranscurridos = Math.max(1, now.getDate());
  const diasTotalesMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (Number(totalFacturado || 0) / diasTranscurridos) * diasTotalesMes;
};

function ResumenDeVentas() {
  const dispatch = useDispatch();
  const mesActual = useMemo(() => getMesActualRange(), []);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState(mesActual.desde);
  const [fechaHasta, setFechaHasta] = useState(mesActual.hasta);
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [orden, setOrden] = useState('FECHA_DESC');
  const [resumenBackend, setResumenBackend] = useState(null);
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState(null);
  const [eliminandoRemitoId, setEliminandoRemitoId] = useState(null);

  useEffect(() => {
    let active = true;

    const cargarVentas = async () => {
      setLoading(true);
      setError('');

      const limite = 100;
      const filtrosRemitos = {
        fechaDesde,
        fechaHasta,
        estado: estadoFiltro === 'TODOS' ? undefined : estadoFiltro,
        query: query.trim() || undefined,
      };
      const primeraPagina = await dispatch(getRemitos({ page: 1, limit: limite, ...filtrosRemitos }));

      if (!active) return;

      if (primeraPagina?.error) {
        setLoading(false);
        setError(primeraPagina.message || 'No se pudo cargar el resumen de ventas.');
        return;
      }

      const totalPages = Number(primeraPagina?.totalPages || 1);
      const coleccion = Array.isArray(primeraPagina?.remitos)
        ? primeraPagina.remitos.map(normalizeRemitoVenta)
        : [];
      setResumenBackend(primeraPagina?.resumen || null);

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await dispatch(getRemitos({ page, limit: limite, ...filtrosRemitos }));
        if (!active) return;

        if (response?.error) {
          setLoading(false);
          setError(response.message || 'No se pudo completar la carga de ventas.');
          return;
        }

        if (Array.isArray(response?.remitos)) {
          coleccion.push(...response.remitos.map(normalizeRemitoVenta));
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
  }, [dispatch, estadoFiltro, fechaDesde, fechaHasta, query]);

  const ventasFiltradas = useMemo(() => {
    return [...ventas]
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
  }, [orden, ventas]);

  const resumen = useMemo(() => {
    const base = ventasFiltradas.reduce((acc, venta) => {
      const total = Number(venta?.importeTotal || 0);
      acc.cantidad += 1;
      acc.totalFacturado += total;
      acc.totalCosto += getTotalCosto(venta);
      acc.rentabilidad += getRentabilidad(venta);
      acc.prendas += getCantidadPrendas(venta?.pedido);
      const estado = normalizeEstadoVenta(venta?.estado);
      if (estado === 'PAGADO') acc.pagadas += 1;
      if (estado === 'PENDIENTE') acc.pendientes += 1;
      return acc;
    }, {
      cantidad: 0,
      totalFacturado: 0,
      totalCosto: 0,
      rentabilidad: 0,
      prendas: 0,
      pagadas: 0,
      pendientes: 0,
    });

    const resumenCalculado = {
      ...base,
      proyeccion: getProyeccionMesActual(base.totalFacturado),
    };

    if (!resumenBackend) return resumenCalculado;

    return {
      ...resumenCalculado,
      totalFacturado: Number(resumenBackend.totalFacturado ?? resumenCalculado.totalFacturado),
      proyeccion: Number(resumenBackend.proyeccion ?? resumenCalculado.proyeccion),
    };
  }, [resumenBackend, ventasFiltradas]);

  const limpiarFiltros = () => {
    setQuery('');
    setFechaDesde(mesActual.desde);
    setFechaHasta(mesActual.hasta);
    setEstadoFiltro('TODOS');
    setOrden('FECHA_DESC');
  };

  const verRemito = (venta) => {
    const items = Array.isArray(venta?.pedido) ? venta.pedido : [];
    const detalle = buildItemsTable(items);

    Swal.fire({
      title: venta?.numeroRemitoFormateado || `Remito ${venta?.numeroRemito || ''}`,
      html: `
        <div style="text-align:left">
          <p><strong>Cliente:</strong> ${getNombreCliente(venta)}</p>
          <p><strong>Razon social:</strong> ${venta?.razonSocial || '-'}</p>
          <p><strong>Numero cliente:</strong> ${venta?.numeroCliente || '-'}</p>
          <p><strong>Fecha:</strong> ${formatDate(venta?.createdAt)}</p>
          <p><strong>Estado:</strong> ${estadoLabel[normalizeEstadoVenta(venta?.estado)]}</p>
          <p><strong>Importe:</strong> ${formatMoney(venta?.importeTotal)}</p>
          <p><strong>Items:</strong></p>
          ${detalle}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: 820,
    });
  };

  const handleActualizarEstado = async (venta, nextEstado) => {
    const remitoId = venta?._id;
    const estadoNormalizado = nextEstado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE';
    if (!remitoId || estadoNormalizado === normalizeEstadoVenta(venta?.estado)) return;

    setActualizandoEstadoId(remitoId);
    const response = await dispatch(actualizarEstadoRemito(remitoId, estadoNormalizado));
    setActualizandoEstadoId(null);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar el estado',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    const remitoActualizado = response?.remito || response;
    setVentas((prev) => prev.map((item) => (
      (item?._id || item?.numeroRemito) === (remitoId || venta?.numeroRemito)
        ? { ...item, ...remitoActualizado, estado: estadoNormalizado }
        : item
    )));
    setResumenBackend(null);

    Swal.fire({
      icon: 'success',
      title: 'Estado actualizado',
      text: `${venta.numeroRemitoFormateado || 'El remito'} ahora esta en ${estadoLabel[estadoNormalizado]}.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleEliminarRemito = async (venta) => {
    const remitoId = venta?._id;
    if (!remitoId) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar remito',
      text: `Se eliminara ${venta?.numeroRemitoFormateado || 'el remito seleccionado'} y se revertira el stock asociado.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#111827',
    });

    if (!result.isConfirmed) return;

    setEliminandoRemitoId(remitoId);
    const response = await dispatch(eliminarRemito(remitoId));
    setEliminandoRemitoId(null);

    if (response?.error) {
      Swal.fire('Error', response.message || 'No se pudo eliminar el remito.', 'error');
      return;
    }

    setVentas((prev) => prev.filter((item) => item?._id !== remitoId));
    setResumenBackend(null);

    Swal.fire({
      icon: 'success',
      title: 'Remito eliminado',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <section className="resumen-ventas-page">
      <div className="resumen-ventas-shell">
        <header className="resumen-ventas-hero">
          <div>
            <p className="resumen-ventas-kicker">Gestion comercial</p>
            <h1>Resumen de ventas</h1>
            <p className="resumen-ventas-subtitle">
              Analiza ventas cerradas y controla la facturacion visible con filtros por cliente, fecha, estado e importe.
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
            <span>Costo visible</span>
            <strong>{formatMoney(resumen.totalCosto)}</strong>
          </article>
          <article className="resumen-ventas-summary-card resumen-ventas-summary-card--profit">
            <span>Rentabilidad visible</span>
            <strong>{formatMoney(resumen.rentabilidad)}</strong>
          </article>
          <article className="resumen-ventas-summary-card resumen-ventas-summary-card--warn">
            <span>Pendientes</span>
            <strong>{resumen.pendientes}</strong>
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
                <option value="PAGADO">Pagados</option>
              </select>
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
                  <th>Num cliente</th>
                  <th>Nomb cliente</th>
                  <th>Estado</th>
                  <th>Importe que debe</th>
                  <th>Importe total</th>
                  <th>Costo total</th>
                  <th>Rentabilidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="10" className="resumen-ventas-empty">Cargando resumen de ventas...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="10" className="resumen-ventas-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && ventasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="10" className="resumen-ventas-empty">No hay ventas para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loading && !error && ventasFiltradas.map((venta) => (
                  <tr key={venta._id || venta.numeroRemito}>
                    <td>
                      <div className="resumen-ventas-code resumen-ventas-remito-cell">
                        <strong>{venta.numeroRemitoFormateado || `R-${String(venta.numeroRemito || '').padStart(6, '0')}`}</strong>
                        {/* <span>{venta.razonSocial || '-'}</span> */}
                      </div>
                    </td>
                    <td>{formatDate(venta.createdAt)}</td>
                    <td>{venta.numeroCliente || '-'}</td>
                    <td>
                      <div className="resumen-ventas-code">
                        <strong>{getNombreCliente(venta)}</strong>
                        {/* <span>{venta.razonSocial || 'Consumidor final'}</span> */}
                      </div>
                    </td>
                    <td>
                      <div className="resumen-ventas-status-editor">
                        <span className={`resumen-ventas-status resumen-ventas-status--${normalizeEstadoVenta(venta.estado).toLowerCase()}`}>
                          {estadoLabel[normalizeEstadoVenta(venta.estado)]}
                        </span>
                        <select
                          value={normalizeEstadoVenta(venta.estado)}
                          onChange={(e) => handleActualizarEstado(venta, e.target.value)}
                          disabled={actualizandoEstadoId === venta._id}
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="PAGADO">Pagado</option>
                        </select>
                      </div>
                    </td>
                    <td className="resumen-ventas-money">{formatMoney(getImporteDebe(venta))}</td>
                    <td className="resumen-ventas-money">{formatMoney(venta.importeTotal)}</td>
                    <td className="resumen-ventas-money">{formatMoney(getTotalCosto(venta))}</td>
                    <td className={`resumen-ventas-money ${getRentabilidad(venta) < 0 ? 'resumen-ventas-money--loss' : 'resumen-ventas-money--profit'}`}>
                      {formatMoney(getRentabilidad(venta))}
                    </td>
                    <td>
                      <div className="resumen-ventas-remito-actions resumen-ventas-remito-actions--end">
                        {venta.numeroCliente && (
                          <NavLink
                            to={`/cliente/${venta.cliente || venta.clienteId || venta.idCliente || venta.numeroCliente}/cuentaCorrient`}
                            state={{ cliente: getClienteCuentaCorriente(venta) }}
                            className="resumen-ventas-action-link"
                          >
                            <button
                              type="button"
                              className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--receipt"
                              title="Cuenta corriente"
                              aria-label="Cuenta corriente"
                            >
                              C.C
                            </button>
                          </NavLink>
                        )}
                        <button
                          type="button"
                          className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--receipt"
                          onClick={() => verRemito(venta)}
                          title="Ver remito"
                          aria-label="Ver remito"
                        >
                          <VisibilityIcon fontSize="inherit" />
                        </button>
                        <NavLink
                          to={`/ventas/editar/${venta._id}`}
                          state={{ remito: venta }}
                          className="resumen-ventas-action-link"
                        >
                          <button
                            type="button"
                            className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--edit"
                            title="Editar remito"
                            aria-label="Editar remito"
                          >
                            <EditIcon fontSize="inherit" />
                          </button>
                        </NavLink>
                        <button
                          type="button"
                          className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--delete"
                          onClick={() => handleEliminarRemito(venta)}
                          disabled={eliminandoRemitoId === venta._id}
                          title="Eliminar remito"
                          aria-label="Eliminar remito"
                        >
                          <DeleteIcon fontSize="inherit" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" className="resumen-ventas-total-label">Totales visibles</td>
                  <td className="resumen-ventas-money">{formatMoney(ventasFiltradas.reduce((acc, venta) => acc + getImporteDebe(venta), 0))}</td>
                  <td className="resumen-ventas-money">{formatMoney(resumen.totalFacturado)}</td>
                  <td className="resumen-ventas-money">{formatMoney(resumen.totalCosto)}</td>
                  <td className={`resumen-ventas-money ${resumen.rentabilidad < 0 ? 'resumen-ventas-money--loss' : 'resumen-ventas-money--profit'}`}>
                    {formatMoney(resumen.rentabilidad)}
                  </td>
                  <td></td>
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
