const form = document.querySelector('[data-contribute-form]');
const status = form?.querySelector('.contribute-status');
if (form) {
  const question = form.elements.question;
  const incoming = new URLSearchParams(location.search).get('q');
  if (incoming && question) question.value = incoming;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    status.textContent = 'Sending to the editor queue…';
    try {
      const response = await fetch('/api/manuscript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw Error(result?.error ?? 'submission failed');
      status.textContent = 'Received. The editor will review it before anything is published.';
      form.reset();
    } catch (error) {
      status.textContent = error.message === 'submission failed'
        ? 'The submission could not be sent. Try again, or tell us on Discord.'
        : error.message;
    } finally {
      button.disabled = false;
    }
  });
}
