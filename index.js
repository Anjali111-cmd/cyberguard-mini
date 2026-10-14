document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaintForm');
  const statusBox = document.getElementById('statusMessage');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userName = document.getElementById('userName')?.value.trim() || 'Anonymous';
      const type = document.getElementById('type')?.value;
      const description = document.getElementById('description')?.value.trim();
      const customId = 'CG-' + Math.floor(100000 + Math.random() * 900000);

      statusBox.style.display = 'block';
      statusBox.className = 'status-box info';
      statusBox.textContent = 'Submitting...';

      try {
        const response = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: customId, userName, type, description })
        });

        if (response.ok) {
          statusBox.className = 'status-box success';
          statusBox.textContent = `Incident report submitted successfully! Reference ID: ${customId}`;
          form.reset();
        } else {
          statusBox.className = 'status-box error';
          statusBox.textContent = 'Failed to submit report. Please try again.';
        }
      } catch (err) {
        console.error('Submission error:', err);
        statusBox.className = 'status-box error';
        statusBox.textContent = 'Server connection error.';
      }
    });
  }
});