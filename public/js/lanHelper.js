/**
 * Moroccan Ronda - LAN & QR Code Connection Helper
 * Fetches local Wi-Fi / LAN IP addresses and generates instant QR codes for mobile access
 */

class LANHelper {
  constructor() {
    this.networkInfo = null;
  }

  async fetchNetworkInfo(roomCode = '') {
    try {
      const url = roomCode ? `/api/network-info?room=${roomCode}` : '/api/network-info';
      const res = await fetch(url);
      if (res.ok) {
        this.networkInfo = await res.json();
        this.updateUI();
      }
    } catch (e) {
      console.warn('Could not fetch network info', e);
    }
  }

  updateUI() {
    if (!this.networkInfo) return;

    // Update QR image
    const qrImg = document.getElementById('lan-qr-image');
    if (qrImg && this.networkInfo.qrDataUrl) {
      qrImg.src = this.networkInfo.qrDataUrl;
    }

    // Update IP text badge
    const ipBadge = document.getElementById('lan-url-display');
    if (ipBadge && this.networkInfo.primaryUrl) {
      ipBadge.textContent = this.networkInfo.primaryUrl;
    }

    // Update lobby quick connection banner
    const lobbyLanDisplay = document.getElementById('lobby-lan-ip');
    if (lobbyLanDisplay && this.networkInfo.primaryUrl) {
      lobbyLanDisplay.textContent = this.networkInfo.primaryUrl;
    }
  }

  async copyJoinUrl() {
    if (!this.networkInfo || !this.networkInfo.primaryUrl) return;
    try {
      await navigator.clipboard.writeText(this.networkInfo.primaryUrl);
      this.showToast('✅ تم نسخ الرابط! صيفطو لأصحابك دابا');
    } catch (e) {
      // Fallback
      prompt('انسخ هذا الرابط لمشاركته مع أصدقائك:', this.networkInfo.primaryUrl);
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

window.lanHelper = new LANHelper();
