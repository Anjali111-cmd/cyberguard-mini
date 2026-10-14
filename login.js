const API_BASE_URL = '/api/admin';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usernameInput = document.getElementById('username')?.value;
      const passwordInput = document.getElementById('password')?.value;

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem('adminToken', data.token);
          window.location.href = 'admin.html';
        } else {
          alert(data.message || 'Invalid login details');
        }
      } catch (err) {
        console.error('Login error:', err);
        alert('Server connection error.');
      }
    });
  }
});