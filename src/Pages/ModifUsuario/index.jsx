import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ActualizoLoading, getUsuarioById } from '../../Redux/Actions';
import Registrarse from '../../Components/Registrarse';

function ModifUsuario() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const usuario = useSelector(state => state.dataUsuario);
    const loading = useSelector(state => state.loading);
    const error = useSelector(state => state.error);

    useEffect(() => {
        if (id) {
            dispatch(ActualizoLoading());
            dispatch(getUsuarioById(id));
        }
    }, [dispatch, id]);

    if (loading) return <p>Cargando usuario...</p>;
    if (error) return <p>Error al cargar el usuario: {error}</p>;
    if (!usuario) return <p>No se encontró el usuario.</p>;

    return (
        <div className="page">
            <h1>Modificar Usuario</h1>
            <Registrarse operacion="modificar" rol="usuario" />
        </div>
    );
}

export default ModifUsuario;
