const express = require("express");
const path = require("path");
const session = require('express-session');
const app = express();

app.use(express.static(path.join(__dirname, './public')));

//Set up the session
app.use(session({
    secret:'cs5003grouptHello',
    resave: false,
    saveUninitialized: true
}))

let gsize ;

//Shiu_to stroge all user information together set as Database
let userDB = [
    //default
    {"userID": "Player1",
    "userName": "Wait...",
    "score":0,
    "Rounds":0 ,
    "WinTimes": 0 
    },


]


//Track the state of fences
//When the game intialises, all the fences have state 0
//If a fence is clicked by Player 1, state changes into 1
//If clicked by Player 2, state changes into 2

//intfenceStatus(size); -->size 4x4 ,5x5
let fencesState = [
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0]
];

//Unclaimed land has state of 0
//Claimed by Player 1, state of 1
//Claimed by Player 2, state of 2

//intLandStatus(size) -->size 4x4 ,5x5
let landState = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
];

let gamepause = false

let latest_game_status = {
    "fence_state": fencesState,
    "land_state": landState,
    "userDB": userDB,
    "gamepause" :gamepause
}


//Store the players' IDs on the server
//Once a player starts a game, an ID will be assigned to him/her
//This ID is a constant and cannot be changed

//const playersUniqueID = ['user1','user2'];
const playersUniqueID = ['user1','user2','user3','user4','user5'];
//get user an ID and push in DB 
app.get('/getuserid', function(req, res, next){
    //req.session.userNum = playersUniqueID[0] 
    req.session.userNum = `user${userDB.length}` //generate instead set arr
    let id_value = req.session.userNum;
    userDB.push({userID: id_value})
    userDB.forEach((i)=>{
        if(i.userID == id_value){
            //create The user data and column in DB
            i.userName= id_value
            i.score = 0
            i.Rounds =0
            i.WinTimes = 0
        }
    })
    console.log(userDB)
    res.status(200).send(id_value);
    //playersUniqueID.splice(0,1);
})

//get player selected gamesize  
app.put('/gamesize', function(req, res,next){
    gsize = req.query.gamesize
    console.log(`player chose${gsize}`)
})

app.post('/quitgame', function(req,res,next){
    playerQuit= req.query.uid
    userDB.forEach(i=>{
        if(i.userID != playerQuit){ //for 2 players situation , Quit lose ; the other Win
            i.WinTimes +=1
        }
    })
    gamepause =true
    latest_game_status["gamepause"] = true
    console.log(`${gamepause} quit game`)
    res.status(200).send(playerQuit);
})



app.put('/winner', function(req,res,next){
    //the 2 players 2browes active the same url twice , met the winTime +twice ; fix by only active with the winner
    playerID= req.query.uid
    winplayerID = findwinner(userDB);
    console.log(playerID);
    if(gamepause == false){ // gameover , not quit
        if (playerID === winplayerID){ 
        userDB.forEach(i=>{
            if(i.userID === playerID){
                i.WinTimes +=1
            }
        })
        }
    }
    console.log(winplayerID);
    res.status(200).send(userDB)
})



//Polling
app.get('/requestnewgamestatus', function(req, res, next){
    res.status(200).json(latest_game_status);
})

//Upated and store the name of user input 
app.post('/userName',function(req, res, next){
    const playerID = req.query.uid
    const Name = req.query.username
    fencesState = intFS();
    landState =intLS() ;
    latest_game_status["fencesState"] =intFS();
    latest_game_status["landState"] =intLS();
    latest_game_status["gamepause"] = false;

    userDB.forEach((i)=>{
        i.score =0
        if(i.userID == playerID){
            //create The user data and column in DB
            i.userName = Name
            i.Rounds +=1
            gamepause = false
        }
    })
    latest_game_status["userDB"] = userDB;
    console.log(userDB)
    res.status(200).send(userDB)
})

//User information in DB
app.get('/userName',function(req, res, next){
    res.status(200).send(userDB)
})

let Playerturn =true; // true and false _2player take turn
//more than 2 player 
//currenTurn start user1
    //currenTurn =1 
    //currenTurn ++ 
    //if(currenTurn >=userDB.length-1){currenTurn =1 } //restart
function swapTurn(outcome_status){
    if(outcome_status.length == 1){
        return Playerturn = !Playerturn
    }else{
        return Playerturn = Playerturn
    }
}

app.get('/Playerturn',function(req, res, next){//2 players situation
    currentTurn = Playerturn ? "user1" : "user2";
    //console.log('current:'+currentTurn)
    res.status(200).send(Playerturn)
})



//Get player clicked fence 
app.post('/:playerID/:fenceID',function(req, res, next){
    //The fenceID is a variable in the URL
    //Get the fenceID value, e.g. "h_0_0"
    const playerID = req.params.playerID
    const fenceID =req.params.fenceID

    outcome_status =  checkLandStatus(playerID,fenceID)
    console.log(outcome_status);
    let nextTurn = swapTurn(outcome_status)? "user1" : "user2";
    //console.log('next:'+nextTurn)

    if(outcome_status.length == 1){
        //'yes': fence available 
        //take turn
        res.status(200).send(`${playerID};yes`); 
    }else if(outcome_status.length == 2){
        //Player$ score + 1
        //playerID +1turn
        userDB.forEach((i)=>{
            if(i.userID == playerID){
                i.score +=1
            }
        })
        res.status(200).send(`${playerID};${outcome_status[1]}`);
    }else if(outcome_status.length == 3){
         //Player$ score + 2
         //playerID +turn 
         userDB.forEach((i)=>{
            if(i.userID == playerID){
                i.score +=2
            }
        })
        res.status(200).send(`${playerID};${outcome_status[1]};${outcome_status[2]}`)
    }
    //res add uid 
 
    console.log(fenceID+":yes")
    return;
    //Divide the string ID by _, then we will have an array
    // clicked_fence = fenceID.split("_")
    // //x and y indicates the fence location
    // //Convert the string number into numerical number and use them as fence location indicators
    // const x =parseInt(clicked_fence[1]) ;const y =parseInt(clicked_fence[2])

    // clicked_fence_status = fencesState[x][y];//[0][0];
    // //Player 1's operation
    // if (playerID == 'user1'){
    //     //If the fence has not been clicked, then change its state into 1 (Player 1)
    //     if (clicked_fence_status == 0){
    //         fencesState[x][y] = 1;
    //         console.log(fencesState);

    //         //Horizontal fence takes care of two lands above and below it
    //         if(clicked_fence[0] =="h"){
    //             console.log("horizontal playerID: " + playerID + "; " + "id: "+ fenceID +" ;Up/Down")
    //             //The outer fences
    //             //The three fences in the first row: only cares about the three lands below them
    //             if(x == 0){
    //                 if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
    //                     console.log("Close below LAND");
    //                     landState[x/2][y] = 1;
    //                     //The send message should have a unique land variable
    //                     res.status(200).send(`player1_${x}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //The three fences in the bottom row: only cares about the three lands above them
    //             }else if(x == 6){//n-1
    //                 if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     console.log("Close above LAND");
    //                     landState[(x/2)-1][y] = 1;
    //                     res.status(200).send(`player1_${x/3}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //Middle fences
    //             }else{
    //                 //The situation when two lands are claimed with one click
    //                 if (fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0 && fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     landState[x/2][y] = 1;
    //                     landState[(x/2)-1][y] = 1;
    //                     res.status(200).send(`player1_${(x/2)-1}_${y}_${(x/2)}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
    //                     console.log("Close below LAND "+ `land_[${x/2}][${y}]`);
    //                     landState[x/2][y] = 1;
    //                     res.status(200).send(`player1_${x/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     console.log("Close above LAND " + `land_[${x/2-1}][${y}]`);
    //                     landState[(x/2)-1][y] = 1;
    //                     res.status(200).send(`player1_${(x/2)-1}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }
    //             //Vertical fences
    //         }else if(clicked_fence[0] =="v"){
    //             console.log("vertical id: "+fenceID +" ;L/R")
    //             //Vertical outer fences
    //             if(y == 0){
    //                 if(fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0){
    //                     console.log("Close right LAND: "+`land_[${(x-1)/2}][${y}]`)
    //                     landState[(x-1)/2][y] = 1; // status +1
    //                     res.status(200).send(`player1_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }else if(y == 3){
    //                 if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     console.log("Close left LAND: "+`land_[${(x-1)/2}][${y-1}]`)
    //                     landState[(x-1)/2][y-1] = 1; // status +1
    //                     res.status(200).send(`player1_${(x-1)/2}_${y-1}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //Vertical middle fences
    //             }else{
    //                 if (fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0 && fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     landState[(x-1)/2][y] = 1;
    //                     landState[(x-1)/2][y-1] = 1;
    //                     res.status(200).send(`player1_${(x-1)/2}_${y-1}_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0){
    //                     console.log("Close right LAND"+`land_[${(x-1)/2}][${y}]`)
    //                     landState[(x-1)/2][y] = 1; // status +1
    //                     res.status(200).send(`player1_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     console.log("Close left LAND"+`land_[${(x-1)/2}][${y-1}]`)
    //                     landState[(x-1)/2][y-1] = 1; // status +1
    //                     res.status(200).send(`player1_${(x-1)/2}_${y-1}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }
    //             //If no land is claimed
    //         }
    //         res.status(200).send("player1_yes");
    //         console.log(fenceID + ": " + "player1_yes");
    //     }
    // }

    // //Player 2 Operations, exactly the same procedure but change the feedback message to the client
    // if (playerID == 'user2'){
    //     //If the fence has not been clicked, then change its state into 1 (Player 1)
    //     if (clicked_fence_status == 0){
    //         fencesState[x][y] = 2; //Player 2's state is 2
    //         console.log(fencesState);

    //         //Horizontal fence takes care of two lands above and below it
    //         if(clicked_fence[0] =="h"){
    //             console.log("horizontal playerID: " + playerID + "; " + "id: "+ fenceID +" ;Up/Down")
    //             //The outer fences
    //             //The three fences in the first row: only cares about the three lands below them
    //             if(x == 0){
    //                 if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
    //                     console.log("Close below LAND");
    //                     landState[x/2][y] = 2;
    //                     //The send message should have a unique land variable
    //                     res.status(200).send(`player2_${x}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //The three fences in the bottom row: only cares about the three lands above them
    //             }else if(x == 6){//n-1
    //                 if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     console.log("Close above LAND");
    //                     landState[(x/2)-1][y] = 2;
    //                     res.status(200).send(`player2_${x/3}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //Middle fences
    //             }else{
    //                 //The situation when two lands are claimed with one click
    //                 if (fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0 && fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     landState[x/2][y] = 2;
    //                     landState[(x/2)-1][y] = 2;
    //                     res.status(200).send(`player2_${(x/2)-1}_${y}_${(x/2)}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
    //                     console.log("Close below LAND "+ `land_[${x/2}][${y}]`);
    //                     landState[x/2][y] = 2;
    //                     res.status(200).send(`player2_${x/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
    //                     console.log("Close above LAND " + `land_[${x/2-1}][${y}]`);
    //                     landState[(x/2)-1][y] = 2;
    //                     res.status(200).send(`player2_${(x/2)-1}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }
    //             //Vertical fences
    //         }else if(clicked_fence[0] =="v"){
    //             console.log("vertical id: "+fenceID +" ;L/R")
    //             //Vertical outer fences
    //             if(y == 0){
    //                 if(fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0){
    //                     console.log("Close right LAND: "+`land_[${(x-1)/2}][${y}]`)
    //                     landState[(x-1)/2][y] = 2; // status +2
    //                     res.status(200).send(`player2_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }else if(y == 3){
    //                 if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     console.log("Close left LAND: "+`land_[${(x-1)/2}][${y-1}]`)
    //                     landState[(x-1)/2][y-1] = 2; // status +1
    //                     res.status(200).send(`player2_${(x-1)/2}_${y-1}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 //Vertical middle fences
    //             }else{
    //                 if (fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0 && fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     landState[(x-1)/2][y] = 2;
    //                     landState[(x-1)/2][y-1] = 2;
    //                     res.status(200).send(`player2_${(x-1)/2}_${y-1}_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y]!=0 &&fencesState[x+1][y]!=0 &&fencesState[x][y+1]!=0){
    //                     console.log("Close right LAND"+`land_[${(x-1)/2}][${y}]`)
    //                     landState[(x-1)/2][y] = 2; // status +1
    //                     res.status(200).send(`player2_${(x-1)/2}_${y}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //                 if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
    //                     console.log("Close left LAND"+`land_[${(x-1)/2}][${y-1}]`)
    //                     landState[(x-1)/2][y-1] = 2; // status +1
    //                     res.status(200).send(`player2_${(x-1)/2}_${y-1}`);
    //                     console.log(landState);
    //                     return;
    //                 }
    //             }
    //             //If no land is claimed
    //         }
    //         res.status(200).send("player2_yes");
    //         console.log(fenceID + ": " + "player2_yes");
    //     }
    // }

})

app.get('/getscore', function(req, res, next){
    res.status(200).json(score);
})



//Tell the server to listen to our port and log some information into the console
app.listen(9000, () => {
	console.log(`Listening on localhost: 9000`)
});









function checkLandStatus(uid,ID){
    let ClosedLand = [] //for return

    clickedIDarr = ID.split("_")
    const x = parseInt(clickedIDarr[1]) ;const y = parseInt(clickedIDarr[2])
    userdisplay = uid //uid.split('')[4]
    //by Player
    if(uid==='user1'){
        userdisplay = 1 ;
    }else if(uid == "user2"){
        userdisplay = 2 ;
    }else{
        userdisplay = 5;
    }

    //Update fence and Land status
    let clickedIDarr_status = fencesState[x][y];
    //check clicked-fence is avalible
    if (clickedIDarr_status == 0){
        fencesState[x][y] = userdisplay; //This can be 1, 2 or 5
        //easier to count on return ClosedLand
        ClosedLand == ClosedLand.push("yes")
        //Check Whether the one closed the land
        //Horizontal fence
        if(clickedIDarr[0] =="h"){
            //console.log("id:"+ID +"Up/Down")
            //edge only able to close 1
            if(x==0){
                //land is below the clicked fence
                if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
                    //console.log("Close below LAND")
                    landState[x/2][y] = userdisplay;  // landState_positon
                    ClosedLand == ClosedLand.push(`land_${x+1}_${y}`);//land_id
                    console.log(latest_game_status);
                    return ClosedLand;
                }
            }else if(x==6){//x ==gsize*2
                //land is abvoe the clicked fence
                if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
                    //console.log("Close above LAND")
                    landState[x/2-1][y] = userdisplay;
                    ClosedLand == ClosedLand.push(`land_${x-1}_${y}`);
                    console.log(latest_game_status);
                    return ClosedLand;
                }
            }else{
                //middle might 2 or 1 land closed (land is below/abvoe)
                
                if (fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0 && fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0) {
                    landState[x/2][y] = userdisplay;
                    landState[x/2 - 1][y] = userdisplay;
                    
                    ClosedLand == ClosedLand.push(`land_${x+1}_${y}`);
                    ClosedLand == ClosedLand.push(`land_${x-1}_${y}`);
                    
                    console.log(latest_game_status);
                    return ClosedLand;
                }
                if(fencesState[x+1][y]!=0 && fencesState[x+1][y+1]!=0 && fencesState[x+2][y] !=0) {
                    //console.log("Close below LAND"+ `land_[${x/2}][${y}]`)
                    landState[x/2][y] = userdisplay;
                    ClosedLand == ClosedLand.push(`land_${x+1}_${y}`);
                    
                    console.log(latest_game_status);
                    return ClosedLand;

                }
                if(fencesState[x-1][y]!=0 && fencesState[x-1][y+1] !=0 && fencesState[x-2][y]!=0){
                    //console.log("Close above LAND" + `land_[${x/2-1}][${y}]`)
                    landState[x/2-1][y] = userdisplay;
                    ClosedLand == ClosedLand.push(`land_${x-1}_${y}`);
                    
                    console.log(latest_game_status);
                    return ClosedLand;
                }
            }

            //Vertical fence
        }else if(clickedIDarr[0] =="v"){
            //onsole.log("id:"+ ID +"L/R")
            //edge only able to close 1 land
            if(y==0){
                //land is right of the clicked fence
                if(fencesState[x-1][y]!=0 && fencesState[x+1][y]!=0 && fencesState[x][y+1]!=0){
                    //console.log("Close right LAND"+`land_[${(x-1)/2}][${y}]`)
                    landState[(x-1)/2][y] = userdisplay; // score +1
                    ClosedLand == ClosedLand.push(`land_${x}_${y}`);
                    
                    console.log(latest_game_status);
                    return ClosedLand;
                }
                //edge only able to close 1 land
            }else if(y == 3){ //y ==gsize
                //land is left of the clicked fence
                if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 && fencesState[x][y-1]!=0){
                    //console.log("Close left LAND"+`land_[${(x-1)/2}][${y-1}]`)
                    landState[(x-1)/2][y-1] = userdisplay; // score + 1
                    ClosedLand == ClosedLand.push(`land_${x}_${y-1}`);
                
                    console.log(latest_game_status);
                    return ClosedLand;
                }

            }else{
                //middle might 2 or 1 land closed (land is below/abvoe)
                //XU_
                if (fencesState[x-1][y]!=0 && fencesState[x+1][y]!=0 && fencesState[x][y+1]!=0 && fencesState[x-1][y-1]!=0 && fencesState[x+1][y-1]!=0 && fencesState[x][y-1]!=0){
                    landState[(x-1)/2][y] = userdisplay;
                    landState[(x-1)/2][y-1] = userdisplay;
                    console.log(landState);
                    ClosedLand == ClosedLand.push(`land_${x}_${y}`);
                    ClosedLand == ClosedLand.push(`land_${x}_${y-1}`);
                    
                    console.log(latest_game_status);
                    return ClosedLand;
                }
                if(fencesState[x-1][y]!=0 && fencesState[x+1][y]!=0 && fencesState[x][y+1]!=0){
                    //console.log("Close right LAND"+`land_[${(x-1)/2}][${y}]`)
                    landState[(x-1)/2][y] = userdisplay; // score +1
                    ClosedLand == ClosedLand.push(`land_${x}_${y}`);
                
                    console.log(latest_game_status);
                    return ClosedLand;
                }
                if(fencesState[x-1][y-1]!=0 &&fencesState[x+1][y-1]!=0 &&fencesState[x][y-1]!=0){
                    //console.log("Close left LAND"+`land_[${(x-1)/2}][${y-1}]`)
                    landState[(x-1)/2][y-1] = userdisplay; // score +1
                    ClosedLand == ClosedLand.push(`land_${x}_${y-1}`);
                
                    console.log(latest_game_status);
                    return ClosedLand;
                }
            }
        }else{
            console.log(ID+":yes")
            return ("NO");
        }

        //console.log(fenceID+":"+ fencesState +"yes")
        //return ['yes']
        return (["yes"]);
    }
        

    
}



//XU
function intFS(){
    for(let i = 0; i < fencesState.length; i++){
        for(let j = 0; j < fencesState[i].length; j++){
            fencesState[i][j] = 0;
        }
    }
    return fencesState
}
//XU
function intLS(){
    for(let i = 0; i < landState.length; i++) {
        for (let j = 0; j < landState[i].length; j++) {
            landState[i][j] = 0;
        }
    }
    return landState
}


//Shiu_find the who with highest Score ==>winner
function findwinner(data){
    let MaxScore =0
    let winner 
    data.forEach((i)=>{
        if(i.score > MaxScore){
            MaxScore= i.score;
            winner = i.userID
        }
    })
    return winner
}  






function intfenceStatus(size){
    //size=3
    n= 2*size+1

    intialFence=[]
    for(let i =0;i<n ;i++){
        intialFence[i]=[]
        if(i%2 ==0){
            for(let j =0;j<size;j++){
                intialFence[i][j]=0
            }
        }else{
            for(let j =0;j<size;j++){
                intialFence[i][j]=0;
                }
            intialFence[i]==intialFence[i].push(0)    
        }
    }
    fencesState = intialFence
    return fecnceState;
}


function intLandStatus(size){
    //size=3
    n= 2*size+1

    intial=[]
    for(let i =0;i<size ;i++){
        intial[i]=[]
        for(let j =0;j<size;j++){
            intial[i][j]=0
        }
    }
    landState =intial
    return landState;
}



//check landstatus
//size =3;
// for(let i =0;i<size ;i++){
//     for(let j =0;j<size;j++){
//       if(v[i][j]!=0){
//         `land_${2*i+1}_${j} is occupied`
//       }
//     }
// }

// function checkNozero(){
//     for(let i =0;i<size ;i++){
//         for(let j =0;j<size;j++){
//           if(v[i][j] === 0){
//            return false;  
//             }
//         }
//     } 
//     return true;//game over
// }



//comment

let edge_1_status = fencesState[0][0];
let edge_2_status = fencesState[0][1];
let edge_3_status = fencesState[0][2];

let edge_4_status = fencesState[1][0];
let edge_5_status = fencesState[1][1];
let edge_6_status = fencesState[1][2];
let edge_7_status = fencesState[1][3];

let edge_8_status = fencesState[2][0];
let edge_9_status = fencesState[2][1];
let edge_10_status = fencesState[2][2];

let edge_11_status = fencesState[3][0];
let edge_12_status = fencesState[3][1];
let edge_13_status = fencesState[3][2];
let edge_14_status = fencesState[3][3];

let edge_15_status = fencesState[4][0];
let edge_16_status = fencesState[4][1];
let edge_17_status = fencesState[4][2];

let edge_18_status = fencesState[5][0];
let edge_19_status = fencesState[5][1];
let edge_20_status = fencesState[5][2];
let edge_21_status = fencesState[5][3];

let edge_22_status = fencesState[6][0];
let edge_23_status = fencesState[6][1];
let edge_24_status = fencesState[6][2];
