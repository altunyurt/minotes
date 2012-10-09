/*
 * Spread: Speed Reading Extension
 *
 * Upcoming versions TODO: 
 *  - Problem : fast reading is not related to word count. It directly depends on the visual content blocks.
 *  displaying n words breaks the readability when n words contains x characters in one line and 10x
 *  characters in another, such as the following 2 word blocks : 
 *
 *    some man 
 *    international differences
 *
 *  - Possible Solution: break the content in to reading blocks and split the words by character count 
 * instead of word count. For example a 30 c/s setting may display word groups such as :
 *
 *      article, we will use a pen . - 28 chars
 *      each line (with the cap on) - 27 chars 
 *      but it is recommended that you - 30 chars
 *
 *  For the purpose is to display a readable block, as long as the the visual text block is consistent 
 *  reading and understanding the content would be much easier everytime.
 *
 * variables: uniqueVariableName
 * functions: unique_function_name
 *
 */

jQuery.fn.exists = function(){ 
    return this.length > 0; 
};

var myid = chrome.i18n.getMessage("@@extension_id");
var imagePath = format('chrome-extension://{0}/images/', myid);

function format(){
    var formatted_str = arguments[0] || '';
    var re, i;
    for(i=1; i<arguments.length; i++){
        re = new RegExp("\\{"+(i-1)+"}", "gim");
        formatted_str = formatted_str.replace(re, arguments[i]);
    }
    return formatted_str;
}


function get_selected_text()
{
    txt = String(window.getSelection());
    return txt.replace(/(^[\s\t]+|[\s\t]+$)/g, '').replace(/[\t\r\n]/g,' ');
}

function is_not_null(obj){
    return $.inArray(obj)? obj: null;
}

var SPREAD_TEXT_READER = function(content, conf){
    var self = this;

    self.conf = {}; 
    self.set_conf = function(c){
        var item; 
        for (item in c){
            if (is_not_null(c[item])){
                self.conf[item] = parseInt(c[item], 10);
            }
        }
    };

    self.content = String(content).split(' ').filter(is_not_null);
    self.idx = 0;
    self.timer = null;
    self.running = false;
    self.interval = 1000; //milliseconds
    self.last_tick = new Date(); //milliseconds
    self.slider = null;
    self.slider_size = 200;
    self.set_conf(conf);
    self.textBlocks = [];

    self.num_pages = function(){
        return self.content.length / self.conf.chars;
    }

    self.get_closest_point = function(point){
        var l = self.slider_size / self.num_pages();
        return Math.round(point/l);
    };

    self.update_slider = function(point){
        var rate = self.num_pages();
        console.log("rate",rate);
        if (point){
            self.slider.knob.position.x = self.get_closest_point(point);
        } else {
            self.slider.knob.position.x = self.slider_size * self.idx / rate;
        console.log("size", self.slider_size * self.idx / rate);
        }
    };

    self.are_we_there_yet = function(){
        if (!self.running){
            return false;
        }
        var now = new Date();
        if ((now - self.last_tick) >= self.interval){
            self.last_tick = now;
            return true;
        }
        return false;
    };

    self.update_interval = function(){
        self.interval = 60000/self.conf.fpm ;
    };

    self.update_reader = function(){
        var next_block = self.next();
        if (!is_not_null(next_block)){
            return self.stop();
        } 
        self.update_slider();
        self.display_text(next_block, self.conf);
    }

            

    self.display_text = function(){
        console.log("display_text fonksiyonu ayarlanmamış");
    };

    self.next = function(){

        var c = self.content.slice(self.idx);
        var temp_length = 0;
        var tempidx = self.idx ;
        var next_length = 0;


        for(var i=0; i < c.length; i++){
            temp_length += c[i].length;
            

            if (temp_length == self.conf.chars){
                // we have all the neded text
                self.idx += i + 1;
                return self.content.slice(tempidx, self.idx).join(' ');
            } else {
                // if lesser, check the next element 
                if (temp_length < self.conf.chars){
                    // are we at the end?
                    if (i == c.length -1 ){
                        self.idx = self.content.length;
                        return self.content.slice(tempidx, self.idx ).join(' ');
                    }
                    
                    next_length = (c[i + 1]).length;
                    /*
                     * if next word is longer then our text limit,
                     * then display all we got
                     */
                    if (next_length >= self.conf.chars){
                        self.idx += i + 1;
                        return self.content.slice(tempidx, self.idx).join(' ');
                    }
                    /*
                     * if the text we have + next word is longer than the limit
                     * than check if we need the next word.
                     *
                     * self.conf.chars == 10
                     * n words = 8 
                     * n + 1 words = 13
                     * 13 + 8 /2 > 10, then we display n words, else 
                     * display n + 1 words for readability
                     */
                    if (temp_length + next_length > self.conf.chars){
                        if ((2 * temp_length + next_length) / 2 > self.conf.chars){
                            // we don't need the word
                            self.idx += i + 1;
                            
                            return self.content.slice(tempidx, self.idx ).join(' ');
                        }
                        // we need the word, roll on
                            
                    } 
                } else {
                    self.idx += i + 1;
                            
                    return self.content.slice(tempidx, self.idx).join(' ');
                }
            }
        }
        self.idx += i + 1;
        
        return self.content.slice(tempidx).join(' ');
    };

    self.more_chars = function(arg){
        self.conf.chars += arg;
        return self.update_settings();
    };

    self.less_chars = function(arg){
        self.conf.chars -= ((self.conf.chars > arg )? arg: 0);
        return self.update_settings();
    };

    self.restart = function(){
        if(self.running){
           self.stop();
        }
        self.idx = 0;
        return self.start();
    };

    self.speed_up = function(arg){
        self.conf.fpm += arg;
        if (self.running){
            self.update_interval();
        }
        return self.update_settings();
    }

    self.slow_down = function(arg){
        self.conf.fpm -= ((self.conf.fpm > arg)? arg: 0);
        if (self.running){
            self.update_interval();
        }
        return self.update_settings();
    }

    self.increase_font_size = function(arg){
        self.conf.font += arg;
        return self.update_settings();
    };

    self.decrease_font_size = function(arg){
        self.conf.font -= ((self.conf.font > arg )? arg: 0);
        return self.update_settings();
    };

    self.start = function(){
        if (self.running){
            return;
        }
        self.running = true;
    };

    self.stop = function(){
        self.running = false;
    };

    self.update_settings = function(){
        settings = {
            'fpm': self.conf.fpm, /* frame per minute */
            'chars': self.conf.chars,
            'font': self.conf.font,
            'color': self.conf.color
        };

        self.display_settings();
        chrome.extension.sendRequest({
            command: 'saveSettings', 
            settings_data: settings
        });
    };

    self.display_settings = function(){
        $('#spread_infopane').text(
                format('{0} cpm / {1} chars / {2}px fonts', 
                    self.conf.fpm * self.conf.chars, 
                    self.conf.chars, 
                    self.conf.font, 10));
    };

    self.update_interval();
    return self;
};



function create_reader(text){
                console.log(text);
    text_ = text.replace(/(\w+)([,\.:;\(\)\[\]\"]+)(\w+)/gim, '$1$2 $3');
                console.log(text);
    var count = text_.match(/([^\s\t]+)/gim).length;

    chrome.extension.sendRequest(
            {command:'getSettings'}, 
            function(response){
                var settings = response.settings; 
                var reader = SPREAD_TEXT_READER(text_, settings);
                var w_width = $(window).width();
                var w_height = $(window).height()

                var r_width = w_width * 0.8;
                var r_height = w_height * 0.6;

                var background = $('<div/>', {
                    id: 'spread_reader_background',
                    style: format("width:{0}px;height:{1}px;", w_width, w_height)
                }).mousedown(function(){
                    $('#spread_reader').remove();
                    background.remove();
                    reader.stop();
                });


                var div = $('<canvas id="spread_reader"></canvas>');
                //div.resizable();
                $('body').append(background)
                         .append(div.css({'top': (w_height*0.4)/2,'left':(w_width*0.2)/2}));

                paper.setup('spread_reader');
                
                with (paper) {
                    view.viewSize = new Size(r_width, r_height);
                    var center = view.center;
                    var text = null;

                    reader.display_text = function(text_block, conf){
                        if (text){
                            text.remove();
                        }
                        text = new PointText();
                        text.fillColor = conf.color;
                        text.font = "Arial";
                        text.fontSize = conf.font.toString();
                        text.content = text_block;
                        text.point = new Point((r_width - text.bounds.width)/2, 
                                                (r_height - text.bounds.height)/2); 
                    };

                    var makeSlide = function(point, size, r, knobrad){
                        var slider = new Path.RoundRectangle(new Rectangle(point, size), r);
                        slider.fillColor = "#bebebe";
                        slider.strokeColor = "#999";
                        slider.mouseDown = false;
                        slider.footSize = size.x / reader.num_pages();

                        slider.knob = new Path.Circle(point, knobrad);
                        slider.knob.fillColor = "#666";
                        slider.knob.strokeColor = "#444";
                        slider.knob.strokeWidth = 2;

                        slider.knob.move = function(pointX){
                            var x = reader.get_closest_stop(pointX);
                            knob.position.x += x;
                        }

                        return slider;
                    }
                    //          middle         bottom        80% len
                    reader.slider = makeSlide([r_width*0.1, r_height*0.8], [r_width*0.8, 5],10,10 );
                    reader.slider.onMouseMove = function(event){
                        console.log(event);
                    };
                    reader.slider.onMouseDrag = function(event){
                        console.log(event.position);
                        knob.position.x += event.delta.x;
                    };

                    var tool = new Tool();
                    tool.onMouseDown = function(event){
                        if (reader.slider.contains(event.point) || reader.slider.knob.contains(event.point)){
                            reader.slider.mouseDown = true;
                            reader.slider.knob.position.x = event.point.x;
                            //knob.position.y += event.delta.y;
                        }
                    };
                    
                    tool.onMouseMove = function(event){
                        if (reader.slider.mouseDown){
                        console.log(reader.slider);
                            var x = (event.point.x < reader.slider.bounds.x)? reader.slider.bounds.x: 
                                      (event.point.x > reader.slider.bounds.x + reader.slider.bounds.width)?  reader.slider.bounds.x + reader.slider.bounds.width:
                                        event.point.x;
                            reader.slider.knob.position.x = x;
                        }
                    };
                    
                    tool.onMouseUp = function(event){
                        reader.slider.mouseDown = false;
                    };
                    
                    //var path;

                    // //Define a mousedown and mousedrag handler
                    //tool.onMouseDown = function(event) {
                    //    path = new Path();
                    //    path.strokeColor = 'red';
                    //    path.add(event.point);
                    //}

                    //tool.onMouseDrag = function(event) {
                    //    path.add(event.point);
                    //}

                    reader.start();
                    view.onFrame = function(event){
                        if (reader.are_we_there_yet()){
                            reader.update_reader();
                        }
                    }
                }
            }
    );
}


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.command == 'openReader'){
        var text = get_selected_text();
        if (text.length){
            create_reader(text);
        }
    }
});

