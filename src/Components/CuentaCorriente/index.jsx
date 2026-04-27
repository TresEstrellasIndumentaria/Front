import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getOrdenesCompra, getRecibosPorCliente, getRemitosPorCliente } from '../../Redux/Actions';
import './styles.css';

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(value));
};

const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const getSaldoLabel = (value) => {
  if (value > 0) return 'Saldo deudor';
  if (value < 0) return 'Saldo a favor';
  return 'Saldo actual';
};

const getNombreCliente = (cliente) => (
  `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || cliente?.razonSocial || 'Sin nombre'
);

const getNombreProveedor = (proveedor) => (
  `${proveedor?.nombre || ''} ${proveedor?.apellido || ''}`.trim() ||
  proveedor?.razonSocial ||
  proveedor?.nombreFantasia ||
  'Sin nombre'
);

const getOrdenProveedorId = (orden) => {
  if (!orden) return '';
  if (typeof orden.proveedor === 'string') return orden.proveedor;
  return orden.proveedor?._id || orden.proveedor?.id || orden.proveedorInfo?._id || orden.proveedorInfo?.id || '';
};

const getOrdenDetalle = (orden) => {
  const items = Array.isArray(orden?.items) ? orden.items : Array.isArray(orden?.articulos) ? orden.articulos : [];
  if (!items.length) return 'Orden de compra sin detalle';

  return items
    .map((item) => {
      const cantidad = Number(item?.cantidad || 1);
      const nombre = item?.nombre || item?.articuloNombre || item?.descripcion || item?.prenda || 'Articulo';
      return `${cantidad}x ${nombre}`.trim();
    })
    .join(', ');
};

const getPagosOrden = (orden) => {
  if (Array.isArray(orden?.pagos)) return orden.pagos;
  if (Array.isArray(orden?.pagosProveedor)) return orden.pagosProveedor;
  if (Array.isArray(orden?.abonos)) return orden.abonos;
  return [];
};

function CuentaCorriente({ cliente, proveedor, tipoCuenta = 'CLIENTE' }) {
  const dispatch = useDispatch();
  const esProveedor = tipoCuenta === 'PROVEEDOR';
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [data, setData] = useState({ remitos: null, recibos: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esProveedor) return;

    const numeroCliente = String(cliente?.numeroCliente || '').trim();
    if (!numeroCliente) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      dispatch(getRemitosPorCliente(numeroCliente)),
      dispatch(getRecibosPorCliente(numeroCliente)),
    ]).then(([remitosResponse, recibosResponse]) => {
      if (!active) return;

      const responseError = remitosResponse?.error || recibosResponse?.error;
      setLoading(false);

      if (responseError) {
        setError(
          remitosResponse?.message ||
          recibosResponse?.message ||
          'No se pudo cargar la cuenta corriente.'
        );
        return;
      }

      setData({
        remitos: remitosResponse,
        recibos: recibosResponse,
      });
    });

    return () => {
      active = false;
    };
  }, [cliente?.numeroCliente, dispatch, esProveedor]);

  useEffect(() => {
    if (!esProveedor) return;

    const proveedorId = proveedor?._id || proveedor?.id;
    if (!proveedorId) return;

    let active = true;
    setLoading(true);
    setError('');

    dispatch(getOrdenesCompra()).then((ordenesResponse) => {
      if (!active) return;

      setLoading(false);

      if (ordenesResponse?.error) {
        setError(ordenesResponse?.message || 'No se pudo cargar la cuenta corriente del proveedor.');
        return;
      }

      setData({
        ordenes: ordenesResponse,
        pagos: null,
      });
    });

    return () => {
      active = false;
    };
  }, [dispatch, esProveedor, proveedor?._id, proveedor?.id]);

  const movimientos = useMemo(() => {
    if (esProveedor) {
      const proveedorId = proveedor?._id || proveedor?.id;
      const ordenes = Array.isArray(data?.ordenes)
        ? data.ordenes
        : Array.isArray(data?.ordenes?.ordenes)
          ? data.ordenes.ordenes
          : [];

      const ordenesProveedor = ordenes.filter((orden) => getOrdenProveedorId(orden) === proveedorId);

      const movimientosOrdenes = ordenesProveedor.map((orden) => ({
        id: orden?._id || orden?.id || `orden-${orden?.numero}`,
        fecha: orden?.fechaOrden || orden?.createdAt,
        tipo: 'DEBE',
        comprobante: orden?.numero ? `OC-${String(orden.numero).padStart(6, '0')}` : 'Orden de compra',
        descripcion: getOrdenDetalle(orden),
        estado: orden?.estado || 'PENDIENTE',
        referencia: orden?.tiendaDestino || '-',
        debe: Number(orden?.estado === 'CANCELADA' ? 0 : orden?.totalOrden ?? orden?.total ?? 0),
        haber: 0,
      }));

      const movimientosPagos = ordenesProveedor.flatMap((orden) => (
        getPagosOrden(orden).map((pago, index) => ({
          id: pago?._id || pago?.id || `pago-${orden?._id || orden?.id || orden?.numero}-${index}`,
          fecha: pago?.fechaPago || pago?.fecha || pago?.createdAt || orden?.updatedAt || orden?.createdAt,
          tipo: 'HABER',
          comprobante: pago?.numeroPagoFormateado || pago?.comprobante || `Pago OC-${orden?.numero || '-'}`,
          descripcion: pago?.observaciones?.trim() || `Pago registrado a ${getNombreProveedor(proveedor)}`,
          estado: 'PAGADO',
          referencia: pago?.medioPago || pago?.referencia || '-',
          debe: 0,
          haber: Number(pago?.importe ?? pago?.monto ?? pago?.total ?? 0),
        }))
      ));

      return [...movimientosOrdenes, ...movimientosPagos]
        .filter((movimiento) => {
          const fecha = movimiento?.fecha ? movimiento.fecha.slice(0, 10) : '';
          const matchTipo = tipoFiltro === 'TODOS' ? true : movimiento.tipo === tipoFiltro;
          const matchEstado = estadoFiltro === 'TODOS'
            ? true
            : movimiento.tipo === 'HABER'
              ? estadoFiltro === 'PAGADO'
              : movimiento.estado === estadoFiltro;
          const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
          const matchHasta = fechaHasta ? fecha <= fechaHasta : true;
          return matchTipo && matchEstado && matchDesde && matchHasta;
        })
        .sort((a, b) => {
          const fechaA = new Date(a?.fecha || 0).getTime();
          const fechaB = new Date(b?.fecha || 0).getTime();
          return fechaA - fechaB;
        });
    }

    const remitos = Array.isArray(data?.remitos?.remitos) ? data.remitos.remitos : [];
    const recibos = Array.isArray(data?.recibos?.recibos) ? data.recibos.recibos : [];

    const movimientosRemitos = remitos.map((remito) => {
      const items = Array.isArray(remito?.pedido) ? remito.pedido : [];
      const detalle = items.length
        ? items
          .map((item) => {
            const cantidad = Number(item?.cantidad || 1);
            const prenda = item?.prenda || 'Prenda';
            const talle = item?.talle || '';
            return `${cantidad}x ${prenda} ${talle}`.trim();
          })
          .join(', ')
        : 'Venta sin detalle';

      return {
        id: remito?._id || `remito-${remito?.numeroRemito}`,
        fecha: remito?.createdAt,
        tipo: 'DEBE',
        comprobante: remito?.numeroRemitoFormateado || `R-${String(remito?.numeroRemito || '').padStart(6, '0')}`,
        descripcion: detalle,
        estado: remito?.estado || 'PENDIENTE',
        referencia: remito?.estado || '-',
        debe: Number(remito?.estado === 'CANCELADO' ? 0 : remito?.importeTotal || 0),
        haber: 0,
      };
    });

    const movimientosRecibos = recibos.map((recibo) => ({
      id: recibo?._id || `recibo-${recibo?.numeroRecibo}`,
      fecha: recibo?.fechaCobro || recibo?.createdAt,
      tipo: 'HABER',
      comprobante: recibo?.numeroReciboFormateado || `RC-${String(recibo?.numeroRecibo || '').padStart(6, '0')}`,
      descripcion: recibo?.observaciones?.trim() || `Cobro registrado a ${getNombreCliente(cliente)}`,
      estado: 'COBRADO',
      referencia: recibo?.medioPago || '-',
      debe: 0,
      haber: Number(recibo?.importe || 0),
    }));

    return [...movimientosRemitos, ...movimientosRecibos]
      .filter((movimiento) => {
        const fecha = movimiento?.fecha ? movimiento.fecha.slice(0, 10) : '';
        const matchTipo = tipoFiltro === 'TODOS' ? true : movimiento.tipo === tipoFiltro;
        const matchEstado = estadoFiltro === 'TODOS'
          ? true
          : movimiento.tipo === 'HABER'
            ? estadoFiltro === 'COBRADO'
            : movimiento.estado === estadoFiltro;
        const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
        const matchHasta = fechaHasta ? fecha <= fechaHasta : true;
        return matchTipo && matchEstado && matchDesde && matchHasta;
      })
      .sort((a, b) => {
        const fechaA = new Date(a?.fecha || 0).getTime();
        const fechaB = new Date(b?.fecha || 0).getTime();
        return fechaA - fechaB;
      });
  }, [cliente, data, esProveedor, estadoFiltro, fechaDesde, fechaHasta, proveedor, tipoFiltro]);

  const movimientosConSaldo = useMemo(() => {
    let saldo = 0;
    return movimientos.map((movimiento) => {
      saldo += Number(movimiento.debe || 0) - Number(movimiento.haber || 0);
      return {
        ...movimiento,
        saldo,
      };
    });
  }, [movimientos]);

  const totalesFiltrados = useMemo(() => {
    const totalDebe = movimientosConSaldo.reduce((acc, movimiento) => acc + Number(movimiento.debe || 0), 0);
    const totalHaber = movimientosConSaldo.reduce((acc, movimiento) => acc + Number(movimiento.haber || 0), 0);
    return {
      totalDebe,
      totalHaber,
      saldoFinal: totalDebe - totalHaber,
    };
  }, [movimientosConSaldo]);

  const resumen = useMemo(() => {
    if (esProveedor) {
      const proveedorId = proveedor?._id || proveedor?.id;
      const ordenes = Array.isArray(data?.ordenes)
        ? data.ordenes
        : Array.isArray(data?.ordenes?.ordenes)
          ? data.ordenes.ordenes
          : [];
      const ordenesProveedor = ordenes.filter((orden) => getOrdenProveedorId(orden) === proveedorId);
      const pagos = ordenesProveedor.flatMap((orden) => getPagosOrden(orden));
      const totalDebe = ordenesProveedor.reduce(
        (acc, orden) => acc + Number(orden?.estado === 'CANCELADA' ? 0 : orden?.totalOrden ?? orden?.total ?? 0),
        0
      );
      const totalPagado = pagos.reduce((acc, pago) => acc + Number(pago?.importe ?? pago?.monto ?? pago?.total ?? 0), 0);

      return {
        entidad: getNombreProveedor(proveedor),
        identificador: proveedor?.numeroProveedor || proveedor?.codigoProveedor || proveedor?._id || 'Sin numero',
        totalDebe,
        totalHaber: totalPagado,
        saldoActual: totalDebe - totalPagado,
        totalPrincipal: ordenesProveedor.length,
        totalSecundario: pagos.length,
        totalPendientes: ordenesProveedor.filter((orden) => ['BORRADOR', 'ENVIADA', 'PARCIALMENTE_RECIBIDA'].includes(orden?.estado)).length,
        totalFinalizados: ordenesProveedor.filter((orden) => orden?.estado === 'RECIBIDA').length,
      };
    }

    const totalDebe = Number(data?.remitos?.totalDebe || 0);
    const totalCobrado = Number(data?.recibos?.totalCobrado || 0);
    return {
      entidad: getNombreCliente(cliente),
      identificador: cliente?.numeroCliente || 'Sin numero',
      totalDebe,
      totalHaber: totalCobrado,
      saldoActual: totalDebe - totalCobrado,
      totalPrincipal: Number(data?.remitos?.totalRemitos || 0),
      totalSecundario: Number(data?.recibos?.totalRecibos || 0),
      totalPendientes: Number(data?.remitos?.totalPendientes || 0),
      totalFinalizados: Number(data?.remitos?.totalDeudores || 0),
    };
  }, [cliente, data, esProveedor, proveedor]);

  const entidadLabel = esProveedor ? 'Proveedor' : 'Cliente';
  const principalLabel = esProveedor ? 'Ordenes' : 'Remitos';
  const secundarioLabel = esProveedor ? 'Pagos' : 'Recibos';
  const finalizadosLabel = esProveedor ? 'Recibidas' : 'Deudores';
  const sinIdentificadorMessage = esProveedor
    ? 'No se encontro el proveedor para consultar la cuenta corriente.'
    : 'No se encontro el numero de cliente para consultar la cuenta corriente.';
  const puedeConsultar = esProveedor ? Boolean(proveedor?._id || proveedor?.id) : Boolean(cliente?.numeroCliente);

  return (
    <section className="cuenta-corriente">
      <div className="cuenta-corriente-summary">
        <article className="cuenta-corriente-summary-card cuenta-corriente-summary-card--wide">
          <span>{entidadLabel}</span>
          <strong>{resumen.entidad}</strong>
          <small>{esProveedor ? 'Identificador' : 'Numero cliente'}: {resumen.identificador}</small>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>Debe total</span>
          <strong>{formatMoney(resumen.totalDebe)}</strong>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>Haber total</span>
          <strong>{formatMoney(resumen.totalHaber)}</strong>
        </article>
        <article className="cuenta-corriente-summary-card cuenta-corriente-summary-card--saldo">
          <span>{getSaldoLabel(resumen.saldoActual)}</span>
          <strong className={`cuenta-corriente-saldo-value ${resumen.saldoActual > 0 ? 'is-deudor' : resumen.saldoActual < 0 ? 'is-favor' : ''}`}>
            {formatMoney(resumen.saldoActual)}
          </strong>
        </article>
      </div>

      <div className="cuenta-corriente-summary cuenta-corriente-summary--secondary">
        <article className="cuenta-corriente-summary-card">
          <span>{principalLabel}</span>
          <strong>{resumen.totalPrincipal}</strong>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>{secundarioLabel}</span>
          <strong>{resumen.totalSecundario}</strong>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>Pendientes</span>
          <strong>{resumen.totalPendientes}</strong>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>{finalizadosLabel}</span>
          <strong>{resumen.totalFinalizados}</strong>
        </article>
      </div>

      <div className="cuenta-corriente-card">
        <div className="cuenta-corriente-filters">
          <label>
            <span>Desde</span>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </label>

          <label>
            <span>Hasta</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </label>

          <label>
            <span>Tipo</span>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="DEBE">Debe</option>
              <option value="HABER">Haber</option>
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="DEUDOR">Deudor</option>
              <option value="PAGADO">Pagado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ENVIADA">Enviada</option>
              <option value="PARCIALMENTE_RECIBIDA">Parcialmente recibida</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="COBRADO">Cobrado</option>
            </select>
          </label>
        </div>

        <div className="cuenta-corriente-table-wrap">
          <table className="cuenta-corriente-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Comprobante</th>
                <th>Descripcion</th>
                <th>Referencia</th>
                <th>Debe</th>
                <th>Haber</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" className="cuenta-corriente-empty">Cargando cuenta corriente...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="8" className="cuenta-corriente-empty">{error}</td>
                </tr>
              )}

              {!loading && !error && !puedeConsultar && (
                <tr>
                  <td colSpan="8" className="cuenta-corriente-empty">{sinIdentificadorMessage}</td>
                </tr>
              )}

              {!loading && !error && puedeConsultar && movimientosConSaldo.length === 0 && (
                <tr>
                  <td colSpan="8" className="cuenta-corriente-empty">No hay movimientos para los filtros seleccionados.</td>
                </tr>
              )}

              {!loading && !error && movimientosConSaldo.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{formatDate(movimiento.fecha)}</td>
                  <td>
                    <span className={`cuenta-corriente-tag cuenta-corriente-tag--${movimiento.tipo.toLowerCase()}`}>
                      {movimiento.tipo}
                    </span>
                  </td>
                  <td>{movimiento.comprobante}</td>
                  <td>{movimiento.descripcion}</td>
                  <td>{movimiento.referencia}</td>
                  <td className="cuenta-corriente-money cuenta-corriente-money--debe">
                    {movimiento.debe ? formatMoney(movimiento.debe) : '-'}
                  </td>
                  <td className="cuenta-corriente-money cuenta-corriente-money--haber">
                    {movimiento.haber ? formatMoney(movimiento.haber) : '-'}
                  </td>
                  <td className="cuenta-corriente-money">{formatMoney(movimiento.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="cuenta-corriente-total-label">Totales visibles</td>
                <td className="cuenta-corriente-money cuenta-corriente-money--debe">
                  {formatMoney(totalesFiltrados.totalDebe)}
                </td>
                <td className="cuenta-corriente-money cuenta-corriente-money--haber">
                  {formatMoney(totalesFiltrados.totalHaber)}
                </td>
                <td className={`cuenta-corriente-money cuenta-corriente-total-saldo ${totalesFiltrados.saldoFinal > 0 ? 'is-deudor' : totalesFiltrados.saldoFinal < 0 ? 'is-favor' : ''}`}>
                  {formatMoney(totalesFiltrados.saldoFinal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

export default CuentaCorriente;
