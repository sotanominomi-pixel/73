const MIN_N = 12;
const MAX_N = 48;
let currentN = 24; 
let isSecondsVisible = true; 
let currentLang = 'ja'; 

// タブバーの翻訳マップ
const translations = {
    'ja': {
        'nav-clock': '時計',
        'nav-stopwatch': 'ストップウォッチ',
        'nav-alarm': 'アラーム',
        'nav-settings': '設定',
    },
    'en': {
        'nav-clock': 'Clock',
        'nav-stopwatch': 'Stopwatch',
        'nav-alarm': 'Alarm',
        'nav-settings': 'Settings',
    }
};

// ストップウォッチ関連の変数
let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0; 
let stopwatchTimer = null;
let lapTimes = []; 

// アラーム関連の変数
let alarms = [
    {id: 1, h: 7, m: 0, enabled: true, label: 'Alarm'},
]; 
let nextAlarmId = 2;


// ----------------------------------------------------
// 1. N値に基づいた時計の「速さ」調整ロジック 
// ----------------------------------------------------

function calculateNTime(realTime) {
    const speedFactor = 24 / currentN; 
    const real_elapsed_seconds = realTime / 1000;
    const n_world_elapsed_seconds = real_elapsed_seconds * speedFactor;
    
    const totalSecondsIn24h = n_world_elapsed_seconds;

    const h_24 = Math.floor((totalSecondsIn24h / 3600) % 24); 
    const m_24 = Math.floor((totalSecondsIn24h % 3600) / 60);
    const s_24 = Math.floor(totalSecondsIn24h % 60);

    return { h: h_24, m: m_24, s: s_24 };
}

function updateClock() {
    const now = new Date();
    const realTimeOfDay = now.getTime() - new Date(now.toDateString()).getTime(); 
    
    const { h, m, s } = calculateNTime(realTimeOfDay); 
    
    const formattedH = String(h).padStart(2, '0');
    const formattedM = String(m).padStart(2, '0');
    const formattedS = String(s).padStart(2, '0');
    
    let timeString = `${formattedH}:${formattedM}`;
    if (isSecondsVisible) {
        timeString += `:${formattedS}`;
    }

    const clockDisplay = document.getElementById('n-clock-display');
    if (clockDisplay) {
        clockDisplay.textContent = timeString;
    }
    const nValueDisplay = document.getElementById('n-value-display');
    if (nValueDisplay) {
        nValueDisplay.textContent = `N = ${currentN} ${currentLang === 'ja' ? '時間' : 'Hours'}`;
    }

    checkAlarms(h, m, s); 
}


// ----------------------------------------------------
// 2. ストップウォッチ ロジック
// ----------------------------------------------------

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const msRemainder = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return `${h}:${m}:${s}.${msRemainder}`;
}

function updateStopwatch() {
    const now = Date.now();
    const realTimeElapsedSinceStart = now - stopwatchStartTime;
    let totalRealAccumulated = stopwatchElapsedTime + realTimeElapsedSinceStart;
    
    const speedFactor = 24 / currentN;
    let nWorldTimeForDisplay = totalRealAccumulated * speedFactor;

    document.getElementById('stopwatch-display').textContent = formatTime(nWorldTimeForDisplay);
}

function startStopwatch() {
    if (!stopwatchTimer) {
        stopwatchStartTime = Date.now();
        stopwatchTimer = setInterval(updateStopwatch, 10); 
        document.getElementById('start-stop-btn').textContent = currentLang === 'ja' ? 'ストップ' : 'Stop';
        document.getElementById('start-stop-btn').classList.remove('start');
        document.getElementById('start-stop-btn').classList.add('stop');
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'ラップ' : 'Lap';
        document.getElementById('lap-reset-btn').classList.remove('reset');
    } else {
        clearInterval(stopwatchTimer);
        stopwatchElapsedTime += Date.now() - stopwatchStartTime; 
        stopwatchTimer = null;
        document.getElementById('start-stop-btn').textContent = currentLang === 'ja' ? 'スタート' : 'Start';
        document.getElementById('start-stop-btn').classList.remove('stop');
        document.getElementById('start-stop-btn').classList.add('start');
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'リセット' : 'Reset';
        document.getElementById('lap-reset-btn').classList.add('reset');
    }
}

function lapOrResetStopwatch() {
    if (stopwatchTimer) { 
        const totalRealTime = (Date.now() - stopwatchStartTime) + stopwatchElapsedTime;
        const speedFactor = 24 / currentN;
        const nWorldLapTime = totalRealTime * speedFactor;
        
        lapTimes.push(nWorldLapTime);
        renderLaps();
    } else if (stopwatchElapsedTime > 0) { 
        stopwatchStartTime = 0;
        stopwatchElapsedTime = 0; 
        lapTimes = [];
        document.getElementById('stopwatch-display').textContent = formatTime(0);
        document.getElementById('lap-reset-btn').textContent = currentLang === 'ja' ? 'ラップ' : 'Lap';
        document.getElementById('lap-reset-btn').classList.remove('reset');
        renderLaps();
    }
}

function renderLaps() {
    const lapsList = document.getElementById('lap-list');
    if (!lapsList) return;
    
    lapsList.innerHTML = '';
    
    lapTimes.slice().reverse().forEach((lap, index) => {
        const li = document.createElement('li');
        const lapNumber = lapTimes.length - index; 
        li.textContent = `${currentLang === 'ja' ? 'ラップ' : 'Lap'} ${lapNumber}: ${formatTime(lap)}`;
        lapsList.appendChild(li); 
    });
}


// ----------------------------------------------------
// 3. アラーム ロジック 
// ----------------------------------------------------

function addAlarm() {
    const newAlarm = {
        id: nextAlarmId++,
        h: 7, 
        m: 0, 
        enabled: true,
        label: currentLang === 'ja' ? 'アラーム' : 'Alarm',
    };
    alarms.push(newAlarm);
    renderAlarmMode(); 
}

function toggleAlarm(id) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
        alarm.enabled = !alarm.enabled;
        renderAlarmsList(); 
    }
}

function deleteAlarm(id) {
    alarms = alarms.filter(a => a.id !== id);
    renderAlarmMode(); 
}

function checkAlarms(currentH_24, currentM_24, currentS_24) {
    if (currentS_24 === 0) { 
        alarms.forEach(alarm => {
            if (alarm.enabled) {
                if (alarm.h === currentH_24 && alarm.m === currentM_24) {
                    alert(`${currentLang === 'ja' ? 'アラームが鳴りました！' : 'Alarm Triggered!'}\n${String(alarm.h).padStart(2, '0')}:${String(alarm.m).padStart(2, '0')}`);
                }
            }
        });
    }
}

function handleTimeClick(id) {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;

    const itemDiv = document.getElementById(`alarm-item-${id}`); 
    if (!itemDiv) return;

    const hourSelect = Array.from({ length: 24 }, (_, i) => 
        `<option value="${i}" ${i === alarm.h ? 'selected' : ''}>${String(i).padStart(2, '0')}</option>`
    ).join('');
    
    const minuteSelect = Array.from({ length: 60 }, (_, i) => 
        `<option value="${i}" ${i === alarm.m ? 'selected' : ''}>${String(i).padStart(2, '0')}</option>`
    ).join('');

    itemDiv.innerHTML = `
        <div class="alarm-time-setting-container">
            <select id="hour-${id}" class="time-select">${hourSelect}</select>
            <span>:</span>
            <select id="minute-${id}" class="time-select">${minuteSelect}</select>
        </div>
        <div class="alarm-actions">
             <button onclick="saveAlarmTime(${id})" class="save-btn action-button">
                ${currentLang === 'ja' ? '保存' : 'Save'}
            </button>
        </div>
    `;
}

function saveAlarmTime(id) {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;

    const hourSelect = document.getElementById(`hour-${id}`);
    const minuteSelect = document.getElementById(`minute-${id}`);

    if (hourSelect && minuteSelect) {
        alarm.h = parseInt(hourSelect.value);
        alarm.m = parseInt(minuteSelect.value);
        renderAlarmsList(); 
    } else {
        console.error(`Error: Could not find hour/minute selects for alarm ID: ${id}`);
    }
}

function renderAlarmsList() {
    const list = document.getElementById('alarms-list');
    if (!list) return;

    list.innerHTML = alarms.map(alarm => `
        <li class="alarm-item" id="alarm-item-${alarm.id}">
            <div id="alarm-time-${alarm.id}" class="alarm-time" onclick="handleTimeClick(${alarm.id})">
                ${String(alarm.h).padStart(2, '0')}:${String(alarm.m).padStart(2, '0')}
            </div>
            <div class="alarm-actions">
                <button onclick="deleteAlarm(${alarm.id})" class="delete-btn action-button">
                    ${currentLang === 'ja' ? '削除' : 'Delete'}
                </button>
                <label class="toggle-switch" style="float:none; margin-left: 10px;">
                    <input type="checkbox" ${alarm.enabled ? 'checked' : ''} onchange="toggleAlarm(${alarm.id})">
                    <span class="slider"></span>
                </label>
            </div>
        </li>
    `).join('');
}


// ----------------------------------------------------
// 4. モードのレンダリング関数 
// ----------------------------------------------------

function renderClockMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? '時計' : 'Clock'}</div>
        <div id="n-clock-display" class="clock-display">--:--</div>
        
        <div class="control-panel">
            <label for="n-slider" style="font-weight: 700;">1日の時間 (N)</label>
            <input type="range" id="n-slider" min="${MIN_N}" max="${MAX_N}" value="${currentN}">
            <div id="n-value-display" style="text-align: center; font-weight: 700;">N = ${currentN} ${currentLang === 'ja' ? '時間' : 'Hours'}</div>
        </div>
    `;
    setupNControl(); 
    updateClock();
}

function renderStopwatchMode() {
    const totalRealTime = stopwatchElapsedTime + (stopwatchTimer ? Date.now() - stopwatchStartTime : 0);
    const speedFactor = 24 / currentN;
    const displayTime = formatTime(totalRealTime * speedFactor);
    
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? 'ストップウォッチ' : 'Stopwatch'}</div>
        <div id="stopwatch-display" class="clock-display">${displayTime}</div>
        
        <div class="stopwatch-controls">
            <button id="lap-reset-btn" class="control-button rounded-square-btn gray-btn ${stopwatchTimer ? '' : (stopwatchElapsedTime > 0 ? 'reset' : '')}">
                ${stopwatchTimer ? (currentLang === 'ja' ? 'ラップ' : 'Lap') : (stopwatchElapsedTime > 0 ? (currentLang === 'ja' ? 'リセット' : 'Reset') : (currentLang === 'ja' ? 'ラップ' : 'Lap'))}
            </button>
            <button id="start-stop-btn" class="control-button rounded-square-btn ${stopwatchTimer ? 'stop' : (stopwatchElapsedTime > 0 ? 'start' : 'start')}">
                ${stopwatchTimer ? (currentLang === 'ja' ? 'ストップ' : 'Stop') : (currentLang === 'ja' ? 'スタート' : 'Start')}
            </button>
        </div>
        
        <ul id="lap-list" class="lap-list">
            </ul>
    `;
    
    document.getElementById('start-stop-btn').addEventListener('click', startStopwatch);
    document.getElementById('lap-reset-btn').addEventListener('click', lapOrResetStopwatch);
    
    renderLaps();
}

function renderAlarmMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? 'アラーム' : 'Alarm'}</div>
        
        <div style="text-align:center; padding: 10px 0;">
            <button id="add-alarm-btn" onclick="addAlarm()" class="add-button action-button">
                ${currentLang === 'ja' ? '＋ アラームを追加' : '＋ Add Alarm'}
            </button>
        </div>
        
        <ul id="alarms-list" class="alarms-list">
            </ul>
    `;
    renderAlarmsList();
}

function renderSettingsMode() {
    document.getElementById('content-area').innerHTML = `
        <div class="mode-title">${currentLang === 'ja' ? '設定' : 'Settings'}</div>
        <ul class="settings-list">
            <li>
                <span>${currentLang === 'ja' ? '秒数表示' : 'Show Seconds'}</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="seconds-toggle">
                    <span class="slider"></span>
                </label>
            </li>
            <li>
                <span>${currentLang === 'ja' ? '言語表示' : 'Language'}</span>
                <div class="segmented-control" id="language-control">
                    <button data-lang="ja" class="segment-button ${currentLang === 'ja' ? 'active' : ''}">${currentLang === 'ja' ? '日本語' : 'Japanese'}</button>
                    <button data-lang="en" class="segment-button ${currentLang === 'en' ? 'active' : ''}">${currentLang === 'ja' ? '英語' : 'English'}</button>
                </div>
            </li>
        </ul>
    `;
    setupSettings(); 
}


// ----------------------------------------------------
// 5. コントロール/イベントハンドラの設定
// ----------------------------------------------------

function setupNControl() {
    const slider = document.getElementById('n-slider');
    if (slider) {
        slider.min = MIN_N;
        slider.max = MAX_N;
        slider.value = currentN;

        slider.oninput = (e) => {
            currentN = parseInt(e.target.value);
            updateClock();
        };
    }
}

function setupSettings() {
    const secondsToggle = document.getElementById('seconds-toggle');
    if (secondsToggle) {
        secondsToggle.checked = isSecondsVisible;
        secondsToggle.onchange = (e) => {
            isSecondsVisible = e.target.checked;
            updateClock(); 
        };
    }
    
    const langControl = document.getElementById('language-control');
    if (langControl) {
        langControl.querySelectorAll('.segment-button').forEach(button => {
            button.addEventListener('click', () => {
                langControl.querySelectorAll('.segment-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                currentLang = button.dataset.lang;
                
                renderCurrentMode(); 
                updateClock();
                updateTabBarText(); 
            });
        });
    }
}

function renderCurrentMode() {
    const activeTab = document.querySelector('.tab-item.active');
    if (!activeTab) return;

    switch (activeTab.id) {
        case 'nav-clock':
            renderClockMode();
            break;
        case 'nav-stopwatch':
            renderStopwatchMode();
            break;
        case 'nav-alarm':
            renderAlarmMode();
            break;
        case 'nav-settings':
            renderSettingsMode();
            break;
    }
}

// タブバーのテキストを更新する関数
function updateTabBarText() {
    document.querySelectorAll('.tab-item').forEach(button => {
        const key = button.id;
        const text = translations[currentLang][key];
        const label = button.querySelector('.label');
        if (label) {
            label.textContent = text;
        }
    });
}

function setupNavigation() {
    document.querySelectorAll('.tab-item').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            renderCurrentMode();
        });
    });
}


// ----------------------------------------------------
// 6. アプリの初期化
// ----------------------------------------------------

// PWA対応: Service Workerの登録
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

function initApp() {
    // PWA対応のため、Service Workerを最初に登録
    registerServiceWorker(); 
    
    setInterval(updateClock, 100); 
    setupNavigation();
    updateTabBarText(); 
    renderClockMode(); 
}

document.addEventListener('DOMContentLoaded', initApp);
