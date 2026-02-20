// 
// Create authentication JavaScript with:
// - Form validation
// - API calls to backend
// - Token storage (localStorage)
// - Redirect after login/signup
// - Error handling
// - Loading states

const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your backend URL

// Utility to get elements and clear previous errors
function getElement(id) {
    return document.getElementById(id);
}

function clearErrorMessages() {
    document.querySelectorAll('.input-error').forEach(el => el.textContent = '');
    const authError = getElement('auth-error');
    if (authError) authError.style.display = 'none';
}

function showErrorMessage(elementId, message) {
    const errorElement = getElement(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showGlobalError(message) {
    const authError = getElement('auth-error');
    if (authError) {
        authError.textContent = message;
        authError.style.display = 'block';
    }
}

function setLoadingState(buttonId, isLoading) {
    const button = getElement(buttonId);
    const textSpan = getElement(`${buttonId.split('-')[0]}-text`);
    const spinnerSpan = getElement(`${buttonId.split('-')[0]}-spinner`);

    if (button && textSpan && spinnerSpan) {
        button.disabled = isLoading;
        textSpan.style.display = isLoading ? 'none' : 'inline-block';
        spinnerSpan.style.display = isLoading ? 'inline-block' : 'none';
    }
}

// Client-side Validation
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 6;
}

// Handle Login
const loginForm = getElement('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages();

        const email = getElement('email').value;
        const password = getElement('password').value;
        const loginButton = getElement('login-button');

        let isValid = true;
        if (!validateEmail(email)) {
            showErrorMessage('email-error', 'Please enter a valid email address.');
            isValid = false;
        }
        if (!validatePassword(password)) {
            showErrorMessage('password-error', 'Password must be at least 6 characters long.');
            isValid = false;
        }

        if (!isValid) return;

        setLoadingState('login-button', true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                // Optionally store user info
                if (data.user) {
                    localStorage.setItem('userName', data.user.name);
                    localStorage.setItem('userId', data.user._id);
                }
                window.location.href = 'app/dashboard.html';
            } else {
                showGlobalError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showGlobalError('An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('login-button', false);
        }
    });
}

// Handle Signup
const signupForm = getElement('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages();

        const name = getElement('name').value;
        const email = getElement('email').value;
        const password = getElement('password').value;
        const confirmPassword = getElement('confirm-password').value;
        const termsAccepted = getElement('terms').checked;
        const signupButton = getElement('signup-button');

        let isValid = true;
        if (name.trim() === '') {
            showErrorMessage('name-error', 'Name is required.');
            isValid = false;
        }
        if (!validateEmail(email)) {
            showErrorMessage('email-error', 'Please enter a valid email address.');
            isValid = false;
        }
        if (!validatePassword(password)) {
            showErrorMessage('password-error', 'Password must be at least 6 characters long.');
            isValid = false;
        }
        if (password !== confirmPassword) {
            showErrorMessage('confirm-password-error', 'Passwords do not match.');
            isValid = false;
        }
        if (!termsAccepted) {
            showErrorMessage('terms-error', 'You must accept the terms and conditions.');
            isValid = false;
        }

        if (!isValid) return;

        setLoadingState('signup-button', true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                if (data.user) {
                    localStorage.setItem('userName', data.user.name);
                    localStorage.setItem('userId', data.user._id);
                }
                window.location.href = 'app/dashboard.html';
            } else {
                showGlobalError(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showGlobalError('An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('signup-button', false);
        }
    });
}