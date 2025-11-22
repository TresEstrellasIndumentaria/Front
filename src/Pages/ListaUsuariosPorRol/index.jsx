import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { NavLink } from 'react-router-dom';
import { getUsuarioByRol } from '../../Redux/Actions';
import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';
import SearchBar from '../../Components/SearchBar';
import './styles.css';

function ListaUsuariosPorRol({rol}) {

    const allUsuarios = useSelector(state => state.usuariosRol);
    const [buscaUsuario, setBuscaUsuario] = useState(allUsuarios);
    //const [usuarioAeditar, setUsuarioAeditar] = useState(null);
    const dispatch = useDispatch();
    const contexto = useContext(AppContext);

    //onChange para pasarle al comp. hijo searchbar - a pesar q el input está en el hijo
    const handleOnChangeBuscaUsuario = (e) => {
        contexto.setSearch(e.target.value);
    };

    /* const handleEdit = (empleado) => {
        setUsuarioAeditar(empleado);
    }; */

    //trae usuarios
        useEffect(() => {
            dispatch(getUsuarioByRol(rol));
        }, [dispatch, rol]);

    //para la SearchBar
    useEffect(() => {
        setBuscaUsuario(
            allUsuarios?.filter(c =>
                (c.nombreApellido || "")
                    .toLowerCase()
                    .includes((contexto.search || "").toLowerCase())
            )
        );
    }, [allUsuarios, contexto.search]);


    return (
        <div className='cont-principal-listaEmp'>
            <div className="header-lista">
                <h2>
                    Lista de {
                        rol === "administrador" 
                        ? "Administradores"
                        : rol === "empleado" 
                        ? "Emplados"
                        : rol === "cliente"
                        ? "Clientes"
                        : "Proveedores"
                    }
                </h2>
                {/* searchBar */}
                <SearchBar handleOnChange={handleOnChangeBuscaUsuario} vista={"usuario"} />
                <NavLink to='/creaEmpleado' className='navLink-btnCreaEmp'>
                    <button className="btn-add">+ Añadir Empleado</button>
                </NavLink>
            </div>

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
                    {buscaUsuario?.map((emp, i) => (
                        <tr key={i}>
                            <td>{emp.nombre}</td>
                            <td>{emp.apellido}</td>
                            <td>{emp.email}</td>
                            <td>{emp.telefono.area+emp.telefono.numero}</td>
                            <td>{emp.rolAsignado}</td>
                            <td className="acciones">
                                <NavLink to={`/modificaUsuario/${rol}/${emp._id}`} className='nav-modifUsuario'>
                                    <button className="btn-edit" /* onClick={() => handleEdit(emp)} */>Editar</button>
                                </NavLink>

                                <BotonEliminarUsuario _id={emp._id} nombre={emp.nombre} apellido={emp.apellido} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaUsuariosPorRol;
