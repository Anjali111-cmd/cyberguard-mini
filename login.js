const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const error = document.getElementById("loginError");

        error.textContent = "";

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem("adminLoggedIn", "true");
                sessionStorage.setItem("adminToken", data.token);
                window.location.href = "admin.html";
            } else {
                error.textContent = data.message || "Invalid username or password.";
            }
        } catch (err) {
            console.error('Login error:', err);
            error.textContent = "Server communication error.";
        }
    });
}