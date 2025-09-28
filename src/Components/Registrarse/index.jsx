import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { modificaUsuario, registrarse } from '../../Redux/Actions';
import Swal from 'sweetalert2';
//import FormDatosUsuario from '../FormDatosUsuario';
import './styles.css';

function Registrarse({ operacion, tipo }) {
    const userLog = useSelector(state => state.dataUsuario);
    const dispatch = useDispatch();

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
    const [comentarios, setComentarios] = useState('');
    const [rol, setRol] = useState('usuario');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
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
            case 'comentarios': setComentarios(value); break;
            case 'rol': setRol(value); break;
            default: break;
        }
    };

    const onClickVerContraseña = () => {
        const input = document.querySelector('#password');
        input.type = input.type === 'password' ? 'text' : 'password';
    };

    const validar = () => {
        const esCliente = tipo === 'cliente';
        const esModif = operacion === 'modificar';

        let campos = {
            nombre, email, rol,
        };

        if (!esModif) campos.password = password;

        if (esCliente) {
            campos = {
                ...campos,
                apellido, dni, area, numTel, calle, numero, codigoPostal, provincia, localidad, comentarios
            };
        }

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
        setComentarios(''); setErrors({}); setRol('usuario');
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
            rol,
            telefono: { area, numero: numTel },
            direccion: {
                calle,
                numero,
                piso,
                depto,
                codigoPostal,
                provincia,
                localidad,
            },
            comentarios,
        };

        if (operacion === 'modificar') {
            dispatch(modificaUsuario(idUser, data)).then((response) => {
                if (response?.msg === 'success') {
                    Swal.fire({ icon: 'success', title: 'Modificado correctamente', timer: 1500 });
                    limpiarCampos();
                } else {
                    Swal.fire({ icon: 'error', title: response?.data?.msg || 'Error desconocido', timer: 1500 });
                }
            });
        } else {
            dispatch(registrarse(data)).then((response) => {
                if (response?.message === 'success') {
                    Swal.fire({ icon: 'success', title: 'Registrado correctamente', timer: 1500 });
                    limpiarCampos();
                    window.location.href = '/login';
                } else {
                    Swal.fire({ icon: 'error', title: response?.data?.message || 'Error desconocido', timer: 1500 });
                }
            });
        }
    };

    useEffect(() => {
        if (operacion === 'modificar') {
            setIdUser(userLog.id);
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
            setRol(userLog.rol || 'usuario');
        }
    }, [operacion, userLog]);

    return (
        <div className='cont-registrarse'>
            {/* <FormDatosUsuario
                nombre={nombre} apellido={apellido} dni={dni} email={email} password={password}
                area={area} numTel={numTel} calle={calle} numero={numero} piso={piso} depto={depto}
                codigoPostal={codigoPostal} provincia={provincia} localidad={localidad}
                comentarios={comentarios} rol={rol}
                errors={errors} onClickVerContraseña={onClickVerContraseña}
                limpiarCampos={limpiarCampos} handleChange={handleChange}
                handleSubmit={handleSubmit} operacion={operacion} tipo={tipo}
            /> */}
        </div>
    );
}

export default Registrarse;
