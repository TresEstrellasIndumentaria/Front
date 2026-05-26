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

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

const getTallesArticulo = (articulo) => (
    Array.isArray(articulo?.talles)
        ? articulo.talles.filter((talle) => String(talle?.talle || '').trim())
        : []
);

const getStockArticuloPorTalle = (articulo, talleSeleccionado = '') => {
    const talles = getTallesArticulo(articulo);
    if (!talles.length) return getStockArticulo(articulo);

    const talle = talles.find((item) => String(item?.talle || '') === String(talleSeleccionado || ''));
    return Number(talle?.stock ?? 0);
};

const getCosteArticuloPorTalle = (articulo, talleSeleccionado = '') => {
    const talles = getTallesArticulo(articulo);
    if (!talles.length) return getCosteArticulo(articulo);

    const talle = talles.find((item) => String(item?.talle || '') === String(talleSeleccionado || ''));
    return Number(talle?.costo ?? talle?.coste ?? getCosteArticulo(articulo));
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

const crearKeyAjuste = (articuloId, talle = '') => `${articuloId}::${talle || 'SIN_TALLE'}`;

function AjusteDeStock() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const articulos = useSelector((state) => state.articulos || []);

    const [anotaciones, setAnotaciones] = useState('');
    const [tipoAjuste, setTipoAjuste] = useState('AJUSTE');
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

        const art = mapaArticulos.get(id);
        if (!art) return;
        const talles = getTallesArticulo(art);
        const tallesUsados = new Set(itemsAjuste
            .filter((item) => item.articulo === id)
            .map((item) => item.talle || ''));
        const talleInicial = talles.find((talle) => !tallesUsados.has(talle.talle))?.talle || '';
        const key = crearKeyAjuste(id, talleInicial);

        if (itemsAjuste.some((item) => item.key === key)) {
            setArticuloSelect('');
            return;
        }

        setItemsAjuste((prev) => [
            ...prev,
            {
                key,
                articulo: id,
                nombre: art.nombre,
                talle: talleInicial,
                talles: talles.map((talle) => ({
                    talle: talle.talle,
                    stock: Number(talle?.stock ?? 0),
                    coste: Number(talle?.costo ?? talle?.coste ?? 0),
                })),
                stockActual: getStockArticuloPorTalle(art, talleInicial),
                cantidad: '',
                coste: String(getCosteArticuloPorTalle(art, talleInicial)),
            },
        ]);
        setArticuloSelect('');
        setErrorItems('');
    };

    const actualizarItem = (rowKey, key, value) => {
        setItemsAjuste((prev) =>
            prev.map((item) => {
                if (item.key !== rowKey) return item;
                return { ...item, [key]: value };
            })
        );
    };

    const actualizarTalleItem = (rowKey, talleSeleccionado) => {
        setItemsAjuste((prev) =>
            prev.map((item) => {
                if (item.key !== rowKey) return item;

                const art = mapaArticulos.get(item.articulo);
                return {
                    ...item,
                    key: crearKeyAjuste(item.articulo, talleSeleccionado),
                    talle: talleSeleccionado,
                    stockActual: getStockArticuloPorTalle(art, talleSeleccionado),
                    coste: String(getCosteArticuloPorTalle(art, talleSeleccionado)),
                };
            })
        );
    };

    const eliminarItem = (key) => {
        setItemsAjuste((prev) => prev.filter((item) => item.key !== key));
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
                    talle: item.talle,
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
            motivo: tipoAjuste,
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

            const advertencias = Array.isArray(resp?.advertencias)
                ? [...new Set(resp.advertencias.filter(Boolean))]
                : [];

            if (advertencias.length) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Ajuste realizado con stock negativo',
                    html: `
                        <p>${escapeHtml(msg || 'Se ajusto el stock correctamente.')}</p>
                        <ul style="text-align:left;">
                            ${advertencias.map((advertencia) => `<li>${escapeHtml(advertencia)}</li>`).join('')}
                        </ul>
                    `,
                });
            } else {
                await Swal.fire('Ajuste realizado', msg || 'Se ajusto el stock correctamente.', 'success');
            }
            setItemsAjuste([]);
            setAnotaciones('');
            setTipoAjuste('AJUSTE');
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
                    <label>Tipo de ajuste</label>
                    <select
                        className="stock-type-select"
                        value={tipoAjuste}
                        onChange={(e) => setTipoAjuste(e.target.value)}
                    >
                        <option value="COMPRA">Compra</option>
                        <option value="VENTA">Venta</option>
                        <option value="AJUSTE">Ajuste</option>
                    </select>
                </div>

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
                            <th>Talle</th>
                            <th>En stock</th>
                            <th>Ajuste (+/-)</th>
                            <th>Stock final</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsAjuste.map((item) => {
                            const stockFinal = getStockFinal(item);
                            const tallesUsados = new Set(itemsAjuste
                                .filter((otroItem) => otroItem.articulo === item.articulo && otroItem.key !== item.key)
                                .map((otroItem) => otroItem.talle));
                            return (
                                <tr key={item.key}>
                                    <td>{item.nombre}</td>
                                    <td>
                                        {item.talles.length ? (
                                            <select
                                                className="stock-talle-select"
                                                value={item.talle}
                                                onChange={(e) => actualizarTalleItem(item.key, e.target.value)}
                                            >
                                                {item.talles.map((talle) => (
                                                    <option
                                                        key={`${item.articulo}-${talle.talle}`}
                                                        value={talle.talle}
                                                        disabled={tallesUsados.has(talle.talle)}
                                                    >
                                                        {talle.talle}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="stock-talle-empty">-</span>
                                        )}
                                    </td>
                                    <td>{item.stockActual}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => {
                                                const value = normalizarInputNumerico(e.target.value);
                                                if (!esInputNumericoValido(value)) return;
                                                actualizarItem(item.key, 'cantidad', value);
                                            }}
                                            onBlur={() => {
                                                actualizarItem(item.key, 'cantidad', limpiarInputNumerico(item.cantidad));
                                            }}
                                        />
                                    </td>
                                    <td className={stockFinal < 0 ? 'stock-final-danger' : ''}>{stockFinal}</td>
                                    <td>
                                        <button type="button" className="stock-remove" onClick={() => eliminarItem(item.key)}>X</button>
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
