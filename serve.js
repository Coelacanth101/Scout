const { Console } = require("console");
const { emit } = require("process");

//サーバー用変数
const app  = require("express")();
const http = require("http").createServer(app);
const io   = require("socket.io")(http);
const DOCUMENT_ROOT = __dirname + "/static";
const SECRET_TOKEN = "abcdefghijklmn12345";

app.get("/", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/Scout.html");
});

app.get("/:file", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/" + req.params.file);
});

/**
 * 3000番でサーバを起動する
 */
 http.listen(process.env.PORT || 3000, ()=>{
  console.log("listening on *:3000");
});


/*------------------------------------------
------------------------------------------*/
//ゲーム用変数
let playersName = ['','','','','']
let allCards = [];
let players = [];

class Card{
  constructor(topNumber, bottomNumber){
      this.topNumber = topNumber;
      this.bottomNumber = bottomNumber;
      this.number = topNumber;
      this.rnumber = bottomNumber;
      this.position = 'upright';
      this.name = `${topNumber}-${bottomNumber}`;
      this.index;
      this.holder;
      this.before = {number:topNumber, rnumber:bottomNumber, position:'upright', index:'', holder:''}
  };
  reverse(){
      if(this.position === 'upright'){
          this.number = this.bottomNumber;
          this.rnumber = this.topNumber;
          this.position = 'reverse';
      } else {
          this.number = this.topNumber;
          this.rnumber = this.bottomNumber;
          this.position = 'upright';
      };
  };
  shuffle(){
      let r = Math.random()
      if(r >= 0.5){
          this.reverse();
      }
  };
  recordLog(){
    this.before.number = this.number;
    this.before.rnumber = this.rnumber
    this.before.position = this.position
    this.before.index = this.index
    this.before.holder = this.holder
  };
  undo(){
    this.number = this.before.number;
    this.rnumber = this.before.rnumber
    this.position = this.before.position
    this.index = this.before.index
    this.holder = this.before.holder
  }
}

class Player{
  constructor(name, number, socketID){
      this.name = name;
      this.number = number;
      this.socketID = socketID
      this.hand = [];
      this.gain = 0;
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.doubleAction = 1;
      this.chip = 0;
      this.ready = false
      this.candidate =''
      this.scoutplace = [];
      this.action = '';
      this.score = 0;
      this.lastScore = 0;
      this.before = {hand:[], gain:0, combination:{cards:[], valid:true, type:'', owner:this}, doubleAction:1, chip:0, candidate:'', scoutplace:[], action:'',score:0}
  };
  reverseHand(){
      if(game.turn === 0){
          for(let card of this.hand){
              card.reverse();
          };
          let player = server.copyOf(this)
          display.myHand(player)
      };
  };
  choice(card){
      if(this.combination.cards.length === 0){
          this.combination.cards.push(card)
          for(let c of this.combination.cards){
            display.log(c.name)
          }
      }else{
          for(let item of this.combination.cards){
              if(item.index > card.index){
                  this.combination.cards.splice(this.combination.cards.indexOf(item), 0, card);
                  return;
              };
          };
          this.combination.cards.push(card);
      };
      this.checkCombination()
  };
  cancel(card){
      server.discard(card, this.combination.cards);
      this.checkCombination()
  };
  checkCombination(){
      if(this.combination.cards.length >= 2){
          //隣り合ったカードか確認
          this.combination.valid = true;
          let i = 1
          while(i <= this.combination.cards.length-1){
              if(this.combination.cards[i].index !== this.combination.cards[i-1].index + 1 && this.combination.cards[i].index !== this.combination.cards[i-1].index - 1){
                  this.combination.valid = false;
                  this.combination.type = ''
                  return;
              }
              i += 1;
          }
          //同じ数字の組み合わせか確認
          i = 1;
          while(i <= this.combination.cards.length-1){
              if(this.combination.cards[i].number !== this.combination.cards[i-1].number){
                  this.combination.valid = false;
                  this.combination.type = ''
              }
              i += 1;
          }
          if(this.combination.valid === true){
              this.combination.type = 'set'
          }else{
              this.combination.valid = true
              //昇順か確認
              i = 1;
              while(i <= this.combination.cards.length-1){
                  if(this.combination.cards[i].number !== this.combination.cards[i-1].number + 1){
                      this.combination.valid = false;
                      this.combination.type = ''
                  };
                  i += 1;
              };
              if(this.combination.valid === true){

                  this.combination.type = 'sequence'
              }else{
                  this.combination.valid = true
                  //降順か確認
                  i = 1;
                  while(i <= this.combination.cards.length-1){
                      if(this.combination.cards[i].number !== this.combination.cards[i-1].number - 1){
                          this.combination.valid = false;
                          this.combination.type = ''
                      }
                      i += 1;
                  }
                  if(this.combination.valid === true){
                      this.combination.type = 'reversesequence'
                  }
              }
          }
      }else if(this.combination.cards.length === 1){
          this.combination.type = 'single'
          this.combination.valid = true
      }else{
          this.combination.type = ''
          this.combination.valid = false;
      }
  };
  playCards(){
      display.backgroundAllDelete()
      if(this.combination.valid && game.combiJudge(this.combination, game.fieldCards)){
          server.recordLog();
          if(this.combination.type === 'reversesequence'){
            let arr = []
            for(let item of this.combination.cards){
                arr.unshift(item)
            }
            this.combination.cards = arr
            this.combination.type = 'sequence'
          };
          this.gain += game.fieldCards.cards.length
          for(let item of this.combination.cards){
              item.index = this.combination.cards.indexOf(item)
          }
          game.fieldCards = this.combination;
          for(let item of this.combination.cards){
              server.discard(item, this.hand)
          }
          for(let item of this.hand){
              item.index = this.hand.indexOf(item)
          }
          this.action = ''
          let player = {number:'',socketID:'',hand:[], name:'', gain:0, chip:0, doubleAction:1, score:0}
          player.number = this.number;
          player.socketID = this.socketID;
          player.name = this.name
          player.gain = this.gain;
          player.chip = this.chip;
          player.doubleAction = this.doubleAction;
          player.score = this.score
          for(c of this.hand){
            let card = {name:'', index:'', position:''}
            card.name = c.name;
            card.index = c.index;
            card.position = c.position;
            player.hand.push(card)
          }
          display.gain(player)
          display.myHand(player);
          display.field();
          if(this.hand.length === 0){
              game.winner = this
              game.roundEnd();
          }else{
              game.turnEnd();
          };
      };
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.candidate = '';
      this.scoutplace = []
  };
  turnEnd(){
    server.recordLog()
    display.backgroundAllDelete()
    this.action = '';
    this.combination = {cards:[], valid:true, type:'', owner:this};
    this.candidate = '';
    this.scoutplace = [];
    game.turnEnd();
  };
  startOK(){
      this.ready = true;
      game.startCheck()
  };
  choiceCandidate(card){
      if(!this.candidate){
          this.candidate = card;
          let fc = server.copyOfCard(card)
          display.fieldCardRed(fc)
      }else if(this.candidate !== card){
          this.candidate = card;
          let fc = server.copyOfCard(card)
          display.fieldCardRed(fc)
      }else{
          this.candidate = '';
          let fc = server.copyOfCard(card)
          display.fieldCardDelete(fc)
      }
  };
  choiceScoutPlace(card){
      if(this.scoutplace.includes(card)){
          server.discard(card, this.scoutplace);
      }else if(this.scoutplace.length === 0){
          this.scoutplace.push(card);
      }else if(this.scoutplace.length === 1){
          if(card.index === this.scoutplace[0].index-1){
              this.scoutplace.unshift(card);
          }else if(card.index === this.scoutplace[0].index+1){
              this.scoutplace.push(card);
          }
      }
  };
  stayScout(){
      display.backgroundAllDelete()
      if(this.combination.cards.length >= 3){
          this.combination = {cards:[], valid:true, type:'', owner:this};
          this.candidate = '';
          this.scoutplace = []
          return
      }
      if(this.action !== 'onlyplay'){
          if(this.candidate && this.combination.cards.length){
              if(this.combination.cards.length === 2 && this.combination.cards[0].index === this.combination.cards[1].index-1){
                  server.recordLog();
                  this.hand.splice(this.combination.cards[1].index, 0, this.candidate);
                  this.candidate.holder = this;
              }else if(this.combination.cards.length === 1 && this.combination.cards[0].index === 0){
                  server.recordLog();
                  this.hand.unshift(this.candidate);
                  this.candidate.holder = this;
              }else if(this.combination.cards.length === 1 && this.combination.cards[0].index === this.hand.length-1){
                  server.recordLog();
                  this.hand.push(this.candidate);
                  this.candidate.holder = this;
              }else{
                  this.combination = {cards:[], valid:true, type:'', owner:this};
                  this.candidate = '';
                  this.combination.cards = []
                  display.backgroundAllDelete()
                  return
              }
              for(let item of this.hand){
                  item.index = this.hand.indexOf(item)
              }
              server.discard(this.candidate, game.fieldCards.cards);
              display.myHand(server.copyOf(this));
              display.field();
              game.fieldCards.owner.chip += 1
              display.chip(server.copyOf(game.fieldCards.owner))
              if(this.action === ''){
                  game.turnEnd()
              }else{
                  this.action = 'onlyplay'
              }
          }
      }
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.candidate = '';
      this.scoutplace = []
  };
  reverseScout(){
      display.backgroundAllDelete()
      if(this.combination.cards.length >= 3){
        this.combination = {cards:[], valid:true, type:'', owner:this};
        this.candidate = '';
        this.scoutplace = []
        return
      }
      if(this.action !== 'onlyplay'){
          if(this.candidate && this.combination.cards.length){
              if(this.combination.cards.length === 2 && this.combination.cards[0].index === this.combination.cards[1].index-1){
                  server.recordLog();
                  if(this.candidate){
                    this.candidate.reverse()
                  }
                  this.hand.splice(this.combination.cards[1].index, 0, this.candidate);
                  this.candidate.holder = this;
              }else if(this.combination.cards.length === 1 && this.combination.cards[0].index === 0){
                  server.recordLog();
                  if(this.candidate){
                    this.candidate.reverse()
                  }
                  this.hand.unshift(this.candidate);
                  this.candidate.holder = this;
              }else if(this.combination.cards.length === 1 && this.combination.cards[0].index === this.hand.length-1){
                  server.recordLog();
                  if(this.candidate){
                    this.candidate.reverse()
                  }
                  this.hand.push(this.candidate);
                  this.candidate.holder = this;
              }else{
                  this.combination = {cards:[], valid:true, type:'', owner:this};
                  this.candidate = '';
                  this.combination.cards = []
                  display.backgroundAllDelete()
                  return
              }
              for(let item of this.hand){
                  item.index = this.hand.indexOf(item)
              }
              server.discard(this.candidate, game.fieldCards.cards);
              display.myHand(server.copyOf(this));
              display.field();
              game.fieldCards.owner.chip += 1
              display.chip(server.copyOf(game.fieldCards.owner))
              if(this.action === ''){
                  game.turnEnd()
              }else{
                  this.action = 'onlyplay'
              }
          }
      }
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.candidate = '';
      this.scoutplace = []
  };
  double(){
    /*server.recordLog();*/
      if(this.doubleAction === 1 && game.turnPlayer === this){
          this.action = 'double'
          this.doubleAction -= 1
          display.doubleaction(server.copyOf(this))
      }
  };
  reset(){
      this.hand = [];
      this.gain = 0;
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.doubleAction = 1;
      this.chip = 0;
      this.ready = false;
      this.candidate = '';
      this.scoutplace = [];
      this.action = '';
  };
  newGame(){
      this.hand = [];
      this.gain = 0;
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.doubleAction = 1;
      this.chip = 0;
      this.ready = false;
      this.candidate = '';
      this.scoutplace = [];
      this.action = '';
      this.score = 0;
      this.lastScore = 0;
  };
  recordLog(){
    this.before.hand = [];
    for(c of this.hand){
      this.before.hand.push(c);
    }
    this.before.combination = {cards:[], valid:true, type:'', owner:this}
    this.before.gain = this.gain;
    this.before.doubleAction = this.doubleAction;
    this.before.chip = this.chip;
    this.before.candidate = '';
    this.before.scoutplace = [];
    this.before.action = this.action;
    this.before.score = this.score;
  };
  undo(){
    this.hand = [];
    for(c of this.before.hand){
      this.hand.push(c);
    }
    this.combination = {cards:[], valid:true, type:'', owner:this}
    this.gain = this.before.gain;
    this.doubleAction = this.before.doubleAction;
    this.chip = this.before.chip;
    this.candidate = '';
    this.scoutplace = [];
    this.action = this.before.action;
    this.score = this.before.score;
  }

}

const game = {allCards:allCards, usingCards:[], players:players, round:1, fieldCards:{cards:[], valid:true, type:'', owner:''}, turnPlayer:'', startPlayer:'', turn:0, active:true, winner:'',champion:'', phase:'nameinputting', before:{allCards:allCards, usingCards:[], players:players, round:1, fieldCards:{cards:[], valid:true, type:'', owner:''}, turnPlayer:'', startPlayer:'', turn:0, active:true, winner:'',champion:'', phase:'nameinputting'},
    deckMake(){
        this.usingCards = []
        if(this.players.length === 3){
            let i = 1;
            while(i <= this.allCards.length){
                if(this.allCards[i-1].bottomNumber !== 10){
                    this.usingCards.push(this.allCards[i-1]);
                }
                i += 1;
            };
        };
        if(this.players.length === 4){
            this.usingCards = this.allCards.slice(0, this.allCards.length-1)
        }
        if(this.players.length === 5){
            this.usingCards = this.allCards.slice(0, this.allCards.length)
        }
    },
    deal(){
        let n;
        switch(this.players.length){
            case 3:
                n = 12;
                break;
            case 4:
                n = 11;
                break;
            case 5:
                n = 9;
                break;
        }
        let arr = this.usingCards.slice(0, this.usingCards.length)
        for(let p of this.players){
            let i = 1;
            while(i <= n){
                let randomNumber = Math.floor(Math.random()*arr.length);
                let card = arr[randomNumber]
                card.index = i-1
                card.shuffle();
                p.hand.push(card);
                card.holder = p;
                if(card.name === '1-2' && this.round === 1){
                    this.startPlayer = p;
                }
                arr.splice(randomNumber,1);
                i += 1;
            }
        }
        server.recordLog()
    },
    combiJudge(p, f){
        if(p.cards.length !== 0){
            if(p.cards.length < f.cards.length){
                return false;
            }else if(p.cards.length > f.cards.length){
                return true;
            }else if(p.type === 'sequence' && f.type === 'set'){
                return false;
            }else if(p.type === 'set' && f.type === 'sequence'){
                return true;
            }else if(p.cards[0].number > f.cards[0].number){
                return true
            }else{
                return false;
            }
        }else{
            return false;
        }
    },
    turnEnd(){
        if(this.players.indexOf(this.turnPlayer) === this.players.length-1){
            this.turnPlayer = this.players[0];
        } else {
            this.turnPlayer = this.players[this.players.indexOf(this.turnPlayer)+1];
        }
        this.turn += 1
        display.turnPlayer()
        if(this.fieldCards.owner === this.turnPlayer){
            this.winner = this.turnPlayer
            this.roundEnd();
        }
    },
    roundEnd(){
        this.active = false;
        this.turn = 0;
        game.turnPlayer = '';
        for(let p of game.players){
            if(this.winner === p){
                p.score += p.gain + p.chip
                p.lastScore = p.gain + p.chip
            }else{
                p.score += p.gain + p.chip - p.hand.length
                p.lastScore = p.gain + p.chip - p.hand.length
            }
            display.score(server.copyOf(p))
        }
        this.phase = 'roundresult'
        display.roundResult()
    },
    nextRound(){
        this.phase = 'playing'
        if(this.round === this.players.length){
            this.matchEnd();
            return
        }
        this.active = true;
        this.round += 1
        if(this.players.indexOf(this.startPlayer) === this.players.length-1){
            this.startPlayer = this.players[0];
        } else {
            this.startPlayer = this.players[this.players.indexOf(this.startPlayer)+1];
        }
        this.turnPlayer = this.startPlayer;
        this.fieldCards = {cards: Array(0), valid: true, type: '', owner: ''}
        this.winner = '';
        for(let p of this.players){
            p.reset();
        }
        this.deckMake();
        this.deal();
        display.allHands();
        display.startButton();
        display.reverseButton();
        display.field()
        display.turnPlayer();
        for(let p of game.players){
          let player = server.copyOf(p)
          display.gain(player)
          display.chip(player)
          display.doubleaction(player)
        }
    },
    matchEnd(){
        this.champion =''
        for(let p of this.players){
            if(this.champion === ''){
                this.champion = p
            }else if(p.score > this.champion.score){
                this.champion = p
            }
        };
        this.phase = 'matchresult'
        display.matchResult();
    },
    reset(){
        this.fieldCards = {cards:[], valid:true, type:'', owner:''};
        this.turnPlayer = ''; 
        this.startPlayer = '';
        this.turn = 0;
    },
    newGame(){
        for(let p of this.players){
            p.newGame();
        }
        this.round = 1
        this.fieldCards = {cards:[], valid:true, type:'', owner:''}
        this.turnPlayer = ''
        this.startPlayer = ''
        this.turn = 0
        this.active = true
        this.winner = ''
        this.champion = ''
        this.phase ='setup'
        this.deckMake();
        this.deal();
        display.name();
        display.allHands();
        display.field()
        display.hideItems();
        display.startButton();
        display.reverseButton();
        display.turnPlayer();
        display.turnPlayerDelete();
    },
    startCheck(){
        let s = true
        for(let p of this.players){
            if(p.ready === false){
                s = false;
                this.turn = 0
            }
        }
        if(s === true){
            this.turn = 1;
            this.turnPlayer = this.startPlayer;
            this.phase = 'playing'
            if(this.round !== 1){
              display.turnPlayer()
            }
        }
    },
    playerMake(){
        let i = 1
        this.players = []
        while(i <= nop){
            let name = playersName[i-1].name
            let number = i-1
            let socketID = playersName[i-1].socketID
            const player = new Player(name, number, socketID)
            this.players.push(player)
            i += 1
        }
    },
    gameStart(){
        this.playerMake();
        this.cardMake();
        this.newGame();
    },
    cardMake(){
      let t = 1;
      while(t <= 9){
        let b = 1;
        while(b <= 10){
          if(t < b){
            const card = new Card(t, b);
            allCards.push(card);
          };
          b += 1;
        };
        t += 1;
      };
    },
    initialize(){
      let i = 1
      while(i <= 5){
        playersName[i-1] = ''
        i += 1
      }
      allCards.length = 0;
      players.length = 0;
      this.usingCards = [];
      this.players = players;
      this.round = 1
      this.fieldCards = {cards:[], valid:true, type:'', owner:''}
      this.turnPlayer = ''
      this.startPlayer = ''
      this.turn = 0
      this.active = true
      this.winner = ''
      this.champion = ''
      this.phase = 'nameinputting';
    },
    takeOver(player){
      this.players[player.number].socketID = player.socketID
    },
    recordLog(){
      this.before.round = this.round;
      this.before.fieldCards.cards = [];
      for(c of this.fieldCards.cards){
        this.before.fieldCards.cards.push(c)
      }
      this.before.fieldCards.valid = this.fieldCards.valid
      this.before.fieldCards.type = this.fieldCards.type
      this.before.fieldCards.owner = this.fieldCards.owner
      this.before.turnPlayer = this.turnPlayer;
      this.before.startPlayer = this.startPlayer;
      this.before.turn = this.turn;
      this.before.active = this.active;
      this.before.winner = this.winner;
      this.before.champion = this.champion;
      this.before.phase = this.phase;
    },
    undo(){
      this.round = this.before.round;
      this.fieldCards.cards = [];
      for(c of this.before.fieldCards.cards){
        this.fieldCards.cards.push(c)
      }
      this.fieldCards.valid = this.before.fieldCards.valid
      this.fieldCards.type = this.before.fieldCards.type
      this.fieldCards.owner = this.before.fieldCards.owner
      this.turnPlayer = this.before.turnPlayer;
      this.startPlayer = this.before.startPlayer;
      this.turn = this.before.turn;
      this.active = this.before.active;
      this.winner = this.before.winner;
      this.champion = this.before.champion;
      this.phase = this.before.phase;
    }
};

const display = {
  hideItems(){
    let nop = game.players.length
    io.emit('hideItems', nop);
  },
  hideMyItems(socketID){
    let nop = game.players.length
    io.to(socketID).emit('hidemyitems', nop)
  },
  name(){
    let players = []
    for(let p of game.players){
      let player = {number:'',socketID:'',hand:[], name:'', gain:0, chip:0, doubleAction:1, score:0}
      player.number = p.number;
      player.socketID = p.socketID;
      player.name = p.name
      player.gain = p.gain;
      player.chip = p.chip;
      player.doubleAction = p.doubleAction;
      player.score = p.score
      for(c of p.hand){
        let card = {name:'', index:'', position:''}
        card.name = c.name;
        card.index = c.index;
        card.position = c.position;
        player.hand.push(card)
      }
      players.push(player)
    }
    io.emit('name', players);
  },
  gain(player){
    io.emit('gain', player);
  },
  chip(player){
    io.emit('chip', player);
  },
  doubleaction(player){
    io.emit('doubleaction', player);
  },
  score(player){
    io.emit('score', player);
  },
  allHands(){
    let players = []
    for(let p of game.players){
      let player = {number:'',socketID:'',hand:[], name:''}
      player.number = p.number;
      player.socketID = p.socketID;
      player.name = p.name
      for(c of p.hand){
        let card = {name:'', index:'', position:''}
        card.name = c.name;
        card.index = c.index;
        card.position = c.position;
        player.hand.push(card)
      }
      players.push(player)
    }
    io.emit('allHands', players);
  },
  myHand(player){
    io.emit('myHand', player)
  },
  field(){
      let cards = []
      for(c of game.fieldCards.cards){
        let card = {name:'', index:'', position:''}
        card.name = c.name;
        card.index = c.index;
        card.position = c.position
        cards.push(card)
      }
      io.emit('field', cards)
  },
  nextButtonHIde(){
      let a = ''
      io.emit('nextButtonHide', a)
  },
  roundResult(){
      let data = {round:game.round, players:server.copyOfPlayers()}
      io.emit('roundResult', data)
  },
  matchResult(){
      let data = {championname:game.champion.name, players:server.copyOfPlayers()}
      io.emit('matchResult', data)
  },
  hideResult(){
    let a = ''
    io.emit('hideResult', a)
  },
  startButton(){
    let a = ''
    io.emit('startButton', a)
  },
  reverseButton(){
    let a = ''
    io.emit('reverseButton', a)
  },
  backgroundAllDelete(){
    let a = ''
    io.emit('backgroundAllDelete', a)
  },
  backgroundDelete(card){
    io.emit('backgroundDelete', card)
  },
  backgroundRed(card){
    io.emit('backgroundRed', card)    
  },
  fieldCardRed(card){
    io.emit('fieldcardred', card)
  },
  fieldCardDelete(card){
    io.emit('fieldcarddelete', card);
  },
  initialize(){
    let a = ''
    io.emit('yesbuttonclick',a)
  },
  turnPlayer(){
    let tn = game.turnPlayer.number
    io.emit('turnplayer', tn)
  },
  turnPlayerDelete(){
    let e = ''
    io.emit('tunplayerdelete', e)
  },
  takeOver(player){
    io.emit('takeoverbuttonclick', player)
  },
  toggleTakeOver(){
    let e = ''
    io.emit('toggletakeoverbutton',e)
  },
  showStart(n){
    io.emit('showstart', n)
  },
  log(a){
    io.emit('log', a)
  },
}


const server = {
  arrayHasID(array, ID){
    for(let item of array){
      if(item.socketID === ID){
        return true;
      }
    }
    return false
  },
  discard(item,list){
    if(list.includes(item)){
        let i = list.indexOf(item);
        list.splice(i, 1);
    }
  },
  nameToCard(name){
    for(c of allCards){
        if(c.name === name){
            return c;
        };
    };
  },
  copyOf(playerobj){
    let player = {number:'',socketID:'',hand:[], name:'', gain:0, chip:0, doubleAction:1, score:0, lastScore:0}
          player.number = playerobj.number;
          player.socketID = playerobj.socketID;
          player.name = playerobj.name
          player.gain = playerobj.gain;
          player.chip = playerobj.chip;
          player.doubleAction = playerobj.doubleAction;
          player.score = playerobj.score
          player.lastScore = playerobj.lastScore
          for(c of playerobj.hand){
            let card = {name:'', index:'', position:''}
            card.name = c.name;
            card.index = c.index;
            card.position = c.position;
            player.hand.push(card)
          }
    return player
  },
  copyOfPlayers(){
    let players = []
    for(p of game.players){
      players.push(this.copyOf(p))
    }
    return players
  },
  copyOfCard(cardobj){
    let card = {name:'', index:'', position:''}
    card.name = cardobj.name;
    card.index = cardobj.index;
    card.position = cardobj.position;
    return card
  },
  recordLog(){
    for(c of game.usingCards){
      c.recordLog()
    }
    for(p of game.players){
      p.recordLog()
    }
    game.recordLog()
  },
  undo(){
    for(c of game.usingCards){
      c.undo()
    }
    for(p of game.players){
      p.undo()
    }
    game.undo()
    display.field()
    display.allHands()
    display.name()
    display.turnPlayer()
  }
}


io.on("connection", (socket)=>{
  //画面の表示
  if(game.phase === 'nameinputting'){
    io.to(socket.id).emit("nameDisplay", (playersName));
  }else if(game.phase === 'setup'){
    let socketID = socket.id
    display.name();
    display.allHands();
    display.hideMyItems(socketID);
    display.field()
  }else if(game.phase === 'roundresult'){
    display.name();
    display.allHands();
    display.hideItems();
    display.field()
    display.roundResult()
  }else if(game.phase === 'matchresult'){
    display.name();
    display.allHands();
    display.hideItems();
    display.field()
    display.matchResult()
  }else{
    display.name();
    display.allHands();
    display.hideItems();
    display.field()
  }
  
  //名前の入力
  socket.on("nameInput", (namedata)=>{
    if(!server.arrayHasID(playersName, socket.id)){
      playersName[namedata.number] = {name:namedata.name, socketID:namedata.socketID};
      io.emit("nameInput", namedata);     
    }
  });

  //スタートボタンクリック
  socket.on('start', (e)=>{
    let i = 1
    let arr = playersName.slice(0, playersName.length)
    while(i <= 8){
        server.discard('', playersName);
        i += 1;
    };
    nop = playersName.length;
    if(nop >= 3){
      game.gameStart()
      let i = 1
      while(i <= 5){
        playersName[i-1] = ''
        i += 1
      }
    }else{
      playersName = arr
    }
  });

  //手札を選択
  socket.on('handclick', (data)=>{
    let thisCard = server.nameToCard(data.cardName)
    if(thisCard.holder === game.turnPlayer && game.turn !== 0 && data.socketID === thisCard.holder.socketID){
      game.turnPlayer.choiceScoutPlace(thisCard)
      if(!thisCard.holder.combination.cards.includes(thisCard)){
          let card = {holderNumber:'', index:''}
          card.holderNumber = thisCard.holder.number
          card.index = thisCard.index
          display.backgroundRed(card)
          thisCard.holder.choice(thisCard);
      }else{
          let card = {holderNumber:'', index:''}
          card.holderNumber = thisCard.holder.number
          card.index = thisCard.index
          display.backgroundDelete(card)
          thisCard.holder.cancel(thisCard);
      }
      game.turnPlayer.checkCombination();
    }
  });

  //開始に同意する
  socket.on('startbuttonclick', (data)=>{
    let n = data.number
    let p = game.players[n]
    p.startOK();
    io.emit('startbuttonclick', n)
  })

  //カードを場に出す
  socket.on('playbuttonclick', (player)=>{
    let n = player.number
    let p = game.players[n]
    p.playCards();
  })

  //カードをひっくり返す
  socket.on('reversebuttonclick', (n)=>{
    let p = game.players[n]
    p.reverseHand();
  })

  //スカウトするカードを選択
  socket.on('fieldcardclick', (data)=>{
    if(data.socketID === game.turnPlayer.socketID){
      let thisCard = server.nameToCard(data.cardName)
      if(thisCard === game.fieldCards.cards[0] || thisCard === game.fieldCards.cards[game.fieldCards.cards.length -1]){
        game.turnPlayer.choiceCandidate(thisCard)
      }
    }
  })

  //そのままスカウトする
  socket.on('stayscoutbuttonclick', (player)=>{
    let n = player.number
    let p = game.players[n]
    if(p === game.turnPlayer){
        p.stayScout();
    };
  });

  
  //ひっくり返してスカウトする
  socket.on('reversescoutbuttonclick', (player)=>{
    let n = player.number
    let p = game.players[n]
    if(p === game.turnPlayer){
        p.reverseScout();
    };
  });


  //ダブルアクション
  socket.on('doublebuttonclick', (player)=>{
    let n = player.number
    let p = game.players[n]
    if(p === game.turnPlayer){
        p.double();
    };
  })

  //次のラウンド
  socket.on('nextroundbuttonclick', (e)=>{
    display.nextButtonHIde()
    display.hideResult()
    game.nextRound()
  })

  
  //もう一度遊ぶ
  socket.on('newgamebuttonclick', (e)=>{
    game.newGame();
  })

  //初期化
  
  socket.on('yesbuttonclick', (e)=>{
    display.initialize()
    game.initialize()
  })

  //継承
  socket.on('takeoverbuttonclick', (player)=>{
    game.takeOver(player)
    display.takeOver(player)
    display.allHands()
  })

  //やり直し
  socket.on('undobuttonclick', (player)=>{
    if(game.phase !== 'roundresult' && game.phase!== 'matchresult'){
      let n = player.number
      let p = game.players[n]
      server.undo()
      if(game.turn === 0){
        p.ready = false
        game.startCheck()
        display.showStart(n)
      }
    }
  })

  //ターン終了
  socket.on('endbuttonclick', (player)=>{
    let n = player.number
    let p = game.players[n]
    if(p === game.turnPlayer){
        p.turnEnd();
    };
  })
})