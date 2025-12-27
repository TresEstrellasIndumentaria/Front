import React, { useEffect, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { NavLink } from 'react-router-dom';
import { getAllArticulos, getCategorias } from '../../Redux/Actions';
import BotonEliminarArt from '../../Components/BotonEliminarArt';
import SearchBar from '../../Components/SearchBar';
import './styles.css';

function ListaArticulos() {
    const dispatch = useDispatch();
    const contexto = useContext(AppContext);

    const allArticulos = useSelector(state => state.articulos);
    const allCat = useSelector(state => state.categorias);

    //trae articulos
    useEffect(() => {
        if (!allArticulos?.length) {
            dispatch(getAllArticulos());
        }
    }, [dispatch, allArticulos?.length]);

    //trae categorias
    useEffect(()=>{
        if(!allCat?.length) {
            dispatch(getCategorias());
        }
    },[dispatch, allCat?.length]);

    const articulosFiltrados = useMemo(() => {
        return allArticulos?.filter(art =>
            art.nombre
                ?.toLowerCase()
                .includes((contexto.search || '').toLowerCase())
        );
    }, [allArticulos, contexto.search]);

    const calculoMargen = (precio, coste) => {
        if (!precio || !coste) return 0;
        return ((precio - coste) * 100) / precio;
    };

    return (
        <div className='cont-principal-listaEmp'>
            <div className="header-lista">
                <h2>Lista Artículos</h2>

                <SearchBar
                    handleOnChange={e => contexto.setSearch(e.target.value)}
                    vista="articulo"
                />

                <NavLink to='/creaArticulo' className='navLink-btnCreaEmp'>
                    <button className="btn-add">+ Añadir Artículo</button>
                </NavLink>
            </div>

            <table className="tabla-empleados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Coste</th>
                        <th>Margen</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {articulosFiltrados?.map(art => (
                        <tr key={art._id}>
                            <td>{art.nombre}</td>
                            <td>{art.categoria}</td>
                            <td>{art.precio}</td>
                            <td>{art.coste}</td>
                            <td>{calculoMargen(art.precio, art.coste).toFixed(2)}%</td>
                            <td className="acciones">
                                <NavLink to={`/modificaArt/${art._id}`}>
                                    <button className="btn-edit">Editar</button>
                                </NavLink>

                                <BotonEliminarArt _id={art._id} nombre={art.nombre} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaArticulos;
