const audio_blindlift = new Audio(__dirname + '/../../sounds/w10_login.mp3');
const Datastore = require('nedb');

const electron = require('electron');
const {remote, ipcRenderer} = require('electron');
const app = electron.app || electron.remote.app;
const appDir = app.getPath('userData');

const tokens = new Datastore({ filename: appDir + '/db/tokens.db', autoload: true });
const players = new Datastore({ filename: appDir + '/db/players.db', autoload: true });
const game = new Datastore({ filename: appDir + '/db/game.db', autoload: true });

let clock = document.getElementById('clockdiv');
let hoursSpan = clock.querySelector('.hours');
let minutesSpan = clock.querySelector('.minutes');
let secondsSpan = clock.querySelector('.seconds');

let gameID = 0;

let smallBlindPlayerNum, bigBlindPlayerNum;
let smallBlindPlayerIdx, bigBlindPlayerIdx;

let playersplaying = 0;

let playersData = []; /*  name, rebuys, ingame */

let tokensData = []; /* value, color, piece */

let tokenperplayeratstart = 0;

let blindtype, blindlift, smallblind, bigblind;

let bets, cash;

let dealer;

let i;

game.find({}).sort({ _id: -1 }).exec(function (err, docs) {
  docs.forEach(function(doc) {

    gameID = doc._id;

    let playersRebuys = doc._rebuys;
    
    blindtype = doc._blindtype;

    blindlift = doc._blindlift;

    let playerIDsArr = doc._players.split(',');
    let tokenIDsArr = doc._tokens.split(',');

    /* get playing token ids */
    let findTokenIDsObjs = [];

    for (i = 0; i < tokenIDsArr.length; i++) {
      let findTokenIDsObj = { _id: parseInt(tokenIDsArr[i]) }
      findTokenIDsObjs.push(findTokenIDsObj);
    }

    let findTokenIDs = { $or: findTokenIDsObjs }

    /* get playing player ids */
    let findPlayerIDsObjs = [];

    for (i = 0; i < playerIDsArr.length; i++) {
      let findPlayerIDsObj = { _id: parseInt(playerIDsArr[i]) }
      findPlayerIDsObjs.push(findPlayerIDsObj);
    }

    let findPlayerIDs = { $or: findPlayerIDsObjs }

    playersplaying = playerIDsArr.length;
    
    /* get datas with  the collected ids */
    getTokens(findTokenIDs,playerIDsArr.length).then( () => {
      
      getPlayers(findPlayerIDs, playersRebuys).then( () => { 

        endtime = blindlift * 60 * 1000;
        updateClock();
    
        smallblind = tokensData[0].value;
        document.getElementById('smallblind').innerHTML = smallblind;
    
        bigblind = tokensData[1].value;
        document.getElementById('bigblind').innerHTML = bigblind;
    
        bets = doc._bets;
        document.getElementById('bets').innerHTML = bets;
    
        cash = doc._bets * playerIDsArr.length;
        document.getElementById('cash').innerHTML = cash;

        // roll the 1st dealer, set blinds
        dealer = Math.floor((Math.random() * playersplaying) + 1);
        setDealer();

        handleClock();

        console.log("Game create successfully. ID: " + gameID);
        console.log("Game array:");
        console.log(docs);
        console.log("Players array:");
        console.log(playersData);
        console.log("Tokens array:");
        console.log(tokensData);

      });

    });

  });
});

/*****************************************
*************** Functions ****************
*****************************************/

function getPlayers(findPlayerIDs, playersRebuys) {
  let playerNum = 0;
  return new Promise ( (resolve, reject) => {
    /* players.find(findPlayerIDs).sort({ _name: 1 }).exec(function(err, docs) { */
    players.find(findPlayerIDs, function(err, docs) {
      docs.forEach(function(d) {

        playerNum++;

        let playerData = {
          name: d._name,
          rebuys: playersRebuys,
          ingame: true
        };

        playersData.push(playerData);

        document.getElementById('player' + playerNum + 'name').innerHTML = d._name;
        document.getElementById('player' + playerNum + 'rebuystext').innerHTML = i18n.__('rebuys') + ': ';
        document.getElementById('player' + playerNum + 'rebuys').innerHTML = playersRebuys;
        document.getElementById('player' + playerNum + 'rebuybutton').innerHTML = i18n.__('rebuy');
        document.getElementById('player' + playerNum + 'droppedoutbutton').innerHTML = i18n.__('droppedout');

      });
      resolve();
    });
  });
}

function getTokens(findTokenIDs, playersplaying) {
  let tokenNum = 0;
  return new Promise ( (resolve, reject) => {
    tokens.find(findTokenIDs).sort({ _value: 1, _piece: 1 }).exec( function (err, docs) {
      docs.forEach(function(d) {

        tokenNum++;

        let tokenData = {
          value: d._value,
          color: d._color,
          piece: d._piece
        };

        tokensData.push(tokenData);

        switch(tokenNum) {
          case 1:
            let token1perplayer = Math.floor(d._piece / playersplaying); 
            let token1perplayertotalvalue = d._value * token1perplayer;

            document.getElementById('token1div').innerHTML += '<br />' + d._value + '$' + '<br />' + token1perplayer + '<span class="tinitext">' + i18n.__('pcs') + '</span><br />' + token1perplayertotalvalue + '$';
            document.getElementById('token1img').style.background = d._color;
            tokenperplayeratstart += token1perplayertotalvalue;
            break;
          case 2:
            let token2perplayer = Math.floor(d._piece / playersplaying); 
            let token2perplayertotalvalue = d._value * token2perplayer;

            document.getElementById('token2div').innerHTML += '<br />' + d._value + '$' + '<br />' + token2perplayer + '<span class="tinitext">' + i18n.__('pcs') + '</span><br />' + token2perplayertotalvalue + '$';
            document.getElementById('token2img').style.background = d._color;
            tokenperplayeratstart += token2perplayertotalvalue;
            break;
          case 3:
            let token3perplayer = Math.floor(d._piece / playersplaying); 
            let token3perplayertotalvalue = d._value * token3perplayer;

            document.getElementById('token3div').innerHTML += '<br />' + d._value + '$' + '<br />' + token3perplayer + '<span class="tinitext">' + i18n.__('pcs') + '</span><br />' + token3perplayertotalvalue + '$';
            document.getElementById('token3img').style.background = d._color;
            tokenperplayeratstart += token3perplayertotalvalue;
            break;
          case 4:
            let token4perplayer = Math.floor(d._piece / playersplaying); 
            let token4perplayertotalvalue = d._value * token4perplayer;

            document.getElementById('token4div').innerHTML += '<br />' + d._value + '$' + '<br />' + token4perplayer + '<span class="tinitext">' + i18n.__('pcs') + '</span><br />' + token4perplayertotalvalue + '$';
            document.getElementById('token4img').style.background = d._color;
            tokenperplayeratstart += token4perplayertotalvalue;
            break;
          case 5:
            let token5perplayer = Math.floor(d._piece / playersplaying); 
            let token5perplayertotalvalue = d._value * token5perplayer;

            document.getElementById('token5div').innerHTML += '<br />' + d._value + '$' + '<br />' + token5perplayer + '<span class="tinitext">' + i18n.__('pcs') + '</span><br />' + token5perplayertotalvalue + '$';
            document.getElementById('token5img').style.background = d._color;
            tokenperplayeratstart += token5perplayertotalvalue;
            
            document.getElementById('tokensperplayer').innerHTML = tokenperplayeratstart + '$';
            break;
        }

      });
      resolve();
    });
  });
}

module.exports = {
  handleClock,
  setDealer,
  handleDroppedOut,
  handleRebuy
};

let timeinterval, endtime;
let clockbutton = document.getElementById('clockbutton');

function handleClock() {

  let clockstate = clockbutton.getAttribute("data-state");

  if (clockstate == 'stopped') {
    timeinterval = setInterval(updateClock, 1000);
    clockbutton.setAttribute("data-state", "running");
    removeClass(clockbutton, 'uk-button-primary');
    addClass(clockbutton, 'uk-button-danger');
    clockbutton.innerHTML = i18n.__('pauseclock');
  } else {
    clearInterval(timeinterval);
    clockbutton.setAttribute("data-state", "stopped");
    removeClass(clockbutton, 'uk-button-danger');
    addClass(clockbutton, 'uk-button-primary');
    clockbutton.innerHTML = i18n.__('startclock');
  }
  
}
function updateClock() {

  let seconds = Math.floor((endtime / 1000) % 60);
  let minutes = Math.floor((endtime / 1000 / 60) % 60);
  let hours = Math.floor((endtime / (1000 * 60 * 60)) % 24);

  hoursSpan.innerHTML = ('0' + hours).slice(-2);
  minutesSpan.innerHTML = ('0' + minutes).slice(-2);
  secondsSpan.innerHTML = ('0' + seconds).slice(-2);

  if (endtime <= 0) {
    
    handleClock(); /* stop clock */
    clearInterval(timeinterval);
    /* start new round */
    blindLift();
    audio_blindlift.play();
    endtime = blindlift * 60 * 1000;
    updateClock();
    handleClock();

  }

  endtime = endtime - 1000;

}

function setDealer() {

  let i2 = 0;
  for (i = 0; i < playersData.length; i++) {
    i2 = i + 1;
    document.getElementById('player' + i2 + 'dealerbutton').style.display = 'none';
  }

  if (smallBlindPlayerNum !== undefined && bigBlindPlayerNum !== undefined) {
    document.getElementById('player' + smallBlindPlayerNum + 'name').innerHTML = '';
    document.getElementById('player' + bigBlindPlayerNum + 'name').innerHTML = '';
  }

  let nextDealerNum = dealer + 1;
  let nextDealerIdx = dealer;

  if (nextDealerNum > playersplaying) {
    nextDealerNum = 1;
    nextDealerIdx = 0;
  }

  if (playersData[nextDealerIdx].ingame) {
    dealer = nextDealerNum;
  } else {

    for (i = 0; i < playersplaying; i++) {

      nextDealerNum++;
      nextDealerIdx++;

      if (nextDealerNum > playersplaying) {
        nextDealerNum = 1;
        nextDealerIdx = 0;
      }

      if (playersData[nextDealerIdx].ingame) {
        dealer = nextDealerNum;
        break;
      }

    }

  }

  document.getElementById('player' + nextDealerNum + 'dealerbutton').style.display = 'block';

  ipcRenderer.sendToHost('uknofify-dealing', 'warning', i18n.__('dealer') + ": " + playersData[nextDealerIdx].name);
      
  smallBlindPlayerNum = dealer + 1;
  smallBlindPlayerIdx = dealer;

  if(smallBlindPlayerNum > playersplaying) {
    smallBlindPlayerNum = 1;
    smallBlindPlayerIdx = 0;
  }

  if (!playersData[smallBlindPlayerIdx].ingame) {

    for (i = 0; i < playersplaying; i++) {

      smallBlindPlayerNum++;
      smallBlindPlayerIdx++;

      if (nextDealerNum > playersplaying) {
        smallBlindPlayerNum = 1;
        smallBlindPlayerIdx = 0;
      }

      if (playersData[smallBlindPlayerIdx].ingame) {
        break;
      }

    }

  }

  document.getElementById('player' + smallBlindPlayerNum + 'name').innerHTML += ' <span class="uk-badge"> Sb </span>';

  ipcRenderer.sendToHost('uknofify-blind-call', 'primary', i18n.__('smallblind') + '(' + smallblind + '): ' + playersData[smallBlindPlayerIdx].name);

  bigBlindPlayerNum = smallBlindPlayerNum + 1;
  bigBlindPlayerIdx = smallBlindPlayerNum;
  
  if(bigBlindPlayerNum > playersplaying) {
    bigBlindPlayerNum = 1;
    bigBlindPlayerIdx = 0;
  }

  if (!playersData[bigBlindPlayerIdx].ingame) {

    for (i = 0; i < playersplaying; i++) {

      bigBlindPlayerNum++;
      bigBlindPlayerIdx++;

      if (nextDealerNum > playersplaying) {
        bigBlindPlayerNum = 1;
        bigBlindPlayerIdx = 0;
      }

      if (playersData[bigBlindPlayerIdx].ingame) {
        break;
      }

    }

  }

  document.getElementById('player' + bigBlindPlayerNum + 'name').innerHTML += ' <span class="uk-badge"> Bb </span>';

  ipcRenderer.sendToHost('uknofify-blind-call', 'primary', i18n.__('bigblind') + '(' + bigblind + '): ' + playersData[bigBlindPlayerIdx].name);

}

function handleDroppedOut(playernum) {
  let playeridx = playernum - 1;

  let playerbox = document.getElementById('player' + playernum + 'box');

  if (playersData[playeridx].ingame) {
    
    addClass(playerbox, "uk-card-secondary");

    playersplaying--;
    playersData[playeridx].ingame = false;

    if (playersplaying <= 1) {
      alert(i18n.__('gameover') + ' ' + i18n.__('prize') + ': ' + cash);
      document.location.href = 'setupmatch.html';
    }

  }

}

function handleRebuy(playernum) {

  let playeridx = playernum - 1;

  let playerbox = document.getElementById('player' + playernum + 'box');

  if (playersData[playeridx].rebuys > 0 && !playersData[playeridx].ingame) {

    playersData[playeridx].rebuys -= 1;

    document.getElementById('player' + playernum + 'rebuys').innerHTML = playersData[playeridx].rebuys;

    cash += bets;
    document.getElementById('cash').innerHTML = cash;

    ipcRenderer.sendToHost('uknofify-rebuy', 'success', i18n.__('rebuy') + ": " + playersData[playeridx].name);

    removeClass(playerbox, "uk-card-secondary");
    addClass(playerbox, "uk-card-default");

    playersplaying++;
    playersData[playeridx].ingame = true;

  } else {
    ipcRenderer.sendToHost('uknofify-rebuy', 'danger', i18n.__('rebuy') + " " + playersData[playeridx].name + " " + i18n.__('failed') + "!");
  }

}

function blindLift() {

  switch(blindtype) {
    case "fix-blinds":
      /* nothing to change */
      break;
    case "gradual-blinds":

      smallblind = bigblind;

      switch(bigblind) {
        case tokensData[1].value:
          bigblind = tokensData[2].value;
          break;
        case tokensData[2].value:
          bigblind = tokensData[3].value;
          break;
        case tokensData[3].value:
          bigblind = tokensData[4].value;
          break;
        case tokensData[4].value:
          bigblind = bigblind + tokensData[3].value;
          break;

        default:
          bigblind = bigblind + tokensData[3].value;
          break;
      }
      break;
    case "tokenpair-blinds":

      switch(bigblind) {
        case tokensData[1].value:
          smallblind = tokensData[2].value;
          bigblind = tokensData[3].value;
          break;
        case tokensData[3].value:
          smallblind = tokensData[4].value;
          bigblind = smallblind * 2;
          break;

        default:
          smallblind = bigblind * 2;
          bigblind = smallblind * 2;
          break;
      }
      break;
  }

  document.getElementById('smallblind').innerHTML = smallblind;
  document.getElementById('bigblind').innerHTML = bigblind;

}

function hasClass(elem, className) {
  if (elem.classList) {
    return elem.classList.contains(className);
  } else {
    return !!elem.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
  }
}
function addClass(elem, className) {
  if (elem.classList) {
    elem.classList.add(className);
  } else if (!hasClass(elem, className)) {
    elem.className += " " + className;
  }
}
function removeClass(elem, className) {
  if (elem.classList) {
    elem.classList.remove(className);
  } else if (hasClass(elem, className)) {
    let reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    elem.className=elem.className.replace(reg, ' ');
  }
}
