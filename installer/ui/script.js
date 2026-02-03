const invoke = window.__TAURI__.invoke;
const { listen } = window.__TAURI__.event;

// Translations
const translations = {
    es: {
        step_welcome: "Bienvenido",
        step_install: "Instalación",
        step_finish: "Finalizar",
        title_welcome: "Instalar Battly Launcher",
        desc_welcome: "Bienvenido al asistente de instalación de Battly Launcher para Hytale. Este programa instalará la última versión en tu sistema.",
        btn_install: "Instalar",
        title_installing: "Instalando...",
        status_init: "Preparando...",
        title_finished: "¡Instalación Completada!",
        desc_finished: "Battly Launcher se ha instalado correctamente en tu ordenador.",
        btn_launch: "Jugar Ahora",
        status_cleaning: "Limpiando instalación anterior...",
        status_downloading_start: "Descargando Battly Launcher...",
        status_downloading_percent: "Descargando... {0}%",
        status_extracting: "Extrayendo archivos...",
        status_installing: "Instalando...",
        status_shortcuts: "Creando accesos directos...",
    },
    en: {
        step_welcome: "Welcome",
        step_install: "Installation",
        step_finish: "Finish",
        title_welcome: "Install Battly Launcher",
        desc_welcome: "Welcome to the Battly Launcher setup wizard for Hytale. This program will install the latest version on your system.",
        btn_install: "Install",
        title_installing: "Installing...",
        status_init: "Preparing...",
        title_finished: "Installation Complete!",
        desc_finished: "Battly Launcher has been successfully installed on your computer.",
        btn_launch: "Play Now",
        status_cleaning: "Cleaning previous installation...",
        status_downloading_start: "Downloading Battly Launcher...",
        status_downloading_percent: "Downloading... {0}%",
        status_extracting: "Extracting files...",
        status_installing: "Installing...",
        status_shortcuts: "Creating shortcuts...",
    },
    de: {
        step_welcome: "Willkommen",
        step_install: "Installation",
        step_finish: "Fertigstellen",
        title_welcome: "Battly Launcher installieren",
        desc_welcome: "Willkommen beim Installationsassistenten für den Battly Launcher. Dieses Programm installiert die neueste Version auf Ihrem System.",
        btn_install: "Installieren",
        title_installing: "Installiere...",
        status_init: "Vorbereitung...",
        title_finished: "Installation abgeschlossen!",
        desc_finished: "Battly Launcher wurde erfolgreich auf Ihrem Computer installiert.",
        btn_launch: "Jetzt spielen",
        status_cleaning: "Bereinige vorherige Installation...",
        status_downloading_start: "Lade Battly Launcher herunter...",
        status_downloading_percent: "Herunterladen... {0}%",
        status_extracting: "Entpacke Dateien...",
        status_installing: "Installiere...",
        status_shortcuts: "Erstelle Verknüpfungen...",
    },
    fr: {
        step_welcome: "Bienvenue",
        step_install: "Installation",
        step_finish: "Terminer",
        title_welcome: "Installer Battly Launcher",
        desc_welcome: "Bienvenue dans l'assistant d'installation de Battly Launcher. Ce programme installera la dernière version sur votre système.",
        btn_install: "Installer",
        title_installing: "Installation...",
        status_init: "Préparation...",
        title_finished: "Installation terminée !",
        desc_finished: "Battly Launcher a été installé avec succès sur votre ordinateur.",
        btn_launch: "Jouer maintenant",
        status_cleaning: "Nettoyage de l'installation précédente...",
        status_downloading_start: "Téléchargement de Battly Launcher...",
        status_downloading_percent: "Téléchargement... {0}%",
        status_extracting: "Extraction des fichiers...",
        status_installing: "Installation...",
        status_shortcuts: "Création des raccourcis...",
    },
    pt: {
        step_welcome: "Bem-vindo",
        step_install: "Instalação",
        step_finish: "Concluir",
        title_welcome: "Instalar Battly Launcher",
        desc_welcome: "Bem-vindo ao assistente de instalação do Battly Launcher. Este programa instalará a versão mais recente no seu sistema.",
        btn_install: "Instalar",
        title_installing: "Instalando...",
        status_init: "Preparando...",
        title_finished: "Instalação Concluída!",
        desc_finished: "Battly Launcher foi instalado com sucesso no seu computador.",
        btn_launch: "Jogar Agora",
        status_cleaning: "Limpando instalação anterior...",
        status_downloading_start: "Baixando Battly Launcher...",
        status_downloading_percent: "Baixando... {0}%",
        status_extracting: "Extraindo arquivos...",
        status_installing: "Instalando...",
        status_shortcuts: "Criando atalhos...",
    },
    ru: {
        step_welcome: "Добро пожаловать",
        step_install: "Установка",
        step_finish: "Завершение",
        title_welcome: "Установить Battly Launcher",
        desc_welcome: "Добро пожаловать в мастер установки Battly Launcher. Эта программа установит последнюю версию на ваш компьютер.",
        btn_install: "Установить",
        title_installing: "Установка...",
        status_init: "Подготовка...",
        title_finished: "Установка завершена!",
        desc_finished: "Battly Launcher успешно установлен на ваш компьютер.",
        btn_launch: "Играть сейчас",
        status_cleaning: "Очистка предыдущей установки...",
        status_downloading_start: "Загрузка Battly Launcher...",
        status_downloading_percent: "Загрузка... {0}%",
        status_extracting: "Извлечение файлов...",
        status_installing: "Установка...",
        status_shortcuts: "Создание ярлыков...",
    },
    zh: {
        step_welcome: "欢迎",
        step_install: "安装",
        step_finish: "完成",
        title_welcome: "安装 Battly Launcher",
        desc_welcome: "欢迎使用 Battly Launcher 安装向导。该程序将在您的系统上安装最新版本。",
        btn_install: "安装",
        title_installing: "正在安装...",
        status_init: "准备中...",
        title_finished: "安装完成！",
        desc_finished: "Battly Launcher 已成功安装在您的电脑上。",
        btn_launch: "立即开始",
        status_cleaning: "正在清理旧版本...",
        status_downloading_start: "正在下载 Battly Launcher...",
        status_downloading_percent: "下载中... {0}%",
        status_extracting: "正在解压文件...",
        status_installing: "正在安装...",
        status_shortcuts: "正在创建快捷方式...",
    },
    ja: {
        step_welcome: "ようこそ",
        step_install: "インストール",
        step_finish: "完了",
        title_welcome: "Battly Launcher のインストール",
        desc_welcome: "Battly Launcher インストールウィザードへようこそ。このプログラムはシステムに最新バージョンをインストールします。",
        btn_install: "インストール",
        title_installing: "インストール中...",
        status_init: "準備中...",
        title_finished: "インストール完了！",
        desc_finished: "Battly Launcher が正常にインストールされました。",
        btn_launch: "今すぐプレイ",
        status_cleaning: "以前のインストールを削除中...",
        status_downloading_start: "Battly Launcher をダウンロード中...",
        status_downloading_percent: "ダウンロード中... {0}%",
        status_extracting: "ファイルを展開中...",
        status_installing: "インストール中...",
        status_shortcuts: "ショートカットを作成中...",
    }
};

let currentLang = 'en';

function detectLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    const shortLang = lang.split('-')[0]; // es-MX -> es, en-US -> en

    if (translations[shortLang]) {
        return shortLang;
    }
    return 'en';
}

function t(key, ...args) {
    const dict = translations[currentLang] || translations['en'];
    let text = dict[key] || translations['en'][key] || key;

    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });

    return text;
}

function initLocales() {
    currentLang = detectLanguage();
    console.log("Detected language:", currentLang);

    const map = {
        'step-welcome-text': 'step_welcome',
        'step-install-text': 'step_install',
        'step-finish-text': 'step_finish',
        'title-welcome': 'title_welcome',
        'desc-welcome': 'desc_welcome',
        'btn-install': 'btn_install',
        'title-installing': 'title_installing',
        'status-text': 'status_init',
        'title-finished': 'title_finished',
        'desc-finished': 'desc_finished',
        'btn-launch': 'btn_launch'
    };

    for (const [id, key] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            // Special handling for buttons/inputs if needed, but here mostly textContent works
            el.textContent = t(key);
        }
    }
}

// Elements
const stepWelcome = document.getElementById('step-welcome');
const stepInstall = document.getElementById('step-install');
const stepFinish = document.getElementById('step-finish');

const screenWelcome = document.getElementById('screen-welcome');
const screenProgress = document.getElementById('screen-progress');
const screenFinish = document.getElementById('screen-finish');

const btnInstall = document.getElementById('btn-install');
const btnLaunch = document.getElementById('btn-launch');
const btnClose = document.getElementById('close-btn');

const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');

// Init Translations immediately
initLocales();

// Navigation
function goToStep(stepIndex) {
    if (stepIndex === 2) {
        stepWelcome.classList.remove('active');
        stepInstall.classList.add('active');
        screenWelcome.classList.remove('active');
        screenProgress.classList.add('active');
    } else if (stepIndex === 3) {
        stepInstall.classList.remove('active');
        stepFinish.classList.add('active');
        screenProgress.classList.remove('active');
        screenFinish.classList.add('active');
    }
}

// Event Listeners
btnClose.addEventListener('click', () => {
    invoke('close_installer');
});

btnInstall.addEventListener('click', async () => {
    goToStep(2);

    // Listen for progress events from Rust
    await listen('install-progress', (event) => {
        const payload = event.payload;
        progressBar.style.width = `${payload.progress * 100}%`;

        // Translate dynamic status
        let statusMsg = t(payload.status_key);
        if (payload.status_data) {
            statusMsg = t(payload.status_key, payload.status_data);
        }
        statusText.innerText = statusMsg;
    });

    try {
        await invoke('start_install', { installOpera: checkOpera.checked });
        goToStep(3);
    } catch (e) {
        statusText.innerText = 'Error: ' + e;
        statusText.style.color = '#ed4245';
    }
});

btnLaunch.addEventListener('click', () => {
    invoke('launch_app');
});
