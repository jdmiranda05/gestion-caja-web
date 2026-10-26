
/**
 * Aplica y guarda el tema visual seleccionado por el usuario.
 */
(function () {
    const storageKey = 'tienda-alondralu-theme';

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;

        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            // Asigna el icono de sol o luna
            button.textContent = theme === 'dark' ? '☀️' : '🌙';

            button.setAttribute(
                'aria-label',
                theme === 'dark'
                    ? 'Cambiar al tema claro'
                    : 'Cambiar al tema oscuro'
            );
        });
    }

    let savedTheme = 'light';

    try {
        savedTheme = localStorage.getItem(storageKey) || 'light';
    } catch (error) {
        // La página sigue funcionando si el navegador bloquea el almacenamiento.
    }

    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-theme-toggle]');

        if (!button) {
            return;
        }

        const nextTheme =
            document.documentElement.dataset.theme === 'dark'
                ? 'light'
                : 'dark';

        applyTheme(nextTheme);

        try {
            localStorage.setItem(storageKey, nextTheme);
        } catch (error) {
            // El cambio se mantiene en la página aunque no se pueda guardar.
        }
    });
})();