document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.news-cards');
  const updateBtn = document.getElementById('updateNewsBtn');

  function renderCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="category">${article.Source}</span>
        <span class="time">${new Date(article.Timestamp).toLocaleTimeString()}</span>
      </div>
      <h3>${article.Title}</h3>
      <p class="summary">${article.Summary}</p>
      <div class="card-footer">
        <a href="${article.Link}" target="_blank"><i class="fas fa-external-link-alt"></i> Read More</a>
        <button class="save-btn"><i class="far fa-bookmark"></i></button>
      </div>`;
    container.appendChild(card);
  }

  async function loadNews() {
    container.innerHTML = '';
    try {
      const res = await fetch('http://localhost:8000/news'); //hard
      const articles = await res.json();
      articles.forEach(renderCard);
      attachBookmarkHandlers();
    } catch (e) {
      console.error('Error loading news:', e);
      container.innerHTML = '<p>Failed to load news.</p>';
    }
  }

  function attachBookmarkHandlers() {
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('fas');
        const icon = btn.querySelector('i');
        icon.classList.toggle('far');
        alert(icon.classList.contains('fas') ? 'Saved' : 'Removed');
      });
    });
  }

  updateBtn.addEventListener('click', async () => {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating…';
    try {
      const res = await fetch('http://localhost:8000/update_news'); //hard
      await res.json();
      await loadNews();
    } catch (e) {
      console.error('Update failed:', e);
      alert('Update failed. See console.');
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = 'Update News';
    }
  });

  loadNews();
});
