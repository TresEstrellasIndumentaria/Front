import React from 'react';
import { useDispatch } from 'react-redux';
import { eliminarCategoria, getCategorias } from '../../Redux/Actions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';
import './estilos.css';

function BotonEliminarCategoria({ _id, nombre }) {
    const dispatch = useDispatch();

    const handleOnClick = async () => {
        const confirm = await Swal.fire({
            title: 'Estas segur@?',
            text: `De eliminar la categoria ${nombre}!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'No'
        });

        if (!confirm.isConfirmed) return;

        const resp = await dispatch(eliminarCategoria(_id));
        const msg = String(resp?.message || resp?.msg || '');
        const ok = msg.toLowerCase().includes('elimin');

        if (ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Categoria eliminada',
                timer: 1500,
                showConfirmButton: false
            });
            dispatch(getCategorias());
            return;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg || 'Error desconocido al eliminar categoria',
        });
    };

    return (
        <button
            className='btn-elim-cliente'
            onClick={handleOnClick}
        >
            <DeleteForeverIcon />
        </button>
    );
}

export default BotonEliminarCategoria;
