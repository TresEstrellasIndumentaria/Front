import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../Context';
import './estilos.css';

function SearchFilterBar({
    handleOnChange,
    onQueryChange,
    vista,
    searchType = 'nombre',
    onSearchTypeChange,
    categoryOptions = [],
    inventoryFilter = 'todos',
    onInventoryFilterChange,
}) {

    const contexto = useContext(AppContext);
    const handleChange = onQueryChange || handleOnChange;

    const normalizedCategories = categoryOptions
        .map((cat) => (typeof cat === 'string' ? cat : cat?.nombre))
        .filter(Boolean);

    //useEffect para q no me quede en el estdo, la busqueda de un componente anterior.
    useEffect(() => {
        contexto.setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); //si coloco contexto en el array NO funciona

    return (
        <div className='search-panel'>
            <form className='search-form'>
                <label className='search-label'>
                    {vista === 'articulo'
                        ? `Buscar por ${searchType === 'categoria' ? 'categoria' : 'nombre de articulo'}`
                        : 'Buscar'}
                </label>
                <div className='search-controls'>
                    {vista === 'articulo' && (
                        <select
                            className='search-mode-select'
                            value={searchType}
                            onChange={(e) => onSearchTypeChange?.(e.target.value)}
                        >
                            <option value='nombre'>Nombre articulo</option>
                            <option value='categoria'>Categoria</option>
                        </select>
                    )}

                    {vista === 'articulo' && (
                        <div className='search-field'>
                            <label className='search-field-label'>Stock</label>
                            <select
                                className='search-mode-select'
                                value={inventoryFilter}
                                onChange={(e) => onInventoryFilterChange?.(e.target.value)}
                            >
                                <option value='todos'>Todos los articulos</option>
                                <option value='stock-bajo'>Stock bajo</option>
                                <option value='sin-stock'>Sin stock</option>
                            </select>
                        </div>
                    )}

                    {vista === 'articulo' && searchType === 'categoria' && normalizedCategories.length > 0 ? (
                        <select
                            className='search-input'
                            onChange={handleChange}
                            defaultValue=''
                        >
                            <option value=''>Todas las categorias</option>
                            {normalizedCategories.map((categoria) => (
                                <option key={categoria} value={categoria}>
                                    {categoria}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type='text'
                            onChange={handleChange}
                            className='search-input'
                            placeholder={
                                vista === 'articulo'
                                    ? (searchType === 'categoria' ? 'Ej: Remeras' : 'Ej: nombre art')
                                    : (vista === 'producto' ? 'nombre art' : 'nombre art')
                            }
                        />
                    )}
                </div>
            </form>
        </div>
    )
}

export default SearchFilterBar
