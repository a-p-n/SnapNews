document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Form validation
    function validateForm() {
        let isValid = true;

        // Username validation
        if (usernameInput.value.trim() === '') {
            usernameError.style.display = 'block';
            isValid = false;
        } else {
            usernameError.style.display = 'none';
        }

        // Password validation
        if (passwordInput.value.length < 8) {
            passwordError.style.display = 'block';
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }

        // Enable/disable button
        loginBtn.disabled = !isValid;

        return isValid;
    }

    // Real-time validation
    usernameInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);

    // Form submission
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;

        const data = {
            username: usernameInput.value,
            password: passwordInput.value
        };

        try {
            const payload = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };

            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('username', data.username);
                        window.location.href = '/home';
                    } else {
                        alert(data.error);
                    }
                });
            
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'An error occurred during login');
            loginBtn.textContent = 'Sign In';
            loginBtn.disabled = false;
        }
    });
});