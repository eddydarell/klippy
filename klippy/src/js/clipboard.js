'use strict';
const {ipcRenderer} = require('electron');

$(document).ready(function() {
    var items = [];
    var mainbox = $('.main>div');
    //Loads the items from the clipboard
    ipcRenderer.send('load-items');
    ipcRenderer.on('items-recieved', (event, arg) => {
      console.log(typeof arg);
      items = arg;

      for(var i = 0; i < items.length; i++){
      console.log(i);
      mainbox.append(function(){
        var itemBox = $('<div class="item">');
        itemBox.append(function(){
          var title = $('<h4>');
          title.html(items[i].substring(0, 15) + '...');
          return title;
        });

        itemBox.append(function(){
          var content = $('<span>');
          content.html(items[i]);
          return content;
        });

        return itemBox;
      });
    }
    });

    var itemTitles = $('.item>h4');
    var itemContents = $('.item>span');
    var btnClose = $('.btn-close');

    btnClose.click(function(e){
      e.preventDefault();
      ipcRenderer.send('close-clipboard-window');
    });

    console.log(items);

    for(var i = 0; i < items.length; i++){
      console.log(i);
      main.append(function(){
        var itemBox = $('<div class="item">');
        itemBox.append(function(){
          var title = $('<h4>');
          title.html(elem.substring(0, 15) + '...');
          return title;
        });

        itemBox.append(function(){
          var content = $('<span>');
          content.html(elem);
          return content;
        });

        return itemBox;
      });
    }

    /*items.each((index, elem) => {
      main.append(function(){
        var itemBox = $('<div class="item">');
        itemBox.append(function(){
          var title = $('<h4>');
          title.html(elem.substring(0, 15) + '...');
          return title;
        });

        itemBox.append(function(){
          var content = $('<span>');
          content.html(elem);
          return content;
        });

        return itemBox;
      });
    });*/

    itemContents.each((index, elem) => {
      $(elem).hide();
    });

    itemTitles.each((index, elem) => {
      $(elem).parent().mouseenter((e)=> {
        $(elem).siblings('span').clearQueue().toggle('slow');
      });

      $(elem).parent().mouseout((e)=> {
        e.stopPropagation();
        $(elem).siblings('span').clearQueue().toggle('slow');
      });
    });
});
