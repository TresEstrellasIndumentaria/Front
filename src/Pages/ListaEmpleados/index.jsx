import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { NavLink } from 'react-router-dom';
import { getAllUsuarios } from '../../Redux/Actions';

import './styles.css';
import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';

function ListaEmpleados() {

    const allUsuarios = useSelector(state => state.clientes); 
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
        dispatch(getAllUsuarios());
    }, [dispatch]);
    //para la SearchBar
    useEffect(() => {
        setBuscaUsuario(
            allUsuarios.filter(c => c.nombreApellido.includes(contexto.search)));//ver por q criterio buscar
    },[allUsuarios, contexto.search]);

    return (
        <div className='cont-principal-listaEmp'>
            <div className="header-lista">
                <h2>Lista de Empleados</h2>
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
                    {allUsuarios.map((emp, i) => (
                        <tr key={i}>
                            <td>{emp.nombre}</td>
                            <td>{emp.apellido}</td>
                            <td>{emp.email}</td>
                            <td>{emp.tel}</td>
                            <td>{emp.rol}</td>
                            <td className="acciones">
                                <NavLink to={`/modificaUsuario/${emp._id}`} className='nav-modifUsuario'>
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

export default ListaEmpleados;
