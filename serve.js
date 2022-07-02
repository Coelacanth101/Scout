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
          let player = server.copyOf(this)
          display.myHand(player)
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
      server.discard(card, this.combination.cards);
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
      display.backgroundAllDelete()
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
      console.log('1')
      if(this.action !== 'onlyplay'){
        console.log('2')
          if(this.candidate && this.scoutplace.length){
              if(this.scoutplace.length === 2){
                console.log('3')
                  this.hand.splice(this.scoutplace[1].index, 0, this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === 0){
                console.log('4')
                  this.hand.unshift(this.candidate);
                  this.candidate.holder = this;
              }else if(this.scoutplace[0].index === this.hand.length-1){
                console.log('51')
                  this.hand.push(this.candidate);
                  this.candidate.holder = this;
              }else{
                console.log('6')
                  this.combination = {cards:[], valid:true, type:'', owner:this};
                  this.candidate = '';
                  this.scoutplace = []
                  display.backgroundAllDelete()
                  return
              }
              for(let item of this.hand){
                  item.index = this.hand.indexOf(item)
              }
              
              console.log('7')
              server.discard(this.candidate, game.fieldCards.cards);
              console.log('8')
              display.myHand(server.copyOf(this));
              console.log('9')
              display.field();
              console.log('10')
              game.fieldCards.owner.chip += 1
              console.log('11')
              display.chip(server.copyOf(game.fieldCards.owner))
              console.log('12')
              if(this.action === ''){
                console.log('13')
                  this.action = ''
                  game.turnEnd()
              }else{
                console.log('14')
                  this.action = 'onlyplay'
              }
          }
      }
      
      console.log('15')
      this.combination = {cards:[], valid:true, type:'', owner:this};
      this.candidate = '';
      this.scoutplace = []
  };
  reverseScout(){
      if(this.candidate){
        this.candidate.reverse()
      }
      this.stayScout()
  };
  double(){
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
      console.log('414')
        if(this.players.indexOf(this.turnPlayer) === this.players.length-1){
          console.log('416')
            this.turnPlayer = this.players[0];
        } else {
          console.log('419')
            this.turnPlayer = this.players[this.players.indexOf(this.turnPlayer)+1];
        }
        console.log('422')
        this.turn += 1
        if(this.fieldCards.owner === this.turnPlayer){
          console.log('425')
            this.winner = this.turnPlayer
            this.roundEnd();
        }
    },
    roundEnd(){
      console.log('431')
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
            console.log('443')
            display.score(server.copyOf(p))
        }
        console.log('446')
        display.roundResult()
        console.log('448')
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
        display.name();
        display.allHands();
        display.hideItems();
        display.startButton();
        display.reverseButton();
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
    }
};

const display = {
  hideItems(){
    let nop = game.players.length
    io.emit('hideItems', nop);
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
  nextButton(){
      let a = ''
      io.emit('nextButton', a)
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
  }
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
  }
}


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
    let arr = playersName.slice(0, playersName.length)
    while(i <= 8){
        server.discard('', playersName);
        i += 1;
    };
    nop = playersName.length;
    if(nop >= 3){
      game.gameStart()
      playersName = ['','','','','']
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
    display.nextButton()
    display.hideResult()
    game.nextRound()
  })
  

  
  //もう一度遊ぶ
  socket.on('newgamebuttonclick', (e)=>{
    game.newGame();
  })
})