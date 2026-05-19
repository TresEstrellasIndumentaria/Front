import React from 'react';
import { useDispatch } from 'react-redux';
import { eliminarArt, getAllArticulos } from '../../Redux/Actions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';

function BotonEliminarArt({ _id, nombre }) {
    const dispatch = useDispatch();

    const handleOnClick = async () => {
        const confirm = await Swal.fire({
            title: 'Eliminar articulo',
            text: `Vas a eliminar ${nombre}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1f1f1f',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        const resp = await dispatch(eliminarArt(_id));

        if (resp?.msg === 'Articulo eliminado correctamente' || resp?.message === 'Articulo eliminado correctamente') {
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            dispatch(getAllArticulos());
            return;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp?.message || resp?.msg || 'Error desconocido al eliminar',
        });
    };

    return (
        <button
            type="button"
            className="btn-delete-articulo"
            onClick={handleOnClick}
            aria-label={`Eliminar ${nombre}`}
            title="Eliminar articulo"
        >
            <DeleteForeverIcon />
        </button>
    );
}

export default BotonEliminarArt;
