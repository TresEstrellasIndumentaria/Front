import React from 'react';
import { useDispatch } from 'react-redux';
import { eliminaCliente, getAllClientes } from '../../Redux/Actions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';
import './estilos.css';

function BotonEliminarUsuario({_id, nombre, apellido}) {

    const dispatch = useDispatch();

    const handleOnClick = () => {
        Swal.fire({
            title: "Estás segur@ ?",
            text: `De eliminar a ${nombre} ${apellido}!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "SI",
            cancelButtonText: "NO"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Your file has been deleted.",
                    icon: "success"
                });
                /* dispatch(eliminaCliente(_id));
                dispatch(getAllClientes()); */
                window.location.reload();
            }
        });
    };

    return (        
        <button 
            className='btn-elim-cliente'
            onClick={() => {handleOnClick()}}
        >
            <DeleteForeverIcon />
        </button>        
    )
}

export default BotonEliminarUsuario