import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../Context';
import { getAllArticulos, getCategorias } from '../../Redux/Actions';
import SearchBar from '../../Components/BuscaArticulo';
import './styles.css';

function ListaArticulos() {
    const dispatch = useDispatch();
    const contexto = useContext(AppContext);
    const [searchType, setSearchType] = useState('nombre');
    const [inventoryFilter, setInventoryFilter] = useState('todos');

    const allArticulos = useSelector((state) => state.articulos);
    const allCat = useSelector((state) => state.categorias);

    useEffect(() => {
        if (!allArticulos?.length) {
            dispatch(getAllArticulos());
        }
    }, [dispatch, allArticulos?.length]);

    useEffect(() => {
        if (!allCat?.length) {
            dispatch(getCategorias());
        }
    }, [dispatch, allCat?.length]);

    const categoriasDisponibles = useMemo(() => {
        return (allCat || [])
            .map((cat) => cat?.nombre)
            .filter(Boolean);
    }, [allCat]);

    const getTotalStock = (articulo) => (
        (Array.isArray(articulo?.talles) ? articulo.talles : [])
            .reduce((acc, talle) => acc + Number(talle?.stock ?? 0), 0)
    );

    const articulosFiltrados = useMemo(() => {
        const searchValue = (contexto.search || '').toLowerCase();

        return (allArticulos || []).filter((art) => {
            const stock = getTotalStock(art);
            const fieldValue = searchType === 'categoria'
                ? (typeof art.categoria === 'string' ? art.categoria : art.categoria?.nombre || '')
                : art.nombre || '';

            const normalizedField = fieldValue.toLowerCase();
            const matchSearch = !searchValue
                ? true
                : (searchType === 'categoria' ? normalizedField === searchValue : normalizedField.includes(searchValue));

            const matchInventory = (() => {
                if (inventoryFilter === 'sin-stock') return stock <= 0;
                if (inventoryFilter === 'stock-bajo') return stock > 0 && stock <= 10;
                return true;
            })();

            return matchSearch && matchInventory;
        });
    }, [allArticulos, contexto.search, searchType, inventoryFilter]);

    const getStockTone = (stockValue) => {
        if (stockValue <= 3) return 'stock-chip stock-chip--danger';
        if (stockValue <= 10) return 'stock-chip stock-chip--warn';
        return 'stock-chip stock-chip--ok';
    };

    const renderStock = (stockValue) => (
        <span className={getStockTone(Number(stockValue ?? 0))}>
            <span className="stock-dot" />
            {Number(stockValue ?? 0)}
        </span>
    );

    const calculoMargen = (precio, coste) => {
        if (!precio || !coste) return 0;
        return ((precio - coste) * 100) / precio;
    };

    return (
        <div className="cont-principal-listaEmp articulos-page">
            <div className="header-lista articulos-header">
                <div className="articulos-heading">
                    <p className="articulos-kicker">Catalogo</p>
                    <h2>Lista Articulos</h2>
                </div>

                <SearchBar
                    handleOnChange={(e) => contexto.setSearch(e.target.value)}
                    vista="articulo"
                    searchType={searchType}
                    onSearchTypeChange={(nextType) => {
                        setSearchType(nextType);
                        contexto.setSearch('');
                    }}
                    categoryOptions={categoriasDisponibles}
                    inventoryFilter={inventoryFilter}
                    onInventoryFilterChange={setInventoryFilter}
                />

                <NavLink to="/creaArticulo" className="navLink-btnCreaEmp">
                    <button className="btn-add">+ Anadir Articulo</button>
                </NavLink>
            </div>

            <div className="articulos-table-shell">
                <table className="tabla-empleados articulos-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoria</th>
                            <th>Talle</th>
                            <th>Medidas</th>
                            <th>Precio</th>
                            <th>Coste</th>
                            <th>Stock</th>
                            <th>Entrantes</th>
                            <th>Margen</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {articulosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="10" className="articulos-empty">
                                    No hay articulos para mostrar.
                                </td>
                            </tr>
                        )}

                        {articulosFiltrados.map((art, articuloIndex) => {
                            const talles = Array.isArray(art?.talles) && art.talles.length
                                ? art.talles
                                : [{
                                    talle: '-',
                                    ancho: '-',
                                    alto: '-',
                                    precio: 0,
                                    coste: 0,
                                    stock: 0,
                                    entrantes: 0,
                                    artCompuesto: false
                                }];

                            return talles.map((talle, index) => (
                                <tr
                                    key={`${art._id}-${talle?.talle || index}`}
                                    className={`articulo-row-${articuloIndex % 2 === 0 ? 'even' : 'odd'} ${index === 0 ? 'articulo-row-start' : 'articulo-row-detail'}`}
                                >
                                    <td>
                                        <div className="articulo-nombre-cell">
                                            <strong>{art.nombre}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="articulo-categoria-cell">
                                            {typeof art.categoria === 'string' ? art.categoria : art.categoria?.nombre}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="talle-chip">{talle?.talle || '-'}</span>
                                    </td>
                                    <td>
                                        <span className="medidas-chip">
                                            {talle?.ancho || '-'} x {talle?.alto || '-'}
                                        </span>
                                    </td>
                                    <td className="money-cell">${Number(talle?.precio ?? 0).toLocaleString('es-AR')}</td>
                                    <td className="money-cell money-cell--soft">${Number(talle?.coste ?? 0).toLocaleString('es-AR')}</td>
                                    <td>{renderStock(talle?.stock)}</td>
                                    <td><span className="entrantes-pill">{Number(talle?.entrantes ?? 0)}</span></td>
                                    <td><span className="margen-pill">{calculoMargen(Number(talle?.precio ?? 0), Number(talle?.coste ?? 0)).toFixed(2)}%</span></td>
                                    <td className="acciones articulos-acciones">
                                        <NavLink to={`/modificaArt/${art._id}`}>
                                            <button className="btn-edit">Editar</button>
                                        </NavLink>
                                    </td>
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ListaArticulos;
