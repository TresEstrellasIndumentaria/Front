export const apiFetch = async (url, options = {}) => {

    const user = JSON.parse(localStorage.getItem("userData"));

    const headers = {
        "Content-Type": "application/json",
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Error en la solicitud");
    }

    return data;
};
