'use strict';


//code from https://www.youtube.com/watch?v=5-koI06rmcA
var log = console.log;

document.body.style.overflow = 'hidden';
var editor = document.getElementById('editor');


var Mode = {
    Normal: 0,
    Insert: 1,
    Visual: 2,
    Command:3,
    Replace: 4,
};

var vim = {};

(function init(){
    vim.mode = Mode.Normal;
    vim.command = null;
    vim.texts = load_opening_text();
    vim.cursor = {
        ui: document.getElementById('cursor'),
        x: 0,
        y: 0,
    };
    

    make_buffer(vim.texts);
    change_mode_display();
    
    document.body.addEventListener('keydown', body_onKeyDown);   // 1
    document.body.addEventListener('keyup',   body_onKeyUp);
})( );



var is_shift_pressed = false;
function body_onKeyDown(event){

    prevent_backward_navigation_by_backspacke_key(event);
    set_mode(event); 

    if( event.key =='Shift' )
        is_shift_pressed = true;

    branch_out_event(event);

}

function prevent_backward_navigation_by_backspacke_key(event){
    log(event.target);
    if(event.keyCode == 8){
    //if(event.keyCode == 8 &&
       //(event.target || event.srcElement).tagName != 'Body') {
        event.returnValue = false;
    }
    return false;
}

function body_onKeyUp(event){
    if( event.key =='Shift' && is_shift_pressed )
        is_shift_pressed = false;
}

function branch_out_event(event){

    var key = get_key_downed(event);

    if(vim.mode == Mode.Normal)
        normal_op(key);
    else if (vim.mode == Mode.Insert)
        insert_op(key);
    else if (vim.mode == Mode.Visual)
        visual_mode_op(key);
    else if (vim.mode == Mode.Command)
        command_mode_op(key);
}


function get_key_downed(event){
    var key = event.key || event.code || event.which;
    return key;
}




function normal_op(ch){
    switch(ch){
    case 'k' :
        if(vim.cursor.y > 0){
            var y = vim.cursor.y;
            move_cursor_y(y, y-1);
            vim.cursor.y--;
        } 
        break;

    case 'j':
        if(vim.cursor.y < vim.texts.length){
            move_cursor_y(vim.cursor.y, vim.cursor.y+1);
            if (vim.cursor.y < vim.texts.length - 1)
                vim.cursor.y++;
        } 
        break;

    case 'l' :
        if(vim.cursor.x < vim.texts[vim.cursor.y].length-1){
            vim.cursor.x++;
            move_cursor_x(vim.cursor.x, vim.cursor.y);
        }
        break;
  
    case 'h':
        if(vim.cursor.x>0){
            vim.cursor.x--;
            move_cursor_x(vim.cursor.x, vim.cursor.y);
        }
        break;

    case 'w':
        if(vim.cursor.x < vim.texts.length-1){
            while(vim.texts[vim.cursor.x] != ' '){
                vim.cursor.x++;
            }
            vim.cursor.x++;
        }
        break;
    case 'b':
        while(vim.cursor.x > 0 && vim.texts[vim.cursor.x] != ' ' ){
            if ( vim.cursor.x != 0)
                vim.cursor.x--;
                //else
            break;               
        }
        vim.cursor.x--;
        while(vim.cursor.x > 0 && vim.texts[vim.cursor.x] != ' ' ){
            if( vim.cursor.x != 0)
                vim.cursor.x--;
            else
                break;
        }
        if( vim.cursor.x != 0)
            vim.cursor.x++;
        if( vim.cursor.x < 0){
            vim.cursor.x = 0;
        }
        break;
    case 'y':
        if(vim.cursor.x > 0){
            while(vim.texts[vim.cursor.x] != ' ' || vim.texts[vim.cursor.x] > 0){
                vim.cursor.x--;
            }
            vim.cursor.x--;
        }
        break;
    }
}

function insert_op(char){
    if(!vim.newly_insert_mode)
        insert_charCode(char);
    vim.newly_insert_mode = false;
}

function visual_mode_op(ch){}

function command_mode_op(key){

    //var command_input = document.getElementById('status_mode');
    //command_input.innerText += key;

}





function insert_charCode(char){
    var x = vim.cursor.x;
    var y = vim.cursor.y;

    var  this_line = vim.texts[y];
    this_line = this_line.substring(0, x+1) + char + this_line.substring(x+1 , this_line.length);

    vim.texts[y] = this_line;
    var line = 'text_' + y;
    var elm = document.getElementById(line);
    elm.innerHTML = make_ui_text_with_cursor_insert_mode(this_line); 

}




function set_mode(event){
    
    if(event.code == 'Escape'){               
        vim.mode = Mode.Normal;
    } else if(event.key == ':'){
        vim.mode = Mode.Command;
    }

    if(vim.mode != Mode.Command){
        if (event.code == 'KeyI' ||event.code == 'KeyA') {
            if(vim.mode !== Mode.Insert){
                vim.newly_insert_mode = true;
                vim.mode = Mode.Insert;
            }
        }else if(event.code == 'keyV'){
            vim.mode = Mode.Visual;
        }
    }
    change_mode_display(event.key);
}



function change_mode_display(key){
    if(vim.mode != Mode.Command){

        updateUI( 'status_mode', '<span>' + mode_ToString(vim.mode) + '</span>' );

    } else {
        //if( key != 'Backspace'){ 
        //    run_command(vim.command);
        //    vim.command = null;
        //}else if( key == 'Enter'){ 
        if( key == 'Enter'){ 
            run_command(vim.command);
            vim.command = null;
        } else{
            if( key != 'Shift'){
                vim.command = vim.command == null ? ':' : vim.command + key;
                updateUI( 'status_mode', '<span>' + vim.command + '</span>');
            }
        }
    }
}


function run_command(cmd){
    switch(cmd){
    case ':help':
        load_help();
        break;
    case ':tutor':
        load_vim_tutor();
        break;
    case ':q':
        quit();
        break;
    case ':w':
        write_file();
        break;
    case ':set nu':
        show_line_numbers();
        break;
    case ':set rnu':
        shor_relative_numbers();
        break;
    }
    reset_mode_display();
}

function reset_mode_display(){
    vim.mode = Mode.Normal;
    updateUI( 'status_mode', '<span>' + mode_ToString(vim.mode) + '</span>' );
}

function updateUI( id , content){
    var element = document.getElementById(id);
    element.innerHTML = content;
}



function load_help(){
    log('loading help ...');
}


var KeyCode = {
    ESC: 27,
    i:73,
    v:118,
    V:86,
    COLON: 58,
};




function mode_ToString(mode){
    var str = 'Normal';
    switch(mode){
    case Mode.Normal: 
        str = 'NORMAL';
        break;
    case Mode.Insert: 
        str = '-- INSERT --';
        break;
    case Mode.Visual:
        str = '-- VISUAL --';
        break;
    case Mode.Command:
        str = ':';
        break;
    case Mode.Replace:
        str = 'Replace';
        break;
    }
    return str;
}











function move_cursor_x(x, y){
    var elm ='line_' + y; 
    var current_ui_line = document.getElementById(elm);
    current_ui_line.innerHTML = make_ui_line_with_cursor(vim.texts[y], x);
}


function move_cursor_y(y, new_y){
 
    if (new_y < vim.texts.length){
        var elm ='line_' + y; 
        var current_ui_line = document.getElementById(elm);
        current_ui_line.innerHTML = make_ui_line(vim.texts[y], y);

        var c_elm = 'line_' + new_y;
        var next_ui_line_with_cursor = document.getElementById(c_elm);
        next_ui_line_with_cursor.innerHTML = make_ui_line_with_cursor(vim.texts[new_y], new_y);
    }
}

function make_buffer(texts){
    for(var i = texts.length-1; i != -1  ; i--){
        if ( i == vim.cursor.y) {
            if(vim.mode == Mode.Normal){
                editor.innerHTML
                =  make_ui_line_with_cursor(texts[i], i) + editor.innerHTML;
            }
        } else if(vim.mode  == Mode.Normal){
            editor.innerHTML
            =  make_ui_line(vim.texts[i], i) + editor.innerHTML;
        }
    } 
    add_unused_line();
}


function make_ui_line(ui_text, i){
    return     '<div class="line" id="line_'+i+'" >'+
        '<div class="number" id="nu_'+i+'" >' + i +	'</div>'+
        '<div class="text" id="text_'+i+'">' + vim.texts[i] +
        '</div>'+
        '</div>';
}


function make_ui_line_with_cursor(ui_text, i){
   
    var x = vim.cursor.x < ui_text.length ? vim.cursor.x : ui_text.length-1;

    if(ui_text){
        return  ('<div class="line" id="line_' + i + '" >'+
       '<div class="number" id="nu_'  + i + '" >' + i + '</div>'+
        '<div class="text" id="text_' + i + '" >' +
         ui_text.substring(0, x) +
        '<span id="cursor">' + ui_text.substring(x, x+1) +
        '</span>' + ui_text.substring(x+1, ui_text.length) +
        '</div>' +
        '</div>');
    }
}



function make_ui_text_with_cursor_insert_mode(ui_text){
    if(ui_text){
        vim.cursor.x++;

        return  ui_text.substring(0, vim.cursor.x) +
        '<span id="cursor_insert">' + ui_text.substring(vim.cursor.x, vim.cursor.x+1) +
        '</span>' + ui_text.substring(vim.cursor.x+1, ui_text.length) +
        '</div>';
    }
}



function add_unused_line(){
    while( window.innerHeight > editor.clientHeight + 249){
        editor.innerHTML += '<div class="number" ></div><div class="text">~</div>';
    }
}
