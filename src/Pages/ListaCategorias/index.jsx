import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { getCategorias, crearCategoria, editarCategoria } from '../../Redux/Actions';
import PopupCategoria from "../../Components/FormCategoria";
import SearchBar from '../../Components/BuscaArticulo';
import BotonEliminarCategoria from '../../Components/BotonEliminarCategoria';
import Swal from 'sweetalert2';

function ListaCategorias() {
    const dispatch = useDispatch();
    const contexto = useContext(AppContext);

    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [modoPopup, setModoPopup] = useState('crear');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    const categorias = useSelector(state => state.categorias);

    // Traer categorias
    useEffect(() => {
        if (!categorias?.length) {
            dispatch(getCategorias());
        }
    }, [dispatch, categorias?.length]);

    const cerrarPopup = () => {
        setMostrarPopup(false);
        setCategoriaSeleccionada(null);
        setModoPopup('crear');
    };

    // Crear/editar categoria desde popup
    const guardarCategoria = async (categoriaData) => {
        let resp;

        if (modoPopup === 'modificar' && categoriaSeleccionada?._id) {
            resp = await dispatch(editarCategoria(categoriaSeleccionada._id, categoriaData));
            await dispatch(getCategorias());
        } else {
            resp = await dispatch(crearCategoria(categoriaData));
        }

        const errorMsg = resp?.message || resp?.msg;
        if (resp?.error || errorMsg?.toLowerCase()?.includes('error')) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar la categoria',
                text: errorMsg || 'Ocurrio un error inesperado'
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: modoPopup === 'modificar' ? 'Categoria actualizada' : 'Categoria creada',
            timer: 1400,
            showConfirmButton: false
        });

        cerrarPopup();
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
                        categorias={categorias}
                        modo={modoPopup}
                        categoriaInicial={categoriaSeleccionada}
                        onClose={cerrarPopup}
                        onCreate={guardarCategoria}
                    />
                )}

                <h2>Lista Categorias</h2>

                <SearchBar
                    handleOnChange={e => contexto.setSearch(e.target.value)}
                    vista="categoria"
                />

                <button
                    className="btn-add"
                    onClick={() => {
                        setModoPopup('crear');
                        setCategoriaSeleccionada(null);
                        setMostrarPopup(true);
                    }}
                >
                    + Anadir Categoria
                </button>
            </div>

            <table className="tabla-empleados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Cantidad de articulos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {categoriasFiltradas?.map(cat => (
                        <tr key={cat._id}>
                            <td>{cat.nombre}</td>
                            <td>{cat.cantidadArticulos}</td>
                            <td className="acciones">
                                <button
                                    className="btn-edit"
                                    onClick={() => {
                                        setModoPopup('modificar');
                                        setCategoriaSeleccionada(cat);
                                        setMostrarPopup(true);
                                    }}
                                >
                                    Editar
                                </button>

                                <BotonEliminarCategoria _id={cat._id} nombre={cat.nombre} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaCategorias;
