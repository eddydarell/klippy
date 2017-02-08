'use strict';
const {
    app,
    Tray,
    Menu,
    BrowserWindow,
    clipboard,
    globalShortcut,
    desktopCapturer
} = require('electron');

const path = require('path');
const STACK_MAX_SIZE = 10;
const ITEM_MAX_LENGTH = 20;
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
            click: _ => cp.writeText(item),
            accelerator: `Ctrl+Alt+${i + 1}`
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

app.on('will-quit', _ => {
    globalShortcut.unregisterAll();
});

app.on('ready', _ => {
    let stack = [];
    const tray = new Tray(path.join('assets', 'img', icon));

    if(process.platform === 'mac'){
        tray.setTitle(APP_TITLE);
    }

    tray.setContextMenu(Menu.buildFromTemplate([{
        label: '<empty>',
        enabled: false
    }]));
    tray.setToolTip('Klippy v' + app.getVersion());

    tray.on('click', _=> {
        tray.popUpContextMenu();//Displays the menu on click
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
    })
    /*var win = new BrowserWindow({
        width: 900,
        height: 500
    });*/
});
