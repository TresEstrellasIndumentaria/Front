import React from 'react';
import { NavLink } from 'react-router-dom';

function ListaClientes() {
    const arrayEmp = [
        {
            nombre: "Marcos",
            apellido: "Pp",
            email: "ff@gmail.com",
            tel: 123456,
            rol: "Empleado"
        },
        {
            nombre: "Mel",
            apellido: "Pp",
            email: "ff@gmail.com",
            tel: 123456,
            rol: "Empleado"
        }
    ];

    const handleEdit = (empleado) => {
        alert(`Editar: ${empleado.nombre} ${empleado.apellido}`);
    };

    const handleDelete = (empleado) => {
        if (window.confirm(`¿Seguro que deseas eliminar a ${empleado.nombre} ${empleado.apellido}?`)) {
            alert(`Eliminado: ${empleado.nombre}`);
        }
    };

    return (
        <div className='cont-principal-listaEmp'>
            <div className="header-lista">
                <h2>Lista de Clientes</h2>
                <NavLink to='/creaCliente' className='navLink-btnCreaEmp'>
                    <button className="btn-add">+ Añadir Cliente</button>
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
                    {arrayEmp.map((e, i) => (
                        <tr key={i}>
                            <td>{e.nombre}</td>
                            <td>{e.apellido}</td>
                            <td>{e.email}</td>
                            <td>{e.tel}</td>
                            <td>{e.rol}</td>
                            <td className="acciones">
                                <button className="btn-edit" onClick={() => handleEdit(e)}>Editar</button>
                                <button className="btn-delete" onClick={() => handleDelete(e)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaClientes;
