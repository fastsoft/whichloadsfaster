var start = [new Date(), new Date()];
var duration = [0, 0];
var runs = new Array();

if(!String.prototype.startsWith){
    String.prototype.startsWith = function (str) {
        return !this.indexOf(str);
    }
}

load_frame = function(i, j) {

    // Add http method if it is not there
    var url = $('#url'+i).val();
    if (url.indexOf('://') == -1) {
        url = 'http://' + url;
        $('#url'+i).val(url);
    }

    // Clear current frame
    $('#frame'+i).attr('src', 'about:blank');	

    // Starting timestamp
    start[i] = new Date();
    duration[i] = 0; 

    // Set frame address to whatever's in the input box
    $('#frame' + i).attr('src', url);

    // Update loading message
    $('#time' + i).html('<blink>loading...</blink>');

    // Clear xfactor box
    $('#xfactor').html('');
};

display_runs = function() {
    var msg = '<ul>';
    $.each(runs, function(key, value) {
        msg += '<li>' + String(key);
        msg += '<ul>';
        $.each(value, function(key, value) {
            msg += '<li>' + String(value) + '</li>';
            alert('blah');
        });
        msg += '</ul>';
        msg += '</li>';
    });
    msg += '</ul>';
    $('#header').text(msg);
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
        var benefit = duration[i]/duration[j];
        var b = benefit.toPrecision(2);
        if (b === '1.0') {
            $('#xfactor').html('<div class="xfactor">= it\'s a tie! =</div>');
        } else {
            if (i === 0) {
                $('#xfactor').html('<div class="xfactor">'+b+' &times; faster &rarr;</div>');
            } else {
                $('#xfactor').html('<div class="xfactor">&larr; '+b+' &times; faster</div>');
            }
        }
        /*
        // Record result
        var pair = $('#url'+i).val() + ':' + $('#url'+j).val();
        if (!runs[pair])
            runs[pair] = new Array();

        runs[pair].push([duration[i], duration[j], benefit]);
        display_runs();
        */
    }
    $('#url0').focus().select();
};

reload_frames = function () {
    load_frame(1, 0);
    load_frame(0, 1);
};

$(window).ready(function(){
    $('#url0').focus();

    $('#frame0').load(function() { after_load(0, 1); });
    $('#frame1').load(function() { after_load(1, 0); });

    $('#go').click(reload_frames);
    $('#url0, #url1').keyup(function (e) {
        if (e.keyCode == 13) {reload_frames();}
    });

    $("#repeat-form").dialog({
        autoOpen: false, width: 550, modal: true, top: '20%',
        title: 'Repeat',
        buttons: {
            'Go': function() {
                var bValid = true;
                var value = $('#times input[name="times"]:checked').val();
                
                if (bValid) {
                    $(this).dialog('close');
                }
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
        },
        close: function() {
        }
    });
    //$('#times').buttonset();

    $("#race-form").dialog({
        autoOpen: false, width: 550, modal: true,
        title: 'Race!',
        buttons: {
            'Go': function() {
                var bValid = true;
                if (bValid) {
                    $(this).dialog('close');
                }
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
        },
        close: function() {
        }
    });

    $('#repeat').click(function () { $('#repeat-form').dialog('open'); });
    $('#race').click(function () { $('#race-form').dialog('open'); });

    $('button').button();
});
