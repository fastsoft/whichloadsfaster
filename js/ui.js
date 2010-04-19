var start = [new Date(), new Date()];
var duration = [0, 0];
var urls = ['', ''];
var runs = {};
var repeat = 0;
var repeat_total = 0;
var repeat_render = false;

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str) {
        return !this.indexOf(str);
    }
}

load_frame = function(i, j) {

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
    start[i] = new Date();
    duration[i] = 0; 

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

display_runs = function() {
    msg = '';
    $.each(runs, function(key, value) {
        msg += unescape(key) + '\n\n';
        msg += 'right_ms,left_ms\n';
        $.each(value.history, function(key, value) {
            msg += value[0] + ',' + value[1] + '\n';
        });
        msg += '\n\n';
    });
    return msg;
};

comparison_txt = function(benefit) {

    if (benefit < 1.0) var b = (1/benefit).toPrecision(2);
    else var b = benefit.toPrecision(2);

    if (b === '1.0') {
        return 'it\'s a tie!';
    /*} else if (b < 2)  {
        b = (100 * (b-1)).toFixed(0);
        if (benefit > 1.0) return b + '% faster &rarr;';
        else return '&larr; ' + b + '% faster';
    */
    } else {
        if (benefit > 1.0) return b + ' &times; faster &rarr;';
        else return '&larr; ' + b + ' &times; faster';
    }
}

after_load = function(i, j) {

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
        var pair = escape(urls[0]) + ':' + escape(urls[1]);
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

        // Take care of repeats
        if (repeat) {
            if (--repeat == 0) repeat_render = true;
            reload_frames();
        }
        
        $('.load_time').hide();
        $('#url0').focus().select();
    }

};

reload_frames = function() {
    duration = [0, 0];
    load_frame(1, 0);
    load_frame(0, 1);
};

$(window).ready(function(){
    $('#url0').focus();

    $('#frame0').load(function() { after_load(0, 1); });
    $('#frame1').load(function() { after_load(1, 0); });

    $('#go')
    .button({icons:{primary:'ui-icon-arrowthick-1-e'}})
    .click(reload_frames);

    $('#url0, #url1').keyup(function (e) {
        if (e.keyCode == 13) {reload_frames();}
    });

    $('#repeat').click(function () {
    $("#repeat-form").dialog({
        modal: true, title: 'Repeat this matchup',
        open: function() {
            $('#custom_times').focus(function() {
                $('#custom').attr('checked', 'checked');    
            });
        },
        buttons: {
            'GO': function() {
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
                    repeat = value - 1;
                    repeat_total = value;
                    repeat_render = false;
                    reload_frames();
                }
            },
            'Cancel': function() { $(this).dialog('close'); }
        },
        close: function() { }
    });
    });

    $('#race').click(function () {
        $("#race-form").dialog({
            width: 400, height: 250,
            modal: true, title: 'Race!',
            buttons: {
                'OK': function() { $(this).dialog('close'); }
            },
            close: function() { }
        });
    });

    $('#data').click(function () {
        $("#data-form").dialog({
            width: 600, height: 600,
            modal: true, title: 'Grab my data',
            open: function (event, ui) {
                $('#data-form textarea').val(display_runs());
                $('#data-form textarea').focus();
            },
            buttons: { 'OK': function() {$(this).dialog('close')}, },
            close: function() {}
        });
    });

    $("#splash").dialog({
        modal: true, title: 'Which loads faster?',
        open: function (event, ui) {
            $('#matchups button')
            .button({icons:{primary:'ui-icon-star'}})
            .click(function(){
                var urls = $(this).attr('name').split(':');
                $('#url0').val(urls[0]);
                $('#url1').val(urls[1]);
                $('#splash').dialog('close');
                reload_frames();
            });
        },
        buttons: { 
            'Try my own matchup': function() {
                $(this).dialog('close')
                $('#url0').focus().select();
        },},
        close: function() {}
    });
    $('#splash-link').click(function(){$('#splash').dialog();});

    $('button').button();
    $('.load_time').hide();


});
