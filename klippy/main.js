'use strict';
const {
    app,
    Tray,
    Menu,
    BrowserWindow,
    clipboard,
    globalShortcut,
    desktopCapturer,
    ipcMain
} = require('electron');

let win;
let itemWin;
var persistentStack;
const path = require('path');
const STACK_MAX_SIZE = 20;
const ITEM_MAX_LENGTH = 30;
const WIN_WIDTH = 85;
const WIN_HEIGHT = 75;
const ITEM_WIN_WIDTH = 400;
const ITEM_WIN_HEIGHT = 600;
const APP_TITLE = 'Klippy';
const icon = 'clipboard_icon.png';
const balloonMessages = {
    greetings: 'Hello there, I am Klippy, your smarter than usual clipboard buffer.\nYou can always find me here in your Notification area if you need to recover your Copy / Cut history.',
    add: 'New Copy!',
    full: 'Clipboard full! The oldest element wil be deleted.'
};

function registerShortcut(gsc, cp, stack) {
    gsc.unregisterAll();
    for (let i; i < STACK_MAX_SIZE; i++) {
        gsc.register(`Ctrl+Alt+${i + 1}`, _ => {
            cp.writeText(stack[i]);
        });
    }
}

function formatItem(item) {
    return item && item.length > ITEM_MAX_LENGTH ? item.substring(0, ITEM_MAX_LENGTH) + '...' : item;
}

function formatMenuTemplateForStack(cp, stack) {
    return stack.map((item, i) => {
        return {
            label: `${formatItem(item)}`,
            sublabel: item,
            click: _ => cp.writeText(item),
            accelerator: `Ctrl+Alt+${i + 1}`,
            icon: 'assets/img/text_icon20X20.png'
        }
    });
}

function addToStack(item, stack) {
    return [item].concat(stack.length >= STACK_MAX_SIZE ? stack.slice(0, stack.length - 1) : stack);
}

function checkClipboardForChange(cb, onChange) {
    let cache = cb.readText();
    let latest;
    setInterval(_ => {
        latest = cb.readText();
        if (latest !== cache) {
            cache = latest;
            onChange(cache);
        }
    }, 1000);
}

function createItemWindow(){
    itemWin = new BrowserWindow({
        width: ITEM_WIN_WIDTH,
        height: ITEM_WIN_HEIGHT,
        x: win.getPosition()[0] - (ITEM_WIN_WIDTH / 2) + (WIN_WIDTH / 2),
        y: win.getPosition()[1] + 10,
        transparent: true,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        movable: false,
        skipTaskbar: true,
        alwaysOnTop: true
    });
    itemWin.loadURL(`file://${__dirname}/src/html/clipboard.html`);
    itemWin.setClosable(true);
    itemWin.setAlwaysOnTop(true);
    itemWin.setIcon(path.join('assets', 'img', icon));
    itemWin.webContents.openDevTools({
        mode: 'detach'
    });
    itemWin.on('ready-to-show', _ => {
        itemWin.show();
        itemWin.focus();
    });

    itemWin.on('close', _ => {
        itemWin = null;
    });

    itemWin.on('blur', _ => {
        //itemWin.close();
    });
}

ipcMain.on('show-items', (arg) => {
    if(!itemWin) createItemWindow();
    else itemWin.show();
});

ipcMain.on('close-clipboard-window', _ => {
    itemWin.close();
});

ipcMain.on('load-items', _ => {
  itemWin.webContents.send('items-recieved', persistentStack);
});

app.on('will-quit', _ => {
    globalShortcut.unregisterAll();
});

app.on('ready', _ => {
    let stack = [];
    const tray = new Tray(path.join('assets', 'img', icon));

    if (process.platform === 'mac') {
        tray.setTitle(APP_TITLE);
    }

    tray.setContextMenu(Menu.buildFromTemplate([{
        label: '<empty>',
        enabled: false
    }]));
    tray.setToolTip('Klippy v' + app.getVersion());

    tray.on('click', _ => {
        tray.popUpContextMenu(); //Displays the menu on click
    });

    tray.displayBalloon({
        icon: icon,
        title: APP_TITLE,
        content: balloonMessages.greetings
    });

    checkClipboardForChange(clipboard, text => {
        stack = addToStack(text, stack);
        tray.setContextMenu(Menu.buildFromTemplate(formatMenuTemplateForStack(clipboard, stack)));
        registerShortcut(globalShortcut, clipboard, stack);
        persistentStack = stack;
    })


    ipcMain.on('show-menu', _ => {
        Menu.buildFromTemplate(formatMenuTemplateForStack(clipboard, stack)).popup();
    });


    win = new BrowserWindow({
        width: WIN_WIDTH,
        height: WIN_HEIGHT,
        transparent: true,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        movable: false,
        skipTaskbar: true,
        alwaysOnTop: true
    });
    win.loadURL(`file://${__dirname}/index.html`);
    win.setClosable(false);
    win.setAlwaysOnTop(true);
    win.setIcon(path.join('assets', 'img', icon));

    var screenSize = require('electron').screen.getPrimaryDisplay().workAreaSize;
    var posX = (screenSize.width / 2) - (WIN_WIDTH / 2);
    var posY = 0;
    win.setPosition(Math.floor(posX), posY);
    setTimeout(_ => {
        win.show();
        win.webContents.openDevTools({
           mode: 'detach'
        })
    }, 20);
    // Open the DevTools.
    //TODO: take this away in production


    // Emitted when the window is closed.
    win.on('closed', () => {
        win = null
    });
});
