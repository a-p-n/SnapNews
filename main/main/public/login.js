document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Form validation
    function validateForm() {
        let isValid = true;

        // Username validation (simple check for non-empty)
        if (usernameInput.value.trim() === '') {
            usernameError.style.display = 'block';
            isValid = false;
        } else {
            usernameError.style.display = 'none';
        }

        // Password validation (at least 8 characters)
        if (passwordInput.value.length < 8) {
            passwordError.style.display = 'block';
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }

        // Enable/disable login button
        loginBtn.disabled = !isValid;

        return isValid;
    }

    // Real-time validation
    usernameInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            // Simulate login process
            loginBtn.textContent = 'Signing in...';
            loginBtn.disabled = true;

            // Simulate server response and redirect to /home
            setTimeout(() => {
                localStorage.setItem('loggedIn', 'true');
                window.location.href = '/home';
            }, 1500);
        }
    });

    // Social login buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Social login would be implemented here');
        });
    });
});