// FoMO interactive exhibition — vanilla JavaScript
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


// Scroll progress bar
const progressBar = $('#progress-bar');
function updateProgress(){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();


// Reveal on scroll
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:0.12});
$$('.reveal').forEach(el => revealObserver.observe(el));


// Custom cursor (desktop)
const cursor = $('.cursor-dot');
if(cursor && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  window.addEventListener('mousemove', event => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  $$('.loop-node, button, a, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.transform = 'translate(-50%,-50%) scale(2.4)'; });
    el.addEventListener('mouseleave', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; });
  });
}

// Mobile menu
const menuToggle = $('#menu-toggle');
const mobileMenu = $('#mobile-menu');
function closeMenu(){
  mobileMenu.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded','false');
}
menuToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('#mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));

// Rotate the real-life examples clockwise and animate the card rearrangement.
const irlGrid = $('.irl-grid');
const irlCards = $$('.irl-item', irlGrid);
const reduceIrlMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Clockwise around the desktop card layout: featured, upper middle, upper right,
// lower right, then lower middle.
const irlClockwiseOrder = [0, 1, 2, 4, 3].map(index => irlCards[index]).filter(Boolean);

function featureIrlCard(card){
  const currentFeatured = $('.irl-wide', irlGrid);
  if(currentFeatured === card) return;

  const previousRects = new Map(irlCards.map(item => [item, item.getBoundingClientRect()]));
  $('.irl-countdown', currentFeatured)?.classList.remove('running');
  currentFeatured?.classList.remove('irl-wide');
  card.classList.add('irl-wide');
  irlGrid.prepend(card);

  if(reduceIrlMotion) return;
  requestAnimationFrame(() => {
    irlCards.forEach(item => {
      const before = previousRects.get(item);
      const after = item.getBoundingClientRect();
      if(!before || !after.width || !after.height) return;
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      const sx = before.width / after.width;
      const sy = before.height / after.height;
      if(Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
      item.getAnimations().forEach(animation => animation.cancel());
      item.animate([
        {transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, transformOrigin: 'top left'},
        {transform: 'translate(0, 0) scale(1, 1)', transformOrigin: 'top left'}
      ], {duration: 560, easing: 'cubic-bezier(.2,.75,.2,1)'});
    });
  });
}

let irlIsVisible = false;
let irlRotationTimer = null;
let irlSecondsRemaining = 5;
let irlClockwiseIndex = Math.max(0, irlClockwiseOrder.indexOf($('.irl-wide', irlGrid)));
function resetIrlCountdown(animate = false){
  const featuredTimer = $('.irl-countdown', $('.irl-wide', irlGrid));
  if(!featuredTimer) return;
  featuredTimer.querySelector('.irl-countdown-value').textContent = String(irlSecondsRemaining);
  if(animate){
    featuredTimer.classList.remove('running');
    void featuredTimer.offsetWidth;
    featuredTimer.classList.add('running');
  }
}
function startIrlRotation(){
  if(irlRotationTimer || irlClockwiseOrder.length < 2 || document.hidden || !irlIsVisible) return;
  irlSecondsRemaining = 5;
  resetIrlCountdown(true);
  irlRotationTimer = window.setInterval(() => {
    irlSecondsRemaining -= 1;
    if(irlSecondsRemaining === 0){
      irlClockwiseIndex = (irlClockwiseIndex + 1) % irlClockwiseOrder.length;
      featureIrlCard(irlClockwiseOrder[irlClockwiseIndex]);
      irlSecondsRemaining = 5;
      resetIrlCountdown(true);
      return;
    }
    resetIrlCountdown(false);
  }, 1000);
}
function stopIrlRotation(){
  window.clearInterval(irlRotationTimer);
  irlRotationTimer = null;
  irlSecondsRemaining = 5;
  resetIrlCountdown(false);
  $('.irl-countdown', $('.irl-wide', irlGrid))?.classList.remove('running');
}
if(irlGrid){
  new IntersectionObserver(([entry]) => {
    irlIsVisible = entry.isIntersecting;
    if(irlIsVisible) startIrlRotation();
    else stopIrlRotation();
  }, {threshold: 0.12}).observe(irlGrid);
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stopIrlRotation();
    else startIrlRotation();
  });
}

// Loop stage details
const loopStages = {
  trigger: {number:'01 / 04', title:'The Trigger', text:'A notification, photo, conversation, or unexpected update catches your attention. Something makes you wonder what is happening beyond your current moment.', note:'AWARENESS STARTS HERE', caption:'A NOTIFICATION CATCHES YOUR ATTENTION', image:'assets/Section2/Gambar1.png', alt:"A notification draws someone's attention to their phone"},
  comparison: {number:'02 / 04', title:'The Comparison', text:'You compare your current experience with what others seem to be enjoying. The picture you see may be incomplete, but it can still feel persuasive.', note:'THE COMPARISON MAY BE UNEVEN', caption:'OTHERS’ HIGHLIGHTS SHIFT YOUR FOCUS', image:'assets/Section2/Gambar2.png', alt:'Someone compares their day with photos of other people celebrating, traveling, and succeeding'},
  anxiety: {number:'03 / 04', title:'The Anxiety', text:'A sense of being left out, behind, or disconnected can grow. You may start to feel that you should be somewhere else or doing something different.', note:'A FEELING IS NOT A FACT', caption:'UNCERTAINTY BECOMES HARD TO IGNORE', image:'assets/Section2/Gambar3.png', alt:'Someone feels overwhelmed while looking at many social notifications on a phone'},
  checking: {number:'04 / 04', title:'The Checking', text:'You check again to feel informed, connected, or reassured. The relief may be temporary—making the next urge to check more likely.', note:'RELIEF CAN BE TEMPORARY', caption:'CHECKING OFFERS A MOMENT OF RELIEF', image:'assets/Section2/Gambar4.png', alt:'Someone repeatedly checks a phone, shown with two circular arrows around their hand'}
};
const stageKeys = Object.keys(loopStages);
let currentStage = 0;
let loopIsVisible = false;
let loopAutoTimer = null;
const loopTimerProgress = $('#loop-timer-progress');

function restartLoopTimer(){
  window.clearTimeout(loopAutoTimer);
  loopAutoTimer = null;
  loopTimerProgress.classList.remove('running');
  if(!loopIsVisible || document.hidden) return;
  void loopTimerProgress.getBoundingClientRect();
  loopTimerProgress.classList.add('running');
  loopAutoTimer = window.setTimeout(() => {
    currentStage = (currentStage + 1) % stageKeys.length;
    setLoopStage(stageKeys[currentStage]);
  }, 5000);
}

function setLoopStage(key){
  const data = loopStages[key];
  if(!data) return;
  currentStage = stageKeys.indexOf(key);
  $$('.loop-node').forEach(node => {
    const active = node.dataset.stage === key;
    node.classList.toggle('active', active);
    node.setAttribute('aria-pressed', String(active));
  });
  $('#loop-detail-number').textContent = data.number;
  $('#loop-detail-title').textContent = data.title;
  $('#loop-detail-text').textContent = data.text;
  $('#loop-detail-note').textContent = data.note;
  $('#loop-showcase-index').textContent = data.number;
  $('#loop-showcase-caption').textContent = data.caption;
  const detailImage = $('#loop-detail-image');
  detailImage.src = data.image;
  detailImage.alt = data.alt;
  restartLoopTimer();
}
$$('.loop-node').forEach(node => node.addEventListener('click', () => {
  setLoopStage(node.dataset.stage);
}));
$('#loop-next').addEventListener('click', () => {
  currentStage = (currentStage + 1) % stageKeys.length;
  setLoopStage(stageKeys[currentStage]);
});

const loopSection = $('#loop');
const loopAutoObserver = new IntersectionObserver(entries => {
  loopIsVisible = entries[0].isIntersecting;
  restartLoopTimer();
},{threshold:0.12});
loopAutoObserver.observe(loopSection);
document.addEventListener('visibilitychange', restartLoopTimer);

// Identity slider response
const identityRange = $('#identity-range');
const identityOutput = $('#identity-output');
const identitySubmit = $('#identity-submit');
const identitySubmitLabel = $('#identity-submit-label');
const identityResult = $('#identity-result');
const identityResultClose = $('#identity-result-close');
const identityResultArt = $('#identity-result-art');
const identityResultImage = $('#identity-result-image');
const identityResultKicker = $('#identity-result-kicker');
const identityResultTitle = $('#identity-result-title');
const identityResultDescription = $('#identity-result-description');
const identityArtTag = $('#identity-art-tag');
const identityArtCaption = $('#identity-art-caption');
const identityReflections = [
  {
    mode: 'identity-art-personal',
    image: 'assets/Section6/Gambar1.png',
    artLabel: 'A person planning a personal creative goal with a guitar, journal, and compass while friends appear in a framed photo',
    tag: 'MY GOALS · MY DIRECTION',
    caption: 'PERSONAL VALUES · BOUNDARIES',
    kicker: 'POSITION 1 / STRONGLY PERSONAL',
    title: 'My own priorities come first here.',
    description: 'In this situation, your personal goals, needs, or boundaries feel much more important than the effect on other people. That can help you protect what matters to you. It may still be useful to explain your choice and let people close to you know that the relationship matters.'
  },
  {
    mode: 'identity-art-personal',
    image: 'assets/Section6/Gambar2.png',
    artLabel: 'A person considering two paths toward a personal goal and a gathering with friends',
    tag: 'CHOOSING MY PATH',
    caption: 'PERSONAL VALUES · BOUNDARIES',
    kicker: 'POSITION 2 / PERSONAL PRIORITIES',
    title: 'I would mainly follow my own goals.',
    description: 'Your own plans and values are leading, while the people around you still matter. You may be comfortable making a choice that fits your direction, even if others choose differently. Consider how you can stay connected without giving up a priority that is important to you.'
  },
  {
    mode: 'identity-art-personal',
    image: 'assets/Section6/Gambar3.png',
    artLabel: 'A person planning a personal goal while noticing an invitation from friends',
    tag: 'MY PLANS · THEIR INVITATION',
    caption: 'PERSONAL GOALS · CONNECTION',
    kicker: 'POSITION 3 / SLIGHTLY PERSONAL',
    title: 'I lean a little toward my own priorities.',
    description: 'Your personal goals seem a bit more important in this imagined choice, but connection is still part of the picture. You might choose what suits you and look for a considerate way to tell others or make time for them another day.'
  },
  {
    mode: 'identity-art-balanced',
    image: 'assets/Section6/Gambar4.png',
    artLabel: 'A person considering personal goals and relationships with equal care',
    tag: 'BOTH MATTER',
    caption: 'PERSONAL PRIORITIES · RELATIONSHIPS',
    kicker: 'POSITION 4 / BOTH IN VIEW',
    title: 'Both perspectives feel equally important.',
    description: 'You are giving similar importance to your own priorities and your relationships in this situation. You might look for an option that respects both, or decide which one needs attention first today. This balance can change with the people involved and what the moment asks of you.'
  },
  {
    mode: 'identity-art-relational',
    image: 'assets/Section6/Gambar5.png',
    artLabel: 'A person choosing to meet friends while keeping a guitar and personal goals in view',
    tag: 'MAKING ROOM FOR FRIENDS',
    caption: 'CONNECTION · PERSONAL GOALS',
    kicker: 'POSITION 5 / SLIGHTLY RELATIONAL',
    title: 'I lean a little toward staying connected.',
    description: 'The relationship matters slightly more in this imagined choice, though your own plans still count. You may want to take part or consider the other person’s needs, while being honest about what you can manage and what you need for yourself.'
  },
  {
    mode: 'identity-art-relational',
    image: 'assets/Section6/Gambar6.png',
    artLabel: 'A person sharing a warm evening with friends and rescheduling guitar practice',
    tag: 'CHOOSING CONNECTION',
    caption: 'CONNECTION · SHARED CONTEXT',
    kicker: 'POSITION 6 / RELATIONSHIPS',
    title: 'I would mainly consider the people involved.',
    description: 'Staying connected and considering how your decision affects others are guiding you more strongly. That care can support close relationships. Remember that your own limits still matter, and a thoughtful conversation can help you honor both.'
  },
  {
    mode: 'identity-art-relational',
    image: 'assets/Section6/Gambar7.png',
    artLabel: 'A person prioritizing a meaningful shared moment with close friends',
    tag: 'HERE WITH OTHERS',
    caption: 'CONNECTION · SHARED CONTEXT',
    kicker: 'POSITION 7 / STRONGLY RELATIONAL',
    title: 'Staying connected comes first here.',
    description: 'Being there for others or protecting a shared bond feels much more important than your own plans in this situation. That can reflect real care and commitment. Pause to check that you are choosing freely, and that your needs and boundaries still have room in the decision.'
  }
];
let identityHasChosen = true;
identityRange.style.setProperty('--identity-progress', '50%');
identityRange.setAttribute('aria-valuetext', 'Both perspectives feel equally important');
function getIdentityReflection(value){
  const resultIndex = Math.min(identityReflections.length - 1, Math.floor(value / (100 / identityReflections.length)));
  return identityReflections[resultIndex];
}
function getIdentityScaleDescription(value){
  return getIdentityReflection(value).title;
}
function updateIdentity(){
  const value = Number(identityRange.value);
  identityHasChosen = true;
  identitySubmit.disabled = false;
  identityRange.style.setProperty('--identity-progress', `${value}%`);
  identityRange.setAttribute('aria-valuetext', getIdentityScaleDescription(value));
  identityOutput.textContent = 'POSITION SELECTED · PRESS SEE MY REFLECTION';
}
identityRange.addEventListener('input', updateIdentity);
identitySubmit.addEventListener('click', () => {
  if(!identityHasChosen) return;
  const reflection = getIdentityReflection(Number(identityRange.value));
  identityResultArt.classList.remove('identity-art-personal', 'identity-art-balanced', 'identity-art-relational');
  identityResultArt.classList.add(reflection.mode);
  identityResultArt.setAttribute('aria-label', reflection.artLabel);
  identityResultImage.src = reflection.image;
  identityResultImage.alt = reflection.artLabel;
  identityArtTag.textContent = reflection.tag;
  identityArtCaption.textContent = reflection.caption;
  identityResultKicker.textContent = reflection.kicker;
  identityResultTitle.textContent = reflection.title;
  identityResultDescription.textContent = reflection.description;
  identityResult.showModal();
  identitySubmitLabel.textContent = 'UPDATE MY REFLECTION';
});
identityResultClose.addEventListener('click', () => identityResult.close());
identityResult.addEventListener('click', event => {
  if(event.target === identityResult) identityResult.close();
});

// Highlight reel draggable split slider
const reelRange = $('#reel-range');
const reelSlider = $('#reel-slider');
const reelDivider = $('#reel-divider');
function updateReel(){
  const value = Number(reelRange.value);
  const split = `${value}%`;
  reelSlider.style.setProperty('--split', split);
  reelDivider.style.left = split;
  reelSlider.classList.toggle('reel-left-narrow', reelSlider.clientWidth * value / 100 < 180);
  reelSlider.classList.toggle('reel-right-narrow', reelSlider.clientWidth * (100 - value) / 100 < 180);
}
reelRange.addEventListener('input', updateReel);
window.addEventListener('resize', updateReel);
updateReel();

// Checklist reflection (non-scoring)
const checks = $$('.checklist-items input[type="checkbox"]');
const checkPercent = $('#check-percent');
const checkCount = $('#check-count');
const checkProgress = $('#check-progress');
const checkProgressFill = $('#check-progress-fill');
function updateChecklist(){
  const checked = checks.filter(item => item.checked).length;
  const percent = checks.length ? Math.round((checked / checks.length) * 100) : 0;
  checks.forEach(item => item.closest('label').classList.toggle('is-checked', item.checked));
  checkPercent.textContent = `${percent}%`;
  checkCount.textContent = `${checked} of ${checks.length} statements feel familiar`;
  checkProgress.setAttribute('aria-valuenow', String(percent));
  checkProgressFill.style.width = `${percent}%`;
}
checks.forEach(check => check.addEventListener('change', updateChecklist));
$('#reset-check').addEventListener('click', () => {
  checks.forEach(check => check.checked = false);
  updateChecklist();
});

// Reflection notes stay in memory only and disappear when the page is refreshed.
const reflectionForm = $('#reflection-form');
const reflectionInput = $('#reflection-input');
const reflectionCount = $('#reflection-count');
const reflectionNotesElement = $('#reflection-notes');
const reflectionNotesCount = $('#reflection-notes-count');
const reflectionEmpty = $('#reflection-empty');
const reflectionStatus = $('#reflection-status');
const reflectionNotes = [];

function updateReflectionCount() {
  reflectionCount.textContent = `${reflectionInput.value.length} / 200`;
}

function renderReflectionNotes() {
  reflectionNotesElement.replaceChildren();
  reflectionNotes.forEach((note, index) => {
    const paper = document.createElement('article');
    paper.className = 'reflection-note-paper';
    const label = document.createElement('span');
    label.className = 'reflection-note-label mono';
    label.textContent = `NOTE / ${String(index + 1).padStart(2, '0')}`;
    const message = document.createElement('p');
    message.className = 'reflection-note-text';
    message.textContent = note;
    paper.append(label, message);
    reflectionNotesElement.append(paper);
  });
  reflectionNotesCount.textContent = `${reflectionNotes.length} / 3 PAPERS`;
  reflectionEmpty.hidden = reflectionNotes.length > 0;
}

reflectionInput.addEventListener('input', updateReflectionCount);
reflectionForm.addEventListener('submit', event => {
  event.preventDefault();
  const note = reflectionInput.value.trim();
  if (!note) {
    reflectionInput.focus();
    return;
  }
  reflectionNotes.unshift(note);
  if (reflectionNotes.length > 3) reflectionNotes.pop();
  renderReflectionNotes();
  reflectionInput.value = '';
  updateReflectionCount();
  reflectionStatus.textContent = 'Note added. Only your three newest notes are shown.';
  reflectionInput.focus();
});

$('#clear-reflection').addEventListener('click', () => {
  reflectionInput.value = '';
  updateReflectionCount();
  reflectionStatus.textContent = '';
  reflectionInput.focus();
});

// Lightweight active-section navigation update
const sectionsForNav = ['definition','loop','culture','reflection'];
const navLinks = $$('.desktop-nav a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const id = entry.target.id;
      navLinks.forEach(link => link.classList.toggle('current', link.getAttribute('href') === `#${id}`));
    }
  });
},{rootMargin:'-40% 0px -50% 0px'});
sectionsForNav.forEach(id => { const target = document.getElementById(id); if(target) sectionObserver.observe(target); });
