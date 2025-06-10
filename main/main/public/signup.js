document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const signupBtn = document.getElementById('signupBtn');

    // Toggle password visibility
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Form validation
    function validateForm() {
        let isValid = true;

        if (fullNameInput.value.trim() === '') isValid = false;
        if (emailInput.value.trim() === '') isValid = false;
        if (usernameInput.value.trim() === '') isValid = false;
        if (passwordInput.value.length < 8) isValid = false;

        signupBtn.disabled = !isValid;
        return isValid;
    }

    // Real-time validation on input
    [fullNameInput, emailInput, usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    // Handle form submission
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        signupBtn.textContent = 'Signing up...';
        signupBtn.disabled = true;

        const data = {
            fullName: fullNameInput.value,
            email: emailInput.value,
            username: usernameInput.value,
            password: passwordInput.value
        };

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('loggedIn', 'true');
                window.location.href = '/home';
            } else {
                alert(result.error || 'Signup failed');
                signupBtn.textContent = 'Sign Up';
                signupBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('An error occurred. Please try again.');
            signupBtn.textContent = 'Sign Up';
            signupBtn.disabled = false;
        }
    });

    // Social buttons (stub)
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            alert('Social sign-up would be implemented here');
        });
    });
});