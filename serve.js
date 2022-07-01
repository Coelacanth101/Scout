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
let playersName = ['','','','','','','','']
let allCards = [];
let players = [];
io.on("connection", (socket)=>{
    //画面の表示
    if(game.phase === 'nameinputting'){
      io.to(socket.id).emit("nameDisplay", (playersName));
    }else{
      io.to(socket.id).emit('newGame', players);
      io.to(socket.id).emit('playerDisplay', players);
      io.to(socket.id).emit('reload', players);
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
      while(i <= 8){
          server.discard('', playersName);
          i += 1;
      };
      nop = playersName.length;
      game.gameStart()
    })



})
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
  };
  reverseHand(){
      if(game.turn === 0){
          for(let card of this.hand){
              card.reverse();
          };
          display.allHands();
      };
  };
  choice(card){
      if(this.combination.cards.length === 0){
          this.combination.cards.push(card)
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
      discard(card, this.combination.cards);
      this.checkCombination()
  };
  checkCombination(){
      if(this.combination.cards.length >= 2){
          //隣り合ったカードか確認
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
      if(this.combination.type === 'reversesequence'){
          let arr = []
          for(let item of this.combination.cards){
              arr.unshift(item)
          }
          this.combination.cards = arr
          this.combination.type = 'sequence'
      };
      if(this.combination.valid && game.combiJudge(this.combination, game.fieldCards)){
          this.gain += game.fieldCards.cards.length
          for(let item of this.combination.cards){
              item.index = this.combination.cards.indexOf(item)
          }
          game.fieldCards = this.combination;
          for(let item of this.combination.cards){
              discard(item, this.hand)
          }
          for(let item of this.hand){
              item.index = this.hand.indexOf(item)
          }
          this.action = ''
          display.gain(this)
          display.myHand(this);
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
  startOK(){
      this.ready = true;
      game.startCheck()
  };
  choiceCandidate(card){
      if(!this.candidate){
          this.candidate = card;
      }else if(this.candidate !== card){
          this.candidate = card;
      }else{
          this.candidate = '';
      }
  };
  choiceScoutPlace(card){
      if(this.scoutplace.includes(card)){
          discard(card, this.scoutplace);
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
      if(this.action !== 'onlyplay'){
          if(this.candidate && this.scoutplace.length){
              if(this.scoutplace.length === 2){
                  this.hand.splice(this.scoutplace[1].index, 0, this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === 0){
                  this.hand.unshift(this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === this.hand.length-1){
                  this.hand.push(this.candidate);
                  this.candidate.holder = this;
              }else{
                  display.backgroundDelete()
                  this.combination = {cards:[], valid:true, type:'', owner:this};
                  this.candidate = '';
                  this.scoutplace = []
              }
              for(let item of this.hand){
                  item.index = this.hand.indexOf(item)
              }
              discard(this.candidate, game.fieldCards.cards);
              display.myHand(this);
              display.field();
              game.fieldCards.owner.chip += 1
              display.chip(game.fieldCards.owner)
              if(this.action === ''){
                  this.action = ''
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
      this.candidate.reverse()
      if(this.action !== 'onlyplay'){
          if(this.candidate && this.scoutplace.length){
              if(this.scoutplace.length === 2){
                  this.hand.splice(this.scoutplace[1].index, 0, this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === 0){
                  this.hand.unshift(this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === this.hand.length-1){
                  this.hand.push(this.candidate);
                  this.candidate.holder = this;
              }else{
                  display.backgroundDelete()
                  this.combination = {cards:[], valid:true, type:'', owner:this};
                  this.candidate = '';
                  this.scoutplace = []
              }
              for(let item of this.hand){
                  item.index = this.hand.indexOf(item)
              }
              discard(this.candidate, game.fieldCards.cards);
              display.myHand(this);
              display.field();
              game.fieldCards.owner.chip += 1
              display.chip(game.fieldCards.owner)
              if(this.action === ''){
                  this.action = ''
                  game.turnEnd()
              }else{
                  this.action = 'onlyplay'
              }
          }
      }
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.candidate = '';
      this.scoutplace = [];
  };
  double(){
      if(this.doubleAction === 1 && game.turnPlayer === this){
          this.action = 'double'
          this.doubleAction -= 1
          display.doubleaction(this)
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
  }
}

const game = {allCards:allCards, usingCards:[], players:players, round:1, fieldCards:{cards:[], valid:true, type:'', owner:''}, turnPlayer:'', startPlayer:'', turn:0, active:true, winner:'',champion:'', phase:'nameinputting',
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
                p.lastscore = p.gain + p.chip
            }else{
                p.score += p.gain + p.chip - p.hand.length
                p.lastscore = p.gain + p.chip - p.hand.length
            }
            display.score(p)
        }
        display.roundResult()
        display.nextButton()
    },
    nextRound(){
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
        this.deckMake();
        this.deal();
        //display.name();
        console.log('name')
        display.allHands();
        console.log('allh')
        //display.hideItems();
        console.log('hideitem')
        //display.startButton();
        console.log('startbutton')
        //display.reverseButton();
        console.log('reversebutton')
    },
    startCheck(){
        let s = true
        for(let p of this.players){
            if(p.ready === false){
                s = false;
            }
        }
        if(s === true){
            this.turn += 1;
            this.turnPlayer = this.startPlayer;
        }
    },
    playerMake(){
        let i = 1
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
        console.log('newgame')
        return
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
      return;
    }
};

const display = {
  hideItems(){
    let nop = game.players.length
    io.emit('hideItems', nop);
  },
  name(){
    let players = game.players
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
      let players = game.players
      io.emit('allHands', players)
  },
  myHand(player){
    io.emit('myHand', player)
  },
  field(){
      let cards = fieldCards.cards
      io.emit('field', cards)
  },
  nextButton(){
      let a = ''
      io.emit('nextButton', a)
  },
  roundResult(){
      let data = {round:game.round, players:game.players}
      io.emit('roundResult', data)
  },
  matchResult(){
      let data = {cahampionname:game.champion.name, players:game.players}
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
  backgroundDelete(){
    let a = ''
    io.emit('backgroundDelete', a)
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
  }
}