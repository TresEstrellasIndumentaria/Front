import { useEffect, useState } from "react";
import { URL } from "../../Urls";
import Swal from "sweetalert2";
import "./styles.css";

export default function PopupProveedor({ proveedoresDB = [], onClose, onCreate }) {
    const [form, setForm] = useState({
        nombre: "",
        apellido: "",
        dni: "",
        email: "",
        numeroProveedor: "",
        telefono: { area: "", numero: "" },
        direccion: { calle: "", numero: "" },
        nota: ""
    });

    useEffect(() => {
        const maxNumero = (proveedoresDB || []).reduce((max, proveedor) => {
            const value = Number(proveedor?.numeroProveedor || proveedor?.numeroCliente || 0);
            return Number.isFinite(value) && value > max ? value : max;
        }, 0);

        setForm(prev => ({
            ...prev,
            numeroProveedor: String(maxNumero + 1)
        }));
    }, [proveedoresDB]);

    //obtengo token para poder agregar prov
    const userData = JSON.parse(localStorage.getItem("userData"));
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.includes(".")) {
            const [obj, key] = name.split(".");
            setForm(prev => ({
                ...prev,
                [obj]: { ...prev[obj], [key]: value }
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCrear = async () => {
        if (!form.nombre.trim() || !form.email.trim()) {
            Swal.fire("Faltan datos", "Nombre y email son obligatorios", "warning");
            return;
        }

        const res = await fetch(`${URL}/auth/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userData.token}`
            },
            body: JSON.stringify({
                ...form,
                rol: "PROVEEDOR"
            })
        });

        const data = await res.json();

        if (!res.ok) {
            Swal.fire("Error", data.message || "Error al crear proveedor", "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Proveedor creado",
            timer: 1200,
            showConfirmButton: false
        });

        onCreate(data.persona || data);
    };

    return (
        <div className="popup-overlay">
            <div className="popup popup-proveedor">
                <h3>Nuevo proveedor</h3>

                <input name="nombre" placeholder="Nombre" onChange={handleChange} />
                <input name="apellido" placeholder="Apellido" onChange={handleChange} />
                <input name="dni" placeholder="DNI" onChange={handleChange} />
                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="numeroProveedor" placeholder="Numero de proveedor" value={form.numeroProveedor} onChange={handleChange} />

                <div className="fila">
                    <input name="telefono.area" placeholder="Área" onChange={handleChange} />
                    <input name="telefono.numero" placeholder="Teléfono" onChange={handleChange} />
                </div>

                <textarea
                    name="nota"
                    placeholder="Nota"
                    onChange={handleChange}
                />

                <div className="acciones">
                    <button onClick={onClose}>Cancelar</button>
                    <button className="btn-crear" onClick={handleCrear}>
                        Crear proveedor
                    </button>
                </div>
            </div>
        </div>
    );
}
