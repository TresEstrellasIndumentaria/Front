import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ajustarStockArticulos, getAllArticulos } from '../../Redux/Actions';
import './styles.css';

const toNumberOrZero = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const esInputNumericoValido = (value) => /^-?\d*([.,]\d*)?$/.test(value);

const normalizarInputNumerico = (value) => value.replace(',', '.');

const limpiarInputNumerico = (value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') return 0;
    return toNumberOrZero(value);
};

const getCodigoArticulo = (articulo) => (
    articulo?.codigoArticulo || articulo?.codigo || articulo?.codArticulo || ''
);

const getStockArticulo = (articulo) => {
    const stockRaiz = Number(articulo?.stock || 0);
    const stockTalles = Array.isArray(articulo?.talles)
        ? articulo.talles.reduce((total, talle) => total + Number(talle?.stock || 0), 0)
        : 0;

    return Math.max(stockRaiz, stockTalles);
};

const getCosteArticulo = (articulo) => {
    if (Number.isFinite(Number(articulo?.costo ?? articulo?.coste))) {
        return Number(articulo?.costo ?? articulo?.coste);
    }

    if (Array.isArray(articulo?.talles) && articulo.talles.length) {
        const talleConCoste = articulo.talles.find((talle) => Number.isFinite(Number(talle?.costo ?? talle?.coste)));
        if (talleConCoste) return Number(talleConCoste.costo ?? talleConCoste.coste);
    }

    return 0;
};

function AjusteDeStock() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const articulos = useSelector((state) => state.articulos || []);

    const [anotaciones, setAnotaciones] = useState('');
    const [articuloSelect, setArticuloSelect] = useState('');
    const [itemsAjuste, setItemsAjuste] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [errorItems, setErrorItems] = useState('');

    useEffect(() => {
        if (!articulos.length) dispatch(getAllArticulos());
    }, [dispatch, articulos.length]);

    const mapaArticulos = useMemo(() => {
        const map = new Map();
        articulos.forEach((art) => {
            map.set(art._id, art);
        });
        return map;
    }, [articulos]);

    const articulosOrdenados = useMemo(() => (
        [...articulos].sort((a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es'))
    ), [articulos]);

    const agregarArticulo = (id) => {
        if (!id) return;
        if (itemsAjuste.some((item) => item.articulo === id)) {
            setArticuloSelect('');
            return;
        }

        const art = mapaArticulos.get(id);
        if (!art) return;

        setItemsAjuste((prev) => [
            ...prev,
            {
                articulo: id,
                nombre: art.nombre,
                stockActual: getStockArticulo(art),
                cantidad: '',
                coste: String(getCosteArticulo(art)),
            },
        ]);
        setArticuloSelect('');
        setErrorItems('');
    };

    const actualizarItem = (id, key, value) => {
        setItemsAjuste((prev) =>
            prev.map((item) => {
                if (item.articulo !== id) return item;
                return { ...item, [key]: value };
            })
        );
    };

    const eliminarItem = (id) => {
        setItemsAjuste((prev) => prev.filter((item) => item.articulo !== id));
    };

    const getStockFinal = (item) => {
        return Number(item.stockActual || 0) + toNumberOrZero(item.cantidad);
    };

    const handleAjustar = async () => {
        if (!itemsAjuste.length) {
            setErrorItems('Por favor, anada al menos un articulo.');
            return;
        }

        const payloadItems = itemsAjuste
            .filter((item) => Number(item.cantidad || 0) !== 0)
            .map((item) => {
                const delta = toNumberOrZero(item.cantidad);
                return {
                    articulo: item.articulo,
                    cantidad: delta,
                    stockFinal: Number(item.stockActual || 0) + delta,
                    coste: toNumberOrZero(item.coste),
                };
            });

        if (!payloadItems.length) {
            setErrorItems('Debes ingresar una cantidad distinta de 0.');
            return;
        }

        const itemNegativo = payloadItems.find((item) => Number(item.stockFinal || 0) < 0);

        if (itemNegativo) {
            Swal.fire('Stock invalido', 'El stock final no puede ser negativo.', 'warning');
            return;
        }

        const payload = {
            anotaciones,
            items: payloadItems,
        };

        setGuardando(true);
        try {
            const resp = await dispatch(ajustarStockArticulos(payload));
            const msg = String(resp?.msg || resp?.message || '');

            if (resp?.error || msg.toLowerCase().includes('error')) {
                Swal.fire('Error', msg || 'No se pudo realizar el ajuste de stock.', 'error');
                return;
            }

            await Swal.fire('Ajuste realizado', msg || 'Se ajusto el stock correctamente.', 'success');
            setItemsAjuste([]);
            setAnotaciones('');
            setErrorItems('');
            dispatch(getAllArticulos());
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="stock-ajuste-page">
            <div className="stock-card">
                <div className="stock-field">
                    <label>Anotaciones</label>
                    <textarea
                        maxLength={500}
                        value={anotaciones}
                        onChange={(e) => setAnotaciones(e.target.value)}
                    />
                    <span className="stock-counter">{anotaciones.length} / 500</span>
                </div>
            </div>

            <div className="stock-card">
                <h2>Articulos</h2>
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Articulo</th>
                            <th>En stock</th>
                            <th>Ajuste (+/-)</th>
                            <th>Costo</th>
                            <th>Stock final</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsAjuste.map((item) => {
                            const stockFinal = getStockFinal(item);
                            return (
                                <tr key={item.articulo}>
                                    <td>{item.nombre}</td>
                                    <td>{item.stockActual}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => {
                                                const value = normalizarInputNumerico(e.target.value);
                                                if (!esInputNumericoValido(value)) return;
                                                actualizarItem(item.articulo, 'cantidad', value);
                                            }}
                                            onBlur={() => {
                                                actualizarItem(item.articulo, 'cantidad', limpiarInputNumerico(item.cantidad));
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={item.coste}
                                            onChange={(e) => {
                                                const value = normalizarInputNumerico(e.target.value);
                                                if (!esInputNumericoValido(value)) return;
                                                actualizarItem(item.articulo, 'coste', value);
                                            }}
                                            onBlur={() => {
                                                actualizarItem(item.articulo, 'coste', limpiarInputNumerico(item.coste));
                                            }}
                                        />
                                    </td>
                                    <td className={stockFinal < 0 ? 'stock-final-danger' : ''}>{stockFinal}</td>
                                    <td>
                                        <button type="button" className="stock-remove" onClick={() => eliminarItem(item.articulo)}>X</button>
                                    </td>
                                </tr>
                            );
                        })}

                        <tr>
                            <td colSpan="6">
                                <div className="stock-search-row">
                                    <select
                                        value={articuloSelect}
                                        onChange={(e) => {
                                            setArticuloSelect(e.target.value);
                                            agregarArticulo(e.target.value);
                                        }}
                                    >
                                        <option value="">Buscar articulo</option>
                                        {articulosOrdenados.map((art) => (
                                            <option key={art._id} value={art._id}>
                                                {art.nombre}{getCodigoArticulo(art) ? ` | ${getCodigoArticulo(art)}` : ''} {art.itemProveedor ? '(Proveedor)' : '(Venta)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errorItems ? <p className="stock-error">{errorItems}</p> : null}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="stock-actions">
                <button type="button" className="btn-ghost" onClick={() => navigate('/')} disabled={guardando}>
                    Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleAjustar} disabled={guardando}>
                    Ajustar
                </button>
            </div>
        </div>
    );
}

export default AjusteDeStock;
