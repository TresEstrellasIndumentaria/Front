import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { URL } from "../../Urls";
import "./styles.css";

export default function PopupPersona({
    rol,
    persona,
    personas = [],
    onClose,
    onSuccess
}) {
    const esEdicion = Boolean(persona);
    const requierePassword = rol === "ADMIN" || rol === "EMPLEADO";
    const soloRequiereNombreApellido = rol === "CLIENTE" || rol === "PROVEEDOR";

    const [form, setForm] = useState({
        nombre: "",
        apellido: "",
        dni: "",
        email: "",
        numeroCliente: "",
        password: "",
        numeroProveedor: "",
        telefono: { area: "", numero: "" },
        direccion: { calle: "", numero: "", localidad: "" },
        nota: ""
    });

    //Precargar datos al editar
    useEffect(() => {
        if (persona) {
            setForm({
                nombre: persona.nombre || "",
                apellido: persona.apellido || "",
                dni: persona.dni || "",
                email: persona.email || "",
                numeroCliente: persona.numeroCliente || "",
                password: "",
                numeroProveedor: persona.numeroProveedor || persona.numeroCliente || "",
                telefono: persona.telefono || { area: "", numero: "" },
                direccion: persona.direccion || { calle: "", numero: "", localidad: "" },
                nota: persona.nota || ""
            });
        }
    }, [persona]);

    useEffect(() => {
        if (persona) return;
        if (!["CLIENTE", "PROVEEDOR"].includes(rol)) return;

        const campoNumero = rol === "PROVEEDOR" ? "numeroProveedor" : "numeroCliente";
        const maxNumero = (personas || []).reduce((max, item) => {
            const value = Number(item?.[campoNumero] || item?.numeroCliente || 0);
            return Number.isFinite(value) && value > max ? value : max;
        }, 0);

        setForm(prev => ({
            ...prev,
            [campoNumero]: String(maxNumero + 1)
        }));
    }, [persona, personas, rol]);

    //Manejo genérico de inputs
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

    //Submit crear / editar
    const handleSubmit = async () => {
        if (
            !form.nombre.trim() ||
            !form.apellido.trim() ||
            (!soloRequiereNombreApellido && !form.email.trim())
        ) {
            Swal.fire(
                "Faltan datos",
                soloRequiereNombreApellido
                    ? "Nombre y apellido son obligatorios"
                    : "Nombre, apellido y email son obligatorios",
                "warning"
            );
            return;
        }

        if (!esEdicion && requierePassword && !form.password.trim()) {
            Swal.fire(
                "Falta contraseña",
                "La contraseña es obligatoria para este rol",
                "warning"
            );
            return;
        }

        const userData = JSON.parse(
            localStorage.getItem("dataUser") || localStorage.getItem("userData") || "null"
        );

        const payload = {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            dni: form.dni ? String(form.dni).trim() : undefined,
            email: form.email.trim() || undefined,
            telefono: form.telefono,
            direccion: form.direccion,
            nota: form.nota,
            rol
        };

        if (rol === "CLIENTE") {
            payload.numeroCliente = form.numeroCliente;
        }

        if (rol === "PROVEEDOR") {
            payload.numeroProveedor = form.numeroProveedor;
        }

        if (form.password) {
            payload.password = form.password;
        }

        const url = esEdicion
            ? (rol === "CLIENTE" || rol === "PROVEEDOR"
                ? `${URL}/personas/modifica-cliente-proveedor/${persona._id}`
                : `${URL}/personas/modifica/${persona._id}`)
            : `${URL}/auth/registrar`;

        const method = esEdicion ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userData.token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            Swal.fire("Error", data.msg || data.message || "Error al guardar", "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: esEdicion
                ? "Cambios guardados"
                : `${rol} creado correctamente`,
            timer: 1200,
            showConfirmButton: false
        });

        onSuccess();
    };

    return (
        <div className="popup-overlay">
            <div className="popup popup-persona">
                <h3>
                    {esEdicion
                        ? `Editar ${rol.toLowerCase()}`
                        : `Nuevo ${rol.toLowerCase()}`}
                </h3>

                <input
                    name="nombre"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={handleChange}
                />

                <input
                    name="apellido"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={handleChange}
                />

                <input
                    name="dni"
                    placeholder="DNI"
                    value={form.dni}
                    onChange={handleChange}
                />

                <input
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                />

                {rol === "CLIENTE" && (
                    <input
                        name="numeroCliente"
                        placeholder="Numero de cliente"
                        value={form.numeroCliente}
                        onChange={handleChange}
                    />
                )}

                {rol === "PROVEEDOR" && (
                    <input
                        name="numeroProveedor"
                        placeholder="Numero de proveedor"
                        value={form.numeroProveedor}
                        onChange={handleChange}
                    />
                )}

                {requierePassword && (
                    <input
                        type="password"
                        name="password"
                        placeholder={
                            esEdicion ? "Nueva contraseña (opcional)" : "Contraseña"
                        }
                        value={form.password}
                        onChange={handleChange}
                    />
                )}

                <div className="fila">
                    <input
                        name="telefono.area"
                        placeholder="Área"
                        value={form.telefono.area}
                        onChange={handleChange}
                    />
                    <input
                        name="telefono.numero"
                        placeholder="Teléfono"
                        value={form.telefono.numero}
                        onChange={handleChange}
                    />
                </div>

                <textarea
                    className="popup-persona-nota"
                    name="nota"
                    placeholder="Nota"
                    value={form.nota}
                    onChange={handleChange}
                />

                <div className="acciones">
                    <button className="popup-persona-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-crear popup-persona-create" onClick={handleSubmit}>
                        {esEdicion ? "Guardar cambios" : "Crear"}
                    </button>
                </div>
            </div>
        </div>
    );
}
