document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaintForm');
  const statusBox = document.getElementById('statusMessage');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userName = document.getElementById('userName')?.value.trim();
      const type = document.getElementById('type')?.value;
      const description = document.getElementById('description')?.value.trim();

      statusBox.style.display = 'block';
      statusBox.className = 'status-box info';
      statusBox.textContent = 'Submitting report...';

      try {
        const response = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, type, description })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          statusBox.className = 'status-box success';
          statusBox.textContent = `✅ Report submitted successfully! Reference ID: ${data.complaint.id}`;
          form.reset();
        } else {
          statusBox.className = 'status-box error';
          statusBox.textContent = data.error || 'Failed to submit report.';
        }
      } catch (err) {
        console.error('Submission error:', err);
        statusBox.className = 'status-box error';
        statusBox.textContent = 'Could not connect to the server.';
      }
    });
  }
});