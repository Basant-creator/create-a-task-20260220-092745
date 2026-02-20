// 
// Create dashboard JavaScript with:
// - Check if user is authenticated
// - Fetch user data from API
// - Handle logout
// - Update UI with user info
// - Redirect to login if not authenticated

const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your backend URL

// Utility functions (similar to auth.js, but scoped for dashboard)
function getElement(id) {
    return document.getElementById(id);
}

function clearErrorMessages(container = document) {
    container.querySelectorAll('.input-error').forEach(el => el.textContent = '');
    container.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    container.querySelectorAll('.info-message').forEach(el => el.style.display = 'none');
}

function showErrorMessage(elementId, message) {
    const errorElement = getElement(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showGlobalMessage(elementId, message, type = 'error') {
    const messageElement = getElement(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `${type}-message`; // 'error-message' or 'info-message'
        messageElement.style.display = 'block';
    }
}

function setLoadingState(buttonId, isLoading) {
    const button = getElement(buttonId);
    if (!button) return; // Exit if button doesn't exist

    const textSpan = getElement(`${buttonId.split('-')[0]}-text`);
    const spinnerSpan = getElement(`${buttonId.split('-')[0]}-spinner`);

    if (button && textSpan && spinnerSpan) {
        button.disabled = isLoading;
        textSpan.style.display = isLoading ? 'none' : 'inline-block';
        spinnerSpan.style.display = isLoading ? 'inline-block' : 'none';
    }
}

// ------------------------------------
// Authentication and User Info
// ------------------------------------

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../public/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user._id);
            updateUIWithUserInfo(data.user.name);
            return data.user;
        } else {
            // Token might be invalid or expired
            console.error('Auth check failed:', data.message);
            handleLogout();
        }
    } catch (error) {
        console.error('Error during auth check:', error);
        handleLogout();
    }
    return null;
}

function updateUIWithUserInfo(userName) {
    const userNameElements = document.querySelectorAll('#user-name');
    userNameElements.forEach(el => {
        if (el) el.textContent = userName;
    });
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    window.location.href = '../public/login.html';
}

// Attach logout listeners
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('#logout-button, #sidebar-logout-button');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleLogout);
        }
    });

    // Check auth on every protected page load
    checkAuth().then(user => {
        if (user) {
            if (window.location.pathname.includes('dashboard.html')) {
                fetchTasks(user._id);
            } else if (window.location.pathname.includes('profile.html')) {
                loadProfileData(user._id);
            } else if (window.location.pathname.includes('settings.html')) {
                loadSettingsData(user._id);
            }
        }
    });
});


// ------------------------------------
// Dashboard - Task Management
// ------------------------------------

const tasksList = getElement('tasks-list');
const addTaskButton = getElement('add-task-button');
const taskFormModal = getElement('task-form-modal');
const taskForm = getElement('task-form');
const taskFormTitle = getElement('task-form-title');
const closeButton = document.querySelector('.modal .close-button');
const noTasksMessage = getElement('no-tasks-message');

if (addTaskButton) {
    addTaskButton.addEventListener('click', () => openTaskModal());
}
if (closeButton) {
    closeButton.addEventListener('click', () => closeTaskModal());
}
if (taskFormModal) {
    window.addEventListener('click', (event) => {
        if (event.target == taskFormModal) {
            closeTaskModal();
        }
    });
}

function openTaskModal(task = {}) {
    clearErrorMessages(taskForm); // Clear errors from previous uses
    taskForm.reset(); // Clear form fields
    
    // Set form title and hidden ID
    taskFormTitle.textContent = task._id ? 'Edit Task' : 'Create New Task';
    getElement('task-id').value = task._id || '';

    // Populate form if editing
    if (task._id) {
        getElement('task-title').value = task.title;
        getElement('task-description').value = task.description || '';
        getElement('task-due-date').value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        getElement('task-status').value = task.status || 'pending';
    } else {
        getElement('task-status').value = 'pending'; // Default for new tasks
    }
    
    setLoadingState('task-form-button', false);
    taskFormModal.classList.add('open');
}

function closeTaskModal() {
    taskFormModal.classList.remove('open');
    clearErrorMessages(taskForm);
}

if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages(taskForm);

        const taskId = getElement('task-id').value;
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        const title = getElement('task-title').value.trim();
        const description = getElement('task-description').value.trim();
        const dueDate = getElement('task-due-date').value;
        const status = getElement('task-status').value;

        let isValid = true;
        if (!title) {
            showErrorMessage('task-title-error', 'Task title is required.');
            isValid = false;
        }

        if (!isValid) return;

        setLoadingState('task-form-button', true);

        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `${API_BASE_URL}/users/${userId}/tasks/${taskId}` : `${API_BASE_URL}/users/${userId}/tasks`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, dueDate, status })
            });

            const data = await response.json();

            if (data.success) {
                closeTaskModal();
                fetchTasks(userId); // Re-fetch tasks to update the list
            } else {
                showGlobalMessage('task-form-error', data.message || `Failed to ${taskId ? 'update' : 'create'} task.`);
            }
        } catch (error) {
            console.error('Task form submission error:', error);
            showGlobalMessage('task-form-error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('task-form-button', false);
        }
    });
}

async function fetchTasks(userId) {
    const token = localStorage.getItem('token');
    if (!userId || !token) {
        handleLogout();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            renderTasks(data.tasks);
        } else {
            console.error('Failed to fetch tasks:', data.message);
            tasksList.innerHTML = `<div class="info-card error-message">Failed to load tasks.</div>`;
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        tasksList.innerHTML = `<div class="info-card error-message">An error occurred while loading tasks.</div>`;
    }
}

function renderTasks(tasks) {
    tasksList.innerHTML = ''; // Clear existing tasks
    if (tasks.length === 0) {
        tasksList.innerHTML = `<div class="info-card" id="no-tasks-message"><p>No tasks yet. Click "Add New Task" to get started!</p></div>`;
        return;
    }

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card status-${task.status}`;
        taskCard.setAttribute('data-id', task._id);

        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date';

        taskCard.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || 'No description provided.'}</p>
            <div class="task-meta">
                <span>Due: ${dueDate}</span>
                <span>Status: ${task.status.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase())}</span>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-edit-task" data-id="${task._id}" aria-label="Edit task"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-complete-task" data-id="${task._id}" aria-label="Mark task complete" ${task.status === 'completed' ? 'disabled' : ''}><i class="fas fa-check"></i></button>
                <button class="btn-icon btn-delete-task" data-id="${task._id}" aria-label="Delete task"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        tasksList.appendChild(taskCard);
    });

    // Add event listeners for new buttons
    document.querySelectorAll('.btn-edit-task').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.id;
            const task = tasks.find(t => t._id === taskId);
            if (task) openTaskModal(task);
        });
    });

    document.querySelectorAll('.btn-complete-task').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.id;
            updateTaskStatus(taskId, 'completed');
        });
    });

    document.querySelectorAll('.btn-delete-task').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.id;
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(taskId);
            }
        });
    });
}

async function updateTaskStatus(taskId, status) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!userId || !token || !taskId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (data.success) {
            fetchTasks(userId);
        } else {
            alert(data.message || 'Failed to update task status.');
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('An error occurred while updating task status.');
    }
}

async function deleteTask(taskId) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!userId || !token || !taskId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            fetchTasks(userId);
        } else {
            alert(data.message || 'Failed to delete task.');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('An error occurred while deleting the task.');
    }
}


// ------------------------------------
// Profile Page
// ------------------------------------

const profileForm = getElement('profile-form');
const passwordForm = getElement('password-form');
const profileImageInput = getElement('profile-picture-input');
const profileImgPreview = getElement('profile-img-preview');

if (profileImageInput && profileImgPreview) {
    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImgPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}


async function loadProfileData(userId) {
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.user) {
            getElement('profile-name').value = data.user.name;
            getElement('profile-email').value = data.user.email;
            updateUIWithUserInfo(data.user.name); // Update header greeting
            // if (data.user.profilePicture) profileImgPreview.src = data.user.profilePicture;
        } else {
            showGlobalMessage('profile-error', data.message || 'Failed to load profile data.');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showGlobalMessage('profile-error', 'An error occurred while loading profile data.');
    }
}

if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages(profileForm);

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        const name = getElement('profile-name').value.trim();
        const email = getElement('profile-email').value.trim();

        let isValid = true;
        if (!name) {
            showErrorMessage('profile-name-error', 'Name is required.');
            isValid = false;
        }
        if (!validateEmail(email)) { // Reusing auth.js validation
            showErrorMessage('profile-email-error', 'Please enter a valid email address.');
            isValid = false;
        }
        if (!isValid) return;

        setLoadingState('profile-save-button', true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email })
            });

            const data = await response.json();

            if (data.success) {
                showGlobalMessage('profile-message', 'Profile updated successfully!', 'info');
                localStorage.setItem('userName', data.user.name); // Update local storage
                updateUIWithUserInfo(data.user.name); // Update header greeting
            } else {
                showGlobalMessage('profile-error', data.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showGlobalMessage('profile-error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('profile-save-button', false);
        }
    });

    getElement('profile-cancel-button')?.addEventListener('click', () => {
        const userId = localStorage.getItem('userId');
        loadProfileData(userId); // Revert changes
        clearErrorMessages(profileForm);
    });
}


if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages(passwordForm);

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        const currentPassword = getElement('current-password').value;
        const newPassword = getElement('new-password').value;
        const confirmNewPassword = getElement('confirm-new-password').value;

        let isValid = true;
        if (!validatePassword(currentPassword)) {
            showErrorMessage('current-password-error', 'Current password is required.');
            isValid = false;
        }
        if (!validatePassword(newPassword)) {
            showErrorMessage('new-password-error', 'New password must be at least 6 characters long.');
            isValid = false;
        }
        if (newPassword !== confirmNewPassword) {
            showErrorMessage('confirm-new-password-error', 'New passwords do not match.');
            isValid = false;
        }
        if (!isValid) return;

        setLoadingState('password-change-button', true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                showGlobalMessage('password-message', 'Password changed successfully!', 'info');
                passwordForm.reset();
            } else {
                showGlobalMessage('password-error', data.message || 'Failed to change password.');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showGlobalMessage('password-error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('password-change-button', false);
        }
    });
}

// Reusing validateEmail/validatePassword from auth.js if available, otherwise define
// (Assuming auth.js is loaded first in public/js/main.js which links it to global scope or its functionality is copied)
// For robustness, redefine here if auth.js is not guaranteed to load first:
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
function validatePassword(password) {
    return password.length >= 6;
}


// ------------------------------------
// Settings Page
// ------------------------------------

const settingsForm = getElement('settings-form');
const deleteAccountButton = getElement('delete-account-button');

async function loadSettingsData(userId) {
    // In a real app, settings would be part of user model or a separate settings model
    // For this example, we'll simulate loading settings data
    // Fetch user data (name, email) just to ensure user is active.
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.user) {
            updateUIWithUserInfo(data.user.name);
            // Simulate loading settings from a user object or a default
            const userSettings = data.user.settings || {
                notificationEmail: 'daily',
                theme: 'light',
                defaultTaskStatus: 'pending'
            };
            getElement('notification-email').value = userSettings.notificationEmail;
            document.querySelector(`input[name="theme"][value="${userSettings.theme}"]`).checked = true;
            getElement('default-task-status').value = userSettings.defaultTaskStatus;
        } else {
            showGlobalMessage('settings-error', data.message || 'Failed to load settings data.');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showGlobalMessage('settings-error', 'An error occurred while loading settings data.');
    }
}


if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessages(settingsForm);

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        const notificationEmail = getElement('notification-email').value;
        const theme = document.querySelector('input[name="theme"]:checked').value;
        const defaultTaskStatus = getElement('default-task-status').value;

        setLoadingState('settings-save-button', true);

        try {
            // In a real app, this would be a PUT to /api/users/:id/settings or /api/settings
            // For now, we'll simulate updating 'settings' as part of the user object
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ settings: { notificationEmail, theme, defaultTaskStatus } })
            });

            const data = await response.json();

            if (data.success) {
                showGlobalMessage('settings-message', 'Settings updated successfully!', 'info');
                // You might want to update local storage or re-fetch settings
            } else {
                showGlobalMessage('settings-error', data.message || 'Failed to update settings.');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            showGlobalMessage('settings-error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoadingState('settings-save-button', false);
        }
    });

    getElement('settings-cancel-button')?.addEventListener('click', () => {
        const userId = localStorage.getItem('userId');
        loadSettingsData(userId); // Revert changes
        clearErrorMessages(settingsForm);
    });
}


if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', async () => {
        if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            // Simulate deletion
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            try {
                // In a real app, this would be a DELETE to /api/users/:id
                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    alert('Your account has been successfully deleted.');
                    handleLogout(); // Redirect to login after deletion
                } else {
                    showGlobalMessage('settings-error', data.message || 'Failed to delete account.', 'error');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                showGlobalMessage('settings-error', 'An error occurred while deleting your account.', 'error');
            }
        }
    });
}