import { Platform } from 'react-native';

class SoundService {
  private isAudioEnabled: boolean = false;
  private audioCtx: any = null;

  public setAudioEnabled(enabled: boolean) {
    this.isAudioEnabled = enabled;
  }

  public getAudioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  public async playFailBeep() {
    if (!this.isAudioEnabled) return;

    try {
      if (Platform.OS === 'web') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!this.audioCtx) {
            this.audioCtx = new AudioContextClass();
          }
          if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
          }
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 high industrial beep
          osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.16);
        }
      }
      // On mobile native, we avoid hard crash if audio assets aren't pre-loaded
    } catch {
      // Graceful fallback
    }
  }
}

export const soundService = new SoundService();
