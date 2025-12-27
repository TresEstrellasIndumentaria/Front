import React from 'react';
import { useDispatch } from 'react-redux';
import { eliminarArt, getAllArticulos } from '../../Redux/Actions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';


function BotonEliminarArt({ _id, nombre }) {
    const dispatch = useDispatch();

    const handleOnClick = async () => {
        const confirm = await Swal.fire({
            title: "¿Estás segur@?",
            text: `De eliminar a ${nombre}!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "No"
        });

        if (confirm.isConfirmed) {
            const resp = await dispatch(eliminarArt(_id));

            if (resp?.message === 'Articulo eliminado correctamente') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Eliminado correctamente',
                    timer: 1500
                });
                dispatch(getAllArticulos());
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: resp?.message || 'Error desconocido al eliminar',
                });
            }
        }
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

export default BotonEliminarArt;
