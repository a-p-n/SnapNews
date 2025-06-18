document.getElementById('snapnews').addEventListener('click', function() {
    window.location.href = '/home';
});

function toggleDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

document.addEventListener('click', function (e) {
    const menu = document.querySelector('.user-menu');
    const dropdown = document.getElementById("userDropdown");
    if (!menu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const dateFilter = document.querySelector('.date-filter select');
    if (dateFilter) {
        dateFilter.addEventListener('change', function () {
            alert(`Loading news for ${this.value}`);
        });
    }

    const loadMoreBtn = document.querySelector('.load-more button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            alert('Loading more news articles...');
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username') || "User";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4361ee&color=fff`;

    document.querySelectorAll('#user-name').forEach(el => el.textContent = username);
    document.querySelectorAll('#user-avatar').forEach(el => el.src = avatarUrl);
});

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
        } catch (e) {
            console.error('Error loading news:', e);
            container.innerHTML = '<p>Failed to load news.</p>';
        }
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
});