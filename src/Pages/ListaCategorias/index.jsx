import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { getCategorias, crearCategoria } from '../../Redux/Actions';
import PopupCategoria from "../../Components/FormCategoria";
import SearchBar from '../../Components/SearchBar';
import BotonEliminarArt from '../../Components/BotonEliminarArt';

function ListaCategorias() {
    const dispatch = useDispatch();
    const contexto = useContext(AppContext);

    const [mostrarPopup, setMostrarPopup] = useState(false);

    const categorias = useSelector(state => state.categorias);

    // Traer categorías
    useEffect(() => {
        if (!categorias?.length) {
            dispatch(getCategorias());
        }
    }, [dispatch, categorias?.length]);

    // Crear categoría desde popup
    const agregarCategoria = async (nombre) => {
        await dispatch(crearCategoria(nombre));
        setMostrarPopup(false);
    };

    // Filtro por search
    const categoriasFiltradas = useMemo(() => {
        return categorias?.filter(cat =>
            cat.nombre
                ?.toLowerCase()
                .includes((contexto.search || '').toLowerCase())
        );
    }, [categorias, contexto.search]);

    return (
        <div className="cont-principal-listaEmp">
            <div className="header-lista">

                {mostrarPopup && (
                    <PopupCategoria
                        onClose={() => setMostrarPopup(false)}
                        onCreate={agregarCategoria}
                    />
                )}

                <h2>Lista Categorías</h2>

                <SearchBar
                    handleOnChange={e => contexto.setSearch(e.target.value)}
                    vista="categoria"
                />

                {/* 🔥 BOTÓN QUE ABRE EL POPUP */}
                <button
                    className="btn-add"
                    onClick={() => setMostrarPopup(true)}
                >
                    + Añadir Categoría
                </button>
            </div>

            <table className="tabla-empleados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Cantidad de artículos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {categoriasFiltradas?.map(cat => (
                        <tr key={cat._id}>
                            <td>{cat.nombre}</td>
                            <td>{cat.cantidadArticulos}</td>
                            <td className="acciones">
                                <button className="btn-edit">Editar</button>
                                <BotonEliminarArt _id={cat._id} nombre={cat.nombre} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaCategorias;
