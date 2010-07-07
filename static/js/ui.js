var our_url = $.url.attr('source');
var our_host = $.url.attr('host') || 'localhost';
var start = [new Date(), new Date()];
var duration = [null, null];
var urls = ['', ''];
var runs = {};
var repeat = 0;
var repeat_total = 0;
var repeat_render = false;
var race_urls = {r:[], l:[]};
var race_index = [0, 0];
var racing = false;
var querystring = '';
var current_test_url = our_url;
var serial = false;

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str) {
        return !this.indexOf(str);
    }
}

load_frame = function (i, j) {

    // Figure out what our next url is
    if (racing) { $('#url'+i).val(race_urls[['l','r'][i]][race_index[i]]); }

    // Add http method if it is not there
    var url = $('#url'+i).val();
    if (url.indexOf('://') == -1) {
        urls[i] = url;
        url = 'http://' + url;
        $('#url'+i).val(url);
    } else {
        urls[i] = url.substr(url.indexOf('://')+3);
    }

    // Clear current frame
    $('#frame'+i).attr('src', 'about:blank');	

    // Starting timestamp
    if (!racing || race_index[i] === 0) {
        start[i] = new Date();
        duration[i] = 0; 
    }

    // Set frame address to whatever's in the input box
    $('#frame' + i).attr('src', url);

    // Update loading message
    $('#time' + i).html('<blink>loading...</blink>').show();

    // Clear overlays box
    if (repeat_total) {
        $('#xfactor div').html(
            '<p> <div id="progress"></div> </p>' +
            '<p> ' + (repeat_total-repeat) + 
            ' out of ' + repeat_total+ '</p>'
        );
        $('#progress').progressbar({value: 
            100 * (repeat_total-repeat) / repeat_total
        });
        $('#xfactor').show();
        $('#average').hide();
    } else {
        $('.overlay').hide();
    }
};

display_runs = function () {
    msg = '';
    $.each(runs, function (key, value) {
        msg += unescape(key) + '\n\n';
        msg += 'right_ms,left_ms\n';
        $.each(value.history, function (key, value) {
            msg += value[0] + ',' + value[1] + '\n';
        });
        msg += '\n\n';
    });
    return msg;
};

comparison_txt = function (benefit) {

    var left_greater = true;
    if (benefit < 1.0) {
        benefit = (1.0/benefit);
        left_greater = false;
    }
    var percent = Math.round(100.0 * (benefit-1));
    var b = benefit.toPrecision(2);

    if (percent < 5) {
        return 'it\'s a tie!';
    } else if (benefit < 2)  {
        if (left_greater) return percent + '<small>%</small> faster &rarr;';
        else return '&larr; ' + percent + '<small>%</small> faster';
    } else {
        if (left_greater) return b + ' &times; faster &rarr;';
        else return '&larr; ' + b + ' &times; faster';
    }
}

after_load = function (i, j) {

    // Fix iframe bug on firefox that triggers run on load
    if (duration[i] === null) return;

    // If we're racing and not on the last run trigger the next load and bail
    if (racing && race_index[i] < race_urls[['l','r'][i]].length - 1) {
        race_index[i]++;
        load_frame(i, j);
        return;
    }

    // Grab the ending timestamp
    var end = new Date();

    // Display load time
    var dur = end.getTime() - start[i].getTime();
    duration[i] = dur;
    $('#time' + i).text(dur + ' ms');

    // Calculate benefit
    if (duration[i] && duration[j]) {

        var benefit = duration[0] / duration[1];

        // Record result
        var pair = current_test_url;
        if (!runs[pair])
            runs[pair] = {
                total_time: [0, 0],
                history: new Array()
            };
        runs[pair].history.push(
            [duration[0], duration[1], benefit]
        );
        var N = runs[pair].history.length;

        // Calculate average
        runs[pair].total_time[0] += duration[0];
        runs[pair].total_time[1] += duration[1];
        var average = runs[pair].total_time[0] / runs[pair].total_time[1];

        var avg0 = (runs[pair].total_time[0] / N).toFixed(0);
        var avg1 = (runs[pair].total_time[1] / N).toFixed(0);

        // Display benefit
        if (repeat_render) {

            repeat_render = false;
            repeat_total = 0;

            // This case shows at the end of a repeat cycle
            $('#xfactor div').html(
                '<h2>' + comparison_txt(average) + '</h2>' +
                '<p>' + avg0 + ' ms / ' + avg1 + ' ms </p>'
            );
            $('#average div').html(
                '<p> Average over ' + N + ' runs: </p>' +
                '<p>' + comparison_txt(average) + '</p>' +
                '<p>' + avg0 + ' ms / ' + avg1 + ' ms </p>'
            );
            $('.overlay').show();
        } 
        else {
            // This case shows for the normal single run
            $('#xfactor div').html(
                '<h2>' + comparison_txt(benefit) + '</h2>' +
                '<p>' + duration[0].toFixed(0) + ' ms / ' + duration[1].toFixed(0) + ' ms</p>'
            );
            $('#xfactor').show();
            if (N>1) {
                $('#average div').html(
                    '<p> Average over ' + N + ' runs: </p>' +
                    '<p>' + comparison_txt(average) + '</p>' +
                    '<p>' + avg0 + ' ms / ' + avg1 + ' ms </p>'
                );
                $('#average').show();
            }
        }

        // Finish race
        if (racing && !repeat) {
            racing = false;
        }

        // Take care of repeats
        if (repeat) {
            if (--repeat == 0) repeat_render = true;
            if (racing) {
                prep_race();
            }
            reload_frames();
        } else {
            $('#share-link').delay(1000).fadeIn();
        }
        
        $('.load_time').hide();
        go_focus();
    }

    // For serial mode, trigger other side if we're all done
    if (serial && duration[i] && !duration[j]) {
        load_frame(j, i);
    }


};

reload_frames = function () {
    duration = [0, 0];
    current_test_url = build_querystring(racing);
    $('#share-link').hide();
    if (serial) {
        load_frame(1, 0);
    } else {
        load_frame(1, 0);
        load_frame(0, 1);
    }
};

go_focus = function () {
    setTimeout(function () {
        $('#go').focus();
    }, 10);
};

prep_repeat = function (times) {
    repeat = times - 1;
    repeat_total = times;
    repeat_render = false;
};

prep_race = function () {
    racing = true;
    race_index = [0, 0];
}

// Build a query string from an array of urls or a single url
build_querystring = function (racing) {
    var l_escaped = [], r_escaped = [];
    if (racing) {
        for (var i=0; i<race_urls.l.length; i++) {
            l_escaped[i] = escape(race_urls.l[i]);
        }
        for (var i=0; i<race_urls.r.length; i++) {
            r_escaped[i] = escape(race_urls.r[i]);
        }
    }
    else {
        l_escaped.push(escape(urls[0])); 
        r_escaped.push(escape(urls[1]));
    }
    var repeat_string = repeat_total ? '&times=' + repeat_total : '';
    return our_url.split('?')[0].split('#')[0] + '?l='+l_escaped.join(';') + '&r='+r_escaped.join(';') + repeat_string;
}

// Parse any querystring and fill our variables
parse_querystring = function (qs) {
    
    // Grab our current querystring if we don't have an arg
    if (!qs) { qs = $.url.attr('query'); if(!qs) return; }

    // $.url.setUrl needs the question mark
    if (qs[0] != '?') { qs = '?'+qs; };

    // Parse it
    $.each({0:'l', 1:'r'}, function (i,side) {
        var param = $.url.setUrl(qs).param(side);
        if (param) {
            var _urls = param.split(';');
            // fill up race form
            $.each(_urls, function (j,url) {
                $('#'+side+j).val(url);
            });
            $('#url'+i).val(_urls[0]);
            urls[i] = _urls[0];
            race_urls[side] = _urls;
        }
    });
}

var add_race_input = function () {
    var new_index = $('#race-form input').size()/2;
    $('#race-form tr').last().after('<tr>' +
        '<td><input type="text" id="l' + new_index +
        '" class="race_url text ui-widget-content ui-corner-all" /></td>' +
        '<td><input type="text" id="r' + new_index +
        '" class="race_url text ui-widget-content ui-corner-all" /></td>' +
    '</tr>');
    $('#race-form').dialog('option', 'position', 'auto');
    race_input_auto_add();
}

var race_input_auto_add = function () {
    // Auto-add more input boxes when they run out
    $('#race-form input').focus(function () {
        // If we're on the last row
        var len = $('#race-form input').size()/2 - 1;
        var id = $(this).attr('id');
        if (id === 'l'+len || id === 'r'+len) {
            add_race_input();
        }
    });
};


$(window).ready(function (){

    $('#frame0').load(function () { after_load(0, 1); });
    $('#frame1').load(function () { after_load(1, 0); });

    $('#go')
    .button({icons:{primary:'ui-icon-arrowthick-1-e'}})
    .click(reload_frames);

    $('#url0, #url1').keyup(function (e) {
        if (e.keyCode == 13) {reload_frames();}
    });

    $('#repeat').click(function () {
    $("#repeat-form").dialog({
        modal: true, title: 'Repeat this matchup',
        open: function () {
            $('#custom_times').focus(function () {
                $('#custom').attr('checked', 'checked');    
            });
        },
        buttons: {
            'GO': function () {
                $('#custom_times_error')
                .removeClass('ui-state-highlight').hide();

                var value = $('#times input[name="times"]:checked').val();
                if (value === 'custom')
                    value = $('#custom_times').val();

                value = parseInt(value);
                if (isNaN(value) || value < 1) {
                    $('#custom_times_error')
                    .addClass('ui-state-highlight')
                    .text('positive number please').show();
                }
                else {
                    $(this).dialog('close');
                    prep_repeat(value);
                    reload_frames();
                }
            },
            'Cancel': function () { $(this).dialog('close'); }
        },
        close: function () { }
    });
    });

    $('#race').click(function () {
        $("#race-form").dialog({
            width: 550,
            modal: true, title: 'Race!',
            open: function () {
                // Loop through race_urls and make sure we have an input box for each, then fill it
                for (var i = 0; i < Math.max(race_urls.r.length, race_urls.l.length); i++) {
                    if ($('#race-form input').size()/2 <= i+1) {
                        add_race_input();
                    }
                    $('#l'+i).val(race_urls.l[i]);
                    $('#r'+i).val(race_urls.r[i]);
                }
                race_input_auto_add();
            },
            buttons: {
                'OK': function () { 

                    // Build a query argument for each side
                    var query = {r:'', l:''};
                    $.each(query, function (k,v) {
                        var i = 0; var u = 'foo'; var run = [];
                        while (u = $('#'+k+i).val()) { run.push(u); i++; }
                        query[k] = k + '=' + run.join(';');
                    });

                    // Then parse it as if it were our querystring
                    var qs = query.l + '&' + query.r;
                    querystring = qs;
                    parse_querystring(qs);

                    // And start the race
                    prep_race();
                    reload_frames();
                    $(this).dialog('close'); 
                }
            },
            close: function () { }
        });
    });

    $('#data').click(function () {
        $("#data-form").dialog({
            width: 600, height: 600,
            modal: true, title: 'Grab my data',
            open: function (event, ui) {
                $('#data-form textarea').val(display_runs());
            },
            buttons: { 'OK': function () {$(this).dialog('close')} },
            close: function () {}
        });
    });


    $("#splash").dialog({
        autoOpen: false,
        modal: true, title: 'Which loads faster?',
        open: function (event, ui) {
            $('#matchups button')
            .button({icons:{primary:'ui-icon-star'}})
            .click(function (){
                urls = $(this).attr('name').split(':');
                $('#url0').val(urls[0]);
                $('#url1').val(urls[1]);
                $('#splash').dialog('close');
                reload_frames();
            });
        },
        buttons: { 
            'Try my own matchup': function (){
                $('#url0').focus().select();
                $(this).dialog('close');
            }
        },
        close: function () { }
    });
    $('#splash-link').click(function (){$('#splash').dialog('open');});

    $("#framebuster").dialog({
        autoOpen: false,
        modal: true, title: 'Framebuster warning',
        open: function () {
            $('#framebuster_name').html('');
            var url = '';
            if (duration[0] && !duration[1])
                url = $('#url1').val();
            else if (duration[1] && !duration[0])
                url = $('#url0').val();
            else return;
            $('#framebuster_name').html('(<b>'+url+'</b>)');
        },
        buttons: { 'OK': function () {$(this).dialog('close')} },
        close: function () {}
    });

    $("#help").dialog({
        autoOpen: false, modal: true, title: 'Help',
        buttons: { 'OK': function () {$(this).dialog('close')} }
    });
    $('#help-link').click(function (){$('#help').dialog('open');});

    $("#about").dialog({
        width: 400,
        autoOpen: false, modal: true, title: 'About this project',
        open: function () {
            $('.IE6 #about').supersleight({shim:'img/x.gif'});
        },
        buttons: { 'Cool Beans!': function () {$(this).dialog('close')} }
    });
    $('#about-link').click(function (){$('#about').dialog('open');});

    $("#share").dialog({
        autoOpen: false, modal: true, title: 'Share this test!',
        width: 400,
        open: function () {
            $('#share textarea').val(current_test_url);
        },
        buttons: { 'OK': function () {$(this).dialog('close')} }
    });
    $('#share-link').click(function (){$('#share').dialog('open');});

    $("#settings").dialog({
        autoOpen: false, modal: true, title: 'Settings',
        width: 400,
        buttons: { 'OK': function () {$(this).dialog('close')} }
    });
    $('#settings-link').click(function (){$('#settings').dialog('open');});

    $('#serial_parallel').buttonset();
    $('#serial, #parallel').change(function(){
        serial = $('#serial').attr('checked');
    });

    $('button').button();
    $('.load_time').hide();

    // Load get parameters

    parse_querystring();

    // Repeat count
    var times = $.url.param('times');
    if (times) {
        if ($('#' + times + 'times').attr('checked') === undefined) {
            $('#custom_times').val(times);
            $('#custom').attr('checked', true);
        } else {
            $('#' + times + 'times').attr('checked', true);
        }
    }

    // Shortcuts
    make_shortcut = function (key,link) {
        $(document).bind('keyup',key,function (){$(link).trigger('click')});
        if ($(link).is('button')) { link += ' span' } // don't munge jquery buttons
        $(link).html($(link).text().replace(RegExp('(.*)('+key+')(.*)','i'),'$1<u>$2</u>$3')); // underline shortcut
    }
    make_shortcut('r','#repeat');
    make_shortcut('c','#race');
    make_shortcut('p','#splash-link');
    make_shortcut('s','#settings-link');
    make_shortcut('d','#data');
    make_shortcut('g','#go');
    make_shortcut('h','#help-link');
    make_shortcut('a','#about-link');

    // Keep iframes from recieving events
    $('#frame0').focus(function (){$('#frame0').trigger('blur')});
    $('#frame1').focus(function (){$('#frame1').trigger('blur')});

    go_focus();

    // Make sure we don't get focus stolen by iframes
    $('input')
    .focus(function (){$(this).addClass('hasfocus')})
    .blur(function (){$(this).removeClass('hasfocus')});
    $('#go').blur(function (){ 
        setTimeout(function (){
            var ok = true;
            $.each($('input'), function (i,v) {
                if ($(this).hasClass('hasfocus')) ok = false;
            });
            if (ok) { go_focus(); }
        }, 10);
    });
    setInterval(function (){
        var ok = true;
        $('input').each(function () {
            if ($(this).hasClass('hasfocus')) ok = false;
        });
        if (ok) { go_focus(); }
    }, 200);

    // Blur inputs on escape
    $('input').bind('keydown', 'esc', function (){$(this).blur()});

    // Action triggers
    switch ($.url.param('action')) {
        case 'go': $('#go').trigger('click'); break;
        case 'race': $('#race').trigger('click'); break;
        case 'repeat': $('#repeat').trigger('click'); break;
        case 'splash': $('#splash').dialog('open'); break;
        case 'serial': 
            serial = true; 
            $('#parallel').removeAttr('checked');
            $('#serial').attr('checked', 'checked');
            $('#serial_parallel').buttonset();
            break;
        default: 
            // Auto-start if they provided URLs
            if (race_urls.l.length && race_urls.r.length) {
                if (times) {
                    prep_repeat(times);
                }
                if (race_urls['l'].length + race_urls['r'].length > 2) {
                    prep_race();
                }
                reload_frames();
            } 
            // Otherwise show the splash screen
            else {
                $('#splash').dialog('open'); 
            }
            break;
    };

    // Setup logo link (always points to currently running copy)
    $('#logo a').attr('href', our_url);
    $('#logo a').html(our_host);

    // Make transparent pngs in IE6
    $('.IE6 #xfactor').supersleight({shim:'img/x.gif'});
    $('.IE6 #average').supersleight({shim:'img/x.gif'});
});



/* 
 * iframe buster buster adapted from:
 * http://stackoverflow.com/questions/1794974/
 */

$('#frame0').top = null;
$('#frame1').top = null;

/*
var fr23s = Math.random() * 3000; 
function slke( init ) { 
    function onbeforeunload() { fr23s++ }
    window.onbeforeunload = onbeforeunload;
    setInterval( function () {
        if ( window.onbeforeunload != onbeforeunload ) {
            fr23s = init + 1;
            window.onbeforeunload = onbeforeunload;
        }
        if (fr23s > init ) {
            fr23s -= 2
            window.top.location = 'http://which.loadsfaster.com/204';
            setTimeout(function (){
                $("#framebuster").dialog('open')
            }, 1000);
       }
   }, 1 );
};
slke( fr23s );
*/

