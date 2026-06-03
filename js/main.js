let episodes = JSON.parse(localStorage.getItem('herb_episodes')) || [/* 기존 데이터 */];

episodes = episodes.map(ep => {
    ep.title = ep.title.replace(/^\d+화[\s.]*/, '').trim();
    return ep;
});

let currentViewMode = 'grid';
let currentReadingId = null;

/* -----------------------
   초기 로딩
------------------------*/
document.addEventListener('DOMContentLoaded', () => {
    const page = location.hash.replace('#', '') || 'home';

    renderAll();
    navigate(page, true);
});

/* -----------------------
   URL 변화 감지 (뒤로가기 포함)
------------------------*/
window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '') || 'home';
    navigate(page, true);
});

/* -----------------------
   SPA 네비게이션 핵심
------------------------*/
function navigate(pageId, skipScroll = false) {

    // 모든 페이지 숨김
    document.querySelectorAll('.page')
        .forEach(p => p.classList.remove('active'));

    // 페이지 선택
    const target = document.getElementById(`page-${pageId}`);

    if (target) target.classList.add('active');

    // admin 분기
    if (pageId === 'admin-login') {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            document.getElementById('page-admin-dashboard').classList.add('active');
        } else {
            document.getElementById('page-admin-login').classList.add('active');
        }
    }

    document.getElementById('nav-links')?.classList.remove('show');

    if (!skipScroll) window.scrollTo(0, 0);

    // URL 동기화
    if (location.hash !== `#${pageId}`) {
        location.hash = pageId;
    }
}

/* -----------------------
   네비 클릭용 함수
------------------------*/
function go(pageId) {
    navigate(pageId);
}

/* -----------------------
   렌더 통합
------------------------*/
function renderAll() {
    saveData();
    renderEpisodes();
    renderAdminEpisodes();
    updateStats();
    renderFirstPreview();
}

/* -----------------------
   이하 기존 로직 유지
   (변경 없음)
------------------------*/

function saveData() {
    localStorage.setItem('herb_episodes', JSON.stringify(episodes));
    updateStats();
    renderFirstPreview();
}

function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('show');
}

/* episode 렌더 */
function renderEpisodes() {
    const container = document.getElementById('episode-container');
    if (!container) return;

    container.className = currentViewMode === 'grid'
        ? 'episode-grid'
        : 'episode-list';

    container.innerHTML = '';

    const visible = episodes.filter(e => e.visible);

    visible.forEach(ep => {
        const div = document.createElement('div');
        div.className = 'episode-card clickable';
        div.onclick = () => readEpisode(ep.id);

        div.innerHTML = `
            <h3>${ep.id}화. ${ep.title}</h3>
            <p>${ep.summary}</p>
            <span>${ep.date}</span>
        `;

        container.appendChild(div);
    });
}

/* 읽기 */
function readEpisode(id, fromPreview = false) {
    const ep = episodes.find(e => e.id === id);
    if (!ep) return;

    ep.views = (ep.views || 0) + 1;
    saveData();

    document.getElementById('read-title').innerText = `${ep.id}화. ${ep.title}`;
    document.getElementById('read-date').innerText = ep.date;
    document.getElementById('read-content').innerText = ep.content;

    currentReadingId = id;

    navigate('read', true);

    if (fromPreview) {
        setTimeout(() => {
            const el = document.getElementById('read-content');
            window.scrollTo(0, el.offsetTop);
        }, 50);
    }
}

/* admin / stats는 그대로 유지 */
function updateStats() {
    const total = episodes.reduce((s, e) => s + (e.views || 0), 0);

    document.getElementById('stat-views')?.innerText = total;
}
