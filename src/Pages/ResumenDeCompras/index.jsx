import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Swal from 'sweetalert2';
import { actualizarEstadoOrdenCompra, eliminarOrdenCompra, getAllArticulos, getOrdenesCompra } from '../../Redux/Actions';
import '../ResumenDeVentas/styles.css';

const estadoLabel = {
  DEUDOR: 'Deudor',
  PAGADA: 'Pagada',
};

const normalizeEstadoCompra = (estado) => (estado === 'PAGADA' ? 'PAGADA' : 'DEUDOR');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR').format(date);
};

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 3,
}).format(Number(value || 0));

const escapeHtml = (value) => String(value ?? '-')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getProveedorNombre = (orden) => {
  if (orden?.proveedorInfo?.nombre || orden?.proveedorInfo?.apellido) {
    return `${orden.proveedorInfo?.nombre || ''} ${orden.proveedorInfo?.apellido || ''}`.trim();
  }

  if (orden?.proveedor?.nombre || orden?.proveedor?.apellido) {
    return `${orden.proveedor?.nombre || ''} ${orden.proveedor?.apellido || ''}`.trim();
  }

  return orden?.proveedorNombre || 'Sin proveedor';
};

const getProveedorId = (orden) => (
  orden?.proveedor?._id || orden?.proveedor?.id || orden?.proveedor || orden?.proveedorInfo?._id || orden?.proveedorInfo?.id
);

const getProveedorNumero = (orden) => (
  orden?.numeroProveedor ||
  orden?.proveedorInfo?.numeroProveedor ||
  orden?.proveedorInfo?.numeroCliente ||
  orden?.proveedor?.numeroProveedor ||
  orden?.proveedor?.numeroCliente ||
  '-'
);

const getProveedorCuentaCorriente = (orden) => {
  const proveedor = orden?.proveedorInfo || orden?.proveedor || {};
  const nombrePartes = getProveedorNombre(orden).split(' ');

  return {
    _id: getProveedorId(orden),
    nombre: proveedor?.nombre || nombrePartes[0] || '',
    apellido: proveedor?.apellido || nombrePartes.slice(1).join(' '),
    razonSocial: proveedor?.razonSocial || orden?.razonSocial || '',
    email: proveedor?.email || '',
    telefono: proveedor?.telefono || '',
    numeroCliente: proveedor?.numeroCliente || '',
    numeroProveedor: proveedor?.numeroProveedor || proveedor?.numeroCliente || orden?.numeroProveedor || '',
  };
};

const getItemsOrden = (orden) => (
  Array.isArray(orden?.items) && orden.items.length ? orden.items : orden?.articulos || []
);

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const getArticuloIdItem = (item) => {
  if (!item) return '';
  if (item.articulo && typeof item.articulo === 'object') return item.articulo._id || item.articulo.id || '';
  return item.articulo || item._id || '';
};

const getArticuloNombreItem = (item, articulosPorId = new Map()) => {
  if (!item) return '-';
  if (item.nombre || item.articuloNombre || item.nombreArticulo || item.descripcion || item.prenda) {
    return item.nombre || item.articuloNombre || item.nombreArticulo || item.descripcion || item.prenda;
  }

  if (item.articulo && typeof item.articulo === 'object') {
    return item.articulo.nombre || item.articulo.codigoArticulo || '-';
  }

  const articuloId = getArticuloIdItem(item);
  const articuloCatalogo = articulosPorId.get(String(articuloId));
  if (articuloCatalogo?.nombre) {
    return articuloCatalogo.nombre;
  }

  if (item.articulo && !isObjectId(item.articulo)) {
    return item.articulo;
  }

  return 'Articulo sin nombre';
};

const getCantidadArticulos = (orden) => (
  getItemsOrden(orden).reduce((acc, item) => acc + Number(item?.cantidad || 0), 0)
);

const buildItemsCompraTable = (items = [], articulosPorId = new Map()) => {
  if (!items.length) return '<p>Sin articulos</p>';

  const rows = items.map((item) => {
    const nombre = getArticuloNombreItem(item, articulosPorId);
    const cantidad = Number(item?.cantidad || 0);
    const costo = Number(item?.coste ?? item?.costo ?? 0);
    const total = Number(item?.costoTotal ?? item?.subtotal ?? item?.total ?? (cantidad * costo));

    return `
      <tr>
        <td>${escapeHtml(nombre)}</td>
        <td>${escapeHtml(item?.talle || '-')}</td>
        <td style="text-align:right">${cantidad}</td>
        <td style="text-align:right">${formatMoney(costo)}</td>
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
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Costo</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #d8d8d8">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const getTotalOrden = (orden) => Number(orden?.totalOrden ?? orden?.total ?? orden?.totalArticulos ?? 0);

const getImporteDebe = (orden) => (
  normalizeEstadoCompra(orden?.estado) === 'DEUDOR' ? getTotalOrden(orden) : 0
);

const formatNumeroOrden = (numero) => {
  if (!numero) return '-';
  return String(numero).replace(/^PO/i, '');
};

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

const isDateInRange = (value, fechaDesde, fechaHasta) => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return false;

  if (fechaDesde) {
    const desde = new Date(`${fechaDesde}T00:00:00`);
    if (date < desde) return false;
  }

  if (fechaHasta) {
    const hasta = new Date(`${fechaHasta}T23:59:59`);
    if (date > hasta) return false;
  }

  return true;
};

function ResumenDeCompras() {
  const dispatch = useDispatch();
  const articulos = useSelector((state) => state.articulos || []);
  const mesActual = useMemo(() => getMesActualRange(), []);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState(mesActual.desde);
  const [fechaHasta, setFechaHasta] = useState(mesActual.hasta);
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [orden, setOrden] = useState('FECHA_DESC');
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState(null);
  const [eliminandoOrdenId, setEliminandoOrdenId] = useState(null);

  const articulosPorId = useMemo(() => {
    const map = new Map();
    (articulos || []).forEach((articulo) => {
      const id = articulo?._id || articulo?.id;
      if (id) map.set(String(id), articulo);
    });
    return map;
  }, [articulos]);

  useEffect(() => {
    if (!articulos?.length) {
      dispatch(getAllArticulos());
    }
  }, [articulos?.length, dispatch]);

  useEffect(() => {
    let active = true;

    const cargarCompras = async () => {
      setLoading(true);
      setError('');

      const response = await dispatch(getOrdenesCompra());
      if (!active) return;

      if (response?.error) {
        setLoading(false);
        setError(response.message || 'No se pudo cargar el resumen de compras.');
        return;
      }

      const ordenes = Array.isArray(response)
        ? response
        : Array.isArray(response?.ordenes)
          ? response.ordenes
          : [];

      setCompras(ordenes.map((compra) => ({
        ...compra,
        estado: normalizeEstadoCompra(compra?.estado),
      })));
      setLoading(false);
    };

    cargarCompras();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const comprasFiltradas = useMemo(() => {
    const queryNormalizada = query.trim().toLowerCase();

    return compras
      .filter((compra) => {
        const estado = normalizeEstadoCompra(compra?.estado);
        if (estadoFiltro !== 'TODOS' && estado !== estadoFiltro) return false;
        if (!isDateInRange(compra?.fechaOrden || compra?.createdAt, fechaDesde, fechaHasta)) return false;

        if (!queryNormalizada) return true;

        const textoBusqueda = [
          compra?.numero,
          getProveedorNumero(compra),
          getProveedorNombre(compra),
          estadoLabel[estado],
          getTotalOrden(compra),
        ].join(' ').toLowerCase();

        return textoBusqueda.includes(queryNormalizada);
      })
      .sort((a, b) => {
        if (orden === 'FECHA_ASC') {
          return new Date(a?.fechaOrden || a?.createdAt || 0).getTime() - new Date(b?.fechaOrden || b?.createdAt || 0).getTime();
        }

        if (orden === 'IMPORTE_DESC') {
          return getTotalOrden(b) - getTotalOrden(a);
        }

        if (orden === 'IMPORTE_ASC') {
          return getTotalOrden(a) - getTotalOrden(b);
        }

        if (orden === 'PROVEEDOR_ASC') {
          return getProveedorNombre(a).localeCompare(getProveedorNombre(b), 'es');
        }

        return new Date(b?.fechaOrden || b?.createdAt || 0).getTime() - new Date(a?.fechaOrden || a?.createdAt || 0).getTime();
      });
  }, [compras, estadoFiltro, fechaDesde, fechaHasta, orden, query]);

  const resumen = useMemo(() => {
    const base = comprasFiltradas.reduce((acc, compra) => {
      const total = getTotalOrden(compra);
      acc.cantidad += 1;
      acc.totalComprado += total;
      acc.articulos += getCantidadArticulos(compra);

      const estado = normalizeEstadoCompra(compra?.estado);
      if (estado === 'PAGADA') acc.pagadas += 1;
      if (estado === 'DEUDOR') acc.deudoras += 1;

      return acc;
    }, {
      cantidad: 0,
      totalComprado: 0,
      articulos: 0,
      pagadas: 0,
      deudoras: 0,
    });

    return base;
  }, [comprasFiltradas]);

  const limpiarFiltros = () => {
    setQuery('');
    setFechaDesde(mesActual.desde);
    setFechaHasta(mesActual.hasta);
    setEstadoFiltro('TODOS');
    setOrden('FECHA_DESC');
  };

  const verOrden = (compra) => {
    const items = getItemsOrden(compra);
    const detalle = buildItemsCompraTable(items, articulosPorId);

    Swal.fire({
      title: formatNumeroOrden(compra?.numero) || 'Orden de compra',
      html: `
        <div style="text-align:left">
          <p><strong>Numero proveedor:</strong> ${getProveedorNumero(compra)}</p>
          <p><strong>Proveedor:</strong> ${getProveedorNombre(compra)}</p>
          <p><strong>Fecha:</strong> ${formatDate(compra?.fechaOrden || compra?.createdAt)}</p>
          <p><strong>Estado:</strong> ${estadoLabel[normalizeEstadoCompra(compra?.estado)]}</p>
          <p><strong>Total:</strong> ${formatMoney(getTotalOrden(compra))}</p>
          <p><strong>Articulos:</strong></p>
          ${detalle}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: 820,
    });
  };

  const handleActualizarEstado = async (compra, nextEstado) => {
    const compraId = compra?._id || compra?.id;
    const estadoNormalizado = nextEstado === 'PAGADA' ? 'PAGADA' : 'DEUDOR';
    if (!compraId || estadoNormalizado === normalizeEstadoCompra(compra?.estado)) return;

    setActualizandoEstadoId(compraId);
    const response = await dispatch(actualizarEstadoOrdenCompra(compraId, estadoNormalizado));
    setActualizandoEstadoId(null);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar el estado',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    const compraActualizada = response?.orden || response?.ordenCompra || response;
    setCompras((prev) => prev.map((item) => (
      (item?._id || item?.id || item?.numero) === (compraId || compra?.numero)
        ? { ...item, ...compraActualizada, estado: estadoNormalizado }
        : item
    )));

    Swal.fire({
      icon: 'success',
      title: 'Estado actualizado',
      text: `${formatNumeroOrden(compra.numero) || 'La orden'} ahora esta en ${estadoLabel[estadoNormalizado]}.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleEliminarOrden = async (compra) => {
    const compraId = compra?._id || compra?.id;
    if (!compraId) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar orden de compra',
      text: `Se eliminara ${formatNumeroOrden(compra?.numero) || 'la orden seleccionada'}. Esta accion no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setEliminandoOrdenId(compraId);
    const response = await dispatch(eliminarOrdenCompra(compraId));
    setEliminandoOrdenId(null);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    setCompras((prev) => prev.filter((item) => (item?._id || item?.id) !== compraId));

    Swal.fire({
      icon: 'success',
      title: 'Orden eliminada',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <section className="resumen-ventas-page">
      <div className="resumen-ventas-shell">
        <header className="resumen-ventas-hero">
          <div>
            <p className="resumen-ventas-kicker">Gestion de compras</p>
            <h1>Resumen de compras</h1>
            <p className="resumen-ventas-subtitle">
              Analiza ordenes de compra y controla los importes visibles con filtros por proveedor, fecha, estado e importe.
            </p>
          </div>
        </header>

        <div className="resumen-ventas-summary">
          <article className="resumen-ventas-summary-card">
            <span>Compras visibles</span>
            <strong>{resumen.cantidad}</strong>
          </article>
          <article className="resumen-ventas-summary-card">
            <span>Total comprado</span>
            <strong>{formatMoney(resumen.totalComprado)}</strong>
          </article>
          <article className="resumen-ventas-summary-card resumen-ventas-summary-card--warn">
            <span>Deudoras</span>
            <strong>{resumen.deudoras}</strong>
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
                placeholder="Buscar por proveedor, numero, orden, estado o importe"
              />
            </label>

            <div className="resumen-ventas-filters">
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="DEUDOR">Deudoras</option>
                <option value="PAGADA">Pagadas</option>
              </select>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="FECHA_DESC">Mas recientes</option>
                <option value="FECHA_ASC">Mas antiguas</option>
                <option value="IMPORTE_DESC">Mayor importe</option>
                <option value="IMPORTE_ASC">Menor importe</option>
                <option value="PROVEEDOR_ASC">Proveedor A-Z</option>
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
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Num proveedor</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th>Importe que debe</th>
                  <th>Importe total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="resumen-ventas-empty">Cargando resumen de compras...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="8" className="resumen-ventas-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && comprasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="8" className="resumen-ventas-empty">No hay compras para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loading && !error && comprasFiltradas.map((compra) => {
                  const compraId = compra._id || compra.id;
                  const proveedorId = getProveedorId(compra);

                  return (
                    <tr key={compraId || compra.numero}>
                      <td>
                        <div className="resumen-ventas-code resumen-ventas-remito-cell">
                          <strong>{formatNumeroOrden(compra.numero)}</strong>
                        </div>
                      </td>
                      <td>{formatDate(compra.fechaOrden || compra.createdAt)}</td>
                      <td>{getProveedorNumero(compra)}</td>
                      <td>
                        <div className="resumen-ventas-code">
                          <strong>{getProveedorNombre(compra)}</strong>
                          {proveedorId && (
                            <NavLink
                              to={`/proveedor/${proveedorId}/cuentaCorrient`}
                              state={{ proveedor: getProveedorCuentaCorriente(compra) }}
                              className="resumen-ventas-action-link resumen-ventas-cuenta-link"
                            >
                              <button type="button" className="resumen-ventas-btn resumen-ventas-btn--compact resumen-ventas-btn--account">
                                C.C
                              </button>
                            </NavLink>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="resumen-ventas-status-editor">
                          <span className={`resumen-ventas-status resumen-ventas-status--${normalizeEstadoCompra(compra.estado) === 'PAGADA' ? 'pagado' : 'pendiente'}`}>
                            {estadoLabel[normalizeEstadoCompra(compra.estado)]}
                          </span>
                          <select
                            value={normalizeEstadoCompra(compra.estado)}
                            onChange={(e) => handleActualizarEstado(compra, e.target.value)}
                            disabled={actualizandoEstadoId === compraId}
                          >
                            <option value="DEUDOR">Deudor</option>
                            <option value="PAGADA">Pagada</option>
                          </select>
                        </div>
                      </td>
                      <td className="resumen-ventas-money">{formatMoney(getImporteDebe(compra))}</td>
                      <td className="resumen-ventas-money">{formatMoney(getTotalOrden(compra))}</td>
                      <td>
                        <div className="resumen-ventas-remito-actions resumen-ventas-remito-actions--end">
                          <button
                            type="button"
                            className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--receipt"
                            onClick={() => verOrden(compra)}
                            title="Ver orden"
                            aria-label="Ver orden"
                          >
                            <VisibilityIcon fontSize="inherit" />
                          </button>
                          {compraId && (
                            <NavLink
                              to={`/ordenesDeCompras/${compraId}`}
                              state={{ orden: compra }}
                              className="resumen-ventas-action-link"
                            >
                              <button
                                type="button"
                                className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--edit"
                                title="Editar orden"
                                aria-label="Editar orden"
                              >
                                <EditIcon fontSize="inherit" />
                              </button>
                            </NavLink>
                          )}
                          {compraId && (
                            <button
                              type="button"
                              className="resumen-ventas-btn resumen-ventas-btn--icon resumen-ventas-btn--delete"
                              onClick={() => handleEliminarOrden(compra)}
                              disabled={eliminandoOrdenId === compraId}
                              title="Eliminar orden"
                              aria-label="Eliminar orden"
                            >
                              <DeleteIcon fontSize="inherit" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5" className="resumen-ventas-total-label">Totales visibles</td>
                  <td className="resumen-ventas-money">{formatMoney(comprasFiltradas.reduce((acc, compra) => acc + getImporteDebe(compra), 0))}</td>
                  <td className="resumen-ventas-money">{formatMoney(resumen.totalComprado)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="resumen-ventas-footer">
            <span>{compras.length} compras cargadas en total</span>
            <strong>{resumen.pagadas} pagadas, {resumen.deudoras} deudoras</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResumenDeCompras;
