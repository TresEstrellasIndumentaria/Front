import { URL } from "../Urls";

//Regla de oro: services → solo hablan con el backend
export const loginService = async (email, password) => {

    const response = await fetch(`${URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Error en login");
    }

    return data.user;
};
