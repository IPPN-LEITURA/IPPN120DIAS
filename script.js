const TOTAL_DIAS = 120;

function getLeituras() {
  return window.LEITURAS_DO_DIA || {};
}

let diaAtual = 1;
let moduloAtual = 1;
let leiturasConcluidas = JSON.parse(localStorage.getItem('ippn_120dias_lidos')) || [];
let ultimosAcessos = JSON.parse(localStorage.getItem('ippn_120dias_acessos')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const userProgressBar = document.getElementById('user-progress-bar');
  const userProgressText = document.getElementById('user-progress-text');
  const streakCount = document.getElementById('streak-count');
  const calendarGrid = document.getElementById('calendar-grid');
  const btnCompleteDay = document.getElementById('btn-complete-day');
  const dayTitle = document.getElementById('day-title');
  const daySubtitle = document.getElementById('day-subtitle');
  const dayTextContent = document.getElementById('day-text-content');
  const currentDayLabel = document.getElementById('current-day-label');
  const btnBibliaLink = document.getElementById('btn-biblia-link');
  const toastEl = document.getElementById('toast');

  const btnPrevDay = document.getElementById('btn-prev-day');
  const btnNextDay = document.getElementById('btn-next-day');
  const navDayIndicator = document.getElementById('nav-day-indicator');

  const audioElement = document.getElementById('audio-element');
  const btnPlayerPlay = document.getElementById('btn-player-play');
  const btnPlayerSpeed = document.getElementById('btn-player-speed');
  const playerTitle = document.getElementById('player-title');
  const playerSubtitle = document.getElementById('player-subtitle');
  const playerProgress = document.getElementById('player-progress');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerDuration = document.getElementById('player-duration');

  // Elementos do Modal Palavra do Pastor
 const btnPastor = document.getElementById('btn-pastor');
  const pastorModal = document.getElementById('pastor-modal');
  const btnClosePastor = document.getElementById('btn-close-pastor');

  if (btnPastor && pastorModal && btnClosePastor) {
    // Abrir Modal
    btnPastor.addEventListener('click', (e) => {
      e.preventDefault();
      pastorModal.classList.add('active');
    });

    // Fechar Modal
    const fecharModal = () => {
      pastorModal.classList.remove('active');
    };

    btnClosePastor.addEventListener('click', fecharModal);

    // Fechar ao clicar no fundo escuro fora do card
    pastorModal.addEventListener('click', (e) => {
      if (e.target === pastorModal) {
        fecharModal();
      }
    });
  }

  function showToast(mensagem) {
    if (!toastEl) return;
    toastEl.textContent = mensagem;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  function getYoutubeEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';
    
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      } else {
        videoId = url.trim();
      }
    } catch (e) {
      videoId = url;
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  }

  function renderComplementos(complementos) {
    const container = document.getElementById('day-complementos');
    if (!container) return;

    if (!complementos || complementos.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    let html = `<h3 class="complementos-title">📚 Materiais Complementares</h3><div class="complementos-grid">`;

    complementos.forEach(item => {
      if (item.tipo === 'youtube') {
        const embedUrl = getYoutubeEmbedUrl(item.url);
        html += `
          <div class="complemento-item">
            ${item.titulo ? `<p class="video-title">🎥 ${item.titulo}</p>` : ''}
            <div class="video-wrapper">
              <iframe 
                src="${embedUrl}" 
                title="${item.titulo || 'Vídeo do YouTube'}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            </div>
          </div>
        `;
      } else if (item.tipo === 'arquivo') {
        html += `
          <a href="${item.url}" target="_blank" download class="complemento-link-card">
            <span class="complemento-icon">📄</span>
            <span>${item.titulo || 'Baixar Ficheiro Complementar'}</span>
          </a>
        `;
      } else {
        html += `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="complemento-link-card">
            <span class="complemento-icon">🔗</span>
            <span>${item.titulo || 'Acessar Link Externo'}</span>
          </a>
        `;
      }
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  function atualizarNavegacaoControls() {
    const leituras = getLeituras();

    if (navDayIndicator) {
      navDayIndicator.innerText = `Dia ${diaAtual} de ${TOTAL_DIAS}`;
    }

    if (btnPrevDay) {
      btnPrevDay.disabled = (diaAtual <= 1);
    }

    if (btnNextDay) {
      const proximoExiste = !!leituras[diaAtual + 1];
      btnNextDay.disabled = (diaAtual >= TOTAL_DIAS || !proximoExiste);
    }
  }

  function carregarDia(dia) {
    const leituras = getLeituras();
    const leitura = leituras[dia];

    if (!leitura) {
      showToast(`A leitura do dia ${dia} ainda não foi disponibilizada.`);
      renderComplementos([]);
      return;
    }

    diaAtual = dia;

    const moduloDoDia = Math.ceil(dia / 30);
    if (moduloDoDia !== moduloAtual) {
      moduloAtual = moduloDoDia;
      document.querySelectorAll('.tab-btn').forEach(t => {
        t.classList.toggle('active', parseInt(t.getAttribute('data-module')) === moduloAtual);
      });
    }

    if (currentDayLabel) currentDayLabel.innerText = `Dia ${dia}`;
    if (dayTitle) dayTitle.innerText = leitura.titulo || `Dia ${dia}`;
    if (daySubtitle) daySubtitle.innerText = leitura.subtitulo || "";
    if (dayTextContent) dayTextContent.innerHTML = leitura.transcricao || "<p>Transcrição ainda não informada.</p>";

    renderComplementos(leitura.complementos);

    if (btnBibliaLink) {
      if (leitura.link) {
        btnBibliaLink.href = leitura.link;
        btnBibliaLink.style.display = "inline-flex";
      } else {
        btnBibliaLink.style.display = "none";
      }
    }

    atualizarBotaoConclusao();
    atualizarNavegacaoControls();
    carregarAudioPlayer(leitura.titulo, leitura.audio || `audio/dia${String(dia).padStart(2, '0')}.mp3`);
    renderCalendario();
  }

  function toggleConclusaoDia(dia) {
    const leituras = getLeituras();
    if (!leituras[dia]) {
      showToast(`O dia ${dia} ainda não está disponível.`);
      return;
    }

    if (leiturasConcluidas.includes(dia)) {
      leiturasConcluidas = leiturasConcluidas.filter(d => d !== dia);
    } else {
      leiturasConcluidas.push(dia);
      registrarAcesso();
    }

    localStorage.setItem('ippn_120dias_lidos', JSON.stringify(leiturasConcluidas));
    atualizarProgressoUI();
    renderCalendario();
    atualizarBotaoConclusao();
  }

  function registrarAcesso() {
    const hoje = new Date().toISOString().split('T')[0];
    if (!ultimosAcessos.includes(hoje)) {
      ultimosAcessos.push(hoje);
      localStorage.setItem('ippn_120dias_acessos', JSON.stringify(ultimosAcessos));
    }
  }

  function calcularStreak() {
    if (ultimosAcessos.length === 0) return 0;
    const datas = ultimosAcessos.map(d => new Date(d)).sort((a, b) => b - a);
    let streak = 0;
    let dataChecagem = new Date();
    dataChecagem.setHours(0,0,0,0);

    for (let i = 0; i < datas.length; i++) {
      const d = datas[i];
      d.setHours(0,0,0,0);
      const diff = Math.floor((dataChecagem - d) / (1000 * 60 * 60 * 24));
      if (diff === 0 || diff === 1) {
        streak++;
        dataChecagem = d;
      } else {
        break;
      }
    }
    return streak;
  }

  function atualizarProgressoUI() {
    const concluidos = leiturasConcluidas.length;
    const porcentagem = Math.round((concluidos / TOTAL_DIAS) * 100);

    if (userProgressBar) userProgressBar.style.width = `${porcentagem}%`;
    if (userProgressText) userProgressText.innerText = `${concluidos} de ${TOTAL_DIAS} dias concluídos (${porcentagem}%)`;
    if (streakCount) streakCount.innerText = calcularStreak();
  }

  function atualizarBotaoConclusao() {
    if (!btnCompleteDay) return;
    const isConcluido = leiturasConcluidas.includes(diaAtual);
    if (isConcluido) {
      btnCompleteDay.classList.add('completed');
      btnCompleteDay.innerHTML = `<span class="check-icon">✓</span> Concluído`;
    } else {
      btnCompleteDay.classList.remove('completed');
      btnCompleteDay.innerHTML = `<span class="check-icon">✓</span> Marcar como Lido`;
    }
  }

  function renderCalendario() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    const leituras = getLeituras();
    const inicio = (moduloAtual - 1) * 30 + 1;
    const fim = moduloAtual * 30;

    for (let i = inicio; i <= fim; i++) {
      const btn = document.createElement('button');
      btn.classList.add('calendar-day-btn');
      btn.innerText = i;

      const disponivel = !!leituras[i];
      const concluido = leiturasConcluidas.includes(i);

      if (disponivel) btn.classList.add('available');
      else btn.classList.add('unavailable');

      if (concluido) btn.classList.add('completed');
      if (i === diaAtual) btn.classList.add('active');

      btn.addEventListener('click', () => carregarDia(i));
      calendarGrid.appendChild(btn);
    }
  }

  function carregarAudioPlayer(titulo, audioPath) {
    if (!audioElement) return;
    audioElement.src = audioPath;
    audioElement.load();
    if (playerTitle) playerTitle.innerText = titulo;
    if (playerSubtitle) playerSubtitle.innerText = `Reflexão do Dia ${diaAtual}`;
    if (btnPlayerPlay) btnPlayerPlay.innerText = "▶";
  }

  if (btnPlayerPlay) {
    btnPlayerPlay.addEventListener('click', async () => {
      if (!audioElement || !audioElement.src) return;
      try {
        if (audioElement.paused) {
          await audioElement.play();
        } else {
          audioElement.pause();
        }
      } catch (err) {
        showToast("Não foi possível reproduzir o áudio. Verifique se o arquivo está na pasta 'audio/'.");
      }
    });
  }

  if (audioElement) {
    audioElement.addEventListener('play', () => {
      if (btnPlayerPlay) btnPlayerPlay.innerText = "⏸";
    });

    audioElement.addEventListener('pause', () => {
      if (btnPlayerPlay) btnPlayerPlay.innerText = "▶";
    });

    audioElement.addEventListener('ended', () => {
      if (btnPlayerPlay) btnPlayerPlay.innerText = "▶";
      if (playerProgress) playerProgress.value = 0;
      if (playerCurrentTime) playerCurrentTime.innerText = "0:00";
    });

    audioElement.addEventListener('timeupdate', () => {
      if (audioElement.duration) {
        const pct = (audioElement.currentTime / audioElement.duration) * 100;
        if (playerProgress) playerProgress.value = pct;
        if (playerCurrentTime) playerCurrentTime.innerText = fmtTime(audioElement.currentTime);
        if (playerDuration) playerDuration.innerText = fmtTime(audioElement.duration);
      }
    });
  }

  if (playerProgress) {
    playerProgress.addEventListener('input', (e) => {
      if (audioElement && audioElement.duration) {
        audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
      }
    });
  }

  const btnPrev = document.getElementById('btn-player-prev10');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (audioElement) audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
    });
  }

  const btnNext = document.getElementById('btn-player-next10');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (audioElement) audioElement.currentTime = Math.min(audioElement.duration || 0, audioElement.currentTime + 10);
    });
  }

  if (btnPlayerSpeed) {
    btnPlayerSpeed.addEventListener('click', () => {
      if (!audioElement) return;
      const speeds = [1, 1.25, 1.5, 2];
      const idx = speeds.indexOf(audioElement.playbackRate);
      const nextSpeed = speeds[(idx + 1) % speeds.length];
      audioElement.playbackRate = nextSpeed;
      btnPlayerSpeed.innerText = `${nextSpeed}×`;
    });
  }

  function fmtTime(s) {
    if (!isFinite(s)) return "--:--";
    const m = Math.floor(s / 60);
    const seg = Math.floor(s % 60);
    return `${m}:${String(seg).padStart(2, '0')}`;
  }

  if (btnPrevDay) {
    btnPrevDay.addEventListener('click', () => {
      if (diaAtual > 1) {
        carregarDia(diaAtual - 1);
      }
    });
  }

  if (btnNextDay) {
    btnNextDay.addEventListener('click', () => {
      const leituras = getLeituras();
      if (diaAtual < TOTAL_DIAS && leituras[diaAtual + 1]) {
        carregarDia(diaAtual + 1);
      }
    });
  }

  if (btnCompleteDay) {
    btnCompleteDay.addEventListener('click', () => toggleConclusaoDia(diaAtual));
  }

  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      moduloAtual = parseInt(e.target.getAttribute('data-module'));
      renderCalendario();
    });
  });

  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      btnTheme.innerText = isDark ? "🌙" : "☀️";
    });
  }

  atualizarProgressoUI();
  carregarDia(1);
});