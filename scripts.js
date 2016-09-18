$(document).ready(function () {

  // UI variables
  var time_origin_game, time_origin_human, time_origin_click; //timers origins
  var game, game_on = false, strict = false, fail = false;
  //                  green      red        yellow     blue
  var cols_on =     ['#13FF7C', '#FF4C4C', '#FED93F', '#1C8CFF'];
  var cols_off =    ['#00A74A', '#9F0F17', '#CCA707', '#094A8F'];
  var sound_files = ['green.mp3', 'red.mp3', 'yellow.mp3', 'blue.mp3', 'lost.mp3'];
  var sounds = [];
  for (var i = 0; i < sound_files.length; i++) {
    var sound = new Audio('./tones/'+sound_files[i]);
    sounds.push(sound);
  }

  // helper functions that tackle interface elements
  function switch_color(i) { // tested: OK
    // switches color of button 'i' for 0.5 secs
    $('#b'+i).css('background-color',cols_on[i]);
    if (fail === true) {
      sounds[4].play();
      fail = false;
    } else {
      sounds[i].play();
    }
    setTimeout(function () {
      //console.log('changing color on: ' + i);
      console.log('Switch trigger: '+ Math.round((new Date() - time_origin_game)/100));
      $('#b'+i).css('background-color',cols_off[i]);
    }, 500);
  }

  function change_buttons_state(state, game) {  // tested:  OK
    // activates/deactivates buttons functionality binding / unbinding to event handlers
    if (state === 'on') {
      console.log('change state to on');
      for (var i=0; i < 4; i++) {
        $('#b'+i).bind('click', {'msg': game}, click_sector);  // reference to game object passed to handlers
      }
    } else {
      console.log('change state to off');
      for (var i=0; i < 4; i++) {
        $('#b'+i).unbind('click');
      }
    }
  }

  function click_sector(evt) { // tested: OK
    // switches color and adds button id to human sequence inside game object.
    time_origin_click = new Date();
    var num = evt.target.id[1];
    console.log('Clicked: '+num);
    switch_color(num);
    evt.data.msg.human_seq.push(parseInt(num));
    console.log('Human sequence: '+evt.data.msg.human_seq);
  }

  //Method to check array equality
  if(Array.prototype.equals)
      console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
  // attach the .equals method to Array's prototype to call it on any array
  Array.prototype.equals = function (array) {
      // if the other array is a falsy value, return
      if (!array)
          return false;

      // compare lengths - can save a lot of time
      if (this.length != array.length)
          return false;

      for (var i = 0, l=this.length; i < l; i++) {
          // Check if we have nested arrays
          if (this[i] instanceof Array && array[i] instanceof Array) {
              // recurse into the nested arrays
              if (!this[i].equals(array[i]))
                  return false;
          }
          else if (this[i] != array[i]) {
              // Warning - two different object instances will never be equal: {x:20} != {x:20}
              return false;
          }
      }
      return true;
  }
  // Hide method from for-in loops
  Object.defineProperty(Array.prototype, "equals", {enumerable: false});

  // Class to represent a complete game process
  // strict: boolean -> flag to signal if strict mode is on
  function Game(strict) {

    this.comp_seq = [];
    this.human_seq = [];
    var failed = false;
    var game_timer;
    var parent = this;


    function comp_show_cicle() { //tested: OK
      // Cicle through the computer sequence with a 1s interval
      var i = 0;
      //time_origin = new Date();
      interval = setInterval(function () {
          console.log('Show trigger: '+Math.round((new Date() - time_origin_game)/100));
          switch_color(parent.comp_seq[i]);
          i++;
          //comp_update();
          if (i >= parent.comp_seq.length) {
            clearInterval(interval);
          }
      }, 1000);
    }

    function update_counter() {
      if (parent.comp_seq.length < 10) {
        counter = '0'+ parent.comp_seq.length;
      } else counter = parent.comp_seq.length;
      $('#count').text(counter);
    }

    function comp_update() { // tested: OK
      // Add a random number in the range [0, 3] to computer sequence
      var counter;
      parent.comp_seq.push(Math.floor(Math.random()*3.99));
      update_counter();
    }

    function human_input() {
      time_origin_human = new Date()
      //clearTimeout(game_timer);
      setTimeout(function () {}, 500); // wait 0.5 seconds
      change_buttons_state('on', game); // activate playing buttons

      var human_input_interval = setInterval(function () { //periodic sweeping and comparing of sequences
        if (parent.human_seq.equals(parent.comp_seq) && parent.comp_seq.length > 0) {
          console.log("right path: "+parent.human_seq+'  '+ parent.comp_seq+'   '+parent.human_seq.equals(parent.comp_seq));
          parent.human_seq = [];
          clearInterval(human_input_interval);
          change_buttons_state('off', game);
          setTimeout(function () {
            comp_update();
            main_cicle();
          }, 500);
          //game_timer = setTimeout(main_cicle,1000*parent.comp_seq.length);
        } else if (/*(parent.human_seq.length >= parent.comp_seq.length
                   && !parent.human_seq.equals(parent.comp_seq)) ||*/
                   ((parent.human_seq.length > 0) && (parent.human_seq[parent.human_seq.length-1] !== parent.comp_seq[parent.human_seq.length-1]))) {
          console.log('wrong path: '+parent.human_seq+'  '+ parent.comp_seq+'   '+parent.human_seq.equals(parent.comp_seq));
          parent.human_seq = [];
          sounds[4].play();
          sounds[4].play();
          clearInterval(human_input_interval);
          change_buttons_state('off', game);
          $('#count').text('!!');
          if (strict === true) {
            console.log("back to 0");
            parent.comp_seq = [];
            comp_update();
          }
          setTimeout(function () {
            update_counter();
            main_cicle();
          }, 1500);

          //game_timer = setTimeout(main_cicle,1000*parent.comp_seq.length);
          //$('#red_button').click();
        }
        if (Math.round((new Date() - time_origin_click)) > 30000) {
          console.log("time exceded");

          //$('#red_button').click();
          clearInterval(human_input_interval);
          failed = true;
          parent.human_seq = [];
          time_origin_game = new Date();
          //game_timer = setTimeout(main_cicle,1000*parent.comp_seq.length);
        }
        console.log('iterate at: '+Math.round((new Date() - time_origin_game)/100));
      }, 500);

    }

    function main_cicle() {
      comp_show_cicle();
      human_input();
    }


    this.start = function () {
      time_origin_game = new Date();
      parent.comp_seq = [];
      parent.human_seq = [];
      comp_update();
      main_cicle();

    } // end of start function

    this.toStr = function () {
      return "Game object ";
    }

  } //end of Game class definition

  // Event handlers
  $('#sw').click(function () {
    if (!game_on) {
      game_on = true;
      $('#s_off').css({'background-color':'#222222'});
      $('#s_on').css({'background-color':'#3193DE'});
      $('#count').css({'color':'#DC0D29'});
    } else {
      game_on = false;
      $('#s_off').css({'background-color':'#3193DE'});
      $('#s_on').css({'background-color':'#222222'});
      $('#count').css({'color':'#32050C'});
      $('#strict_led').css({'background-color':'#32050C'});
    }
  });

  $('#yellow_button').click(function () {
    if (game_on) {
      strict = !strict;
      console.log('strict: '+strict);
      if (strict) {
        $('#strict_led').css({'background-color':'#DC0D29'});
      } else {
        $('#strict_led').css({'background-color':'#32050C'});
      }
    }
  });

  $('#red_button').click(function () {
    if (game_on) {
      console.log("starting game");
      game = new Game(strict);
      //change_buttons_state('on', game); // make buttons active. must be changed
      game.start();
    }
  });

{
// PULSED BUTTON COLORS
// #13FF7C : light green_button
// #FF4C4C : ligth red_button
// #FED93F : light yellow_button
// #1C8CFF : light blue_button


// SOUNDS FREQUENCIES
// Green – 415 Hz
// Red – 310 Hz
// Yellow – 252 Hz
// Blue – 209 Hz
// losing 'razz' sound which is 42 Hz.
}

});
