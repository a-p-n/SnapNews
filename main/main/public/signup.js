document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const signupBtn = document.getElementById('signupBtn');

    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });

    function validateForm() {
        let isValid = true;

        if (fullNameInput.value.trim() === '') isValid = false;
        if (emailInput.value.trim() === '') isValid = false;
        if (usernameInput.value.trim() === '') isValid = false;
        if (passwordInput.value.length < 8) isValid = false;

        signupBtn.disabled = !isValid;
        return isValid;
    }

    [fullNameInput, emailInput, usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (validateForm()) {
            signupBtn.textContent = 'Signing up...';
            signupBtn.disabled = true;

            setTimeout(() => {
                localStorage.setItem('loggedIn', 'true');
                window.location.href = '/home';
            }, 1500);
        }
    });

    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Social sign-up would be implemented here');
        });
    });
});