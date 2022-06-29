/*const socket = io();*/
let allCards = [];
let usingCards = [];
let players = [];
let fieldCards = {cards:[], valid:true, type:'', owner:''};
//リストから削除
function discard(item,list){
    if(list.includes(item)){
        let i = list.indexOf(item);
        list.splice(i, 1);
    }
  }
class Card{
    constructor(topNumber, bottomNumber){
        this.topNumber = topNumber;
        this.bottomNumber = bottomNumber;
        this.number = topNumber;
        this.rnumber = bottomNumber
        this.position = 'upright'
        this.name = `${topNumber}-${bottomNumber}`
        this.index
        this.holder
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
function nameToCard(name){
    for(c of allCards){
        if(c.name === name){
            return c;
        };
    };
}

class Player{
    constructor(name, number, socketID){
        this.name = name;
        this.number = number;
        this.socketID = socketID
        this.hand = [];
        this.gain = [];
        this.combination = {cards:[], valid:true, type:'', owner:this};
        this.doubleAction = 1;
        this.chip = 0;

        players.push(this);
    };
    reverseHand(){
        if(game.round === 0){
            for(let card of this.hand){
                card.reverse();
            };
            display.reloadHand();
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
        }
        if(this.combination.valid && game.combiJudge(this.combination, game.fieldCards)){
            for(let item of this.combination.cards){
                item.index = this.combination.cards.indexOf(item)
            }
            game.fieldCards = this.combination;
            $(`.card`).css('background-color', '')
            for(let item of this.combination.cards){
                discard(item, this.hand)
            }
            for(let item of this.hand){
                item.index = this.hand.indexOf(item)
            }
            game.turnEnd()
        };
        this.combination = {cards:[], valid:true, type:'', owner:this};
        console.log(game.fieldCards)
        display.reloadHand();
        display.reloadField();
        game.round += 1;
    };
}

//allCards
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

const game = {allCards:allCards, usingCards:usingCards, players:players, round:0, fieldCards:fieldCards, turnPlayer:'', startPlayer:'', turn:0,
    deckMake(){
        if(this.players.length === 3){
            this.usingCards = []
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
        for(let p of this.players){
            let i = 1;
            while(i <= n){
                let randomNumber = Math.floor(Math.random()*this.usingCards.length);
                let card = this.usingCards[randomNumber]
                card.index = i-1
                card.shuffle();
                p.hand.push(card);
                card.holder = p;
                if(card.name === '1-2'){
                    this.turnPlayer = p;
                    this.startPlayer = p;
                }
                this.usingCards.splice(randomNumber,1);
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
            return this.players[0];
        } else {
            return this.players[this.players.indexOf(this.turnPlayer)+1];
        }
    },
    start(){
        this.round += 1
    }
};

//画面表示
const display = {
    reloadHand(){
        for(let p of game.players){
            $(`#player${p.number}hand`).html('')
            for(c of p.hand){
                $(`#player${p.number}hand`).append(`<img src="./${c.name}.png" id="mycard${c.index}" class="card ${c.position}" alt="${c.name}">`);
            };
        };
    },
    reloadField(){
        $('#field').html('')
        for(let item of game.fieldCards.cards){
            $('#field').append(`<img src="./${item.name}.png" id="fieldcard${item.index}" class="card ${item.position}" alt="${item.name}">`)
        }
    },
}
let taro = new Player('Taro', 1, '')
let jiro = new Player('Jiro', 2, '')
let saburo = new Player('Saburo', 3, '')
game.deckMake()
game.deal()
display.reloadHand()
$('.hand').on('click', '.card',function(){
    const name = $(this).attr('alt')
    let thisCard = nameToCard(name)
    if(!thisCard.holder.combination.cards.includes(thisCard)){
        $(this).css('background-color', 'red')
        thisCard.holder.choice(thisCard)
    }else{
        $(this).css('background-color', '')
        thisCard.holder.cancel(thisCard)
    }
    game.turnPlayer.checkCombination()
})
$('#play').on('click',function(){
    game.turnPlayer.playCards();
})
$('#reverse').on('click',function(){
    game.turnPlayer.reverseHand();
})



