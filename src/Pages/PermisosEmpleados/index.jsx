import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import Swal from 'sweetalert2';
import { actualizarPermisosEmpleado, getUsuarioByRol, resetPasswordEmpleado } from '../../Redux/Actions';
import { PERMISOS_EMPLEADO } from '../../Config/permisos';
import './styles.css';

const getNombreEmpleado = (empleado) => {
  const nombre = `${empleado?.apellido || ''} ${empleado?.nombre || ''}`.trim();
  return nombre || empleado?.nombreApellido || empleado?.email || '-';
};

function PermisosEmpleados() {
  const dispatch = useDispatch();
  const empleados = useSelector((state) => state.usuariosRol || []);
  const [empleadoId, setEmpleadoId] = useState('');
  const [query, setQuery] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    dispatch(getUsuarioByRol('EMPLEADO'));
  }, [dispatch]);

  const empleadosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...empleados]
      .filter((empleado) => {
        if (!q) return true;
        return [getNombreEmpleado(empleado), empleado?.email, empleado?.dni].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => getNombreEmpleado(a).localeCompare(getNombreEmpleado(b), 'es'));
  }, [empleados, query]);

  const empleadoSeleccionado = useMemo(() => (
    empleados.find((empleado) => empleado._id === empleadoId) || null
  ), [empleadoId, empleados]);

  useEffect(() => {
    if (!empleadoId && empleadosFiltrados.length) {
      setEmpleadoId(empleadosFiltrados[0]._id);
      return;
    }

    if (empleadoId && !empleados.some((empleado) => empleado._id === empleadoId)) {
      setEmpleadoId(empleadosFiltrados[0]?._id || '');
    }
  }, [empleadoId, empleados, empleadosFiltrados]);

  useEffect(() => {
    setPermisosSeleccionados(Array.isArray(empleadoSeleccionado?.permisos) ? empleadoSeleccionado.permisos : []);
  }, [empleadoSeleccionado]);

  const togglePermiso = (permiso) => {
    setPermisosSeleccionados((prev) => (
      prev.includes(permiso) ? prev.filter((item) => item !== permiso) : [...prev, permiso]
    ));
  };

  const guardarPermisos = async () => {
    if (!empleadoSeleccionado?._id) return;
    setGuardando(true);
    const response = await dispatch(actualizarPermisosEmpleado(empleadoSeleccionado._id, permisosSeleccionados));
    setGuardando(false);

    if (response?.error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudieron guardar los permisos',
        text: response.message || 'Intenta nuevamente.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Permisos actualizados',
      text: `${getNombreEmpleado(empleadoSeleccionado)} ya tiene sus permisos actualizados.`,
      timer: 1500,
      showConfirmButton: false,
    });
    dispatch(getUsuarioByRol('EMPLEADO'));
  };

  const solicitarResetPassword = async () => {
    if (!empleadoSeleccionado?._id) return;

    const result = await Swal.fire({
      title: 'Resetear contraseña',
      html: `
        <div style="display:flex; flex-direction:column; gap:10px; text-align:left">
          <label>Nueva contraseña temporal</label>
          <input id="reset-pass" type="password" class="swal2-input" style="margin:0; width:100%" />
          <label>Confirmar contraseña</label>
          <input id="reset-pass-confirm" type="password" class="swal2-input" style="margin:0; width:100%" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Resetear',
      cancelButtonText: 'Cancelar',
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

    const response = await dispatch(resetPasswordEmpleado(empleadoSeleccionado._id, result.value));
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
      text: `${getNombreEmpleado(empleadoSeleccionado)} ya puede ingresar con la contraseña temporal.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  return (
    <section className="permisos-page">
      <div className="permisos-shell">
        <header className="permisos-header">
          <p className="permisos-kicker">Administracion</p>
          <h1>Permisos para empleados</h1>
          <p>Define que pantallas y operaciones puede usar cada empleado dentro del sistema.</p>
        </header>

        <div className="permisos-layout">
          <aside className="permisos-card permisos-empleados-card">
            <label className="permisos-search">
              <SearchIcon fontSize="small" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empleado" />
            </label>

            <div className="permisos-empleados-list">
              {empleadosFiltrados.map((empleado) => (
                <button
                  type="button"
                  key={empleado._id}
                  className={`permisos-empleado-item ${empleado._id === empleadoId ? 'permisos-empleado-item--active' : ''}`}
                  onClick={() => setEmpleadoId(empleado._id)}
                >
                  <strong>{getNombreEmpleado(empleado)}</strong>
                  <span>{empleado.email}</span>
                </button>
              ))}
              {!empleadosFiltrados.length && <div className="permisos-empty">No hay empleados para mostrar.</div>}
            </div>
          </aside>

          <div className="permisos-card permisos-panel">
            <div className="permisos-panel-head">
              <div>
                <span>Empleado seleccionado</span>
                <h2>{empleadoSeleccionado ? getNombreEmpleado(empleadoSeleccionado) : 'Sin empleado'}</h2>
              </div>
              <div className="permisos-actions">
                <button
                  type="button"
                  className="permisos-btn permisos-btn--ghost"
                  onClick={() => setPermisosSeleccionados(PERMISOS_EMPLEADO.map((permiso) => permiso.key))}
                  disabled={!empleadoSeleccionado}
                >
                  Todos
                </button>
                <button type="button" className="permisos-btn permisos-btn--ghost" onClick={() => setPermisosSeleccionados([])} disabled={!empleadoSeleccionado}>
                  Ninguno
                </button>
                <button type="button" className="permisos-btn permisos-btn--ghost" onClick={solicitarResetPassword} disabled={!empleadoSeleccionado}>
                  <LockResetIcon fontSize="small" />
                  Resetear contraseña
                </button>
                <button type="button" className="permisos-btn" onClick={guardarPermisos} disabled={!empleadoSeleccionado || guardando}>
                  <SaveIcon fontSize="small" />
                  {guardando ? 'Guardando' : 'Guardar'}
                </button>
              </div>
            </div>

            <div className="permisos-grid">
              {PERMISOS_EMPLEADO.map((permiso) => (
                <label className="permiso-item" key={permiso.key}>
                  <input
                    type="checkbox"
                    checked={permisosSeleccionados.includes(permiso.key)}
                    onChange={() => togglePermiso(permiso.key)}
                    disabled={!empleadoSeleccionado}
                  />
                  <span>
                    <strong>{permiso.titulo}</strong>
                    <small>{permiso.descripcion}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PermisosEmpleados;
