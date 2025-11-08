import React from 'react';
import { useDispatch } from 'react-redux';
import { eliminaUsuario, getAllUsuarios } from '../../Redux/Actions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';
import './estilos.css';

function BotonEliminarUsuario({ _id, nombre, apellido }) {
    const dispatch = useDispatch();

    const handleOnClick = async () => {
        const confirm = await Swal.fire({
            title: "¿Estás segur@?",
            text: `De eliminar a ${nombre} ${apellido}!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "No"
        });

        if (confirm.isConfirmed) {
            const resp = await dispatch(eliminaUsuario(_id));

            if (resp?.message === 'Usuario eliminado correctamente') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Eliminado correctamente',
                    timer: 1500
                });
                dispatch(getAllUsuarios());
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

export default BotonEliminarUsuario;
