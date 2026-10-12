/**
 * Muestra un mensaje de estado para el formulario de registro.
 */
function showRegistrationMessage(message, isError = false) {
    const element = document.querySelector('#register-message');

    element.textContent = message;
    element.classList.toggle('error', isError);
}

/**
 * Envía el registro con el token CSRF requerido por Spring Security.
 */
document.querySelector('#register-form').addEventListener('submit', async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = document.querySelector('#register-submit');

    button.disabled = true;
    showRegistrationMessage('Creando tu cuenta...');

    try {
        const csrfResponse = await fetch('/api/users/csrf', {
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
        });

        if (!csrfResponse.ok) {
            throw new Error('No se pudo preparar el formulario seguro.');
        }

        const csrf = await csrfResponse.json();

        const response = await fetch('/api/users/register', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                [csrf.headerName]: csrf.token
            },
            body: JSON.stringify({
                username: document.querySelector('#register-username').value.trim(),
                email: document.querySelector('#register-email').value.trim(),
                password: document.querySelector('#register-password').value
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'No se pudo crear la cuenta.');
        }

        form.reset();
        showRegistrationMessage(
            `Cuenta creada correctamente para ${data.username}. Ya puedes iniciar sesión.`
        );

        const link = document.createElement('a');
        link.href = '/login';
        link.textContent = ' Ir a iniciar sesión';
        link.className = 'registration-success-link';

        document.querySelector('#register-message').appendChild(link);
    } catch (error) {
        showRegistrationMessage(
            error.message || 'Ocurrió un error durante el registro.',
            true
        );
    } finally {
        button.disabled = false;
    }
});