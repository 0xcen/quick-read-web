const pitchText = `Did you know you can read at over 400 words per minute?

Me neither. Until I saw this viral tweet.

It's called RSVP. Words come to you one at a time, so your eyes stay still. The red letter keeps your focus locked in place.

That's it. That's the whole trick.

So I made QuickRead. One hotkey, it grabs the article from your browser, and you read it. Full screen. No distractions.

Fully open source. No subscriptions. Entirely local.

Enjoy.`;

class RSVPReader {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.wpm = 400;
    this.isPlaying = false;
    this.timer = null;
    this.state = 'ready'; // ready, reading, email, success
    
    this.initElements();
    this.initEventListeners();
    this.parseText(pitchText);
  }

  initElements() {
    this.readyState = document.getElementById('ready-state');
    this.readingState = document.getElementById('reading-state');
    this.emailState = document.getElementById('email-state');
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
  }

  initEventListeners() {
    this.playBtn.addEventListener('click', () => this.start());
    
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    this.emailForm.addEventListener('submit', (e) => this.handleSubmit(e));
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
    this.isPlaying = true;
    this.keyboardHints.classList.remove('hidden');
    this.keyboardHints.classList.add('visible');
    this.advance();
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
    this.setState('email');
    this.keyboardHints.classList.remove('visible');
    this.keyboardHints.classList.add('hidden');
    setTimeout(() => this.emailInput.focus(), 300);
  }

  reset() {
    this.pause();
    this.currentIndex = 0;
    this.setState('ready');
    this.keyboardHints.classList.remove('visible');
    this.keyboardHints.classList.add('hidden');
  }

  setState(state) {
    this.state = state;
    
    this.readyState.classList.add('hidden');
    this.readingState.classList.add('hidden');
    this.emailState.classList.add('hidden');
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
      case 'success':
        this.successState.classList.remove('hidden');
        break;
    }
  }

  handleKeydown(e) {
    // Don't handle keys when typing in input
    if (document.activeElement === this.emailInput) {
      if (e.key === 'Escape') {
        this.emailInput.blur();
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
        this.submitText.textContent = 'Send Download Link';
      }, 2000);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new RSVPReader();
});
