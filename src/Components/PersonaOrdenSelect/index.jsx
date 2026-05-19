import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './styles.css';

function PersonaOrdenSelect({
    value,
    onChange,
    includeNumero = false,
    numeroMenorLabel = 'Numero menor',
    numeroMayorLabel = 'Numero mayor',
}) {
    return (
        <div className="persona-orden-select">
            <select value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="APELLIDO_ASC">Apellido A-Z</option>
                <option value="APELLIDO_DESC">Apellido Z-A</option>
                {includeNumero && <option value="NUMERO_ASC">{numeroMenorLabel}</option>}
                {includeNumero && <option value="NUMERO_DESC">{numeroMayorLabel}</option>}
            </select>
            <KeyboardArrowDownIcon fontSize="small" />
        </div>
    );
}

export default PersonaOrdenSelect;
