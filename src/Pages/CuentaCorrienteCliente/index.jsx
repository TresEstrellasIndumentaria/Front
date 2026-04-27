import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CuentaCorriente from '../../Components/CuentaCorriente';
import { getUsuarioById, getUsuarioByRol } from '../../Redux/Actions';
import './styles.css';

function CuentaCorrienteCliente() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { id } = useParams();
  const clientes = useSelector((state) => state.usuariosRol || []);
  const dataUsuario = useSelector((state) => state.dataUsuario || {});
  const [clienteDesdeRuta, setClienteDesdeRuta] = useState(location.state?.cliente || null);

  useEffect(() => {
    if (location.state?.cliente) {
      setClienteDesdeRuta(location.state.cliente);
      return;
    }

    if (!clientes.length) {
      dispatch(getUsuarioByRol('CLIENTE'));
    }

    if (id) {
      dispatch(getUsuarioById(id)).then((data) => {
        if (data?._id === id) {
          setClienteDesdeRuta(data);
        }
      });
    }
  }, [clientes.length, dispatch, id, location.state]);

  const cliente = useMemo(() => {
    if (clienteDesdeRuta) return clienteDesdeRuta;
    if (dataUsuario?._id === id) return dataUsuario;
    return clientes.find((item) => item?._id === id) || null;
  }, [clienteDesdeRuta, clientes, dataUsuario, id]);

  return (
    <section className="cuenta-corriente-page">
      <div className="cuenta-corriente-page-shell">
        <header className="cuenta-corriente-page-header">
          <div>
            <p className="cuenta-corriente-page-kicker">Finanzas del cliente</p>
            <h1>Cuenta corriente</h1>
            <p className="cuenta-corriente-page-subtitle">
              Seguimiento de cargos, pagos y saldo acumulado por cliente.
            </p>
          </div>

          <div className="cuenta-corriente-page-client">
            <span>Cliente</span>
            <strong>{cliente ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || cliente.razonSocial || 'Sin nombre' : 'Cliente no encontrado'}</strong>
            <small>{cliente?.email || 'Sin email'}</small>
          </div>
        </header>

        <CuentaCorriente cliente={cliente} />
      </div>
    </section>
  );
}

export default CuentaCorrienteCliente;
