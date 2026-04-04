import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import FormArticulo from '../../Components/FormArticulo';
import { getAllArticulos, getCategorias } from '../../Redux/Actions';

function ModifArticulo() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const articulos = useSelector((state) => state.articulos);
    const categorias = useSelector((state) => state.categorias);

    useEffect(() => {
        if (!articulos?.length) dispatch(getAllArticulos());
        if (!categorias?.length) dispatch(getCategorias());
    }, [dispatch, articulos?.length, categorias?.length]);

    const articulo = useMemo(
        () => (articulos || []).find((art) => art._id === id),
        [articulos, id]
    );

    if (!articulos?.length) return <p>Cargando articulo...</p>;
    if (!articulo) return <p>No se encontro el articulo.</p>;

    return (
        <div className="page">
            <h1>Modificar articulo</h1>
            <FormArticulo operacion="modificar" articuloInicial={articulo} />
        </div>
    );
}

export default ModifArticulo;
