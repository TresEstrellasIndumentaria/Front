import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { modificaUsuario, registrarse } from '../../Redux/Actions';
import Swal from 'sweetalert2';
import FormularioUsuario from '../FormCreaUsuario';
import './styles.css';

function Registrarse({ operacion, rol }) {
    const dispatch = useDispatch();
    const userLog = useSelector(state => state.dataUsuario); // usuario para modificar

    const [idUser, setIdUser] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [area, setArea] = useState('');
    const [numTel, setNumTel] = useState('');
    const [calle, setCalle] = useState('');
    const [numero, setNumero] = useState('');
    const [piso, setPiso] = useState('');
    const [depto, setDepto] = useState('');
    const [codigoPostal, setCodigoPostal] = useState('');
    const [provincia, setProvincia] = useState('');
    const [localidad, setLocalidad] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setErrors(prev => ({ ...prev, [id]: null }));

        switch (id) {
            case 'nombre': setNombre(value); break;
            case 'apellido': setApellido(value); break;
            case 'dni': setDni(value); break;
            case 'email': setEmail(value); break;
            case 'password': setPassword(value); break;
            case 'area': setArea(value); break;
            case 'numTel': setNumTel(value); break;
            case 'calle': setCalle(value); break;
            case 'numero': setNumero(value); break;
            case 'piso': setPiso(value); break;
            case 'depto': setDepto(value); break;
            case 'codigoPostal': setCodigoPostal(value); break;
            case 'provincia': setProvincia(value); break;
            case 'localidad': setLocalidad(value); break;
            case 'isAdmin': setIsAdmin(type === 'checkbox' ? checked : value); break;
            default: break;
        }
    };

    const onClickVerContraseña = () => {
        const input = document.querySelector('#password');
        input.type = input.type === 'password' ? 'text' : 'password';
    };

    const validar = () => {
        const esModif = operacion === 'modificar';
        let campos = { nombre, email };
        if (!esModif) campos = { ...campos, apellido, dni, password, area, numTel };

        const nuevosErrores = Object.entries(campos).reduce((acc, [key, value]) => {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                acc[key] = ' es requerido.';
            }
            return acc;
        }, {});

        setErrors(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const limpiarCampos = () => {
        setNombre(''); setApellido(''); setDni(''); setEmail(''); setPassword('');
        setArea(''); setNumTel(''); setCalle(''); setNumero(''); setPiso('');
        setDepto(''); setCodigoPostal(''); setProvincia(''); setLocalidad('');
        setErrors({}); setIsAdmin(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validar()) return;

        const data = {
            nombre,
            apellido,
            dni,
            email,
            password,
            isAdmin,
            telefono: { area, numero: numTel },
            direccion: { calle, numero, piso, depto, codigoPostal, provincia, localidad },
        };

        if (operacion === 'modificar') {
            dispatch(modificaUsuario(idUser, data)).then((response) => {
                Swal.fire({
                    icon: response.message.includes('correctamente') ? 'success' : 'error',
                    title: response.message,
                    timer: 2500
                });
            });
        } else {
            dispatch(registrarse(data)).then((response) => {
                Swal.fire({
                    icon: response.message.includes('correctamente') ? 'success' : 'error',
                    title: response.message,
                    timer: 2500
                }).then(() => {
                    if (response.message.includes('correctamente')) {
                        limpiarCampos();
                        window.location.href = '/listaEmpleados';
                    }
                });
            });
        }
    };

    // --- Al montar, si es modificar, precarga los datos ---
    useEffect(() => {
        if (operacion === 'modificar' && userLog?._id) {
            setIdUser(userLog._id);
            setNombre(userLog.nombre || '');
            setApellido(userLog.apellido || '');
            setDni(userLog.dni || '');
            setEmail(userLog.email || '');
            setNumTel(userLog.telefono?.numero || '');
            setArea(userLog.telefono?.area || '');
            setCalle(userLog.direccion?.calle || '');
            setNumero(userLog.direccion?.numero || '');
            setPiso(userLog.direccion?.piso || '');
            setDepto(userLog.direccion?.depto || '');
            setCodigoPostal(userLog.direccion?.codigoPostal || '');
            setProvincia(userLog.direccion?.provincia || '');
            setLocalidad(userLog.direccion?.localidad || '');
            setIsAdmin(Boolean(userLog.isAdmin));
        }
    }, [operacion, userLog]);

    return (
        <div className='cont-registrarse'>
            <FormularioUsuario
                nombre={nombre} apellido={apellido} dni={dni} email={email} password={password}
                area={area} numTel={numTel} calle={calle} numero={numero} piso={piso} depto={depto}
                codigoPostal={codigoPostal} provincia={provincia} localidad={localidad}
                isAdmin={isAdmin}
                errors={errors} onClickVerContraseña={onClickVerContraseña}
                limpiarCampos={limpiarCampos} handleChange={handleChange}
                handleSubmit={handleSubmit} operacion={operacion} rol={rol}
            />
        </div>
    );
}

export default Registrarse;
