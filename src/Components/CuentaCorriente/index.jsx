import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { crearRecibo, eliminarPagoProveedor, eliminarRecibo, eliminarRemito, getOrdenesCompraPorProveedor, getPagosProveedorPorProveedor, getRecibosPorCliente, getRemitosPorCliente, registrarPagoProveedor } from '../../Redux/Actions';
import {
  formatCurrencyARS,
  formatDateAR as formatDate,
  getCurrentMonthRange as getMesActualRange,
} from '../../Helpers/formatters';
import './styles.css';

const getTimeValue = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getMovimientoSortValue = (movimiento) => {
  const fechaPrincipal = movimiento?.fecha || movimiento?.fechaHora || movimiento?.createdAt || movimiento?.updatedAt;
  const fechaDia = fechaPrincipal ? String(fechaPrincipal).slice(0, 10) : '';
  const fechaBase = fechaDia ? getTimeValue(`${fechaDia}T00:00:00`) : getTimeValue(fechaPrincipal);
  const fechaHora = getTimeValue(movimiento?.fechaHora || movimiento?.createdAt || fechaPrincipal);

  return { fechaBase, fechaHora };
};

const ordenarMovimientosPorFecha = (movimientos) => (
  [...movimientos].sort((a, b) => {
    const sortA = getMovimientoSortValue(a);
    const sortB = getMovimientoSortValue(b);

    if (sortA.fechaBase !== sortB.fechaBase) {
      return sortA.fechaBase - sortB.fechaBase;
    }

    if (sortA.fechaHora !== sortB.fechaHora) {
      return sortA.fechaHora - sortB.fechaHora;
    }

    return String(a.id || '').localeCompare(String(b.id || ''), 'es');
  })
);

const formatMoney = (value) => formatCurrencyARS(value, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const getSaldoLabel = (value) => {
  if (value > 0) return 'Saldo a favor';
  if (value < 0) return 'Saldo deudor';
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

const normalizeEstadoVenta = (estado) => (estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE');

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

const getOrdenTotal = (orden) => Number(orden?.totalOrden ?? orden?.total ?? 0);

const getOrdenId = (orden) => String(orden?._id || orden?.id || '');

const getEstadoOrdenCompra = (orden) => String(orden?.estado || 'DEUDOR').toUpperCase();

const normalizeEstadoCompra = (orden) => (getEstadoOrdenCompra(orden) === 'PAGADA' ? 'PAGADA' : 'DEUDOR');

const isOrdenCompraPendientePago = (orden) => normalizeEstadoCompra(orden) === 'DEUDOR';

const isOrdenCompraPagada = (orden) => normalizeEstadoCompra(orden) === 'PAGADA';

const getPagoProveedorOrdenId = (pago) => {
  const orden = pago?.ordenCompra || pago?.orden;
  return orden ? String(orden?._id || orden?.id || orden) : '';
};

const getPagoProveedorImporte = (pago) => Number(pago?.importe ?? pago?.monto ?? pago?.total ?? 0);

const getSaldoOrdenProveedor = (orden, pagos = []) => {
  const ordenId = getOrdenId(orden);
  const totalOrden = roundMoney(getOrdenTotal(orden));
  const pagadoOrden = pagos
    .filter((pago) => getPagoProveedorOrdenId(pago) === ordenId)
    .reduce((acc, pago) => acc + getPagoProveedorImporte(pago), 0);

  return roundMoney(Math.max(0, totalOrden - pagadoOrden));
};

const getOrdenesConSaldoProveedor = (ordenes = [], pagos = []) => {
  return ordenes
    .map((orden) => {
      const saldoVinculado = getSaldoOrdenProveedor(orden, pagos);

      return {
        ...orden,
        saldoOrden: roundMoney(Math.max(0, saldoVinculado)),
      };
    });
};

const getReciboRemitoId = (recibo) => {
  const remito = recibo?.remito ?? recibo?.remitoId;
  return remito ? String(remito?._id || remito) : '';
};

const getRemitoSaldo = (remito, recibos = []) => {
  const importeDebe = remito?.importeDebe;
  if (importeDebe !== undefined && importeDebe !== null && importeDebe !== '' && Number.isFinite(Number(importeDebe))) {
    return Math.max(0, Number(importeDebe));
  }

  const remitoId = String(remito?._id || '');
  const totalPagado = recibos
    .filter((recibo) => getReciboRemitoId(recibo) === remitoId)
    .reduce((acc, recibo) => acc + Number(recibo?.importe || 0), 0);

  return Math.max(0, Number(remito?.importeTotal || 0) - totalPagado);
};

function CuentaCorriente({ cliente, proveedor, proveedorId: proveedorIdProp, tipoCuenta = 'CLIENTE' }) {
  const dispatch = useDispatch();
  const esProveedor = tipoCuenta === 'PROVEEDOR';
  const proveedorCuentaId = proveedor?._id || proveedor?.id || proveedorIdProp || '';
  const mesActual = useMemo(() => getMesActualRange(), []);
  const [fechaDesde, setFechaDesde] = useState(mesActual.desde);
  const [fechaHasta, setFechaHasta] = useState(mesActual.hasta);
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [data, setData] = useState({ remitos: null, recibos: null });
  const [loading, setLoading] = useState(false);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [anulandoPagoId, setAnulandoPagoId] = useState(null);
  const [anulandoMovimientoId, setAnulandoMovimientoId] = useState(null);
  const [error, setError] = useState('');
  const [pagoProveedor, setPagoProveedor] = useState({
    ordenCompra: '',
    importe: '',
    pagarTotal: false,
    fechaPago: new Date().toISOString().slice(0, 10),
    medioPago: 'EFECTIVO',
    observaciones: '',
  });
  const [pagoCliente, setPagoCliente] = useState({
    remito: '',
    importe: '',
    fechaCobro: new Date().toISOString().slice(0, 10),
    medioPago: 'Transferencia',
    observaciones: '',
  });

  const cargarOrdenesProveedor = () => {
    setLoading(true);
    setError('');

    const proveedorId = proveedorCuentaId;

    return Promise.all([
      proveedorId ? dispatch(getOrdenesCompraPorProveedor(proveedorId)) : Promise.resolve([]),
      proveedorId ? dispatch(getPagosProveedorPorProveedor(proveedorId)) : Promise.resolve({ pagos: [] }),
    ]).then(([ordenesResponse, pagosResponse]) => {
      setLoading(false);

      if (ordenesResponse?.error || pagosResponse?.error) {
        setError(
          ordenesResponse?.message ||
          pagosResponse?.message ||
          'No se pudo cargar la cuenta corriente del proveedor.'
        );
        return ordenesResponse?.error ? ordenesResponse : pagosResponse;
      }

      setData({
        ordenes: ordenesResponse,
        pagos: pagosResponse,
      });

      return ordenesResponse;
    });
  };

  const cargarCuentaCliente = () => {
    const numeroCliente = String(cliente?.numeroCliente || '').trim();
    if (!numeroCliente) return Promise.resolve(null);

    setLoading(true);
    setError('');

    return Promise.all([
      dispatch(getRemitosPorCliente(numeroCliente)),
      dispatch(getRecibosPorCliente(numeroCliente)),
    ]).then(([remitosResponse, recibosResponse]) => {
      const responseError = remitosResponse?.error || recibosResponse?.error;
      setLoading(false);

      if (responseError) {
        setError(
          remitosResponse?.message ||
          recibosResponse?.message ||
          'No se pudo cargar la cuenta corriente.'
        );
        return remitosResponse?.error ? remitosResponse : recibosResponse;
      }

      setData({
        remitos: remitosResponse,
        recibos: recibosResponse,
      });

      return { remitos: remitosResponse, recibos: recibosResponse };
    });
  };

  useEffect(() => {
    if (esProveedor) return;

    let active = true;
    cargarCuentaCliente().then(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.numeroCliente, dispatch, esProveedor]);

  useEffect(() => {
    if (!esProveedor) return;

    const proveedorId = proveedorCuentaId;
    if (!proveedorId) return;

    let active = true;
    cargarOrdenesProveedor().then((ordenesResponse) => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, esProveedor, proveedorCuentaId]);

  const movimientos = useMemo(() => {
    if (esProveedor) {
      const ordenes = Array.isArray(data?.ordenes)
        ? data.ordenes
        : Array.isArray(data?.ordenes?.ordenes)
          ? data.ordenes.ordenes
          : [];

      const ordenesProveedor = ordenes;

      const movimientosOrdenes = ordenesProveedor.map((orden) => ({
        id: orden?._id || orden?.id || `orden-${orden?.numero}`,
        claseMovimiento: 'ORDEN_COMPRA',
        fecha: orden?.fechaOrden || orden?.createdAt,
        tipo: 'DEBE',
        comprobante: orden?.numero ? `OC-${String(orden.numero).padStart(6, '0')}` : 'Orden de compra',
        descripcion: getOrdenDetalle(orden),
        estado: normalizeEstadoCompra(orden),
        referencia: '',
        fechaHora: orden?.createdAt || orden?.fechaOrden,
        createdAt: orden?.createdAt,
        updatedAt: orden?.updatedAt,
        debe: getOrdenTotal(orden),
        haber: 0,
      }));

      const pagosProveedor = Array.isArray(data?.pagos?.pagos) ? data.pagos.pagos : [];
      const movimientosPagos = pagosProveedor.map((pago, index) => ({
        id: pago?._id || pago?.id || `pago-proveedor-${index}`,
        claseMovimiento: 'PAGO_PROVEEDOR',
        pagoProveedorId: pago?._id || pago?.id,
        fecha: pago?.fechaPago || pago?.fecha || pago?.createdAt,
        tipo: 'HABER',
        comprobante: pago?.numeroPagoFormateado || pago?.comprobante || `PP-${String(pago?.numeroPago || index + 1).padStart(6, '0')}`,
        descripcion: pago?.observaciones?.trim() || `Pago registrado a ${getNombreProveedor(proveedor)}`,
        estado: 'PAGADO',
        referencia: pago?.medioPago || pago?.referencia || '-',
        fechaHora: pago?.createdAt || pago?.fechaPago || pago?.fecha,
        createdAt: pago?.createdAt,
        updatedAt: pago?.updatedAt,
        debe: 0,
        haber: getPagoProveedorImporte(pago),
      }));

      return ordenarMovimientosPorFecha([...movimientosOrdenes, ...movimientosPagos]
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
        }));
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
        claseMovimiento: 'REMITO',
        remitoId: remito?._id,
        fecha: remito?.createdAt,
        tipo: 'DEBE',
        comprobante: remito?.numeroRemitoFormateado || `R-${String(remito?.numeroRemito || '').padStart(6, '0')}`,
        descripcion: detalle,
        estado: normalizeEstadoVenta(remito?.estado),
        referencia: '',
        fechaHora: remito?.createdAt,
        createdAt: remito?.createdAt,
        updatedAt: remito?.updatedAt,
        debe: Number(remito?.importeTotal || 0),
        haber: 0,
      };
    });

    const movimientosRecibos = recibos.map((recibo) => ({
      id: recibo?._id || `recibo-${recibo?.numeroRecibo}`,
      claseMovimiento: 'RECIBO',
      reciboId: recibo?._id,
      fecha: recibo?.fechaCobro || recibo?.createdAt,
      tipo: 'HABER',
      comprobante: recibo?.numeroReciboFormateado || `RC-${String(recibo?.numeroRecibo || '').padStart(6, '0')}`,
      descripcion: recibo?.observaciones?.trim() || `Cobro registrado a ${getNombreCliente(cliente)}`,
      estado: 'COBRADO',
      referencia: recibo?.medioPago || '-',
      fechaHora: recibo?.createdAt || recibo?.fechaCobro,
      createdAt: recibo?.createdAt,
      updatedAt: recibo?.updatedAt,
      debe: 0,
      haber: Number(recibo?.importe || 0),
    }));

    return ordenarMovimientosPorFecha([...movimientosRemitos, ...movimientosRecibos]
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
      }));
  }, [cliente, data, esProveedor, estadoFiltro, fechaDesde, fechaHasta, proveedor, tipoFiltro]);

  const movimientosConSaldo = useMemo(() => {
    let saldo = 0;
    return ordenarMovimientosPorFecha(movimientos).map((movimiento) => {
      saldo += Number(movimiento.haber || 0) - Number(movimiento.debe || 0);
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
      saldoFinal: totalHaber - totalDebe,
    };
  }, [movimientosConSaldo]);

  const resumen = useMemo(() => {
    if (esProveedor) {
      const ordenes = Array.isArray(data?.ordenes)
        ? data.ordenes
        : Array.isArray(data?.ordenes?.ordenes)
          ? data.ordenes.ordenes
          : [];
      const ordenesProveedor = ordenes;
      const pagos = Array.isArray(data?.pagos?.pagos) ? data.pagos.pagos : [];
      const ordenesDeudoras = getOrdenesConSaldoProveedor(
        ordenesProveedor
          .filter(isOrdenCompraPendientePago)
          .sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()),
        pagos
      );
      const totalDebe = ordenesDeudoras.reduce(
        (acc, orden) => acc + Number(orden.saldoOrden || 0),
        0
      );
      const totalPagado = pagos.reduce((acc, pago) => acc + getPagoProveedorImporte(pago), 0);

      return {
        entidad: getNombreProveedor(proveedor),
        identificador: proveedor?.numeroProveedor || proveedor?.codigoProveedor || proveedor?._id || 'Sin numero',
        totalDebe,
        totalHaber: totalPagado,
        saldoActual: totalDebe * -1,
        totalPrincipal: ordenesProveedor.length,
        totalSecundario: pagos.length,
        totalPendientes: ordenesDeudoras.filter((orden) => Number(orden.saldoOrden || 0) > 0).length,
        totalFinalizados: ordenesProveedor.filter(isOrdenCompraPagada).length,
      };
    }

    const totalDebe = Number(data?.remitos?.totalDebe || 0);
    const totalCobrado = Number(data?.recibos?.totalCobrado || 0);
    const remitosCliente = Array.isArray(data?.remitos?.remitos) ? data.remitos.remitos : [];
    const totalPendientes = remitosCliente.length
      ? remitosCliente.filter((remito) => normalizeEstadoVenta(remito?.estado) === 'PENDIENTE').length
      : Number(data?.remitos?.totalPendientes || 0);
    const totalPagados = remitosCliente.length
      ? remitosCliente.filter((remito) => normalizeEstadoVenta(remito?.estado) === 'PAGADO').length
      : Number(data?.remitos?.totalPagados || data?.remitos?.totalPagadas || 0);

    return {
      entidad: getNombreCliente(cliente),
      identificador: cliente?.numeroCliente || 'Sin numero',
      totalDebe,
      totalHaber: totalCobrado,
      saldoActual: totalCobrado - totalDebe,
      totalPrincipal: Number(data?.remitos?.totalRemitos || 0),
      totalSecundario: Number(data?.recibos?.totalRecibos || 0),
      totalPendientes,
      totalFinalizados: totalPagados,
    };
  }, [cliente, data, esProveedor, proveedor]);

  const principalLabel = esProveedor ? 'Ordenes' : 'Remitos';
  const secundarioLabel = esProveedor ? 'Pagos' : 'Recibos';
  const finalizadosLabel = esProveedor ? 'Pagadas' : 'Pagados';
  const sinIdentificadorMessage = esProveedor
    ? 'No se encontro el proveedor para consultar la cuenta corriente.'
    : 'No se encontro el numero de cliente para consultar la cuenta corriente.';
  const puedeConsultar = esProveedor ? Boolean(proveedorCuentaId) : Boolean(cliente?.numeroCliente);
  const remitosCliente = Array.isArray(data?.remitos?.remitos) ? data.remitos.remitos : [];
  const recibosCliente = Array.isArray(data?.recibos?.recibos) ? data.recibos.recibos : [];
  const ordenesProveedorData = Array.isArray(data?.ordenes)
    ? data.ordenes
    : Array.isArray(data?.ordenes?.ordenes)
      ? data.ordenes.ordenes
      : [];
  const pagosProveedorData = Array.isArray(data?.pagos?.pagos) ? data.pagos.pagos : [];
  const ordenesProveedor = ordenesProveedorData
    .filter((orden) => (
      isOrdenCompraPendientePago(orden)
    ))
    .sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime());
  const ordenesParaPago = getOrdenesConSaldoProveedor(ordenesProveedor, pagosProveedorData)
    .filter((orden) => orden.saldoOrden > 0)
    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  const ordenSeleccionada = ordenesParaPago.find((orden) => getOrdenId(orden) === pagoProveedor.ordenCompra);
  const saldoOrdenSeleccionada = ordenSeleccionada ? Number(ordenSeleccionada.saldoOrden || 0) : 0;
  const totalOrdenesParaPago = roundMoney(
    ordenesParaPago.reduce((acc, orden) => acc + Number(orden.saldoOrden || 0), 0)
  );
  const deudaProveedor = totalOrdenesParaPago;
  const maxPagoProveedor = pagoProveedor.ordenCompra ? saldoOrdenSeleccionada : totalOrdenesParaPago;
  const deudaCliente = remitosCliente.reduce(
    (acc, remito) => acc + getRemitoSaldo(remito, recibosCliente),
    0
  );
  const remitosParaPago = remitosCliente
    .map((remito) => ({
      ...remito,
      saldoRemito: getRemitoSaldo(remito, recibosCliente),
      pagosRegistrados: recibosCliente.filter((recibo) => getReciboRemitoId(recibo) === String(remito?._id || '')).length,
    }))
    .filter((remito) => remito.saldoRemito > 0)
    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  const remitoSeleccionado = remitosParaPago.find((remito) => String(remito?._id || '') === pagoCliente.remito);
  const saldoRemitoSeleccionado = remitoSeleccionado ? Number(remitoSeleccionado.saldoRemito || 0) : 0;

  const handlePagoProveedorChange = (e) => {
    const { name, value } = e.target;
    setPagoProveedor((prev) => {
      if (name !== 'ordenCompra') return { ...prev, [name]: value };

      const orden = ordenesParaPago.find((item) => getOrdenId(item) === value);
      return {
        ...prev,
        ordenCompra: value,
        pagarTotal: false,
        importe: orden ? String(roundMoney(orden.saldoOrden)) : '',
      };
    });
  };

  const handlePagoClienteChange = (e) => {
    const { name, value } = e.target;
    setPagoCliente((prev) => {
      if (name !== 'remito') return { ...prev, [name]: value };

      const remito = remitosParaPago.find((item) => String(item?._id || '') === value);
      return {
        ...prev,
        remito: value,
        importe: remito ? String(roundMoney(remito.saldoRemito)) : '',
      };
    });
  };

  const handleRegistrarPagoCliente = async (e) => {
    e.preventDefault();

    if (!pagoCliente.remito) {
      setError('Selecciona el remito que se esta cobrando.');
      return;
    }

    if (pagoCliente.importe === '' || Number(pagoCliente.importe) <= 0) {
      setError('Ingresa un importe de pago valido.');
      return;
    }

    if (Number(pagoCliente.importe) > saldoRemitoSeleccionado) {
      setError('El importe no puede superar el saldo pendiente del remito seleccionado.');
      return;
    }

    setGuardandoPago(true);
    setError('');

    const response = await dispatch(crearRecibo({
      numeroCliente: String(cliente?.numeroCliente || '').trim(),
      remito: pagoCliente.remito,
      razonSocial: cliente?.razonSocial || cliente?.nombreFantasia || getNombreCliente(cliente),
      nombreApellido: getNombreCliente(cliente),
      importe: Number(pagoCliente.importe),
      fechaCobro: pagoCliente.fechaCobro,
      medioPago: pagoCliente.medioPago,
      observaciones: pagoCliente.observaciones.trim(),
    }));

    setGuardandoPago(false);

    if (response?.error) {
      setError(response.message || 'No se pudo registrar el pago del cliente.');
      return;
    }

    setPagoCliente({
      remito: '',
      importe: '',
      fechaCobro: new Date().toISOString().slice(0, 10),
      medioPago: 'Transferencia',
      observaciones: '',
    });

    await cargarCuentaCliente();

    Swal.fire({
      icon: 'success',
      title: 'Pago realizado con exito',
      text: `Se registro un pago por ${formatMoney(response?.recibo?.importe ?? pagoCliente.importe)}.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleRegistrarPagoProveedor = async (e) => {
    e.preventDefault();

    if (pagoProveedor.importe === '' || Number(pagoProveedor.importe) <= 0) {
      setError('Ingresa un importe de pago valido.');
      return;
    }

    const esPagoTotalProveedor = Boolean(pagoProveedor.pagarTotal);

    if (!ordenesParaPago.length) {
      setError('No hay ordenes de compra deudoras para pagar.');
      return;
    }

    if (!pagoProveedor.ordenCompra && !esPagoTotalProveedor) {
      setError('Selecciona una orden de compra o usa el boton Total para saldar todas.');
      return;
    }

    if (Number(pagoProveedor.importe) > maxPagoProveedor) {
      setError('El importe no puede superar el saldo pendiente de las ordenes deudoras.');
      return;
    }

    setGuardandoPago(true);
    setError('');

    const importePago = roundMoney(pagoProveedor.importe);
    let importeRestante = importePago;
    let response = null;

    const ordenesAPagar = esPagoTotalProveedor
      ? ordenesParaPago
      : ordenesParaPago.filter((orden) => getOrdenId(orden) === pagoProveedor.ordenCompra);

    for (const orden of ordenesAPagar) {
      if (importeRestante <= 0) break;

      const importeOrden = roundMoney(Math.min(importeRestante, Number(orden.saldoOrden || 0)));
      if (importeOrden <= 0) continue;

      response = await dispatch(registrarPagoProveedor(getOrdenId(orden), {
        importe: importeOrden,
        monto: importeOrden,
        fechaPago: pagoProveedor.fechaPago,
        medioPago: pagoProveedor.medioPago,
        observaciones: pagoProveedor.observaciones.trim(),
        proveedor: proveedorCuentaId,
      }));

      if (response?.error) break;
      importeRestante = roundMoney(importeRestante - importeOrden);
    }

    setGuardandoPago(false);

    if (response?.error) {
      setError(response.message || 'No se pudo registrar el pago del proveedor.');
      return;
    }

    setPagoProveedor({
      ordenCompra: '',
      importe: '',
      pagarTotal: false,
      fechaPago: new Date().toISOString().slice(0, 10),
      medioPago: 'EFECTIVO',
      observaciones: '',
    });

    await cargarOrdenesProveedor();

    Swal.fire({
      icon: 'success',
      title: 'Pago realizado con exito',
      text: `Se registro un pago por ${formatMoney(response?.pago?.importe ?? pagoProveedor.importe)}.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleAnularPagoProveedor = async (movimiento) => {
    const pagoId = movimiento?.pagoProveedorId;
    if (!pagoId) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Anular pago',
      text: `Se anulara ${movimiento.comprobante || 'el pago seleccionado'} por ${formatMoney(movimiento.haber)}.`,
      showCancelButton: true,
      confirmButtonText: 'Anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setAnulandoPagoId(pagoId);
    const response = await dispatch(eliminarPagoProveedor(pagoId));
    setAnulandoPagoId(null);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo anular',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    await cargarOrdenesProveedor();

    Swal.fire({
      icon: 'success',
      title: 'Pago anulado',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleAnularMovimientoCliente = async (movimiento) => {
    const esRemito = movimiento?.claseMovimiento === 'REMITO';
    const esRecibo = movimiento?.claseMovimiento === 'RECIBO';
    const movimientoId = esRemito ? movimiento?.remitoId : movimiento?.reciboId;

    if (!movimientoId || (!esRemito && !esRecibo)) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: esRemito ? 'Eliminar remito' : 'Anular pago',
      text: esRemito
        ? `Se eliminara ${movimiento.comprobante || 'el remito seleccionado'} y se revertira el stock asociado.`
        : `Se anulara ${movimiento.comprobante || 'el pago seleccionado'} por ${formatMoney(movimiento.haber)}.`,
      showCancelButton: true,
      confirmButtonText: esRemito ? 'Eliminar' : 'Anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setAnulandoMovimientoId(movimientoId);
    const response = esRemito
      ? await dispatch(eliminarRemito(movimientoId))
      : await dispatch(eliminarRecibo(movimientoId));
    setAnulandoMovimientoId(null);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: esRemito ? 'No se pudo eliminar' : 'No se pudo anular',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    await cargarCuentaCliente();

    Swal.fire({
      icon: 'success',
      title: esRemito ? 'Remito eliminado' : 'Pago anulado',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <section className="cuenta-corriente">
      <div className="cuenta-corriente-summary">
        <article className="cuenta-corriente-summary-card">
          <span>Debe total</span>
          <strong>{formatMoney(totalesFiltrados.totalDebe)}</strong>
        </article>
        <article className="cuenta-corriente-summary-card">
          <span>Haber total</span>
          <strong>{formatMoney(totalesFiltrados.totalHaber)}</strong>
        </article>
        <article className="cuenta-corriente-summary-card cuenta-corriente-summary-card--saldo">
          <span>{getSaldoLabel(totalesFiltrados.saldoFinal)}</span>
          <strong className={`cuenta-corriente-saldo-value ${totalesFiltrados.saldoFinal < 0 ? 'is-deudor' : totalesFiltrados.saldoFinal > 0 ? 'is-favor' : ''}`}>
            {formatMoney(totalesFiltrados.saldoFinal)}
          </strong>
        </article>
      </div>

      <div className="cuenta-corriente-summary cuenta-corriente-summary--secondary">
        <article className="cuenta-corriente-summary-card">
          <span>{principalLabel}</span>
          <strong>{resumen.totalPrincipal}</strong>
        </article>
        {esProveedor && (
          <article className="cuenta-corriente-summary-card">
            <span>{secundarioLabel}</span>
            <strong>{resumen.totalSecundario}</strong>
          </article>
        )}
        {!esProveedor && (
          <article className="cuenta-corriente-summary-card">
            <span>Pendientes</span>
            <strong>{resumen.totalPendientes}</strong>
          </article>
        )}
        {!esProveedor && (
          <article className="cuenta-corriente-summary-card">
            <span>{finalizadosLabel}</span>
            <strong>{resumen.totalFinalizados}</strong>
          </article>
        )}
      </div>

      {!esProveedor && puedeConsultar && (
        <form className="cuenta-corriente-payment-form" onSubmit={handleRegistrarPagoCliente}>
          <div>
            <span>Registrar pago de cliente</span>
            <strong>{getNombreCliente(cliente)}</strong>
            <small>Deuda actual: {formatMoney(deudaCliente)}</small>
          </div>

          <label>
            <span>Remito</span>
            <select name="remito" value={pagoCliente.remito} onChange={handlePagoClienteChange}>
              <option value="">Seleccionar remito</option>
              {remitosParaPago.map((remito) => (
                <option key={remito._id} value={remito._id}>
                  {(remito.numeroRemitoFormateado || `R-${String(remito.numeroRemito || '').padStart(6, '0')}`)} - debe {formatMoney(remito.saldoRemito)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Importe</span>
            <div className="cuenta-corriente-payment-amount">
              <input
                type="number"
                name="importe"
                min="0"
                max={saldoRemitoSeleccionado || 0}
                step="0.01"
                value={pagoCliente.importe}
                onChange={handlePagoClienteChange}
                placeholder="0"
              />
              <button
                type="button"
                className="cuenta-corriente-payment-total-btn"
                onClick={() => setPagoCliente((prev) => ({ ...prev, importe: String(saldoRemitoSeleccionado) }))}
                disabled={!saldoRemitoSeleccionado || guardandoPago}
              >
                Total remito
              </button>
            </div>
          </label>

          <label>
            <span>Fecha</span>
            <input type="date" name="fechaCobro" value={pagoCliente.fechaCobro} onChange={handlePagoClienteChange} />
          </label>

          <label>
            <span>Medio</span>
            <select name="medioPago" value={pagoCliente.medioPago} onChange={handlePagoClienteChange}>
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Debito">Debito</option>
              <option value="Credito">Credito</option>
              <option value="Cuenta DNI">Cuenta DNI</option>
            </select>
          </label>

          <label className="cuenta-corriente-payment-notes">
            <span>Observaciones</span>
            <input
              type="text"
              name="observaciones"
              value={pagoCliente.observaciones}
              onChange={handlePagoClienteChange}
              placeholder="Detalle opcional"
            />
          </label>

          <button type="submit" disabled={guardandoPago || !deudaCliente || !remitosParaPago.length}>
            {guardandoPago ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      )}

      {esProveedor && puedeConsultar && (
        <form className="cuenta-corriente-payment-form" onSubmit={handleRegistrarPagoProveedor}>
          <div>
            <span>Registrar pago a proveedor</span>
            <strong>{getNombreProveedor(proveedor)}</strong>
            <small>Deuda actual: {formatMoney(deudaProveedor)}</small>
          </div>

          <label>
            <span>Orden</span>
            <select name="ordenCompra" value={pagoProveedor.ordenCompra} onChange={handlePagoProveedorChange}>
              <option value="">Seleccionar orden deudora</option>
              {ordenesParaPago.map((orden) => (
                <option key={getOrdenId(orden)} value={getOrdenId(orden)}>
                  {(orden.numero ? `OC-${String(orden.numero).padStart(6, '0')}` : 'Orden de compra')} - debe {formatMoney(orden.saldoOrden)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Importe</span>
            <div className="cuenta-corriente-payment-amount">
              <input
                type="number"
                name="importe"
                min="0"
                max={maxPagoProveedor || 0}
                step="0.01"
                value={pagoProveedor.importe}
                onChange={handlePagoProveedorChange}
                placeholder="0"
              />
              <button
                type="button"
                className="cuenta-corriente-payment-total-btn"
                onClick={() => setPagoProveedor((prev) => ({
                  ...prev,
                  ordenCompra: '',
                  pagarTotal: true,
                  importe: String(roundMoney(totalOrdenesParaPago)),
                }))}
                disabled={!totalOrdenesParaPago || guardandoPago}
              >
                Total
              </button>
            </div>
          </label>

          <label>
            <span>Fecha</span>
            <input type="date" name="fechaPago" value={pagoProveedor.fechaPago} onChange={handlePagoProveedorChange} />
          </label>

          <label>
            <span>Medio</span>
            <select name="medioPago" value={pagoProveedor.medioPago} onChange={handlePagoProveedorChange}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>

          <label className="cuenta-corriente-payment-notes">
            <span>Observaciones</span>
            <input
              type="text"
              name="observaciones"
              value={pagoProveedor.observaciones}
              onChange={handlePagoProveedorChange}
              placeholder="Detalle opcional"
            />
          </label>

          <button type="submit" disabled={guardandoPago || !deudaProveedor || !ordenesParaPago.length}>
            {guardandoPago ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      )}

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
              {!esProveedor && <option value="PENDIENTE">Pendiente</option>}
              {!esProveedor && <option value="PAGADO">Pagado</option>}
              {!esProveedor && <option value="COBRADO">Cobrado</option>}
              {esProveedor && <option value="DEUDOR">Deudor</option>}
              {esProveedor && <option value="PAGADO">Pagado</option>}
              {esProveedor && <option value="PAGADA">Orden pagada</option>}
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
                <th>Metodo pago</th>
                <th>Debe</th>
                <th>Haber</th>
                <th>Saldo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9" className="cuenta-corriente-empty">Cargando cuenta corriente...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="9" className="cuenta-corriente-empty">{error}</td>
                </tr>
              )}

              {!loading && !error && !puedeConsultar && (
                <tr>
                  <td colSpan="9" className="cuenta-corriente-empty">{sinIdentificadorMessage}</td>
                </tr>
              )}

              {!loading && !error && puedeConsultar && movimientosConSaldo.length === 0 && (
                <tr>
                  <td colSpan="9" className="cuenta-corriente-empty">No hay movimientos para los filtros seleccionados.</td>
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
                  <td>{movimiento.tipo === 'HABER' ? movimiento.referencia : ''}</td>
                  <td className="cuenta-corriente-money cuenta-corriente-money--debe">
                    {movimiento.tipo === 'DEBE' ? formatMoney(movimiento.debe) : '-'}
                  </td>
                  <td className="cuenta-corriente-money cuenta-corriente-money--haber">
                    {movimiento.tipo === 'HABER' ? formatMoney(movimiento.haber) : '-'}
                  </td>
                  <td className="cuenta-corriente-money">{formatMoney(movimiento.saldo)}</td>
                  <td>
                    {esProveedor && movimiento.pagoProveedorId ? (
                      <button
                        type="button"
                        className="cuenta-corriente-action cuenta-corriente-action--danger"
                        onClick={() => handleAnularPagoProveedor(movimiento)}
                        disabled={anulandoPagoId === movimiento.pagoProveedorId}
                      >
                        {anulandoPagoId === movimiento.pagoProveedorId ? 'Anulando...' : 'Anular'}
                      </button>
                    ) : !esProveedor && (movimiento.remitoId || movimiento.reciboId) ? (
                      <button
                        type="button"
                        className="cuenta-corriente-action cuenta-corriente-action--danger"
                        onClick={() => handleAnularMovimientoCliente(movimiento)}
                        disabled={anulandoMovimientoId === (movimiento.remitoId || movimiento.reciboId)}
                      >
                        {anulandoMovimientoId === (movimiento.remitoId || movimiento.reciboId)
                          ? 'Anulando...'
                          : movimiento.remitoId ? 'Eliminar' : 'Anular'}
                      </button>
                    ) : '-'}
                  </td>
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
                <td className={`cuenta-corriente-money cuenta-corriente-total-saldo ${totalesFiltrados.saldoFinal < 0 ? 'is-deudor' : totalesFiltrados.saldoFinal > 0 ? 'is-favor' : ''}`}>
                  {formatMoney(totalesFiltrados.saldoFinal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

export default CuentaCorriente;
