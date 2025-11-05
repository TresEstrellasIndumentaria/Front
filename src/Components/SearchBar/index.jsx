import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../Context';
import './estilos.css';

function SearchBar({ handleOnChange, vista }) {

    const contexto = useContext(AppContext);
    //useEffect para q no me quede en el estdo, la busqueda de un componente anterior.
    useEffect(() => {
        contexto.setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); //si coloco contexto en el array NO funciona

    return (
        <div className='cont-searchBar'>
            <form>
                <label className='label-searchP'>Buscar un {vista}:</label>
                <input 
                    type='text' 
                    onChange={(e) => { handleOnChange(e) }} 
                    className='input-search-producto'
                    placeholder={vista === 'producto' ? 'Nuez mariposa' : 'Pepe Lopez'}
                />
            </form>
        </div>
    )
}

export default SearchBar