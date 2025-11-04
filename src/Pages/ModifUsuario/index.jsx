import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getUsuarioById } from '../../Redux/Actions';
import Registrarse from '../../Components/Registrarse';

function ModifUsuario() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const loading = useSelector(state => state.loading);
    const error = useSelector(state => state.error);

    useEffect(() => {
        if (id) {
            dispatch(getUsuarioById(id));
        }
    }, [dispatch, id]);

    if (loading) return <p>Cargando usuario...</p>;
    if (error) return <p>Error al cargar el usuario: {error}</p>;

    return (
        <div className="page">
            <h1>Modificar Usuario</h1>
            <Registrarse operacion="modificar" tipo="usuario" />
        </div>
    );
}

export default ModifUsuario;
