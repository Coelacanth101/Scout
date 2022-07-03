const socket = io();
let allCards = [];
let players = [];

//画面初期化
$('#initializebutton').on('click', function(){
    let e =''
    socket.emit('initializebuttonclick', e)
})

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
socket.on('backgroundAllDelete', ()=>{
    display.backgroundAllDelete()
});
socket.on('backgroundDelete', (card)=>{
    display.backgroundDelete(card)
});
socket.on('backgroundRed', (card)=>{
    display.backgroundRed(card)
});
socket.on('startbuttonclick', (n)=>{
    display.startButtonHide(n)
});
socket.on('fieldcardred', (card)=>{
    display.fieldCardRed(card)
});
socket.on('fieldcarddelete', (card)=>{
    display.fieldCardDelete(card)
});
socket.on('initializebuttonclick', ()=>{
    display.initialize()
});
socket.on('turnplayer', (tn)=>{
    display.turnPlayer(tn)
})
socket.on('takeover', (player)=>{
    display.takeOver(player)
})


//手札を選択
$('.hand').on('click', '.card',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        const cardName = $(this).attr('alt')
        let data = {cardName:cardName, socketID:socket.id}
        socket.emit('handclick', data)
    }
    
})

//開始に同意する
$('.startbutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        data ={number:n, socketID:socket.id}
        socket.emit('startbuttonclick', data)
        $(this).hide();
        $(this).siblings('.reversebutton').hide();
    };
});

//カードを場に出す
$('.playbutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        player ={number:n, socketID:socket.id}
        socket.emit('playbuttonclick', player)
        $(`.card`).css('background-color', '')
    };
})

//カードをひっくり返す
$('.reversebutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        socket.emit('reversebuttonclick', n)
    }
})

//スカウトするカードを選択
$('#field').on('click', '.card', function(){
        const cardName = $(this).attr('alt')
        data = {cardName:cardName, socketID:socket.id}
        socket.emit('fieldcardclick', data)
})

//そのままスカウトする
$('.stayscoutbutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        player ={number:n, socketID:socket.id}
        socket.emit('stayscoutbuttonclick', player)
        $('.card').css('background-color', '');
    }
});
//ひっくり返してスカウトする
$('.reversescoutbutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        player ={number:n, socketID:socket.id}
        socket.emit('reversescoutbuttonclick', player)
        $('.card').css('background-color', '');
    }
});


//ダブルアクション
$('.doublebutton').on('click',function(){
    if($(this).parent().parent().data('socketid') === socket.id){
        let n = Number($(this).data('playernumber'))
        player ={number:n, socketID:socket.id}
        socket.emit('doublebuttonclick', player)
    }
});

//次のラウンド
$('#nextroundbutton').on('click',function(){
    let e =''
    socket.emit('nextroundbuttonclick',e)
});


//もう一度遊ぶ
$('#newgamebutton').on('click',function(){
    let e =''
    socket.emit('newgamebuttonclick', e)
});

//継承
$('.takeoverbutton').on('click', function(){
    let n = Number($(this).data('playernumber'))
    player ={number:n, socketID:socket.id}
    socket.emit('takeoverbuttonclick', player)
})







//画面表示
const display = {
    hideItems(nop){
        console.log(nop)
        let i = 1
        while(i <= 5){
            $(`#player${i-1}`).show()
            i += 1
        }
        while(nop <= 4){
            $(`#player${nop}`).hide()
            nop += 1
        }
        $('#gamestartbutton').hide()
        $('#nextroundbutton').hide();
        $('#newgamebutton').hide();
        $('#nameinputarea').hide();
        $('#result').hide();
        $('#field').show()
        $('.startbutton').hide()
        $('.reversebutton').hide();
        $('#players').show();
    },
    name(players){
        for(let p of players){
            $(`#player${p.number}`).attr('data-socketid', `${p.socketID}`);
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
                    console.log('koko')
                    $(`#player${p.number}hand`).append(`<img src="./back.png" id="player${p.number}card${c.index}" class="card">`);
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
                $(`#player${player.number}hand`).append(`<img src="./back.png" id="player${player.number}card${c.index}" class="card">`);
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
        console.log(data.players)
        $('#result').show();
        $('#result').html('')
        $('#result').html(`<div>${data.round}ラウンド終了</div>`)
        for(let p of data.players){
            $('#result').append(`<div>${p.name}:${p.lastScore}点</div>`)
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
    backgroundAllDelete(){
        $('.card').css('background-color', '');
    },
    backgroundDelete(card){
        $(`#player${card.holderNumber}card${card.index}`).css('background-color', '');
    },
    backgroundRed(card){
        $(`#player${card.holderNumber}card${card.index}`).css('background-color', 'red');
    },
    gameStartButton(){
        $('#gamestartbutton').toggle()
    },
    startButtonHide(n){
        $(`#startbutton${n}`).hide();
        $(`#reversebutton${n}`).hide();
    },
    fieldCardsDelete(){
        $('#field').children().css('background-color', '');
    },
    fieldCardRed(card){
        this.fieldCardsDelete()
        $(`#fieldcard${card.index}`).css('background-color', 'red');
    },
    fieldCardDelete(card){
        $(`#fieldcard${card.index}`).css('background-color', '');
    },
    initialize(){
        $('#gamestartbutton').show()
        $('#nextroundbutton').hide();
        $('#newgamebutton').hide();
        $('#nameinputarea').show();
        $('#field').hide()
        $('#result').hide();
        $('#players').hide();
        $('#nameinputarea').html('<h1>名前を入力してください</h1>')
        let i = 1
        while(i <= 5){
            $('#nameinputarea').append(`<div class="player${i-1}">
                <div class="playername">
                    <input type="text" class="nameinput" data-namenumber="${i-1}">
                    <input type="button" value="決定" class="namebutton">
                </div>
            </div>`)
            i += 1
        }
    },
    turnPlayer(tn){
        let i = 0;
        while(i <= 4){
            $(`#player${tn}`).css('border', '0px');
            i += 1
        }
        $(`#player${tn}`).css('border', '5px solid');
        $(`#player${tn}`).css('border-color', 'purple');
    },
    takeOver(player){
        console.log('takeover')
        $(`#player${player.number}`).data('socketid') = player.socketID
    }
}