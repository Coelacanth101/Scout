/*const socket = io();*/
let allCards = [];
let players = [];
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
        this.gain = 0;
        this.combination = {cards:[], valid:true, type:'', owner:this};
        this.doubleAction = 1;
        this.chip = 0;
        this.ready = false
        this.candidate
        this.scoutplace = [];
        this.action = '';
        players.push(this);
    };
    reverseHand(){
        if(game.round === 0){
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
        if(this.action !== 'double'){
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
                game.turnEnd()
            };
        }
        this.combination = {cards:[], valid:true, type:'', owner:this};
        this.candidate = '';
        this.scoutplace = []
    };
    startOK(){
        this.ready = true;
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
    scout(){
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
                    this.combination = {cards:[], valid:true, type:'', owner:this};
                    this.candidate = '';
                    this.scoutplace = []
                    return;
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
    double(){
        if(this.doubleAction === 1){
            this.action = 'double'
        }
    };
    reset(){
        this.hand = [];
        this.gain = 0;
        this.combination = {cards:[], valid:true, type:'', owner:this};
        this.doubleAction = 1;
        this.chip = 0;
        this.ready = false
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

const game = {allCards:allCards, usingCards:[], players:players, round:0, fieldCards:{cards:[], valid:true, type:'', owner:''}, turnPlayer:'', startPlayer:'', turn:0,
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
                if(card.name === '1-2'){
                    this.turnPlayer = p;
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
        this.round += 1
    },
    start(){
        this.round += 1
    },
    reset(){
        this.round = 0;
        this.fieldCards = {cards:[], valid:true, type:'', owner:''};
        this.turnPlayer = ''; 
        this.startPlayer = '';
        this.turn = 0;
    }
};

//画面表示
const display = {
    hidePlayer(){
        let pn = game.players.length
        while(pn <= 5){
            $(`#player${pn+1}`).hide()
            pn += 1
        }
    },
    name(){
        for(let p of game.players){
            $(`#player${p.number}name`).html(`${p.name}`);
            $(`#player${p.number}gain`).html(`得点札:${p.gain}`);
            $(`#player${p.number}chip`).html(` チップ:${p.chip} `);
            $(`#player${p.number}doubleaction`).html(`ダブルアクション:${p.doubleAction}`);
        }
    },
    gain(p){
        $(`#player${p.number}gain`).html(`得点札:${p.gain}`);
    },
    chip(p){
        $(`#player${p.number}chip`).html(` チップ:${p.chip} `);
    },
    doubleaction(p){
        $(`#player${p.number}doubleaction`).html(`ダブルアクションマーカー:${p.doubleAction}`);
    },
    allHands(){
        for(let p of game.players){
            $(`#player${p.number}hand`).html('')
            for(c of p.hand){
                $(`#player${p.number}hand`).append(`<img src="./${c.name}.png" id="mycard${c.index}" class="card ${c.position}" alt="${c.name}">`);
            };
        };
    },
    myHand(p){
        $(`#player${p.number}hand`).html('')
        for(c of p.hand){
            $(`#player${p.number}hand`).append(`<img src="./${c.name}.png" id="mycard${c.index}" class="card ${c.position}" alt="${c.name}">`);
        };
    },
    field(){
        $('#field').html('')
        for(let item of game.fieldCards.cards){
            $('#field').append(`<img src="./${item.name}.png" id="fieldcard${item.index}" class="card ${item.position}" alt="${item.name}">`)
        }
    },
}

let taro = new Player('Taro', 1, '')
let jiro = new Player('Jiro', 2, '')
let saburo = new Player('Saburo', 3, '')
display.name();
game.deckMake();
game.deal();
display.allHands();
display.hidePlayer()

//手札を選択
$('.hand').on('click', '.card',function(){
    console.log('click')
    const name = $(this).attr('alt')
    console.log(name)
    let thisCard = nameToCard(name)
    console.log(thisCard)
    if(thisCard.holder === game.turnPlayer){
        game.turnPlayer.choiceScoutPlace(thisCard)
        if(!thisCard.holder.combination.cards.includes(thisCard)){
            $(this).css('background-color', 'red');
            thisCard.holder.choice(thisCard);
        }else{
            $(this).css('background-color', '');
            thisCard.holder.cancel(thisCard);
        }
        game.turnPlayer.checkCombination();
    }
})

//スカウトするカードを選択
$('#field').on('click', '.card', function(){
    const name = $(this).attr('alt')
    let thisCard = nameToCard(name)
    if(thisCard === game.fieldCards.cards[0] || thisCard === game.fieldCards.cards[game.fieldCards.cards.length 
        -1]){
        game.turnPlayer.choiceCandidate(thisCard)
        $('#field .card').css('background-color', '');
        $(this).css('background-color', 'red');
    }
})

//カードを場に出す
$('.playbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    if(p === game.turnPlayer){
        p.playCards();
        $(`.card`).css('background-color', '')
    }
})

//カードをひっくり返す
$('.reversebutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    p.reverseHand();
})

//スカウトする
$('.scoutbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    if(p === game.turnPlayer){
        p.scout();
        $('.card').css('background-color', '');
    };
});

//開始に同意する
$('.startbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    p.startOK();
});

//ダブルアクション
$('.doublebutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    p.double();
});