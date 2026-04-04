export const logout = () => {
    localStorage.removeItem("userData");

    window.dispatchEvent(
        new CustomEvent("userChanged", { detail: null })
    );
};
