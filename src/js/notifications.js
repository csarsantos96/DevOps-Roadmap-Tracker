// notifications.js — lembretes baseados na agenda fixa
import { Store } from './store.js';
import { getSchedule } from './schedule.js';

export function initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted' && Store.getSetting('notifications_enabled')) {
    schedule();
  }
}

export async function requestNotifications() {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    Store.setSetting('notifications_enabled', true);
    schedule();
    return true;
  }
  return false;
}

function schedule() {
  const sched = getSchedule();
  if (!sched) return;

  // 15min antes de cada evento fixo de hoje
  const now = new Date();
  const dow = now.getDay();
  for (const ev of sched.fixed_events) {
    if (ev.weekday !== undefined && ev.weekday !== dow) continue;
    if (ev.weekdays && !ev.weekdays.includes(dow)) continue;
    if (ev.until && now > new Date(ev.until + 'T23:59:59')) continue;

    const [h, m] = ev.start_time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m - 15, 0, 0);
    if (target > now) {
      const delay = target - now;
      setTimeout(() => fire(`⏰ Em 15min: ${ev.title}`, ev.description || ''), delay);
    }
  }
}

function fire(title, body) {
  if (Notification.permission !== 'granted') return;
  if (navigator.serviceWorker?.ready) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, { body, icon: './icons/icon-192.png', tag: 'roadmap' });
    });
  } else {
    new Notification(title, { body });
  }
}
