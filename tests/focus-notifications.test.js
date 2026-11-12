const test=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');const {createFocusNotificationScheduler}=require('../electron/focus-notifications');
function harness(){let now=Date.parse('2026-11-04T12:00:00Z'),id=0;const timers=new Map(),notifications=[],powerMonitor=new EventEmitter();class N extends EventEmitter{constructor(o){super();this.options=o;}show(){notifications.push(this.options);}close() { this.emit('close'); }
    static isSupported(){return true;}}
const scheduler=createFocusNotificationScheduler({Notification:N,powerMonitor,now:()=>now,setTimer:(fn,ms)=>{const k=++id;timers.set(k,{at:now+ms,fn});return k;},clearTimer:k=>timers.delete(k)});
function advance(ms){now+=ms;let count=0;while(true){const item=[...timers.entries()].filter(([,t])=>t.at<=now).sort((a,b)=>a[1].at-b[1].at)[0];if(!item)break;timers.delete(item[0]);item[1].fn();if(++count>20)throw Error('timer loop');}}
return{scheduler,notifications,advance,sleep(ms){now+=ms;},resume(){powerMonitor.emit('resume');},dispose(){scheduler.dispose();}};}
test('notifica una sola vez y en silencio al terminar Focus',()=>{const h=harness(),start=Date.parse('2026-11-04T12:00:00Z');h.scheduler.schedule({endsAt:new Date(start+30000).toISOString(),taskTitle:'Estudiar'});h.advance(29999);assert.equal(h.notifications.length,0);h.advance(1);assert.equal(h.notifications.length,1);assert.equal(h.notifications[0].title,'Focus terminado');assert.equal(h.notifications[0].silent,true);h.advance(50000);assert.equal(h.notifications.length,1);h.dispose();});
test('el descanso genera únicamente una notificación silenciosa',()=>{const h=harness(),start=Date.parse('2026-11-04T12:00:00Z');h.scheduler.schedule({endsAt:new Date(start+5000).toISOString(),isBreak:true});h.advance(5000);assert.equal(h.notifications.length,1);assert.equal(h.notifications[0].title,'Descanso terminado');assert.equal(h.notifications[0].silent,true);h.dispose();});
test('al despertar de suspensión envía un solo aviso vencido',()=>{const h=harness(),start=Date.parse('2026-11-04T12:00:00Z');h.scheduler.schedule({endsAt:new Date(start+10000).toISOString()});h.sleep(30000);h.resume();h.resume();assert.equal(h.notifications.length,1);h.dispose();});
test('cancelar o desactivar notificaciones impide avisos',()=>{const h=harness(),start=Date.parse('2026-11-04T12:00:00Z');h.scheduler.schedule({endsAt:new Date(start+5000).toISOString()});h.scheduler.cancel();h.advance(10000);assert.equal(h.notifications.length,0);h.scheduler.schedule({endsAt:new Date(start+5000).toISOString(),notificationsEnabled:false});h.advance(10000);assert.equal(h.notifications.length,0);h.dispose();});

test('Focus retains native toasts until close and closes them on disposal', () => {
  const notifications = [];
  class N extends EventEmitter {
    constructor(options) { super(); this.options = options; }
    show() { notifications.push(this); }
    close() { this.closed = true; this.emit('close'); }
  }
  const scheduler = createFocusNotificationScheduler({ Notification: N, now: () => 1000 });
  scheduler.schedule({ endsAt: new Date(1000).toISOString() });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].listenerCount('close'), 1);
  scheduler.dispose();
  assert.equal(notifications[0].closed, true);
  assert.equal(notifications[0].listenerCount('close'), 0);
});

test('clicking a Focus notification reopens the app and uses its icon', () => {
  let toast, opened = 0;
  class N extends EventEmitter { constructor(options) { super(); this.options = options; toast = this; } show() {} close() {} }
  const scheduler = createFocusNotificationScheduler({ Notification: N, now: () => 1000, iconPath: 'task-reminder.png', onOpen: () => { opened++; } });
  scheduler.schedule({ endsAt: new Date(1000).toISOString() });
  assert.equal(toast.options.icon, 'task-reminder.png');
  toast.emit('click');
  assert.equal(opened, 1);
  scheduler.dispose();
});
