var SHEET_API = 'https://api.sheetbest.com/sheets/e21f6dbb-5123-4b18-82d3-152da8c09a8d';

var teacherCodes = {
  'SJ2026': { password: 'Sa!Jn-KTK26', courses: ['Beginner AMC 8 Prep'], email: 'saina@ktkacton.com' },
  'MG2026': { password: 'Mx#Gng-26!', courses: ['Math Fundamentals'], email: 'max@ktkacton.com' },
  'AN2026': { password: 'Ayan', courses: ['Geometry'], email: 'ayan@ktkacton.com' },
  'ARYA26': { password: 'Ar!Nyk-26&', courses: ['Pre-Algebra'], email: 'arya@ktkacton.com' },
  'JA2026': { password: 'Js@Abk-KT26', courses: ['Spanish Fundamentals'], email: 'josephine@ktkacton.com' },
  'AA2026': { password: 'Anj@Agg-KT26', courses: ['Entrepreneurship 101'], email: 'anjaneya@ktkacton.com' }
};

var teacherCourseDetails = {
  'Beginner AMC 8 Prep': { grades: '4-8', schedule: 'Sundays, 2:00-3:00 PM ET', dates: 'Oct 4, 11, 18, 25; Nov 1, 8, 15, 22', numClasses: 8 },
  'Math Fundamentals': { grades: 'K-5', schedule: 'Saturdays, 11:00 AM-12:00 PM ET', dates: 'Oct 3, 10, 17, 24, 31; Nov 7, 14, 21', numClasses: 8 },
  'Geometry': { grades: '7-9', schedule: 'Sundays, 1:00-1:45 PM ET', dates: 'Oct 4, 11, 18, 25; Nov 1, 8', numClasses: 6 },
  'Pre-Algebra': { grades: '5-8', schedule: 'Fridays, 5:15-6:00 PM ET', dates: 'Oct 2, 9, 16, 23, 30; Nov 6', numClasses: 6 },
  'Spanish Fundamentals': { grades: '6-7', schedule: 'Sundays, 12:00-1:00 PM ET', dates: 'Oct 4, 11, 18, 25; Nov 1, 8, 15, 22', numClasses: 8 },
  'Entrepreneurship 101': { grades: '6-12', schedule: 'Mondays, 3:00-4:00 PM ET', dates: 'Oct 5, 12, 19, 26; Nov 2, 9, 16, 23', numClasses: 8 }
};

var teacherZoomLinks = {};
var currentTeacher = null;

var coursesData = [
  { subject: 'Math', name: 'Beginner AMC 8 Prep', teacher: 'Saina Joshi', grades: '4-8', desc: 'A beginner-friendly course designed to introduce students to the types of problems found on the AMC 8 competition. Covers foundational problem-solving strategies in algebra, geometry, number sense, and logical reasoning. No prior competition experience needed.', schedule: 'Sundays, 2:00-3:00 PM ET', classes: 8, dates: 'Oct 4, 11, 18, 25; Nov 1, 8, 15, 22' },
  { subject: 'Math', name: 'Math Fundamentals', teacher: 'Max Geng', grades: 'K-5', desc: 'A fun, hands-on course that builds confidence with core elementary math concepts. Students will work through arithmetic, place value, simple fractions, and word problems in a relaxed, supportive environment. Great for building a strong math foundation.', schedule: 'Saturdays, 11:00 AM-12:00 PM ET', classes: 8, dates: 'Oct 3, 10, 17, 24, 31; Nov 7, 14, 21' },
  { subject: 'Math', name: 'Geometry', teacher: 'Ayan Nayak', grades: '7-9', desc: 'Explore shapes, angles, proofs, and spatial reasoning. Students will learn how to think logically about geometric relationships and solve problems involving triangles, quadrilaterals, circles, and coordinate geometry.', schedule: 'Sundays, 1:00-1:45 PM ET', classes: 6, dates: 'Oct 4, 11, 18, 25; Nov 1, 8' },
  { subject: 'Math', name: 'Pre-Algebra', teacher: 'Arya Nayak', grades: '5-8', desc: 'Bridge the gap between arithmetic and algebra. Students will work with variables, expressions, equations, inequalities, and introductory graphing. Designed for students who want to build a solid foundation before moving into formal algebra.', schedule: 'Fridays, 5:15-6:00 PM ET', classes: 6, dates: 'Oct 2, 9, 16, 23, 30; Nov 6' },
  { subject: 'Spanish', name: 'Spanish Fundamentals', teacher: 'Josephine Abakah', grades: '6-7', desc: 'A beginner-friendly introduction to Spanish. Students will learn basic vocabulary, greetings, everyday phrases, and simple conversation skills. Perfect for students with no prior Spanish experience who want to get started.', schedule: 'Sundays, 12:00-1:00 PM ET', classes: 8, dates: 'Oct 4, 11, 18, 25; Nov 1, 8, 15, 22' },
  { subject: 'Business', name: 'Entrepreneurship 101', teacher: 'Anjaneya Aggarwal', grades: '6-12', desc: 'Learn how real businesses are built from the ground up. Students will explore ideation, market research, pitching, and the basics of entrepreneurship. Includes hands-on activities and a final project where students create and present their own business idea.', schedule: 'Mondays, 3:00-4:00 PM ET', classes: 8, dates: 'Oct 5, 12, 19, 26; Nov 2, 9, 16, 23' }
];

var staffData = [
  { name: 'Ayaan Garg', role: 'Chapter Head', bio: 'A Senior at ABRHS with a deep interest in STEM research. Has been playing soccer competitively for 10 years and loves teaching STEM courses to young students!', photo: 'images/Ayaan.jpg' },
  { name: 'Anish Garimella', role: 'Co-Chapter Head', bio: 'A Senior at ABRHS who loves teaching math and science. Passionate about making education accessible to all students.', photo: 'images/Anish.jpg' }
];

function showPage(id) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMenu();
  setTimeout(function() {
    initBlurText(document.getElementById('page-' + id));
  }, 50);
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
}

function renderCourses() {
  var grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = '';
  coursesData.forEach(function(course) {
    var subjectClass = 'sp-math';
    if (course.subject === 'Science') subjectClass = 'sp-sci';
    if (course.subject === 'Writing') subjectClass = 'sp-write';
    if (course.subject === 'Spanish') subjectClass = 'sp-lang';
    if (course.subject === 'Business') subjectClass = 'sp-biz';

    var card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML =
      '<div>' +
        '<span class="subj-pill ' + subjectClass + '">' + course.subject + '</span>' +
        '<h3 class="c-name">' + course.name + '</h3>' +
        '<p class="c-tag">Teacher: ' + course.teacher + ' &middot; Grades ' + course.grades + '</p>' +
        '<p class="c-desc">' + course.desc + '</p>' +
      '</div>' +
      '<div class="c-meta">' +
        '<span class="c-meta-item">' + course.schedule + '</span>' +
        '<span class="c-meta-item">' + course.classes + ' classes</span>' +
        '<span class="c-meta-item">' + course.dates + '</span>' +
      '</div>';
    grid.appendChild(card);
  });
}

function renderStaff() {
  var grid = document.getElementById('staff-grid');
  if (!grid) return;
  grid.innerHTML = '';
  staffData.forEach(function(person) {
    var card = document.createElement('div');
    card.className = 's-card tilt-card';
    card.innerHTML =
      '<div class="s-ph">' +
        (person.photo ? '<img src="' + person.photo + '" alt="' + person.name + '">' : '<span class="s-init">' + person.name.charAt(0) + '</span>') +
      '</div>' +
      '<div class="s-info">' +
        '<span class="s-role">' + person.role + '</span>' +
        '<h3 class="s-name">' + person.name + '</h3>' +
        '<p class="s-bio">' + person.bio + '</p>' +
      '</div>';
    grid.appendChild(card);
  });
}

function submitSignup() {
  var parent = document.getElementById('su-parent').value.trim();
  var email = document.getElementById('su-email').value.trim();
  var child = document.getElementById('su-child').value.trim();
  var grade = document.getElementById('su-grade').value;
  var course = document.getElementById('su-course').value;
  var notes = document.getElementById('su-notes').value.trim();

  if (!parent || !email || !child || !grade || !course) {
    alert('Please fill in all required fields.');
    return;
  }

  if (!email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }

  var btn = document.querySelector('#signup-form-card .btn-blue');
  if (btn) {
    btn.textContent = 'Signing up...';
    btn.disabled = true;
  }

  fetch(SHEET_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Timestamp: new Date().toISOString(),
      'Parent Name': parent,
      Email: email,
      'Child Name': child,
      Grade: grade,
      Course: course,
      Notes: notes
    })
  }).catch(function(e) {
    console.error('Sheet save failed:', e);
  });

  emailjs.send('service_dkqr24l', 'template_tt28eul', {
    parentName: parent,
    email: email,
    childName: child,
    grade: grade,
    course: course,
    notes: notes
  }).then(function() {
    document.getElementById('signup-form-card').style.display = 'none';
    document.getElementById('signup-success').style.display = 'block';
    fireConfetti();
  }).catch(function(err) {
    console.error('EmailJS error:', err);
    document.getElementById('signup-form-card').style.display = 'none';
    document.getElementById('signup-success').style.display = 'block';
    fireConfetti();
  });
}

function resetSignup() {
  document.getElementById('signup-form-card').style.display = 'block';
  document.getElementById('signup-success').style.display = 'none';
  document.getElementById('su-parent').value = '';
  document.getElementById('su-email').value = '';
  document.getElementById('su-child').value = '';
  document.getElementById('su-grade').value = '';
  document.getElementById('su-course').value = '';
  document.getElementById('su-notes').value = '';
  var btn = document.querySelector('#signup-form-card .btn-blue');
  if (btn) {
    btn.textContent = 'Sign My Child Up!';
    btn.disabled = false;
  }
}

function teacherCodeLogin() {
  var name = document.getElementById('tl-name').value.trim();
  var code = document.getElementById('tl-code').value.trim().toUpperCase();
  var pass = document.getElementById('tl-pass').value;
  var err = document.getElementById('tl-error');
  err.style.display = 'none';

  if (!name || !code) {
    err.textContent = 'Please fill in all fields.';
    err.style.display = 'block';
    return;
  }

  var teacher = teacherCodes[code];
  if (!teacher) {
    err.textContent = 'Invalid teacher code. Please check and try again.';
    err.style.display = 'block';
    return;
  }

  if (pass !== teacher.password) {
    err.textContent = 'Incorrect password. Please try again.';
    err.style.display = 'block';
    return;
  }

  currentTeacher = { name: name, code: code, courses: teacher.courses };
  document.getElementById('tl-login').style.display = 'none';
  document.getElementById('tl-dashboard').style.display = 'block';
  document.getElementById('tl-welcome').textContent = 'Welcome, ' + name + '!';
  renderTeacherDashboard();
}

function renderTeacherDashboard() {
  var container = document.getElementById('tl-courses-list');
  container.innerHTML = '';

  currentTeacher.courses.forEach(function(courseName) {
    var details = teacherCourseDetails[courseName] || {};
    var zoomLink = teacherZoomLinks[courseName] || '#';

    var card = document.createElement('div');
    card.className = 'course-card';
    card.style.cssText = 'flex-direction:column;gap:12px;margin-bottom:20px;';

    var topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;';

    var infoDiv = document.createElement('div');
    var pill = document.createElement('span');
    pill.className = 'subj-pill sp-math';
    pill.textContent = 'Your Course';
    var nameEl = document.createElement('h3');
    nameEl.className = 'c-name';
    nameEl.textContent = courseName;
    var grade = document.createElement('p');
    grade.className = 'c-tag';
    grade.textContent = 'Grades ' + (details.grades || '');
    infoDiv.appendChild(pill);
    infoDiv.appendChild(nameEl);
    infoDiv.appendChild(grade);

    var btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    var startBtn = document.createElement('button');
    startBtn.className = 'btn-green';
    startBtn.style.cssText = 'padding:10px 20px;';
    startBtn.textContent = 'Start Class';
    startBtn.addEventListener('click', function() {
      startClass(courseName);
    });

    var zoomBtn = document.createElement('a');
    zoomBtn.href = zoomLink;
    zoomBtn.target = '_blank';
    zoomBtn.className = 'btn-blue';
    zoomBtn.textContent = 'Manual Zoom Link';

    btnDiv.appendChild(startBtn);
    btnDiv.appendChild(zoomBtn);
    topRow.appendChild(infoDiv);
    topRow.appendChild(btnDiv);
    card.appendChild(topRow);

    var metaRow = document.createElement('div');
    metaRow.className = 'c-meta';
    metaRow.style.cssText = 'flex-wrap:wrap;';
    var sched = document.createElement('span');
    sched.className = 'c-meta-item';
    sched.textContent = 'Schedule: ' + (details.schedule || '');
    var datesEl = document.createElement('span');
    datesEl.className = 'c-meta-item';
    datesEl.textContent = 'Dates: ' + (details.dates || '');
    metaRow.appendChild(sched);
    metaRow.appendChild(datesEl);
    card.appendChild(metaRow);

    var studentsDiv = document.createElement('div');
    studentsDiv.id = 'tl-students-' + courseName.replace(/\s+/g, '-');
    var loadingP = document.createElement('p');
    loadingP.style.cssText = 'font-size:0.85rem;color:var(--lighter);margin-top:8px;';
    loadingP.textContent = 'Loading enrolled students...';
    studentsDiv.appendChild(loadingP);
    card.appendChild(studentsDiv);

    container.appendChild(card);
    loadEnrolledStudents(courseName);
  });
}

function loadEnrolledStudents(courseName) {
  var sectionId = 'tl-students-' + courseName.replace(/\s+/g, '-');
  var section = document.getElementById(sectionId);
  if (!section) return;

  fetch(SHEET_API)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var students = data.filter(function(row) {
        return row.Course === courseName;
      });

      if (students.length === 0) {
        section.innerHTML = '<p style="font-size:0.85rem;color:var(--lighter);">No students enrolled yet.</p>';
        return;
      }

      var html = '<p style="font-size:0.85rem;font-weight:700;margin-top:10px;margin-bottom:6px;">Enrolled Students (' + students.length + ')</p>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;">';
      students.forEach(function(s) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--off);border-radius:8px;border:1px solid var(--border);font-size:0.85rem;">' +
          '<span><strong>' + (s['Child Name'] || 'Student') + '</strong> &middot; Grade ' + (s.Grade || '?') + '</span>' +
          '<span style="color:var(--lighter);">' + (s.Email || '') + '</span></div>';
      });
      html += '</div>';
      section.innerHTML = html;
    })
    .catch(function(err) {
      section.innerHTML = '<p style="font-size:0.85rem;color:#c0392b;">Could not load students.</p>';
      console.error(err);
    });
}

async function startClass(courseName) {
  var btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Starting...';
  btn.style.opacity = '0.6';

  try {
    var teacher = teacherCodes[currentTeacher.code];
    var response = await fetch('http://localhost:3001/api/create-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: currentTeacher.code,
        courseName: courseName,
        teacherEmail: teacher.email,
        duration: 60,
        timezone: 'America/New_York'
      })
    });

    var data = await response.json();

    if (data.success) {
      btn.textContent = 'Class Started!';
      btn.style.background = '#27ae60';

      var card = btn.closest('.course-card');
      var meta = card.querySelector('.c-meta');
      var meetingInfo = document.createElement('div');
      meetingInfo.style.cssText = 'margin-top:12px;padding:12px;background:rgba(39,174,96,0.1);border-radius:8px;border:1px solid rgba(39,174,96,0.3);';

      var p1 = document.createElement('p');
      p1.style.cssText = 'font-size:0.85rem;font-weight:700;color:#27ae60;margin-bottom:8px;';
      p1.textContent = 'Meeting Created - You are the host!';
      meetingInfo.appendChild(p1);

      var p2 = document.createElement('p');
      p2.style.cssText = 'font-size:0.8rem;color:var(--lighter);margin-bottom:8px;';
      p2.textContent = 'Meeting ID: ' + data.meetingId;
      meetingInfo.appendChild(p2);

      var joinBtn = document.createElement('a');
      joinBtn.href = data.joinUrl;
      joinBtn.target = '_blank';
      joinBtn.className = 'btn-green';
      joinBtn.style.cssText = 'display:inline-block;padding:8px 16px;font-size:0.9rem;';
      joinBtn.textContent = 'Join as Host';
      meetingInfo.appendChild(joinBtn);

      var copyBtn = document.createElement('button');
      copyBtn.className = 'btn-outline';
      copyBtn.style.cssText = 'margin-left:8px;padding:8px 16px;font-size:0.9rem;';
      copyBtn.textContent = 'Copy Link for Students';
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(data.joinUrl).then(function() {
          alert('Link copied! Share this with your students.');
        }).catch(function() {
          prompt('Copy this link:', data.joinUrl);
        });
      });
      meetingInfo.appendChild(copyBtn);

      meta.parentNode.insertBefore(meetingInfo, meta.nextSibling);
      teacherZoomLinks[courseName] = data.joinUrl;
    } else {
      throw new Error(data.error || 'Failed to create meeting');
    }
  } catch (err) {
    console.error('Start class error:', err);
    btn.textContent = 'Error - Try Again';
    btn.style.background = '#c0392b';
    setTimeout(function() {
      btn.textContent = 'Start Class';
      btn.style.background = '';
      btn.disabled = false;
      btn.style.opacity = '1';
    }, 3000);
  }
}

function teacherCodeLogout() {
  currentTeacher = null;
  document.getElementById('tl-login').style.display = 'block';
  document.getElementById('tl-dashboard').style.display = 'none';
  document.getElementById('tl-name').value = '';
  document.getElementById('tl-code').value = '';
  document.getElementById('tl-pass').value = '';
}

function joinClass() {
  var code = document.getElementById('jc-code').value.trim().toUpperCase();
  var result = document.getElementById('jc-result');

  if (!code) {
    result.innerHTML = '<p style="color:var(--coral);font-weight:700;">Please enter a class code.</p>';
    return;
  }

  var teacher = teacherCodes[code];
  if (!teacher) {
    result.innerHTML = '<p style="color:var(--coral);font-weight:700;">Invalid class code. Please check and try again.</p>';
    return;
  }

  var courseName = teacher.courses[0];
  var details = teacherCourseDetails[courseName] || {};

  result.innerHTML =
    '<div class="course-card" style="text-align:left;">' +
      '<span class="subj-pill sp-math">Your Class</span>' +
      '<h3 class="c-name">' + courseName + '</h3>' +
      '<p class="c-tag">Teacher: ' + teacher.email + '</p>' +
      '<div class="c-meta" style="margin:12px 0;">' +
        '<span class="c-meta-item">' + (details.schedule || '') + '</span>' +
        '<span class="c-meta-item">' + (details.dates || '') + '</span>' +
      '</div>' +
      '<p style="font-size:0.9rem;color:var(--soft);line-height:1.6;">Check your email for the Zoom link, or contact your teacher for the meeting details.</p>' +
    '</div>';
}

function initBlurText(root) {
  var els = (root || document).querySelectorAll('.blur-text');
  els.forEach(function(el) {
    if (el.dataset.blurInit) return;
    el.dataset.blurInit = '1';

    var raw = el.textContent;
    var words = raw.split(' ');
    el.textContent = '';
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';

    var spans = [];
    words.forEach(function(w, i) {
      var span = document.createElement('span');
      span.className = 'blur-text-word';
      span.textContent = w;
      span.style.opacity = '0';
      span.style.filter = 'blur(10px)';
      span.style.transform = 'translateY(-30px)';
      span.style.transition = 'opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease';
      span.style.transitionDelay = (i * 0.12) + 's';
      span.style.display = 'inline-block';
      el.appendChild(span);
      spans.push(span);
    });

    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          spans.forEach(function(s) {
            s.style.opacity = '1';
            s.style.filter = 'blur(0px)';
            s.style.transform = 'translateY(0)';
          });
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    obs.observe(el);
  });
}

function fireConfetti() {
  var c = document.getElementById('confettiCanvas');
  var ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  var colors = ['#2aab82', '#f5c842', '#e8604a', '#8b6bb1', '#2d7a4f', '#ff6b6b', '#4ecdc4'];
  var particles = [];

  for (var i = 0; i < 80; i++) {
    particles.push({
      x: c.width / 2 + Math.random() * 200 - 100,
      y: c.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -14 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      life: 1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    var alive = false;
    particles.forEach(function(p) {
      if (p.life <= 0) return;
      alive = true;
      p.x += p.vx;
      p.vy += 0.35;
      p.y += p.vy;
      p.rot += p.rotV;
      p.life -= 0.012;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, c.width, c.height);
  }
  draw();
}

window.addEventListener('scroll', function() {
  var h = document.documentElement;
  var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  document.getElementById('scrollProgress').style.width = pct + '%';
});

window.addEventListener('scroll', function() {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 30);
});

var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(function(el) { revealObs.observe(el); });

function startCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(function(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = +el.dataset.target;
    var duration = 1800;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  });
}

var statsSection = document.querySelector('.stats-row');
if (statsSection) {
  var sObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        startCounters();
        sObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  sObs.observe(statsSection);

  setTimeout(function() {
    var r = statsSection.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) startCounters();
  }, 1200);
}

document.querySelectorAll('.tilt-card').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var r = card.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = 'perspective(600px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) scale(1.02)';
  });
  card.addEventListener('mouseleave', function() {
    card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)';
  });
});

document.querySelectorAll('.btn-magnetic').forEach(function(btn) {
  btn.addEventListener('mousemove', function(e) {
    var r = btn.getBoundingClientRect();
    var x = e.clientX - r.left - r.width / 2;
    var y = e.clientY - r.top - r.height / 2;
    btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px) scale(1.03)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transform = '';
  });
});

document.querySelectorAll('.btn-sub, .btn-blue, .btn-white').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    var r = this.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    var size = Math.max(r.width, r.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
    this.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 600);
  });
});

document.querySelectorAll('.flinks a').forEach(function(a, i) {
  a.style.animationDelay = i * 0.05 + 's';
});

window.addEventListener('scroll', function() {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var y = window.scrollY;
  if (y < 600) {
    hero.style.backgroundPositionY = (-y * 0.3) + 'px';
    var inner = hero.querySelector('.hero-inner');
    if (inner) inner.style.transform = 'translateY(' + (-y * 0.15) + 'px)';
  }
});

var stb = document.getElementById('scrollTop');
window.addEventListener('scroll', function() {
  if (window.scrollY > 400) {
    stb.style.opacity = '1';
    stb.style.transform = 'translateY(0)';
  } else {
    stb.style.opacity = '0';
    stb.style.transform = 'translateY(20px)';
  }
});

var heroSub = document.querySelector('.hero-sub');
if (heroSub) {
  var fullText = heroSub.textContent;
  heroSub.textContent = '';
  heroSub.style.visibility = 'visible';
  var ti = 0;
  function typeChar() {
    if (ti < fullText.length) {
      heroSub.textContent += fullText[ti];
      ti++;
      setTimeout(typeChar, 18 + Math.random() * 12);
    }
  }
  setTimeout(typeChar, 600);
}

document.addEventListener('DOMContentLoaded', function() {
  renderCourses();
  renderStaff();
  initBlurText();
});
