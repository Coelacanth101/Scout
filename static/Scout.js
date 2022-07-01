const socket = io();
let allCards = [];
let players = [];

//名前の入力発信
$('#nameinputarea').on('click', '.namebutton', function(){
    if($(this).prev().val()){
        myName = $(this).prev().val()
        let nameNumber = Number($(this).prev().data('namenumber'));
        namedata = {name:myName, number:nameNumber, socketID:socket.id}
        socket.emit("nameInput", namedata)
    }
})

//名前の入力受信
socket.on("nameInput", (namedata)=>{
    $(`.player${namedata.number}`).html(`<p><strong>${namedata.name}</strong></p>`)
})

//スタートボタンクリック発信
$('#gamestartbutton').on('click', function(){
    let e
    socket.emit('start', e)
})

//入力済みの名前表示
socket.on('nameDisplay', (playersName)=>{
    let i = 1
    for(let player of playersName){
        if(player.name){
            $(`.player${playersName.indexOf(player)}`).html(`<p><strong>${player.name}</strong></p>`)
        }
        i += 1
    }
})

socket.on('hideItems', (nop)=>{
    display.hideItems(nop)
});
socket.on('name', (players)=>{
    display.name(players)
});
socket.on('gain', (player)=>{
    display.gain(player)
});
socket.on('chip', (player)=>{
    display.chip(player)
});
socket.on('doubleaction', (player)=>{
    display.doubleaction(player)
});
socket.on('score', (player)=>{
    display.score(player)
});
socket.on('allHands', (players)=>{
    display.allHands(players)
});
socket.on('myHand', (player)=>{
    display.myHand(player)
});
socket.on('field', (cards)=>{
    display.field(cards)
});
socket.on('nextButton', ()=>{
    display.nextButton()
});
socket.on('roundResult', (data)=>{
    display.roundResult(data)
});
socket.on('matchResult', (data)=>{
    display.matchResult(data)
});
socket.on('hideResult', ()=>{
    display.hideResult()
});
socket.on('startButton', ()=>{
    display.startButton()
});
socket.on('reverseButton', ()=>{
    display.reverseButton()
});
socket.on('backgroundDelete', ()=>{
    display.backgroundDelete()
});

//画面表示
const display = {
    hideItems(pn){
        while(pn <= 5){
            $(`#player${pn+1}`).hide()
            pn += 1
        }
        $('#nextroundbutton').hide();
        $('#nameinputarea').hide();
        $('#newgamebutton').hide();
        $('#result').hide();
        $('.startbutton').hide();
        $('.reversebutton').hide();
    },
    name(players){
        console.log('receivenamea')
        console.log(players)
       for(let p of players){
            $(`#player${p.number}name`).html(`${p.name}`);
            this.gain(p);
            this.chip(p);
            this.doubleaction(p);
            this.score(p);
        }
    },
    gain(player){
        $(`#player${player.number}gain`).html(`得点札:${player.gain}  `);
    },
    chip(player){
        $(`#player${player.number}chip`).html(`チップ:${player.chip}  `);
    },
    doubleaction(player){
        $(`#player${player.number}doubleaction`).html(`ダブルアクション:${player.doubleAction}  `);
    },
    score(player){
        $(`#player${player.number}score`).html(`得点:${player.score}`);
    },
    allHands(players){
        for(let p of players){
            $(`#player${p.number}hand`).html('')
            if(p.socketID === socket.id){
                for(c of p.hand){
                    $(`#player${p.number}hand`).append(`<img src="./${c.name}.png" id="player${p.number}card${c.index}" class="card ${c.position}" alt="${c.name}">`);
                };
            }else{
                for(c of p.hand){
                    $(`#player${p.number}hand`).append(`<img src="./back.png" id="player${p.number}card${c.index}"`);
                }
            }
        };
    },
    myHand(player){
        $(`#player${player.number}hand`).html('')
        if(player.socketID === socket.id){
            for(c of player.hand){
                $(`#player${player.number}hand`).append(`<img src="./${c.name}.png" id="player${player.number}card${c.index}" class="card ${c.position}" alt="${c.name}">`);
            };
        }else{
            for(c of player.hand){
                $(`#player${player.number}hand`).append(`<img src="./back.png" id="player${player.number}card${c.index}"`);
            }
        }
    },
    field(cards){
        $('#field').html('')
        for(let item of cards){
            $('#field').append(`<img src="./${item.name}.png" id="fieldcard${item.index}" class="card ${item.position}" alt="${item.name}">`)
        }
    },
    nextButton(){
        $('#nextroundbutton').toggle()
    },
    roundResult(data){
        $('#result').show();
        $('#result').html('')
        $('#result').html(`<div>${data.round}ラウンド終了</div>`)
        for(let p of data.players){
            $('#result').append(`<div>${p.name}:${p.lastscore}点</div>`)
        }
    },
    matchResult(data){
        $('#result').show();
        $('#result').html('');
        $('#result').html(`<div>${data.championname}の勝ちです。</div>`)
        for(let p of data.players){
            $('#result').append(`<div>${p.name}:${p.score}点</div>`)
        }
        $('#field').hide();
        $('#newgamebutton').show()
    },
    hideResult(){
        $('#result').hide();
    },
    startButton(){
        $('.startbutton').toggle()
    },
    reverseButton(){
        $('.reversebutton').toggle()
    },
    backgroundDelete(){
        $('.card').css('background-color', '');
    },
}

















































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

//手札を選択
$('.hand').on('click', '.card',function(){
    const name = $(this).attr('alt')
    let thisCard = nameToCard(name)
    if(thisCard.holder === game.turnPlayer && game.turn !== 0){
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

//そのままスカウトする
$('.stayscoutbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    if(p === game.turnPlayer){
        p.stayScout();
    };
    $('.card').css('background-color', '');
});

//ひっくり返してスカウトする
$('.reversescoutbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    if(p === game.turnPlayer){
        p.reverseScout();
    };
    $('.card').css('background-color', '');
});

//開始に同意する
$('.startbutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    p.startOK();
    $(this).hide();
    $(this).siblings('.reversebutton').hide();
});

//ダブルアクション
$('.doublebutton').on('click',function(){
    let n = Number($(this).data('playernumber'))
    let p = game.players[n-1]
    p.double();
});

//次のラウンド
$('#nextroundbutton').on('click',function(){
    display.nextButton()
    display.hideResult()
    game.nextRound()
});

//もう一度遊ぶ
$('#newgamebutton').on('click',function(){
    game.newGame();
});