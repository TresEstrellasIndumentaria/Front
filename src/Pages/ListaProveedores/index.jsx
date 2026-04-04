import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PopupPersona from '../../Components/PopupPersona';
import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';
import { getUsuarioByRol } from '../../Redux/Actions';
import './styles.css';

const getNombreProveedor = (prov) => {
    if (!prov) return '-';
    const nombre = `${prov.nombre || ''} ${prov.apellido || ''}`.trim();
    return nombre || prov.razonSocial || prov.nombreFantasia || '-';
};

const getContactoProveedor = (prov) => {
    if (!prov) return '-';
    if (prov.contacto) return prov.contacto;
    const alt = `${prov.nombreContacto || ''} ${prov.apellidoContacto || ''}`.trim();
    return alt || '-';
};

const getTelefonoProveedor = (prov) => {
    const tel = prov?.telefono;
    if (!tel) return '-';
    if (typeof tel === 'string') return tel;
    const value = `${tel.area || ''} ${tel.numero || ''}`.trim();
    return value || '-';
};

function ListaProveedores() {
    const dispatch = useDispatch();
    const proveedores = useSelector((state) => state.usuariosRol || []);

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
    const [query, setQuery] = useState('');
    const [seleccionados, setSeleccionados] = useState([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const refrescar = () => {
        dispatch(getUsuarioByRol('PROVEEDOR'));
    };

    useEffect(() => {
        refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtrados = useMemo(() => {
        const q = (query || '').toLowerCase().trim();
        if (!q) return proveedores;

        return proveedores.filter((prov) => {
            const nombre = getNombreProveedor(prov).toLowerCase();
            const contacto = getContactoProveedor(prov).toLowerCase();
            const telefono = getTelefonoProveedor(prov).toLowerCase();
            const email = String(prov?.email || '').toLowerCase();
            return (
                nombre.includes(q) ||
                contacto.includes(q) ||
                telefono.includes(q) ||
                email.includes(q)
            );
        });
    }, [proveedores, query]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * rowsPerPage;
    const rows = filtrados.slice(start, start + rowsPerPage);

    useEffect(() => {
        setPage(1);
    }, [query, rowsPerPage]);

    const idsPagina = rows.map((row) => row?._id).filter(Boolean);
    const todosSeleccionados = idsPagina.length > 0 && idsPagina.every((id) => seleccionados.includes(id));

    const toggleSeleccion = (id) => {
        setSeleccionados((prev) => (
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        ));
    };

    const toggleSeleccionPagina = () => {
        if (todosSeleccionados) {
            setSeleccionados((prev) => prev.filter((id) => !idsPagina.includes(id)));
            return;
        }
        setSeleccionados((prev) => Array.from(new Set([...prev, ...idsPagina])));
    };

    return (
        <div className="prov-list">
            <div className="prov-card">
                <div className="prov-toolbar">
                    <button
                        className="prov-add-btn"
                        onClick={() => {
                            setProveedorSeleccionado(null);
                            setMostrarPopup(true);
                        }}
                    >
                        + Anadir proveedor
                    </button>

                    <div className="prov-search">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar proveedor"
                        />
                        <SearchIcon />
                    </div>
                </div>

                <table className="prov-table">
                    <thead>
                        <tr>
                            <th className="w-check">
                                <input
                                    type="checkbox"
                                    checked={todosSeleccionados}
                                    onChange={toggleSeleccionPagina}
                                />
                            </th>
                            <th>Nombre</th>
                            <th>Contacto</th>
                            <th>Numero de telefono</th>
                            <th>Direccion de correo electronico</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="6" className="prov-empty">No hay proveedores para mostrar.</td>
                            </tr>
                        )}

                        {rows.map((prov) => (
                            <tr key={prov._id || prov.id}>
                                <td className="w-check">
                                    <input
                                        type="checkbox"
                                        checked={seleccionados.includes(prov._id)}
                                        onChange={() => toggleSeleccion(prov._id)}
                                    />
                                </td>
                                <td>{getNombreProveedor(prov)}</td>
                                <td>{getContactoProveedor(prov)}</td>
                                <td>{getTelefonoProveedor(prov)}</td>
                                <td>{prov.email || '-'}</td>
                                <td className="prov-actions">
                                    <button
                                        type="button"
                                        className="prov-btn-edit"
                                        onClick={() => {
                                            setProveedorSeleccionado(prov);
                                            setMostrarPopup(true);
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <BotonEliminarUsuario
                                        _id={prov._id}
                                        nombre={prov.nombre || ''}
                                        apellido={prov.apellido || ''}
                                        onDelete={refrescar}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="prov-pagination">
                    <div className="prov-page-arrows">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                            <KeyboardArrowLeftIcon />
                        </button>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            <KeyboardArrowRightIcon />
                        </button>
                    </div>

                    <div className="prov-page-info">
                        <span>Pagina:</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => setPage(Math.max(1, Math.min(totalPages, Number(e.target.value || 1))))}
                        />
                        <span>de {totalPages}</span>
                    </div>

                    <div className="prov-page-size">
                        <span>Filas por pagina:</span>
                        <div className="prov-page-size-select">
                            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <KeyboardArrowDownIcon fontSize="small" />
                        </div>
                    </div>
                </div>
            </div>

            {mostrarPopup && (
                <PopupPersona
                    rol="PROVEEDOR"
                    persona={proveedorSeleccionado}
                    onClose={() => {
                        setMostrarPopup(false);
                        setProveedorSeleccionado(null);
                    }}
                    onSuccess={() => {
                        setMostrarPopup(false);
                        setProveedorSeleccionado(null);
                        refrescar();
                    }}
                />
            )}
        </div>
    );
}

export default ListaProveedores;
