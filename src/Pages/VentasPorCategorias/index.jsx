import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import { getAllArticulos, getRemitos } from '../../Redux/Actions';
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

const normalizeKey = (value) => normalizeText(value).toLowerCase() || 'sin-categoria';

const getCategoriaNombre = (articulo) => {
  if (!articulo?.categoria) return '';
  return typeof articulo.categoria === 'string' ? articulo.categoria : articulo.categoria?.nombre || '';
};

const getNombreCliente = (venta) => (
  venta?.nombreApellido?.trim() || venta?.razonSocial?.trim() || 'Sin cliente'
);

const getItemsPedido = (venta) => (
  Array.isArray(venta?.pedido)
    ? venta.pedido.filter((item) => normalizeText(item?.prenda))
    : []
);

function VentasPorCategorias() {
  const dispatch = useDispatch();
  const articulos = useSelector((state) => state.articulos || []);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [orden, setOrden] = useState('UNIDADES_DESC');

  useEffect(() => {
    if (!articulos.length) {
      dispatch(getAllArticulos());
    }
  }, [articulos.length, dispatch]);

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
        setError(primeraPagina.message || 'No se pudieron cargar las ventas por categoria.');
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

  const articulosPorNombre = useMemo(() => {
    const map = new Map();

    articulos.forEach((articulo) => {
      const nombre = normalizeText(articulo?.nombre).toLowerCase();
      if (nombre && !map.has(nombre)) {
        map.set(nombre, articulo);
      }
    });

    return map;
  }, [articulos]);

  const categoriasDisponibles = useMemo(() => {
    const categorias = new Set();

    articulos.forEach((articulo) => {
      const categoria = normalizeText(getCategoriaNombre(articulo));
      if (categoria) categorias.add(categoria);
    });

    return Array.from(categorias).sort((a, b) => a.localeCompare(b, 'es'));
  }, [articulos]);

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((venta) => {
      const fecha = String(venta?.createdAt || '').slice(0, 10);
      const matchEstado = estadoFiltro === 'TODOS' ? true : venta?.estado === estadoFiltro;
      const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
      const matchHasta = fechaHasta ? fecha <= fechaHasta : true;

      return matchEstado && matchDesde && matchHasta;
    });
  }, [estadoFiltro, fechaDesde, fechaHasta, ventas]);

  const ventasPorCategoria = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const acumulado = new Map();

    ventasFiltradas.forEach((venta) => {
      const items = getItemsPedido(venta);
      const importePorItem = items.length ? Number(venta?.importeTotal || 0) / items.length : 0;
      const cliente = getNombreCliente(venta);

      items.forEach((item) => {
        const prenda = normalizeText(item?.prenda);
        const articulo = articulosPorNombre.get(prenda.toLowerCase());
        const categoria = normalizeText(getCategoriaNombre(articulo)) || 'Sin categoria';
        const key = normalizeKey(categoria);

        if (categoriaFiltro !== 'TODAS' && categoria !== categoriaFiltro) return;

        if (!acumulado.has(key)) {
          acumulado.set(key, {
            key,
            categoria,
            unidades: 0,
            importeEstimado: 0,
            remitos: new Set(),
            clientes: new Set(),
            articulos: new Map(),
          });
        }

        const row = acumulado.get(key);
        row.unidades += 1;
        row.importeEstimado += importePorItem;
        row.remitos.add(venta?._id || venta?.numeroRemito);
        row.clientes.add(cliente);
        row.articulos.set(prenda, (row.articulos.get(prenda) || 0) + 1);
      });
    });

    return Array.from(acumulado.values())
      .map((row) => ({
        ...row,
        remitosCantidad: row.remitos.size,
        clientesCantidad: row.clientes.size,
        articulosDetalle: Array.from(row.articulos.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
      }))
      .filter((row) => (
        normalizedQuery
          ? `${row.categoria} ${row.articulosDetalle.map(([articulo]) => articulo).join(' ')}`.toLowerCase().includes(normalizedQuery)
          : true
      ))
      .sort((a, b) => {
        if (orden === 'UNIDADES_ASC') return a.unidades - b.unidades;
        if (orden === 'IMPORTE_DESC') return b.importeEstimado - a.importeEstimado;
        if (orden === 'IMPORTE_ASC') return a.importeEstimado - b.importeEstimado;
        if (orden === 'CATEGORIA_ASC') return a.categoria.localeCompare(b.categoria, 'es');
        return b.unidades - a.unidades;
      });
  }, [articulosPorNombre, categoriaFiltro, orden, query, ventasFiltradas]);

  const resumen = useMemo(() => {
    const unidades = ventasPorCategoria.reduce((acc, row) => acc + row.unidades, 0);
    const importeEstimado = ventasPorCategoria.reduce((acc, row) => acc + row.importeEstimado, 0);
    const categoriaTop = ventasPorCategoria[0]?.categoria || '-';

    return {
      categorias: ventasPorCategoria.length,
      unidades,
      importeEstimado,
      categoriaTop,
    };
  }, [ventasPorCategoria]);

  const limpiarFiltros = () => {
    setQuery('');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoFiltro('TODOS');
    setCategoriaFiltro('TODAS');
    setOrden('UNIDADES_DESC');
  };

  return (
    <section className="ventas-categoria-page">
      <div className="ventas-categoria-shell">
        <header className="ventas-categoria-hero">
          <div>
            <p className="ventas-categoria-kicker">Informes</p>
            <h1>Ventas por categoria</h1>
            <p className="ventas-categoria-subtitle">
              Compara el rendimiento por familia de productos y detecta que categorias concentran mas unidades vendidas.
            </p>
          </div>
        </header>

        <div className="ventas-categoria-summary">
          <article className="ventas-categoria-summary-card">
            <span>Categorias vendidas</span>
            <strong>{resumen.categorias}</strong>
          </article>
          <article className="ventas-categoria-summary-card">
            <span>Unidades visibles</span>
            <strong>{resumen.unidades}</strong>
          </article>
          <article className="ventas-categoria-summary-card">
            <span>Importe estimado</span>
            <strong>{formatMoney(resumen.importeEstimado)}</strong>
          </article>
          <article className="ventas-categoria-summary-card ventas-categoria-summary-card--top">
            <span>Categoria lider</span>
            <strong>{resumen.categoriaTop}</strong>
          </article>
        </div>

        <div className="ventas-categoria-card">
          <div className="ventas-categoria-toolbar">
            <label className="ventas-categoria-search">
              <SearchIcon fontSize="small" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por categoria o articulo"
              />
            </label>

            <div className="ventas-categoria-filters">
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="DEUDOR">Deudores</option>
                <option value="PAGADO">Pagados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
              <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                <option value="TODAS">Todas las categorias</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
                <option value="Sin categoria">Sin categoria</option>
              </select>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="UNIDADES_DESC">Mas unidades</option>
                <option value="UNIDADES_ASC">Menos unidades</option>
                <option value="IMPORTE_DESC">Mayor importe</option>
                <option value="IMPORTE_ASC">Menor importe</option>
                <option value="CATEGORIA_ASC">Categoria A-Z</option>
              </select>
              <button type="button" className="ventas-categoria-btn ventas-categoria-btn--ghost" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="ventas-categoria-note">
            La categoria se obtiene cruzando la prenda del remito con el catalogo de articulos. El importe se prorratea porque el pedido no guarda precio por linea.
          </div>

          <div className="ventas-categoria-table-wrap">
            <table className="ventas-categoria-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Unidades</th>
                  <th>Remitos</th>
                  <th>Clientes</th>
                  <th>Articulos vendidos</th>
                  <th>Importe estimado</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="ventas-categoria-empty">Cargando ventas por categoria...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="6" className="ventas-categoria-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && ventasPorCategoria.length === 0 && (
                  <tr>
                    <td colSpan="6" className="ventas-categoria-empty">No hay categorias para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loading && !error && ventasPorCategoria.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <div className="ventas-categoria-name">
                        <strong>{row.categoria}</strong>
                        <span>{row.articulosDetalle.length === 1 ? '1 articulo vendido' : `${row.articulosDetalle.length} articulos vendidos`}</span>
                      </div>
                    </td>
                    <td>{row.unidades}</td>
                    <td>{row.remitosCantidad}</td>
                    <td>{row.clientesCantidad}</td>
                    <td>
                      <div className="ventas-categoria-items">
                        {row.articulosDetalle.slice(0, 6).map(([articulo, cantidad]) => (
                          <span key={`${row.key}-${articulo}`}>{articulo}: {cantidad}</span>
                        ))}
                      </div>
                    </td>
                    <td className="ventas-categoria-money">{formatMoney(row.importeEstimado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="ventas-categoria-total-label">Totales visibles</td>
                  <td>{resumen.unidades}</td>
                  <td colSpan="3">{ventasFiltradas.length} ventas filtradas</td>
                  <td className="ventas-categoria-money">{formatMoney(resumen.importeEstimado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="ventas-categoria-footer">
            <span>{ventas.length} ventas cargadas en total</span>
            <strong>{estadoLabel[estadoFiltro] || 'Todos los estados'}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VentasPorCategorias;
