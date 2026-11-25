/* ===================================================
   SITE BEHAVIOR — navbar, mobile menu, forms, gallery
   lightbox, and other general UI interactions.
   (3D model viewer logic lives in model-viewer.js)
   =================================================== */
  (function () {

    /* ---- Navbar shrink + active link ---- */
    const navbar = document.getElementById('navbar');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelectorAll('[data-link]');
    const sections = ['services', 'model-viewer', 'scotcyd', 'projects', 'resources', 'about', 'contact'];

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('shrink', window.scrollY > 30);
      let current = '';
      for (let id of sections) {
        const sec = document.getElementById(id);
        if (sec) {
          const r = sec.getBoundingClientRect();
          if (r.top <= 200 && r.bottom >= 100) { current = id; break; }
        }
      }
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.link === current));
    });

    /* ---- Mobile menu ---- */
    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
      mobileMenu.querySelectorAll('a').forEach(l =>
        l.addEventListener('click', () => mobileMenu.classList.remove('open'))
      );
    }

    /* ---- Contact form ---- */
    const form = document.getElementById('contactForm');
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        successDiv.style.display = 'none';
        errorDiv.style.display = 'none';

        const fd = new FormData(form);
        const name = fd.get('name')?.trim();
        const email = fd.get('email')?.trim();
        const msg = fd.get('message')?.trim();
        const proj = fd.get('project_type');

        if (!name || !email || !msg || !proj) {
          errorDiv.textContent = 'Please fill in all required fields.';
          errorDiv.style.display = 'block'; return;
        }
        if (!email.includes('@') || !email.includes('.')) {
          errorDiv.textContent = 'Please enter a valid email address.';
          errorDiv.style.display = 'block'; return;
        }

        try {
          const res = await fetch(form.action, {
            method: 'POST', body: fd, headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            gaEvent('generate_lead', { form_id: 'contactForm', project_type: proj });
            form.reset();
            successDiv.style.display = 'block';
            setTimeout(() => successDiv.style.display = 'none', 6000);
          } else { throw new Error(); }
        } catch {
          errorDiv.style.display = 'block';
          setTimeout(() => errorDiv.style.display = 'none', 6000);
        }
      });
    }

    /* ---- Smooth scroll ---- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function (e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    /* ---- Gallery filter ---- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        gaEvent('select_content', { content_type: 'gallery_filter', item_id: filter });
        galleryItems.forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });

    /* ---- Resource link clicks ---- */
    document.querySelectorAll('.resource-link').forEach(link => {
      link.addEventListener('click', () => {
        const title = link.closest('.resource-card')?.querySelector('h3')?.textContent || 'unknown';
        gaEvent('select_content', { content_type: 'resource', item_id: title });
      });
    });

    /* ---- ScotCyd platform link clicks ---- */
    document.querySelectorAll('.platform-btn').forEach(link => {
      link.addEventListener('click', () => {
        const platform = link.textContent.trim();
        gaEvent('select_content', { content_type: 'scotcyd_platform', item_id: platform });
      });
    });

    /* ---- Scroll depth tracking ---- */
    const scrollMilestones = [25, 50, 75, 90, 100];
    const scrollFired = new Set();

    function checkScrollDepth() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      scrollMilestones.forEach(milestone => {
        if (pct >= milestone && !scrollFired.has(milestone)) {
          scrollFired.add(milestone);
          gaEvent('scroll_depth', { percent_scrolled: milestone });
        }
      });
    }
    window.addEventListener('scroll', checkScrollDepth, { passive: true });

    /* ---- Project impression tracking (which projects actually get seen) ---- */
    if ('IntersectionObserver' in window) {
      const seenProjects = new Set();
      const projectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const caption = entry.target.querySelector('.gallery-item-caption')?.textContent || 'unknown';
            if (!seenProjects.has(caption)) {
              seenProjects.add(caption);
              gaEvent('view_item', { item_name: caption, item_category: entry.target.dataset.category });
            }
          }
        });
      }, { threshold: 0.5 });
      galleryItems.forEach(item => projectObserver.observe(item));
    }

    /* ---- Time-on-page ping (fires once at 30s and once at 2min, catches engaged visitors) ---- */
    [30, 120].forEach(seconds => {
      setTimeout(() => gaEvent('engagement_time', { seconds }), seconds * 1000);
    });

  })();

  /* ---- DIY popup ---- */
  function openDIYOptions() {
    document.getElementById('diyOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    gaEvent('select_content', { content_type: 'diy_card', item_id: 'open_options' });
  }

  function closeDIYOptions(e, force) {
    if (force || (e && e.target === document.getElementById('diyOverlay'))) {
      document.getElementById('diyOverlay').classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function setDIYContact(optionText) {
    gaEvent('select_content', { content_type: 'diy_option', item_id: optionText });
    closeDIYOptions(null, true);
    setTimeout(() => {
      const msgField = document.getElementById('contactMessage');
      const typeSelect = document.getElementById('projectTypeSelect');
      if (msgField) msgField.value = optionText;
      if (typeSelect) {
        for (let opt of typeSelect.options) {
          if (opt.value.toLowerCase().includes('roll former')) { opt.selected = true; break; }
        }
      }
    }, 400);
  }

  /* ---- Lightbox ---- */
  let currentLightboxIndex = 0;
  let visibleItems = [];

  function getVisibleItems() {
    return Array.from(document.querySelectorAll('.gallery-item:not(.hidden)'));
  }

  function openLightbox(el) {
    visibleItems = getVisibleItems();
    currentLightboxIndex = visibleItems.indexOf(el);
    showLightboxImage(currentLightboxIndex);
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function showLightboxImage(index) {
    visibleItems = getVisibleItems();
    if (index < 0) index = visibleItems.length - 1;
    if (index >= visibleItems.length) index = 0;
    currentLightboxIndex = index;
    const img = visibleItems[index].querySelector('img');
    document.getElementById('lightboxImg').src = img.src;
    document.getElementById('lightboxImg').alt = img.alt;
    document.getElementById('lightboxCounter').textContent = (index + 1) + ' / ' + visibleItems.length;
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }

  function closeLightboxOnBg(e) {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  }

  function navigateLightbox(dir) {
    showLightboxImage(currentLightboxIndex + dir);
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
  });

  /* Touch swipe for mobile lightbox */
  (function () {
    let touchStartX = 0;
    const lb = document.getElementById('lightbox');
    lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? 1 : -1);
    }, { passive: true });
  })();

/* =====================================================================
   SCOTCYD — LATEST EPISODES
   ---------------------------------------------------------------------
   HOW TO UPDATE: put the newest episode FIRST. The "id" is the 11-character
   code from the YouTube link  (youtube.com/shorts/<ID>  or  youtu.be/<ID>).
   The page shows up to 3 episodes plus a "More on YouTube" tile.
   Entries with an empty id are skipped, so nothing breaks while you fill
   them in.
   ===================================================================== */
const SCOTCYD_EPISODES = [
  { id: 'lkLgA7loscs', title: 'Latest Episode' },
  { id: '', title: '' },   // <-- episode 2: paste the YouTube video ID here + a short title
  { id: '', title: '' }    // <-- episode 3: paste the YouTube video ID here + a short title
];
const SCOTCYD_CHANNEL_URL = 'https://www.youtube.com/@scottsdalenz/shorts';

(function renderScotcydEpisodes() {
  const grid = document.getElementById('episodeGrid');
  if (!grid) return;

  const episodes = SCOTCYD_EPISODES.filter(e => e && /^[A-Za-z0-9_-]{11}$/.test(e.id)).slice(0, 3);

  grid.innerHTML = '';

  episodes.forEach((ep, i) => {
    const title = ep.title || ('ScotCyd Episode ' + (i + 1));
    const card = document.createElement('div');
    card.className = 'episode';
    card.innerHTML =
      '<div class="video-embed-wrap" data-video-id="' + ep.id + '">' +
        '<button type="button" class="video-thumb-btn" aria-label="Play video: ' + title.replace(/"/g, '&quot;') + '">' +
          '<img src="https://i.ytimg.com/vi/' + ep.id + '/hqdefault.jpg" alt="' + title.replace(/"/g, '&quot;') + ' thumbnail" loading="lazy">' +
          '<span class="video-play-icon"><i class="fas fa-play"></i></span>' +
        '</button>' +
      '</div>' +
      '<p class="episode-title"></p>';
    card.querySelector('.episode-title').textContent = title;

    // Thumbnail fallbacks if the first size is missing
    const img = card.querySelector('img');
    const fallbacks = ['mqdefault.jpg', 'default.jpg'];
    let step = 0;
    img.addEventListener('error', function () {
      if (step < fallbacks.length) {
        img.src = 'https://i.ytimg.com/vi/' + ep.id + '/' + fallbacks[step++];
      } else {
        img.style.display = 'none';
      }
    });

    // Click-to-play facade: the real YouTube iframe is only added on click
    const wrap = card.querySelector('.video-embed-wrap');
    wrap.querySelector('.video-thumb-btn').addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + ep.id + '?autoplay=1&rel=0';
      iframe.title = 'ScotCyd — ' + title;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      wrap.innerHTML = '';
      wrap.appendChild(iframe);
      if (typeof gaEvent === 'function') {
        gaEvent('select_content', { content_type: 'video', item_id: ep.id });
      }
    }, { once: true });

    grid.appendChild(card);
  });

  // "More on YouTube" tile — only shown while there are fewer than 3 episodes,
  // and it stretches across the empty columns so the row always looks full.
  if (episodes.length >= 3) return;
  const more = document.createElement('a');
  more.style.gridColumn = 'span ' + (3 - episodes.length);
  more.className = 'episode-more';
  more.href = SCOTCYD_CHANNEL_URL;
  more.target = '_blank';
  more.rel = 'noopener noreferrer';
  more.innerHTML = '<i class="fab fa-youtube"></i><span>More episodes<br>on YouTube</span>';
  more.addEventListener('click', () => {
    if (typeof gaEvent === 'function') gaEvent('select_content', { content_type: 'scotcyd_platform', item_id: 'YouTube (more episodes)' });
  });
  grid.appendChild(more);
})();

/* ---- Hero video link tracking ---- */
(function () {
  ['heroVideoLink', 'heroWatchBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      if (typeof gaEvent === 'function') gaEvent('select_content', { content_type: 'hero_video', item_id: 'youtube_4fGqLOlAcLg' });
    });
  });
})();
