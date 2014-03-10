(function( $, undefined ) {

/*
	$('.galaxy-map').galaxymap({
        galaxy: <?php Lib::jsVar($galaxy); ?>,
        size: {
            horiz: <?php Lib::jsVar($gp->size_horiz); ?>,
            vert: <?php Lib::jsVar($gp->size_vert); ?>,
            rule: <?php Lib::jsVar(GALAXY_MAP_RULE_SIZE); ?>,
            chunk: <?php Lib::jsVar(GALAXY_MAP_CHUNK_SIZE); ?>
        },
        ruleWidth: 40,
        viewEdge: 1,
        horizRuleImage: '/img/rule-horiz.png',
        vertRuleImage: '/img/rule-vert.png',
        backgroundImage: '/img/galaxy-bg/2.jpg',
        offs: [0, 0],
        loadChunkUrl: <?php Lib::jsVar(Html::normalizeUrl(array('galaxy/mapChunk')))?>
    });
*/

$.widget("game.galaxymap", {
	options: {
        loadChunkUrl: '',
		galaxy: 1,
        size: {
            horiz: [1, 19], // valid x coords
            vert: [1, 19], // valid y coords
            chunk: 10, // map chunk size
            rule: 30
        },
        ruleWidth: 30,
        ruleHeight: 30,
        viewEdge: 1,
        horizRuleImage: '',
        vertRuleImage: '',
        backgroundImage: '',
        backgroundFadeColor:  'black',
        backgroundFadeOpacity: 0.5,
        cornerClass: 'galaxy-map-corner',
        horizRuleClass: 'galaxy-map-horiz-rule',
        vertRuleClass: 'galaxy-map-vert-rule',
        contentClass: 'galaxy-map-content',
        ruleNumberClass: 'galaxy-map-rule-number',
        offs: 'center', // [0, 0] // center
        xy: undefined
	},

	_create: function() {
        console.log('galaxyMap._create', this);
		var self = this, options = this.options;
        /*
        container = $('<div />').appendTo(this.element).css({
            position: 'absolute',
            overflow: 'hidden',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%'
        }).append($('<table>'
            + '<tr><td class="'+options.cornerClass+'"></td><td class="'+options.horizRuleClass+'"></td></tr>'
            + '<tr><td class="'+options.vertRuleClass+'"></td><td class="'+options.contentClass+'"></td></tr>'
            + '</table>').css({
            'border-collapse': 'collapse',
            'border-spacing': 0,
            padding: 0,
            margin: 0
        }));
        */
        var container = $('<table>'
            + '<tr><td class="'+options.cornerClass+'"></td><td class="'+options.horizRuleClass+'"></td></tr>'
            + '<tr><td class="'+options.vertRuleClass+'"></td><td class="'+options.contentClass+' bg-full-size"></td></tr>'
            + '</table>').css({
            'border-collapse': 'collapse',
            'border-spacing': 0,
            // 'table-layout': 'fixed', // fix for FireFox
            padding: 0,
            margin: 0,
            width: '100%',
            height: '100%'
        }).appendTo(this.element);

        function css(image, css){
            if(image){
                css['background-image'] = "url('"+image+"')";
            }
            return css;
        };

        /* container.css({
            'table-layout': 'fixed',
            width: container.width(),
            height: container.height()
        }); */

        container.find('td').css({
            // 'white-space': 'nowrap',
            padding: 0,
            margin: 0
        });

        var horiz_rule = container.find('.'+options.horizRuleClass).css(css(options.horizRuleImage, {
            // 'background-image': "url('"+options.horizRuleImage+"')",
            'background-repeat': 'repeat-x',
            'background-position': 'left bottom',
            position: 'relative',
            overflow: 'hidden',
            height: options.ruleHeight+'px'
        }));

        var vert_rule = container.find('.'+options.vertRuleClass).css(css(options.vertRuleImage, {
            // 'background-image': "url('"+options.vertRuleImage+"')",
            'background-repeat': 'repeat-y',
            'background-position': 'right top',
            position: 'relative',
            overflow: 'hidden',
            width: options.ruleWidth+'px'
        }));

		var content = container.find('.'+options.contentClass).css({ //css(options.backgroundImage, {
            // 'background-image': "url('"+options.backgroundImage+"')",
            // 'background-position': '50% 50%',
            // 'background-repeat': 'no-repeat',
            // width: '100%',
            // height: '100%',
            position: 'relative',
            overflow: 'hidden'
        });
		var contentBackgroundImage = null;
		if(options.backgroundImage){
			content.append(contentBackgroundImage = $('<div class="bg-full-size"></div>').css({
                opacity: options.backgroundImageOpacity || 0.2,
				'background-image': "url('"+options.backgroundImage+"')",
				'background-position': '50% 50%',
				'background-repeat': 'no-repeat',
				position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%'
            }).hide().fadeIn(3000));
		}
        if(options.backgroundFadeOpacity > 0){
            content.append($('<div />').css({
                'background-color': options.backgroundFadeColor,
                opacity: options.backgroundFadeOpacity,
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%'
            }));
        }

        /* setTimeout(function(){
            horiz_rule.css({
                width: horiz_rule.parent('td').width()
            });
            vert_rule.css({
                height: vert_rule.parent('td').height()
            });
            content.css({
                width: content.parent('td').width(),
                height: content.parent('td').height()
            });
        }); */

        var chunks_container = $('<div />').css({position: 'absolute'}).appendTo(content);
        var chunks = {}, tick = 0;

        function clamp(a, min, max){
            if(a <  min) return min;
            if(a > max) return max;
            return a;
        };

        function getRandColor(){
            function color(){ return ((Math.random()*25)|0)*10; };
            return 'rgb('+color()+','+color()+','+color()+')';
        };

        function getChunkColor(x_cur, y_cur, g){
            if(g === undefined){
                g = 1;
            }
            x_cur += 123*g; y_cur += 123*g;
            function color(val){ return (val % 256)|0; };
            return 'rgb('+color(x_cur * 300 + y_cur*50)+','+color(x_cur * 70 + y_cur*20)+','+color(x_cur * 100 + y_cur*150)+')';
        };

        var map_offs = [0, 0];
        this.getOffs = function(){
            return [ map_offs[0], map_offs[1] ];
        };
        this.moveToOffs = function(x, y){
            var width = content.width(), height = content.height(), i, start, edge = options.viewEdge;

            x = clamp(x, width + (options.size.horiz[1]+edge) * -options.size.rule + 1, -(options.size.horiz[0]-edge) * options.size.rule);
            y = clamp(y, height + (options.size.vert[1]+edge) * -options.size.rule + 1, -(options.size.vert[0]-edge) * options.size.rule);

            map_offs = [x, y];

            horiz_rule.css({ 'background-position': x+'px bottom' }).empty();
            i = (x % options.size.rule) - options.size.rule;
            start = ((i-x) / options.size.rule)|0;
            for(; i < width + options.size.rule; i += options.size.rule, start++){
                var rule = $('<div />')
                    .text(start)
                    .addClass(options.ruleNumberClass)
                    .css({
                        position: 'absolute'
                    }).appendTo(horiz_rule);
                rule.css({
                    left: i - rule.width()/2 + 1,
                    bottom: 15
                });
                // console.log('horiz x', i, start);
            }

            vert_rule.css({ 'background-position': 'right '+y+'px' }).empty();
            i = (y % options.size.rule) - options.size.rule;
            start = ((i-y) / options.size.rule)|0;
            for(; i < height + options.size.rule; i += options.size.rule, start++){
                var rule = $('<div />')
                    .text(start)
                    .addClass(options.ruleNumberClass)
                    .css({
                        position: 'absolute'
                    }).appendTo(vert_rule);
                rule.css({
                    top: i - rule.height()/2 + 1,
                    right: 15
                })
            }

            edge = 0;
            var x_min = -(options.size.horiz[0]-edge) * options.size.rule + width/2;
            var x_max = -(options.size.horiz[1]+edge) * options.size.rule + width/2;
            var x_diff, x_t = ((x - x_min) / (x_diff = x_max - x_min) - 0.5) * 2;
            var y_min = -(options.size.vert[0]-edge) * options.size.rule + height/2;
            var y_max = -(options.size.vert[1]+edge) * options.size.rule + height/2;
            var y_diff, y_t = ((y - y_min) / (y_diff = y_max - y_min) - 0.5) * 2;
            var p = 45, x_p, y_p;
            if(Math.abs(x_diff) > Math.abs(y_diff)){
                x_p = p;
                y_p = p * y_diff / x_diff;
            }else{
                x_p = p * x_diff / y_diff;
                y_p = p;
            }
            // console.log('p ', x_t, x_p, x_t*x_p, 'diff', x_diff, y_diff);
            if(contentBackgroundImage)
			contentBackgroundImage.css({
                'background-position': (50 + clamp(x_t*x_p*2, -35, 35))+'% '+(50 + clamp(y_t*y_p*2, -35, 35))+'%'
            });

            chunks_container.css({
                left: x,
                top: y
            });

            tick++; x = -x; y = -y;
            var chunk_size = options.size.chunk * options.size.rule;
            var viewport = {left:x, top:y, right: x+width, bottom: y+height};
            var chunk_edge = 2;
            var x_start = (x / chunk_size)|0;
            var x_end = x_start + Math.ceil(width*1.0 / chunk_size);
            var x_old = x_start;
            x_start = x_start - chunk_edge; // Math.max(0, x_start - chunk_edge);
            x_end += x_old - x_start + Math.max(1, chunk_edge);

            var y_start = (y / chunk_size)|0;
            var y_end = y_start + Math.ceil(height*1.0 / chunk_size) + 1;
            var y_old = y_start;
            y_start = y_start - chunk_edge; // Math.max(0, y_start - chunk_edge);
            y_end += y_old - y_start + Math.max(1, chunk_edge);

            var LOADING_STATE = 0;
            var LOADED_STATE = 1;

            function loadChunk(chunk, i){
                if(!chunk.block){
                    console.log('break loading chunk ', chunk.x, chunk.y, 'it has already removed');
                    return;
                }
                if(!chunk.visible){
                    console.log('break loading chunk ', chunk.x, chunk.y, 'it is not visible');
                    return;
                }
				return;
                if(chunk.load_state !== undefined){
                    if(chunk.load_state == LOADED_STATE){
                        // throw new Exception('asasas');
                        console.log('break loading chunk ', chunk.x, chunk.y, 'it is has already loaded');
                        return;
                    }
                    console.log('break loading chunk ', chunk.x, chunk.y, 'due loading in progress');
                    return;
                }
                if(!i){
                    chunk.load_state = LOADING_STATE;
                    // game.createLoader(chunk.block, undefined, 0.5);
                }
                $.ajax({
                    type: "POST",
                    cache: false,
                    dataType:'json',
                    data: {x: chunk.x, y: chunk.y, g: options.galaxy},
                    url: options.loadChunkUrl,
                    error: function(xhr, textStatus, errorThrown){
                        console.log('error loading chunk, step', i, chunk);
                        if(chunk.block){
                            if(i < 10){
                                setTimeout(function(){
                                    delete chunk.load_state;
                                    loadChunk(chunk, i+1);
                                }, 1);
                            }else{
                                // chunk.loading = false;
                                // game.destroyLoader(chunk.block);
                                alert('Ajax triggers an error callback');
                            }
                        }
                    },
                    success: function(data){
                        if(chunk.block){
                            chunk.load_state = LOADED_STATE;
                            // game.destroyLoader(chunk.block);
                            $('<div />').html(data.html).css({

                            }).appendTo(chunk.block).hide().fadeIn(1000);
                        }else{
                            console.log('loaded chunk ', x, y, ' is not exist');
                        }
                    }
                });
            };

            // console.log('chunk x '+x+' start '+x_start+' end '+x_end+', y '+y+' start '+y_start+' end '+y_end, viewport);
            for(var x_cur = x_start; x_cur < x_end; x_cur++){
                for(var y_cur = y_start; y_cur < y_end; y_cur++){
                    if(chunks[x_cur] === undefined){
                        chunks[x_cur] = {};
                    }
                    var chunk_x_pos = x_cur * chunk_size - options.size.rule/2;
                    var chunk_y_pos = y_cur * chunk_size - options.size.rule/2;
                    var chunk_visible = chunk_x_pos+chunk_size >= viewport.left && chunk_x_pos < viewport.right
                        && chunk_y_pos+chunk_size >= viewport.top && chunk_y_pos < viewport.bottom;
                    if(chunks[x_cur][y_cur] === undefined){
                        if(!chunk_visible){
                            continue;
                        }
                        console.log('create chuck', x_cur, y_cur);
                        (function(){
                            var chunk = chunks[x_cur][y_cur] = {
                                x: x_cur,
                                y: y_cur,
                                tick: tick,
                                visible: true,
                                ready_for_load: false,
                                block: $('<div />').css({
                                    position: 'absolute',
                                    left: chunk_x_pos,
                                    top: chunk_y_pos,
                                    width: chunk_size,
                                    height: chunk_size
                                }).appendTo(chunks_container).append(
                                    $('<div />').css({
                                        position: 'absolute',
                                        'background-color': getChunkColor(x_cur, y_cur),
                                        opacity: 0.1,
                                        width: '100%',
                                        height: '100%'
                                    })
                                ).hide().fadeIn(2000).queue(function(){
                                    chunk.ready_for_load = true;
                                    loadChunk(chunk, 0);
                                })
                            };
                        })();
                    }else{
                        var chunk = chunks[x_cur][y_cur];
                        chunk.tick = tick;
                        chunk.visible = chunk_visible;
                        if(chunk_visible && chunk.ready_for_load && chunk.load_state === undefined){ // != LOADED_STATE){
                            loadChunk(chunk, 0);
                        }
                    }
                }
            }
            for(var x_chunk in chunks){
                var col_chunks = chunks[x_chunk];
                for(var y_chunk in col_chunks){
                    var chunk = col_chunks[y_chunk];
                    if(chunk.tick != tick){
                        console.log('delete chuck', chunk.x, chunk.y);
                        // game.destroyLoader(chunk.block);
                        chunk.visible = false;
                        chunk.block.stop(true).remove();
                        delete chunk.block;
                        delete col_chunks[y_chunk];
                    }
                }
            }
        };

        this.centerToXY = function(x, y){
            var width = content.width(), height = content.height();
            this.moveToOffs(
                -x * options.size.rule + width/2,
                -y * options.size.rule + height/2
            );
        };

        this.centerMap = function(){
            this.centerToXY(
                (options.size.horiz[1] + options.size.horiz[0])/2,
                (options.size.vert[1] + options.size.vert[0])/2
            );
        };

        function getTimeSec(){
            var d = new Date();
            return (d.getTime() + d.getMilliseconds() / 1000.0) / 1000.0;
        };

        var start_drag_event_pos, start_drag_map_offs, move_speed = [], move_time = 0, move_timer;

        function dragStart(x, y){
            // console.log('vmousedown', arguments);
            start_drag_event_pos = [x, y];
            start_drag_map_offs = map_offs;
            move_time = getTimeSec();
            clearInterval(move_timer);
        };
        function dragEnd(){
            // console.log('vmouseup', arguments);
            start_drag_event_pos = undefined;
            var max_speed = 3000;
            for(var i = 0; i < 2; i++){
                if(Math.abs(move_speed[i]) > max_speed){
                    move_speed[i] = max_speed * (move_speed[i] < 0 ? -1 : 1);
                }
            }
            move_timer = setInterval(function(){
                for(var i = 0; i < 2; i++){
                    move_speed[i] *= 0.85;
                    if(Math.abs(move_speed[i]) < 20){
                        move_speed[i] = 0;
                    }
                }
                if(move_speed[0] || move_speed[1]){
                    var cur_time = getTimeSec();
                    var delta_time = Math.max(0.01, cur_time - move_time);
                    move_time = cur_time;
                    self.moveToOffs(
                        map_offs[0] + move_speed[0] * delta_time,
                        map_offs[1] + move_speed[1] * delta_time
                    );
                }else{
                    clearInterval(move_timer);
                }
            }, 50);
        };
        function drag(x, y){
            // console.log('vmousemove', arguments);
            if(start_drag_event_pos === undefined){
                return;
            }
            var delta_x = x - start_drag_event_pos[0];
            var delta_y = y - start_drag_event_pos[1];
            if(delta_x*delta_x + delta_y*delta_y < 1*1){
                return;
            }
            var old_offs = [map_offs[0], map_offs[1]];
            self.moveToOffs(
                // dd.deltaX, dd.deltaY
                start_drag_map_offs[0] + delta_x,
                start_drag_map_offs[1] + delta_y
            );
            var cur_time = getTimeSec();
            var delta_time = Math.max(0.01, cur_time - move_time);
            move_time = cur_time;
            move_speed = [
                (map_offs[0] - old_offs[0]) / delta_time,
                (map_offs[1] - old_offs[1]) / delta_time,
            ];
        }

        if(0){
            content
                .bind('vmousedown', function(ev){
                    dragStart(ev.clientX, ev.clientY);
                })
                .bind('vmouseup', dragEnd)
                .bind('vmousemove', function(ev){
                    drag(ev.clientX, ev.clientY);
                })
                .bind('vclick', function(){
                    // console.log('vclick', arguments);
                })
                ;
        }else{
            content
                .bind('dragstart', function(ev, dd){
                    dragStart(dd.offsetX, dd.offsetY);
                })
                .bind('dragend', function(ev, dd){
                    dragEnd();
                })
                .bind('drag', function(ev, dd){
                    drag(dd.offsetX, dd.offsetY);
                })
                ;
        }
        /*
        content
            .bind('dragstart', function(ev, dd){
                start_drag_map_offs = map_offs;
                move_time = getTimeSec();
                clearInterval(move_timer);
            })
            .bind('dragend', function(ev, dd){
                var max_speed = 3000;
                for(var i = 0; i < 2; i++){
                    if(Math.abs(move_speed[i]) > max_speed){
                        move_speed[i] = max_speed * (move_speed[i] < 0 ? -1 : 1);
                    }
                }
                move_timer = setInterval(function(){
                    for(var i = 0; i < 2; i++){
                        move_speed[i] *= 0.85;
                        if(Math.abs(move_speed[i]) < 20){
                            move_speed[i] = 0;
                        }
                    }
                    if(move_speed[0] || move_speed[1]){
                        var cur_time = getTimeSec();
                        var delta_time = Math.max(0.01, cur_time - move_time);
                        move_time = cur_time;
                        self.moveToOffs(
                            map_offs[0] + move_speed[0] * delta_time,
                            map_offs[1] + move_speed[1] * delta_time
                        );
                    }else{
                        clearInterval(move_timer);
                    }
                }, 50);
            })
            .bind('drag', function(ev, dd){
                // console.log('drag', dd.startX, dd.startY, dd.deltaX, dd.deltaY, dd.offsetX, dd.offsetY); return;
                var old_offs = [map_offs[0], map_offs[1]];
                self.moveToOffs(
                    // dd.deltaX, dd.deltaY
                    start_drag_map_offs[0] + dd.deltaX,
                    start_drag_map_offs[1] + dd.deltaY
                );
                var cur_time = getTimeSec();
                var delta_time = Math.max(0.01, cur_time - move_time);
                move_time = cur_time;
                move_speed = [
                    (map_offs[0] - old_offs[0]) / delta_time,
                    (map_offs[1] - old_offs[1]) / delta_time,
                ];
            },{ distance: 1, relative: true });
        */
        /*
        content.draggable({
            start: function(e) {
                // e.preventDefault();
                console.log('drag-start', arguments);
            },
            drag: function() {
                console.log('drag-drag', arguments);
            },
            stop: function() {
                console.log('drag-stop', arguments);
            }
        });
        */

        this._destroy = function(){
            clearInterval(move_timer);
            container.remove();
        };

        this.widget = function(){
            return container;
        };

        if(options.offs !== undefined){
            if(options.offs == "center"){
                this.centerMap();
            }else{
                this.moveToOffs(options.offs[0], options.offs[1]);
            }
        }else if(options.xy !== undefined){
            this.centerToXY(options.xy[0], options.xy[1]);
        }else{
            this.moveToOffs(0, 0);
        }
	}
});

}(jQuery));
