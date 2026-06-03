// 초기 가상 데이터 설정 (Local Storage에 데이터가 없을 때만 작동)
let episodes = JSON.parse(localStorage.getItem('herb_episodes')) || [
    { id: 1, title: '첫 번째 밤', summary: '어둠이 내린 하늘은 맑았다...', content: '약초 냄새가 짙게 밴 오래된 가방을 열자, 희미한 빛이 새어나왔다...\n\n(이곳에 관리자 페이지를 통해 1화의 본문을 아주 길게 작성해 보세요. 약 30줄 정도가 넘어가면 아래쪽이 자연스럽게 흐려지면서 숨겨지도록 설계되었습니다.)\n\n낡은 가죽의 촉감과 바스락거리는 마른 잎사귀들의 소리가 공방의 고요함을 갈랐다...', date: '2023.10.01', visible: true, views: 15 },
    { id: 2, title: '낯선 방문자', summary: '문을 열자 그곳에는 뜻밖의 인물이...', content: '연금술 공방의 문을 두드린 것은 제국에서 온 사절단이었다...', date: '2023.10.08', visible: true, views: 32 },
    { id: 3, title: '은밀한 약속', summary: '우리는 결코 잊어서는 안 되는...', content: '푸른빛이 감도는 만드라고라 뿌리를 건네며 그는 속삭였다...', date: '2023.10.15', visible: true, views: 10 }
];

// 제목 포맷팅 수정 (중복 제거)
episodes = episodes.map(ep => {
    ep.title = ep.title.replace(/^\d+화[\s.]*/, '').trim();
    return ep;
});

let currentViewMode = 'grid'; 
let currentReadingId = null;

// 페이지 시작 시 렌더링
document.addEventListener('DOMContentLoaded', () => {
    saveData(); 
    renderEpisodes();
    renderAdminEpisodes();
    updateStats();
    renderFirstPreview(); 
});

// SPA 탭 화면 전환 함수
function navigate(pageId, skipScroll = false) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    if (pageId === 'admin-login') {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            document.getElementById('page-admin-dashboard').classList.add('active');
        } else {
            document.getElementById('page-admin-login').classList.add('active');
        }
    } else {
        document.getElementById(`page-${pageId}`).classList.add('active');
    }
    
    document.getElementById('nav-links').classList.remove('show');
    if (!skipScroll) {
        window.scrollTo(0, 0);
    }
}

// 모바일 토글 메뉴
function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('show');
}

// 데이터 저장 및 갱신 함수
function saveData() {
    localStorage.setItem('herb_episodes', JSON.stringify(episodes));
    updateStats();
    renderFirstPreview(); 
}

// 에피소드 보기 모드 전환 (갤러리 / 리스트)
function setViewMode(mode) {
    currentViewMode = mode;
    document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
    document.getElementById('btn-list').classList.toggle('active', mode === 'list');
    renderEpisodes();
}

// 에피소드 목록 출력
function renderEpisodes() {
    const container = document.getElementById('episode-container');
    if (!container) return;
    container.className = currentViewMode === 'grid' ? 'episode-grid' : 'episode-list';
    container.innerHTML = '';

    const visibleEpisodes = episodes.filter(ep => ep.visible);

    if (visibleEpisodes.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#999;">아직 등록된 회차가 없습니다.</p>';
        return;
    }

    visibleEpisodes.forEach(ep => {
        const div = document.createElement('div');
        div.className = 'episode-card clickable';
        div.onclick = () => readEpisode(ep.id);
        div.innerHTML = `
            <h3 class="ep-title">${ep.id}화. ${ep.title}</h3>
            <p class="ep-summary">${ep.summary}</p>
            <span class="ep-date">${ep.date}</span>
        `;
        container.appendChild(div);
    });
}

// 메인 페이지 1화 미리보기 출력
function renderFirstPreview() {
    const previewSection = document.getElementById('first-preview');
    if (!previewSection) return;
    const firstEp = episodes.find(ep => ep.id === 1) || episodes[0];
    
    if (firstEp && firstEp.visible) {
        previewSection.innerHTML = `
            <h2 style="font-size: 1.1rem; color: var(--text-light); letter-spacing: 0.15em; margin-bottom: 2rem; font-weight: 600;">1화 미리보기</h2>
            <div class="preview-text-box">${firstEp.content}</div>
            <a class="clickable read-more-text" onclick="readEpisode(${firstEp.id}, true)">
                1화 이어서 읽기 &rarr;
            </a>
        `;
    } else {
        previewSection.innerHTML = '<p style="color: var(--text-light);">미리보기 내용이 없습니다.</p>';
    }
}

// 본문 내용 읽기 작동
function readEpisode(id, fromPreview = false) {
    const ep = episodes.find(e => e.id === id);
    if (!ep) return;
    
    ep.views = (ep.views || 0) + 1;
    saveData();
    
    document.getElementById('read-title').innerText = `${ep.id}화. ${ep.title}`;
    document.getElementById('read-date').innerText = ep.date;
    document.getElementById('read-content').innerText = ep.content;
    
    currentReadingId = id;
    
    const visibleEpisodes = episodes.filter(e => e.visible);
    const currentIndex = visibleEpisodes.findIndex(e => e.id === id);
    const nextBtn = document.getElementById('btn-next-ep');
    
    if (currentIndex !== -1 && currentIndex < visibleEpisodes.length - 1) {
        const nextId = visibleEpisodes[currentIndex + 1].id;
        nextBtn.style.display = 'inline-block';
        nextBtn.onclick = () => readEpisode(nextId);
    } else {
        nextBtn.style.display = 'none';
    }

    navigate('read', fromPreview);

    if (fromPreview) {
        setTimeout(() => {
            const readContent = document.getElementById('read-content');
            const fontSize = parseFloat(window.getComputedStyle(readContent).fontSize) || 17.6;
            const lineHeight = 1.8;
            const offsetHeight = 30 * fontSize * lineHeight;
            const targetPosition = readContent.offsetTop + offsetHeight - 90;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }, 50);
    }
}

// 관리자 로그인 체크
function checkLogin() {
    const pw = document.getElementById('admin-pw').value;
    if (pw === '1234') {
        sessionStorage.setItem('isAdmin', 'true');
        document.getElementById('admin-pw').value = '';
        navigate('admin-dashboard');
        renderAdminEpisodes();
    } else {
        alert('비밀번호가 일치하지 않습니다.');
    }
}

// 관리자 로그아웃
function logout() {
    sessionStorage.removeItem('isAdmin');
    navigate('home');
}

// 관리자 화면 내 등록된 회차 목록 출력 (수정된 코드)
function renderAdminEpisodes(page = 1) {
    const list = document.getElementById('admin-ep-list');
    if (!list) return;

    list.innerHTML = '';

    console.log("episodes:", episodes);
    console.log("page:", page);

    const itemsPerPage = 10;

    const start = Math.max(0, (page - 1) * itemsPerPage);
    const end = start + itemsPerPage;

    const paginated = episodes.slice(start, end);

    console.log("start:", start, "end:", end);
    console.log("paginated:", paginated);

    if (paginated.length === 0 && episodes.length > 0) {
        console.warn("pagination mismatch → resetting page to 1");
        return renderAdminEpisodes(1);
    }

    paginated.forEach(ep => {
        const div = document.createElement('div');
        div.className = 'admin-ep-item';

        div.innerHTML = `
    <div class="ep-actions">
        <button onclick="toggleVisibility(${ep.id})">
            <i class="fa-regular ${ep.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
        </button>

        <button onclick="editEpisode(${ep.id})">
            <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <button onclick="deleteEpisode(${ep.id})">
            <i class="fa-solid fa-trash"></i>
        </button>
    </div>
`;
        list.appendChild(div);
    });

    renderAdminPagination();
}
// 공개 여부 변경 토글
function toggleVisibility(id) {
    const ep = episodes.find(e => e.id === id);
    if (ep) {
        ep.visible = !ep.visible;
        saveData();
        renderAdminEpisodes();
        renderEpisodes();
    }
}

// 회차 삭제
function deleteEpisode(id) {
    if (confirm('정말로 이 회차를 삭제하시겠습니까?')) {
        episodes = episodes.filter(e => e.id !== id);
        saveData(); 
        renderAdminEpisodes();
        renderEpisodes();
    }
}

// 회차 수정을 위한 기존 데이터 폼 로드
function editEpisode(id) {
    const ep = episodes.find(e => e.id === id);
    if (ep) {
        document.getElementById('edit-id').value = ep.id;
        document.getElementById('ep-title').value = ep.title;
        document.getElementById('ep-summary').value = ep.summary;
        document.getElementById('ep-content').value = ep.content;
        
        document.getElementById('upload-title').innerText = '회차 수정';
        document.getElementById('btn-save').innerText = '수정 완료';
        window.scrollTo(0, 0);
    }
}

// 회차 등록 및 수정 저장 실행
function saveEpisode() {
    const editId = document.getElementById('edit-id').value;
    let title = document.getElementById('ep-title').value.trim();
    title = title.replace(/^\d+화[\s.]*/, '').trim();
    
    const summary = document.getElementById('ep-summary').value.trim();
    const content = document.getElementById('ep-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    if (editId) {
        const ep = episodes.find(e => e.id === parseInt(editId));
        ep.title = title;
        ep.summary = summary;
        ep.content = content;
    } else {
        const newId = episodes.length > 0 ? Math.max(...episodes.map(e => e.id)) + 1 : 1;
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
        
        episodes.push({
            id: newId,
            title: title,
            summary: summary,
            content: content,
            date: dateStr,
            visible: true,
            views: 0
        });
    }

    saveData();
    renderAdminEpisodes();
    renderEpisodes();
    
    document.getElementById('edit-id').value = '';
    document.getElementById('ep-title').value = '';
    document.getElementById('ep-summary').value = '';
    document.getElementById('ep-content').value = '';
    document.getElementById('upload-title').innerText = '회차 업로드';
    document.getElementById('btn-save').innerText = '업로드';
    
    alert('저장되었습니다.');
}

// 대시보드 내 통계치 업데이트 계산
function updateStats() {
    const totalViews = episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
    const count = episodes.length;
    
    let maxTitle = '-';
    if (count > 0) {
        const maxEp = episodes.reduce((prev, current) => (prev.views > current.views) ? prev : current);
        if (maxEp.views > 0) {
            maxTitle = `${maxEp.id}화. ${maxEp.title}`;
        }
    }

    const viewEl = document.getElementById('stat-views');
    const countEl = document.getElementById('stat-count');
    const maxEl = document.getElementById('stat-max');

    if(viewEl) viewEl.innerText = totalViews;
    if(countEl) countEl.innerText = `${count}화`;
    if(maxEl) maxEl.innerText = maxTitle;
}
