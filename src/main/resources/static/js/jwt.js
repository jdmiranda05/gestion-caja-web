/**
 * Guarda el JWT recibido al iniciar sesión y lo envía como "Authorization: Bearer"
 * en todas las llamadas a /api/. Así la cabecera es visible en DevTools > Network.
 */
const JWT_STORAGE_KEY = 'gestion-caja-jwt';

function getJwt() {
    try {
        return sessionStorage.getItem(JWT_STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveJwt(token) {
    try {
        sessionStorage.setItem(JWT_STORAGE_KEY, token);
    } catch {
        // Sin almacenamiento disponible: la sesión por cookie sigue funcionando.
    }
}

function clearJwt() {
    try {
        sessionStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
        // Nada que limpiar.
    }
}

const nativeFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const token = getJwt();
    const isProtectedApi = url.startsWith('/api/') && !url.startsWith('/api/users/login');

    if (!token || !isProtectedApi) {
        return nativeFetch(input, init);
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const response = await nativeFetch(input, { ...init, headers });

    // Un token vencido o inválido se descarta y se reintenta con la sesión.
    if (response.status === 401) {
        clearJwt();
        return nativeFetch(input, init);
    }

    return response;
};
