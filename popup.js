// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * todo: use localstorage to save previous searchs
*/


var kittenGenerator = {
    pageLength:0,
    currentPage:0,
    query:'dutch',
    next:function(){ 
        this.gotoPage(parseInt(this.currentPage)+1);
    },
    prev:function(){ 
        var newPage;
        if(this.currentPage <= 2){
            newPage = 1;
        }else{ 
            newPage = parseInt(this.currentPage) - 1;
        } 
        this.gotoPage(newPage);
    },
    clean: function(){
        document.getElementById('content').innerHTML = '';
        document.getElementById('pageIndex').innerHTML = '';
        this.pageLength = 0;
        this.currentPage = 0;

    },
  /**
   * Flickr URL that will give us lots and lots of whatever we're looking for.
   *
   * See http://www.flickr.com/services/api/flickr.photos.search.html for
   * details about the construction of this URL.
   *
   * @type {string}
   * @private
   */
  searchOnFlickr_: function(){ return 'https://secure.flickr.com/services/rest/?' +
      'method=flickr.photos.search&' +
      'api_key=90485e931f687a9b9c2a66bf58a3861a&' +
      'text=' + encodeURIComponent(this.query) + '&' +
      'safe_search=1&' +
      'content_type=1&' +
      'sort=interestingness-desc&' +
      'per_page=20'
      },
 getPhotoInfo_: 'https://secure.flickr.com/services/rest/?' +
       'method=flickr.photos.getinfo&' +
        'api_key=90485e931f687a9b9c2a66bf58a3861a&' +
        'nojsoncallback=1&' +
        'format=json&'+
        'photo_id=',
        
  showPhotoPage: function(photoID) {
    var req = new XMLHttpRequest();
    var query = this.getPhotoInfo_+photoID;

    document.getElementById('photo-id').innerHTML = query;
    req.open("GET",query,true);
    var that = this;
      var showPhotoPage_ = function (e) {
        var rsp = JSON.parse(e.target.responseText);
        if(rsp.photo.urls && rsp.photo.urls.url){
            //console.debug(rsp.photo.urls.url);
            var photoURL = rsp.photo.urls.url[0]._content;
            if(photoURL){
                chrome.tabs.create({url: photoURL}); 
            
            }
        }
      };
    req.onload = showPhotoPage_;
    req.send(null);
  },
  /**
   * Sends an XHR GET request to grab photos of lots and lots of kittens. The
   * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
   *
   * @public
   */
  requestKittens: function(pageNum) {
    var req = new XMLHttpRequest();
    var query = this.searchOnFlickr_()+'&page='+pageNum;

    document.getElementById('query').innerHTML = query;
    req.open("GET",query,false);
    var that = this;

      var showPhotos_ = function (e) {
        var kittens = e.target.responseXML.querySelectorAll('photo');

        var page = document.createElement('div');
        page.className = 'page';
        page.id = 'page'+ pageNum;
        
        for (var i = 0; i < kittens.length; i++) {
          var img = document.createElement('img');
          img.src = that.constructKittenURL_(kittens[i]);
          img.setAttribute('alt', kittens[i].getAttribute('title'));
          img.setAttribute('photo-id', kittens[i].getAttribute('id'));
          page.appendChild(img);
        }

        document.getElementById('content').appendChild(page);

        var pageIndex = document.createElement('a');
       pageIndex.innerHTML = pageNum;
       pageIndex.id = 'pageIndex-'+pageNum;
       document.getElementById('pageIndex').appendChild(pageIndex); 

       that.updatePage(pageNum);
      };
    req.onload = showPhotos_;
    req.send(null);
  },

  /**
   * Given a photo, construct a URL using the method outlined at
   * http://www.flickr.com/services/api/misc.urlKittenl
   *
   * @param {DOMElement} A kitten.
   * @return {string} The kitten's URL.
   * @private
   */
  constructKittenURL_: function (photo) {
    return "http://farm" + photo.getAttribute("farm") +
        ".static.flickr.com/" + photo.getAttribute("server") +
        "/" + photo.getAttribute("id") +
        "_" + photo.getAttribute("secret") +
        "_s.jpg";
  },
  gotoPage: function(pageNum){
    if(pageNum == this.currentPage){
        return;
    }
    if(pageNum > this.pageLength){
        this.requestKittens(pageNum); 
        this.pageLength = pageNum;
    }else{
        this.updatePage(pageNum);
    }

  },
  updatePage: function(pageNum){

    if(this.currentPage){
        document.querySelector('#page'+this.currentPage).style.display = 'none'; 
        document.querySelector('#pageIndex-'+ this.currentPage).classList.remove('currentPage') ; 
    }

    this.currentPage = pageNum;
    
    document.querySelector('#page'+ this.currentPage).style.display = ''; 
    document.querySelector('#pageIndex-'+this.currentPage).classList.add('currentPage');
    
  }
};

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    kittenGenerator.gotoPage(1);


    document.querySelector('.prev').addEventListener('click',function(){
        kittenGenerator.prev();
    });
    document.querySelector('.next').addEventListener('click',function(){
        kittenGenerator.next();
    });
    document.querySelector('#content').addEventListener('click',function(e){
        if(e.target.tagName.toLowerCase() == 'img'){
            var photoID = e.target.getAttribute('photo-id');
            if(photoID){
                kittenGenerator.showPhotoPage(photoID);
            }
        }
        return false;
    });

    document.querySelector('#pageIndex').addEventListener('click',function(e){
        if(e.target.tagName.toLowerCase() == 'a'){
            var pageIndex = parseInt(e.target.id.split('-')[1]);
            kittenGenerator.gotoPage(pageIndex);
        }
        return false;
    });

    document.getElementById('google').addEventListener('click',function(){
        chrome.tabs.create({url: this.href}); 
    });

    document.getElementById('search').addEventListener('submit',function(e){
        var keyword = document.getElementById('keyword').value;
        if(keyword.length > 0){
            kittenGenerator.query = keyword;            
            kittenGenerator.clean();            
            kittenGenerator.gotoPage(1);
        }
       e.preventDefault(); 
    });
});

