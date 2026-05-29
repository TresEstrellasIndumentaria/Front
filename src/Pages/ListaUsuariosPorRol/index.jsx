import { useState, useEffect, useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppContext } from '../../Context';
import { getUsuarioByRol, resetPasswordEmpleado } from '../../Redux/Actions';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';
import PopupPersona from '../../Components/PopupPersona';
import PersonaOrdenSelect from '../../Components/PersonaOrdenSelect';
import BotonEliminarUsuario from '../../Components/BotonEliminarUsuario';
import './styles.css';

const getApellidoNombre = (persona) => {
    const nombre = `${persona?.apellido || ''} ${persona?.nombre || ''}`.trim();
    return nombre || persona?.nombreApellido || '-';
};

const getNumeroClienteOrden = (persona) => {
    const numero = Number(persona?.numeroCliente);
    return Number.isFinite(numero) ? numero : Number.MAX_SAFE_INTEGER;
};

function ListaUsuariosPorRol({ rol }) {
    const dispatch = useDispatch();
    const { search, setSearch } = useContext(AppContext);

    const allUsuarios = useSelector(state => state.usuariosRol);
    const [mostrarPopup, setMostrarPopup] = useState(false);
    const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
    const [ordenListado, setOrdenListado] = useState('APELLIDO_ASC');

    const refrescarLista = () => {
        dispatch(getUsuarioByRol(rol));
    };

    useEffect(() => {
        refrescarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rol]);

    useEffect(() => {
        setOrdenListado('APELLIDO_ASC');
    }, [rol]);

    const usuariosFiltrados = useMemo(() => {
        const q = (search || '').toLowerCase().trim();
        return [...(allUsuarios || [])].filter(u => {
            const nombre = getApellidoNombre(u).toLowerCase();
            const email = String(u.email || '').toLowerCase();
            const numeroCliente = String(u.numeroCliente || '').toLowerCase();
            const telefono = u.telefono ? `${u.telefono.area || ''} ${u.telefono.numero || ''}`.toLowerCase() : '';
            if (!q) return true;
            return nombre.includes(q) || email.includes(q) || numeroCliente.includes(q) || telefono.includes(q);
        }).sort((a, b) => {
            if (rol === 'CLIENTE' && ordenListado === 'NUMERO_ASC') {
                return getNumeroClienteOrden(a) - getNumeroClienteOrden(b);
            }

            if (rol === 'CLIENTE' && ordenListado === 'NUMERO_DESC') {
                return getNumeroClienteOrden(b) - getNumeroClienteOrden(a);
            }

            if (ordenListado === 'APELLIDO_DESC') {
                return getApellidoNombre(b).localeCompare(getApellidoNombre(a), 'es');
            }

            return getApellidoNombre(a).localeCompare(getApellidoNombre(b), 'es');
        });
    }, [allUsuarios, ordenListado, rol, search]);

    const titulo = rol === 'CLIENTE' ? 'Lista de Clientes' : `Lista de ${rol.toLowerCase()}s`;

    const solicitarResetPassword = async (usuario) => {
        const result = await Swal.fire({
            title: 'Resetear contraseña',
            html: `
                <div style="display:flex; flex-direction:column; gap:10px; text-align:left">
                    <label>Nueva contraseña temporal</label>
                    <div style="display:flex; align-items:center; width:100%; border:1px solid #d9d9d9; border-radius:4px; background:#fff">
                        <input id="reset-pass" type="password" class="swal2-input" style="margin:0; width:100%; border:0; box-shadow:none" />
                        <button type="button" class="reset-pass-toggle" data-target="reset-pass" aria-label="Ver contraseña" style="width:42px; height:38px; border:0; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#111827">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                    <label>Confirmar contraseña</label>
                    <div style="display:flex; align-items:center; width:100%; border:1px solid #d9d9d9; border-radius:4px; background:#fff">
                        <input id="reset-pass-confirm" type="password" class="swal2-input" style="margin:0; width:100%; border:0; box-shadow:none" />
                        <button type="button" class="reset-pass-toggle" data-target="reset-pass-confirm" aria-label="Ver confirmación de contraseña" style="width:42px; height:38px; border:0; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#111827">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Resetear',
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                document.querySelectorAll('.reset-pass-toggle').forEach((button) => {
                    button.addEventListener('click', () => {
                        const input = document.getElementById(button.dataset.target);
                        if (!input) return;
                        const visible = input.type === 'text';
                        input.type = visible ? 'password' : 'text';
                        button.setAttribute('aria-label', visible ? 'Ver contraseña' : 'Ocultar contraseña');
                    });
                });
            },
            preConfirm: () => {
                const password = document.getElementById('reset-pass')?.value || '';
                const confirm = document.getElementById('reset-pass-confirm')?.value || '';

                if (password.length < 6) {
                    Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres.');
                    return false;
                }

                if (password !== confirm) {
                    Swal.showValidationMessage('Las contraseñas no coinciden.');
                    return false;
                }

                return password;
            },
        });

        if (!result.isConfirmed) return;

        const response = await dispatch(resetPasswordEmpleado(usuario._id, result.value));
        if (response?.error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo resetear',
                text: response.message || 'Intenta nuevamente.',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Contraseña reseteada',
            text: `${getApellidoNombre(usuario)} ya puede ingresar con la contraseña temporal.`,
            timer: 1800,
            showConfirmButton: false,
        });
    };

    return (
        <div className="cont-principal-listaEmp">
            <div className="usuarios-card">
                <h2 className="usuarios-title">{titulo}</h2>

                <div className="header-lista">
                    <button
                        className="btn-add"
                        onClick={() => {
                            setPersonaSeleccionada(null);
                            setMostrarPopup(true);
                        }}
                    >
                        + Anadir {rol.toLowerCase()}
                    </button>

                    <div className="usuarios-search">
                        <input
                            type="text"
                            value={search || ''}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar ${rol.toLowerCase()}`}
                        />
                        <SearchIcon />
                    </div>

                    <div className="usuarios-filters">
                        <PersonaOrdenSelect
                            value={ordenListado}
                            onChange={setOrdenListado}
                            includeNumero={rol === 'CLIENTE'}
                            numeroMenorLabel="Num Cliente menor"
                            numeroMayorLabel="Num Cliente mayor"
                        />
                    </div>
                </div>
            </div>

            {mostrarPopup && (
                <PopupPersona
                    rol={rol}
                    persona={personaSeleccionada}
                    personas={allUsuarios || []}
                    onClose={() => {
                        setMostrarPopup(false);
                        setPersonaSeleccionada(null);
                    }}
                    onSuccess={() => {
                        refrescarLista();
                        setMostrarPopup(false);
                        setPersonaSeleccionada(null);
                    }}
                />
            )}

            <div className="usuarios-card usuarios-table-card">
                <table className="tabla-empleados">
                    <thead>
                        <tr>
                            {rol === 'CLIENTE' && <th>Num Cliente</th>}
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Telefono</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={rol === 'CLIENTE' ? 6 : 5} className="usuarios-empty">
                                    No hay usuarios
                                </td>
                            </tr>
                        )}

                        {usuariosFiltrados.map(emp => (
                            <tr key={emp._id}>
                                {rol === 'CLIENTE' && <td>{emp.numeroCliente || '-'}</td>}
                                <td>{getApellidoNombre(emp)}</td>
                                <td>{emp.email}</td>
                                <td>
                                    {emp.telefono
                                        ? `(${emp.telefono.area}) ${emp.telefono.numero}`
                                        : '-'}
                                </td>
                                <td>{emp.rol}</td>
                                <td className="acciones">
                                    {rol === 'CLIENTE' && (
                                        <>
                                            <NavLink
                                                to="/ventas/nueva"
                                                state={{ cliente: emp }}
                                                className="btn-edit btn-sale"
                                            >
                                                Nueva Venta
                                            </NavLink>

                                            <NavLink
                                                to={`/cliente/${emp._id}/cuentaCorrient`}
                                                state={{ cliente: emp }}
                                                className="btn-edit"
                                            >
                                                Cuenta Corriente
                                            </NavLink>
                                        </>
                                    )}

                                    {['ADMIN', 'EMPLEADO'].includes(rol) && (
                                        <button
                                            className="btn-edit"
                                            type="button"
                                            onClick={() => solicitarResetPassword(emp)}
                                        >
                                            <LockResetIcon fontSize="small" />
                                            Resetear contraseña
                                        </button>
                                    )}

                                    <button
                                        className="btn-edit"
                                        onClick={() => {
                                            setPersonaSeleccionada(emp);
                                            setMostrarPopup(true);
                                        }}
                                    >
                                        <EditIcon fontSize="inherit" style={{width: '15px',height: "19px"}}/>
                                    </button>

                                    <BotonEliminarUsuario
                                        _id={emp._id}
                                        nombre={emp.nombre}
                                        apellido={emp.apellido}
                                        onDelete={refrescarLista}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ListaUsuariosPorRol;
