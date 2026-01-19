const pitchText = `Did you know you can read at over 400 words per minute?

Me neither. Until I saw this viral tweet.

It's called RSVP. Words come to you one at a time, so your eyes stay still. The red letter keeps your focus locked in place.

That's it. That's the whole trick.

So I made QuickRead. One hotkey, it grabs the article from your browser, and you read it. Full screen. No distractions.

QuickRead is free, open source, and runs natively on your Mac.

I build things like this sometimes. You can find me on X.

Enjoy.`;

class RSVPReader {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.wpm = 400;
    this.isPlaying = false;
    this.timer = null;
    this.state = 'ready'; // ready, reading, email, custom, results, success
    this.isCustomText = false;
    this.startTime = null;
    
    this.initElements();
    this.initEventListeners();
    this.parseText(pitchText);
  }

  initElements() {
    this.readyState = document.getElementById('ready-state');
    this.readingState = document.getElementById('reading-state');
    this.emailState = document.getElementById('email-state');
    this.customState = document.getElementById('custom-state');
    this.resultsState = document.getElementById('results-state');
    this.successState = document.getElementById('success-state');
    
    this.playBtn = document.getElementById('play-btn');
    this.wordDisplay = document.getElementById('word-display');
    this.progressBar = document.getElementById('progress-bar');
    this.wpmDisplay = document.getElementById('wpm-display');
    this.progressText = document.getElementById('progress-text');
    this.keyboardHints = document.getElementById('keyboard-hints');
    
    this.emailForm = document.getElementById('email-form');
    this.emailInput = document.getElementById('email-input');
    this.submitBtn = this.emailForm.querySelector('.submit-btn');
    this.submitText = document.getElementById('submit-text');
    this.sentEmail = document.getElementById('sent-email');
    
    this.tryOwnTextBtn = document.getElementById('try-own-text');
    this.customForm = document.getElementById('custom-form');
    this.customInput = document.getElementById('custom-input');
    this.backFromCustomBtn = document.getElementById('back-from-custom');
    this.shareBeforeReadBtn = document.getElementById('share-before-read');
    
    this.resultsWpm = document.getElementById('results-wpm');
    this.resultsWords = document.getElementById('results-words');
    this.resultsTime = document.getElementById('results-time');
    this.copyShareLinkBtn = document.getElementById('copy-share-link');
    
    this.resultsEmailForm = document.getElementById('results-email-form');
    this.resultsEmailInput = document.getElementById('results-email-input');
    this.resultsSubmitText = document.getElementById('results-submit-text');
  }

  initEventListeners() {
    this.playBtn.addEventListener('click', () => this.start());
    
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    this.emailForm.addEventListener('submit', (e) => this.handleSubmit(e));
    
    this.tryOwnTextBtn.addEventListener('click', () => this.setState('custom'));
    this.backFromCustomBtn.addEventListener('click', () => this.setState('email'));
    this.customForm.addEventListener('submit', (e) => this.handleCustomSubmit(e));
    this.copyShareLinkBtn.addEventListener('click', () => this.copyShareLink());
    this.shareBeforeReadBtn.addEventListener('click', () => this.shareBeforeRead());
    this.resultsEmailForm.addEventListener('submit', (e) => this.handleResultsSubmit(e));
  }

  parseText(text) {
    this.words = text
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  calculateORP(word) {
    const len = word.length;
    if (len <= 1) return 0;
    if (len <= 5) return Math.floor(len / 2);
    if (len <= 9) return Math.floor(len / 2) - 1;
    return Math.floor(len / 2) - 2;
  }

  renderWord(word) {
    const orpIndex = this.calculateORP(word);
    const before = word.slice(0, orpIndex);
    const orp = word[orpIndex] || '';
    const after = word.slice(orpIndex + 1);
    
    this.wordDisplay.innerHTML = `<span class="before">${before}</span><span class="orp">${orp}</span><span class="after">${after}</span>`;
  }

  updateProgress() {
    const progress = ((this.currentIndex + 1) / this.words.length) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `${Math.round(progress)}%`;
  }

  getDelay() {
    const baseDelay = 60000 / this.wpm;
    const word = this.words[this.currentIndex] || '';
    
    // Add pause for punctuation
    if (/[.!?]$/.test(word)) return baseDelay * 2.5;
    if (/[,;:]$/.test(word)) return baseDelay * 1.5;
    
    return baseDelay;
  }

  advance() {
    if (!this.isPlaying) return;
    
    if (this.currentIndex >= this.words.length) {
      this.finish();
      return;
    }
    
    const word = this.words[this.currentIndex];
    this.renderWord(word);
    this.updateProgress();
    
    this.currentIndex++;
    
    this.timer = setTimeout(() => this.advance(), this.getDelay());
  }

  start() {
    this.setState('reading');
    this.currentIndex = 0;
    this.isPlaying = false;
    this.keyboardHints.classList.remove('hidden');
    this.keyboardHints.classList.add('visible');
    this.startCountdown();
  }

  startCountdown() {
    let count = 3;
    this.renderWord(String(count));
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        this.renderWord(String(count));
      } else {
        clearInterval(countdownInterval);
        this.isPlaying = true;
        this.startTime = Date.now();
        this.advance();
      }
    }, 600);
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resume() {
    if (this.state !== 'reading') return;
    this.isPlaying = true;
    this.advance();
  }

  togglePlayPause() {
    if (this.state === 'ready') {
      this.start();
    } else if (this.state === 'reading') {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
    }
  }

  adjustSpeed(delta) {
    this.wpm = Math.max(200, Math.min(800, this.wpm + delta));
    this.wpmDisplay.textContent = `${this.wpm} WPM`;
  }

  finish() {
    this.pause();
    this.keyboardHints.classList.remove('visible');
    this.keyboardHints.classList.add('hidden');
    
    if (this.isCustomText) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const wordCount = this.words.length;
      const actualWpm = Math.round((wordCount / elapsed) * 60);
      
      this.resultsWpm.textContent = `${actualWpm} WPM`;
      this.resultsWords.textContent = wordCount;
      this.resultsTime.textContent = Math.round(elapsed);
      
      this.setState('results');
      this.isCustomText = false;
    } else {
      this.setState('email');
      setTimeout(() => this.emailInput.focus(), 300);
    }
  }

  reset() {
    this.pause();
    this.currentIndex = 0;
    this.keyboardHints.classList.remove('visible');
    this.keyboardHints.classList.add('hidden');
    this.isCustomText = false;
    this.parseText(pitchText);
    this.setState('email');
  }

  setState(state) {
    this.state = state;
    
    this.readyState.classList.add('hidden');
    this.readingState.classList.add('hidden');
    this.emailState.classList.add('hidden');
    this.customState.classList.add('hidden');
    this.resultsState.classList.add('hidden');
    this.successState.classList.add('hidden');
    
    switch (state) {
      case 'ready':
        this.readyState.classList.remove('hidden');
        break;
      case 'reading':
        this.readingState.classList.remove('hidden');
        break;
      case 'email':
        this.emailState.classList.remove('hidden');
        break;
      case 'custom':
        this.customState.classList.remove('hidden');
        setTimeout(() => this.customInput.focus(), 100);
        break;
      case 'results':
        this.resultsState.classList.remove('hidden');
        break;
      case 'success':
        this.successState.classList.remove('hidden');
        break;
    }
  }

  handleKeydown(e) {
    // Don't handle keys when typing in input
    if (document.activeElement === this.emailInput || document.activeElement === this.customInput) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.adjustSpeed(50);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.adjustSpeed(-50);
        break;
      case 'Escape':
        e.preventDefault();
        this.reset();
        break;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const email = this.emailInput.value.trim();
    if (!email) return;
    
    this.submitBtn.disabled = true;
    this.submitText.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) throw new Error('Failed to subscribe');
      
      this.sentEmail.textContent = email;
      this.setState('success');
    } catch (error) {
      console.error('Subscription error:', error);
      this.submitText.textContent = 'Error - Try again';
      this.submitBtn.disabled = false;
      
      setTimeout(() => {
        this.submitText.textContent = 'download';
      }, 2000);
    }
  }

  async handleResultsSubmit(e) {
    e.preventDefault();
    
    const email = this.resultsEmailInput.value.trim();
    if (!email) return;
    
    const submitBtn = this.resultsEmailForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    this.resultsSubmitText.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) throw new Error('Failed to subscribe');
      
      this.sentEmail.textContent = email;
      this.setState('success');
    } catch (error) {
      console.error('Subscription error:', error);
      this.resultsSubmitText.textContent = 'Error - Try again';
      submitBtn.disabled = false;
      
      setTimeout(() => {
        this.resultsSubmitText.textContent = 'download';
      }, 2000);
    }
  }

  handleCustomSubmit(e) {
    e.preventDefault();
    
    const text = this.customInput.value.trim();
    if (!text) return;
    
    this.customTextContent = text;
    this.parseText(text);
    this.isCustomText = true;
    this.start();
  }

  loadSharedText(text) {
    this.sharedText = text;
    this.parseText(text);
    this.isCustomText = true;
    // Stay on ready state - user presses play to start
  }

  getShareUrl() {
    if (!this.customTextContent) return null;
    const compressed = LZString.compressToEncodedURIComponent(this.customTextContent);
    return `${window.location.origin}${window.location.pathname}#text=${compressed}`;
  }

  copyShareLink() {
    const url = this.getShareUrl();
    if (!url) return;
    
    navigator.clipboard.writeText(url).then(() => {
      this.copyShareLinkBtn.textContent = 'Copied!';
      setTimeout(() => {
        this.copyShareLinkBtn.textContent = 'Copy share link';
      }, 2000);
    });
  }

  shareBeforeRead() {
    const text = this.customInput.value.trim();
    if (!text) return;
    
    this.customTextContent = text;
    const url = this.getShareUrl();
    
    navigator.clipboard.writeText(url).then(() => {
      this.shareBeforeReadBtn.textContent = 'Copied!';
      setTimeout(() => {
        this.shareBeforeReadBtn.textContent = 'Share';
      }, 2000);
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.overlay');
  const bgImage = new Image();
  bgImage.src = 'bg.jpg';
  
  bgImage.onload = () => {
    setTimeout(() => {
      overlay.classList.add('visible');
    }, 1000);
  };
  
  // Fallback if image fails to load
  bgImage.onerror = () => {
    overlay.classList.add('visible');
  };
  
  const reader = new RSVPReader();
  
  // Check for shared text in URL
  const hash = window.location.hash;
  if (hash.startsWith('#text=')) {
    try {
      const compressed = hash.slice(6);
      const text = LZString.decompressFromEncodedURIComponent(compressed);
      if (text && text.length > 0) {
        reader.loadSharedText(text);
      }
    } catch (e) {
      console.error('Failed to decompress shared text:', e);
    }
  }
});
