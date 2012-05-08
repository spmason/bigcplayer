(function(){
    'use strict';
    var deps = [
        ["http://code.jquery.com/jquery-1.7.1.min.js", 'jQuery'],
        ["http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min.js", "_"],
        ["http://cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.2/backbone-min.js", "Backbone"],
        ["https://raw.github.com/soundcloud/Widget-JS-API/master/soundcloud.player.api.js", 'soundcloud'],
        ["https://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", 'swfobject']
    ],
        $container, $ul,
        links = [],
        startIndex = 0,
        seenPages = [],
        depsLoaded = 0;

    function pad(n){
        if(n < 10){
            return '0' + n;
        }
        return n.toString();
    }

    function play(url){
        var id = "bigcplayer_player",
            player = document.getElementById(id) ? soundcloud.getPlayer(id) : undefined;

        if(!player){
            loadPlayer(url);
        }else{
            player.api_load(url);
        }
    }

    function loadPlayer(url){
        var $player = $container.find('.player'),
            id = "bigcplayer_player",
            flashvars = {
                enable_api: true, 
                auto_play: true,
                object_id: id,
                url: url
            },
            params = {
                allowscriptaccess: "always"
            },
            attributes = {
                id: id,
                name: id
            };

        $player.html('<div id=' + id + ' />');
        swfobject.embedSWF("http://player.soundcloud.com/player.swf", id, "100%", "81", "9.0.0","expressInstall.swf", flashvars, params, attributes);
    }

    function loadLinks(doc, collection, index){
        var i = 0;

        index = index || 1;

        if(index > 5){
            return;
        }

        doc.find('a[href*="soundcloud.com"],iframe[src*="soundcloud.com"]').each(function(){
            var $a = $(this),
                href = ($a.attr('href') || $a.attr('src')).toLowerCase(),
                $el;

            if(links.indexOf(href) > -1 || href.indexOf('/download') > -1 || href.split('/').length < 5 || !$a.text()){
                return;
            }
            
            collection.add({order: pad(index) + '' + pad(i++), href: href, text: $a.text()});
            links.push(href);
        });

        loadOtherPages(doc, collection);
    }

    function loadOtherPages(doc, collection){
        doc.find('#navigation a[href*="page/"]').each(function(){
            var href = $(this).attr('href'),
                index = /page\/([0-9]+)$/.exec(href)[1] || 1;

            if(seenPages.indexOf(href) > -1){
                return;
            }
            seenPages.push(href);

            $.get(href, function(data){
                loadLinks($(data), collection, index);
            });
        });
    }

    function go(){
        var C = Backbone.Collection.extend({
                comparator: function(m){
                    return m.get('order');
                }
            }),
            collection = new C();

        collection.bind('add', function(model, collection){
            var order = collection.indexOf(model),
                $a = $('<a/>')
                    .attr('href', model.get('href'))
                    .data('order', model.get('order'))
                    .text(model.get('text')),// + '-' + model.get('order') + '-' + order),
                $el = $('<li />').html($a),
                $lis = $ul.find('li');

            if($lis.length){
                $($lis[order - 1] || $lis[0]).after($el);
            }else{
                $ul.append($el);
            }

            $container.find('a').css({
                color: '#FFF',
                fontSize: 11
            });
        });

        $container = $('<div class="bigcplayer"><a href class=toggle>Open Player</a><ul /><div class=player /></div>');
        $ul = $container.find('ul').css({padding:0, height:200, overflowY:'auto'});

        loadLinks($('body'), collection);

        $container
            .css({
                position: 'fixed',
                top: 0, left: 0,
                width: 300,
                padding: 3,
                backgroundColor: '#000',
                border: 'solid 2px #666',
                borderWidth: '0 2px 2px 0',
                borderRadius: '0 0 2px 0'
            })
            .appendTo('body')
            .delegate('a.toggle', 'click', function(){
                $container.find('ul').slideToggle();
                return false;
            })
            .delegate('ul a', 'click', function(e){
                e.preventDefault();
                var $a = $(e.target);

                $container.find('a.toggle').text($a.text());

                $container.find('ul a').removeClass('nowPlaying');

                play($a.addClass('nowPlaying').attr('href'));
                $container.find('ul').slideUp();

                return false;
            });

        $container.find('ul').slideUp();

        soundcloud.onMediaEnd = function(player){
            $container.find('a.nowPlaying').closest('li').next().find('a').click();
        };
    }

    function checkForDep(name, i){
        if(window[name]){
            if(++depsLoaded === deps.length){
                go();
            }
            return;
        }
        if(i === 10){
            throw new Error('Could not load dependency ' + name);
        }
        setTimeout(function(){
            checkForDep(name, i++);
        }, 100);
    }

    function loadScript(dep){
        var script = document.createElement('script');
        script.src = dep[0];

        document.body.appendChild(script);

        checkForDep(dep[1], 0);
    }

    for(var i = 0; i < deps.length; i++){
        loadScript(deps[i]);
    }
})();