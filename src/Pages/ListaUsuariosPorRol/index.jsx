import { useState, useEffect, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { getUsuarioByRol } from '../../Redux/Actions';
import PopupPersona from '../../Components/PopupPersona';
import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';
import SearchBar from '../../Components/BuscaArticulo';
import './styles.css';

function ListaUsuariosPorRol({ rol }) {
    const dispatch = useDispatch();
    const { search, setSearch } = useContext(AppContext);

    const allUsuarios = useSelector(state => state.usuariosRol);
    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

    const refrescarLista = () => {
        dispatch(getUsuarioByRol(rol));
    };

    useEffect(() => {
        refrescarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rol]);

    const usuariosFiltrados = useMemo(() => {
        return allUsuarios?.filter(u =>
            `${u.nombre} ${u.apellido}`.toLowerCase()
                .includes((search || "").toLowerCase())
        );
    }, [allUsuarios, search]);

    return (
        <div className="cont-principal-listaEmp">
            <div className="header-lista">
                <h2>Lista de {rol.toLowerCase()}s</h2>

                <SearchBar
                    handleOnChange={(e) => setSearch(e.target.value)}
                    vista="usuario"
                />

                <button
                    className="btn-add"
                    onClick={() => {
                        setPersonaSeleccionada(null);
                        setMostrarPopup(true);
                    }}
                >
                    + Añadir {rol.toLowerCase()}
                </button>
            </div>

            {mostrarPopup && (
                <PopupPersona
                    rol={rol}
                    persona={personaSeleccionada}
                    onClose={() => {
                        setMostrarPopup(false);
                        setPersonaSeleccionada(null);
                    }}
                    onSuccess={() => {
                        refrescarLista();
                        setMostrarPopup(false);
                        setPersonaSeleccionada(null);
                    }}
                />
            )}

            <table className="tabla-empleados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados?.length === 0 && (
                        <tr>
                            <td colSpan="6" align="center">
                                No hay usuarios
                            </td>
                        </tr>
                    )}

                    {usuariosFiltrados?.map(emp => (
                        <tr key={emp._id}>
                            <td>{emp.nombre}</td>
                            <td>{emp.apellido}</td>
                            <td>{emp.email}</td>
                            <td>
                                {emp.telefono
                                    ? `(${emp.telefono.area}) ${emp.telefono.numero}`
                                    : "-"}
                            </td>
                            <td>{emp.rol}</td>
                            <td className="acciones">
                                <button
                                    className="btn-edit"
                                    onClick={() => {
                                        setPersonaSeleccionada(emp);
                                        setMostrarPopup(true);
                                    }}
                                >
                                    Editar
                                </button>

                                <BotonEliminarUsuario
                                    _id={emp._id}
                                    nombre={emp.nombre}
                                    apellido={emp.apellido}
                                    onDelete={refrescarLista}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaUsuariosPorRol;
