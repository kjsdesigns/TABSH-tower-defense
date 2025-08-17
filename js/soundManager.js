/**
 * soundManager.js
 *
 * Manages music and SFX toggles + volumes from localStorage.
 *
 * Example usage:
 *   soundManager.init();
 *   soundManager.playMusic("assets/sounds/level1_theme.mp3");
 *   soundManager.playSfx("assets/sounds/arrow_shot.wav");
 *
 *   soundManager.setMusicEnabled(false); // or user toggles UI
 *   soundManager.setMusicVolume(0.5);
 *   soundManager.stopMusic(); // forcibly pause + reset music
 */

export const soundManager = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 1.0,  // 0..1
  sfxVolume: 1.0,    // 0..1
  musicAudio: null,

  init() {
    // Load from localStorage
    const me = localStorage.getItem("musicEnabled");
    const se = localStorage.getItem("sfxEnabled");
    const mv = localStorage.getItem("musicVolume");
    const sv = localStorage.getItem("sfxVolume");

    if (me !== null) this.musicEnabled = (me === "true");
    if (se !== null) this.sfxEnabled   = (se === "true");
    if (mv !== null) this.musicVolume  = parseFloat(mv);
    if (sv !== null) this.sfxVolume    = parseFloat(sv);
  },

  saveSettings() {
    localStorage.setItem("musicEnabled", String(this.musicEnabled));
    localStorage.setItem("sfxEnabled",   String(this.sfxEnabled));
    localStorage.setItem("musicVolume",  String(this.musicVolume));
    localStorage.setItem("sfxVolume",    String(this.sfxVolume));
  },

  setMusicEnabled(on) {
    this.musicEnabled = on;
    this.saveSettings();
    if (!on && this.musicAudio) {
      this.musicAudio.pause();
    } else if (on && this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
      // Attempt to play (may fail if user hasn't interacted with the page yet)
      this.musicAudio.play().catch(err => {
        console.warn("Music play error:", err);
      });
    }
  },

  setSfxEnabled(on) {
    this.sfxEnabled = on;
    this.saveSettings();
  },

  setMusicVolume(vol) {
    this.musicVolume = vol;
    this.saveSettings();
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
  },

  setSfxVolume(vol) {
    this.sfxVolume = vol;
    this.saveSettings();
  },

  playMusic(file) {
    // If there's an old track playing, stop it
    if (this.musicAudio && !this.musicAudio.paused) {
      this.musicAudio.pause();
    }
    this.musicAudio = new Audio(file);
    this.musicAudio.loop = true;
    if (this.musicEnabled) {
      this.musicAudio.volume = this.musicVolume;
    } else {
      this.musicAudio.volume = 0;
    }

    // Some browsers require user interaction for music to play
    this.musicAudio.play().catch(err => {
      console.warn("Music play error:", err);
    });
  },

  stopMusic() {
    // Forcibly pause, and reset the audio to the start
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      // optionally set this.musicAudio = null if you want
    }
  },

  playSfx(file) {
    if (!this.sfxEnabled) return;
    const audio = new Audio(file);
    audio.volume = this.sfxVolume;
    audio.play().catch(err => {
      console.warn("SFX play error:", err);
    });
  }
};
