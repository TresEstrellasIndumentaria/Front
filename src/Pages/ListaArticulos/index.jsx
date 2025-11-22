import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { NavLink } from 'react-router-dom';
import { getAllArticulos } from '../../Redux/Actions';
//import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';
import SearchBar from '../../Components/SearchBar';
import './styles.css';

function ListaArticulos() {

    const allArticulos = useSelector(state => state.articulos);
        const [buscaArticulo, setBuscaArticulo] = useState(allArticulos);
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
        
        //calculo margen
        const calculoMarge = (precioArt, costeArt) => {
            let margen = 0;
            if(precioArt === costeArt){
                return margen
            }
            margen = (costeArt*100)/precioArt;
            return margen;
        };
    
        //trae usuarios
            useEffect(() => {
                dispatch(getAllArticulos());
            }, [dispatch]);
    
        //para la SearchBar
        useEffect(() => {
            setBuscaArticulo(
                allArticulos?.filter(c =>
                    (c.nombreApellido || "")
                        .toLowerCase()
                        .includes((contexto.search || "").toLowerCase())
                )
            );
        }, [allArticulos, contexto.search]);

    return (
        <div className='cont-principal-listaEmp'>
            <div className="header-lista">
                <h2>Lista Articulos</h2>
                {/* searchBar */}
                <SearchBar handleOnChange={handleOnChangeBuscaUsuario} vista={"articulo"} />
                <NavLink to='/creaArticulo' className='navLink-btnCreaEmp'>
                    <button className="btn-add">+ Añadir Articulo</button>
                </NavLink>
            </div>

            <table className="tabla-empleados">
                <thead>
                    <tr>
                        <th>Nombre del articulo</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Coste</th>
                        <th>Margen</th>
                        {/* <th>Stock</th> */}
                    </tr>
                </thead>
                <tbody>
                    {buscaArticulo?.map((art, i) => (
                        <tr key={i}>
                            <td>{art.nombre}</td>
                            <td>{art.categoria}</td>
                            <td>{art.precio}</td>
                            <td>{art.coste}</td>
                            <td>{calculoMarge(art.precio, art.coste)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ListaArticulos