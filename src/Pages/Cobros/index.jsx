import FormCobro from '../../Components/FormCobro';
import './styles.css';

function CobrosPage() {
  return (
    <section className="cobros-page">
      <div className="cobros-shell">
        <header className="cobros-hero">
          <div>
            <p className="cobros-kicker">Tesoreria comercial</p>
            <h1>Cobros</h1>
            <p className="cobros-subtitle">
              Registra ingresos y emite recibos sobre clientes existentes con el backend de cobros ya conectado.
            </p>
          </div>
        </header>

        <FormCobro />
      </div>
    </section>
  );
}

export default CobrosPage;
