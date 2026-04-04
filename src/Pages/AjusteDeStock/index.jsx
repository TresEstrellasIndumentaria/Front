import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ajustarStockArticulos, getAllArticulos } from '../../Redux/Actions';
import './styles.css';

const MOTIVOS = [
    { value: 'RECIBIR_ARTICULOS', label: 'Recibir articulos' },
    { value: 'RECUENTO_INVENTARIO', label: 'Recuento de inventario' },
    { value: 'PERDIDA', label: 'Perdida' },
    { value: 'DAÑADO', label: 'Dañado' },
];

const toNumberOrZero = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const esInputNumericoValido = (value) => /^-?\d*([.,]\d*)?$/.test(value);

const normalizarInputNumerico = (value) => value.replace(',', '.');

const getDeltaPorMotivo = (motivo, cantidad) => {
    const value = toNumberOrZero(cantidad);
    if (motivo === 'PERDIDA' || motivo === 'DAÑADO' || motivo === 'DANADO') return -Math.abs(value);
    return value;
};

const limpiarInputNumerico = (value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') return 0;
    return toNumberOrZero(value);
};

function AjusteDeStock() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const articulos = useSelector((state) => state.articulos || []);

    const [motivo, setMotivo] = useState('RECIBIR_ARTICULOS');
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

    const puedeEditarCoste = motivo === 'RECIBIR_ARTICULOS';

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
                stockActual: Number(art.stock || 0),
                cantidad: '',
                coste: String(Number(art.coste || 0)),
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
        const delta = getDeltaPorMotivo(motivo, item.cantidad);
        return Number(item.stockActual || 0) + delta;
    };

    const handleAjustar = async () => {
        if (!itemsAjuste.length) {
            setErrorItems('Por favor, añada al menos un articulo.');
            return;
        }

        const payloadItems = itemsAjuste
            .filter((item) => Number(item.cantidad || 0) !== 0)
            .map((item) => {
                const delta = getDeltaPorMotivo(motivo, item.cantidad);
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

        const itemNegativo = payloadItems.find((item) => {
            return Number(item.stockFinal || 0) < 0;
        });

        if (itemNegativo) {
            Swal.fire('Stock invalido', 'El stock final no puede ser negativo.', 'warning');
            return;
        }

        const payload = {
            motivo,
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
            setMotivo('RECIBIR_ARTICULOS');
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
                    <label>Motivo</label>
                    <div className="stock-select-wrap">
                        <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                            {MOTIVOS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <KeyboardArrowDownIcon fontSize="small" />
                    </div>
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
                            <th>En stock</th>
                            <th>Ajuste (+/-)</th>
                            <th>Coste</th>
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
                                            value={item.coste}
                                            onChange={(e) => {
                                                const value = normalizarInputNumerico(e.target.value);
                                                if (!esInputNumericoValido(value)) return;
                                                actualizarItem(item.articulo, 'coste', value);
                                            }}
                                            onBlur={() => {
                                                actualizarItem(item.articulo, 'coste', limpiarInputNumerico(item.coste));
                                            }}
                                            disabled={!puedeEditarCoste}
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
                                        {articulos.map((art) => (
                                            <option key={art._id} value={art._id}>{art.nombre}</option>
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
