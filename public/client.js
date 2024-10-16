const gmap = document.getElementById("game-map-container")
const gamepage = document.getElementById("Gamepage")
const input_username = document.getElementById("username")
const NewGameButt= document.getElementById("newstart")
const QuitButt = document.getElementById("giveup")
const resultbar = document.getElementById("Resultboard")
const result = document.getElementById("result")
const selectsize =document.getElementById("selectgamesize")
const score_1 = document.getElementById('user1Score');
const score_2 = document.getElementById('user2Score');
const startButt = document.getElementById("start")
const startPage = document.getElementById("Startpage")
const userNamebar1 = document.getElementById("user1")
const userNamebar2 = document.getElementById("user2")
const UserInformation= document.getElementById("userinfor")


let gamesize =3 ;
let user_own_id;
let userName ;
let user_color;


//Open/Home Page
document.addEventListener('DOMContentLoaded',()=>{
  gamepage.style.display ='none';
  resultbar.style.display ='none';
  GetUerUniqeID()
});

//Functions_Open Page
function GetUerUniqeID(){
    //get server userID 
    fetch('/getuserid',
          {method:'GET'})
          .then(res => res.text())
          .then(element =>{
              console.log(`user_own_id =${element}`)
              user_own_id = element;
          })
  }
  

//-----------------------------------------------------------------------------------------------


//Pre game --> GamePage
startButt.addEventListener("click", startGamepage);
startButt.addEventListener('click', requestLatestInterface);
QuitButt.addEventListener("click",quitdisplay)
NewGameButt.addEventListener("click", RestartGame)


//Functions_Pre game
//start game button function
function startGamepage(){
    startPage.style.display ='none';
    gamepage.style.display ='block';
    GetinputUsername();
    selectedgsize();
    gamesize = selectedgsize();
    DisplayGameMap(gamesize)
    GameInteract(); //clicklistener
    updateName();// display username
    getMyturn();
  }



//input_text:userName function
function GetinputUsername(){

    if(input_username.value.trim().length === 0){
        userName = "visiter";
        console.log("empty string_visiter")
    }else{
        userName = input_username.value
        console.log(input_username.value)
    }

    //console.log(userName)
    //Store the name of user input to server 
    fetch(`/userName?uid=${user_own_id}&username=${userName}`,{method:"POST"})
}

//gamesize select function
function selectedgsize(){
    gamesize = selectsize.value
    console.log("size:"+ gamesize)
    //fetch gamesize , update game size to server
    fetch(`/gamesize?gamesize=${gamesize}`,{method:"PUT"})
    return gamesize
  }


//GET information from server 
//update users name 
async function updateName(){
    fetch(`/userName?uid=${user_own_id}&username=${userName}`,{method:"GET"})
    .then(res => res.json())
    .then(data =>{
        //console.log(data),
        data.forEach((i)=>{
            if(i.userID=='user1'){
                userNamebar1.innerText = `${i.userName} :`
            }
            else{
                userNamebar2.innerText = `${i.userName} :`
            }
        })
    })
}



async function DisplayScore(data){
    data.forEach(i=>{
    //console.log(`score: ${i.score}`)
    //Dispaly for 2 players situation
        if(i.userID =="user1"){            
            score_1.innerText = `${i.score}`;
        }else if(i.userID == "user2"){
            score_2.innerText = `${i.score}`;
        }
    })
 }



 async function getMyturn(){
    fetch(`/Playerturn`,{method:"GET"})
    .then(res => res.text())
    .then(data =>{
        //console.log(`Now is ${data}`)
        if(data === "true"){
            curTurn ="user1"
            anti = "user2"
        }else{
            curTurn ="user2"
            anti = "user1"
        }
        console.log(curTurn)
        //Dispaly for 2 players situation --->if there is 3rd player need to consider "user3" as well
        my = document.getElementById(curTurn+"T")
        notmy= document.getElementById(anti+"T")
        if(curTurn ==user_own_id){ //Myturn
            my.innerHTML =`<p>Your Turn <i class="fa-solid fa-play" style="color: green;"></i></p>`
            notmy.innerHTML =``
            All_fence  = document.querySelectorAll('input.hedge, input.vedge')
            All_fence.forEach(i =>{
                 i.disabled = false;
            })

        }else{
            my.innerHTML =``
            notmy.innerHTML =`<p>No Your Turn <i class="fa-solid fa-pause" style="color: red;"></i></p>`
            All_fence  = document.querySelectorAll('input.hedge, input.vedge')
            All_fence.forEach(i =>{
                 i.disabled = true;
            })

        }
    })
}


//-----------------------------------------------------------------------------------------------


//GameOver
function DisplayResult(){ 
    resultbar.style.display ='flex'; //flex block ....
    fetch(`/winner?uid=${user_own_id}`, {method: 'PUT'})
    .then(res => res.json())
    .then(data =>{
        console.log(data),
        data.forEach((i)=>{
            if(user_own_id === i.userID){
                if(i.score > (gamesize**2)/2){ //--->if gameover all land click //if more than 2 play need other way to judge winner and loser
                  result.innerText  = `You are WINNER!! Score: ${i.score} !!`;
                }else{
                  result.innerText = `Sorry You lose! Score: ${i.score} !!`;
                }
            }
          })
        })      
}


//-----------------------------------------------------------------------------------------------


let restimeout ;
//quit game
//show quit result 
function quitdisplay(){
    let player_quit ='1'
    fetch(`/quitgame?uid=${user_own_id}`,{method:"POST"})
    .then(res => res.text())
    .then(data =>{
        console.log(`${data }!Quitthe game`)
        if(data == user_own_id){
            result.innerHTML = `You lost!`;
         }
        //  else{
        //      result.innerHTML = `You WON!`;
        //  }
     })

    //clearTimeout(restimeout);
    resultbar.style.display ='flex'; 
}


//-----------------------------------------------------------------------------------------------


//New game = >RestartGame

function RestartGame(){
    
    fetch(`/userName?uid=${user_own_id}&username=${userName}`,{method:"GET"})
    .then(res => res.json())
    .then(data =>{
        console.log(data),
        data.forEach((i)=>{
            if(i.userID=== user_own_id ){
                UserInformation.innerHTML =`<p> <strong> ${i.userName}</strong> _ Win :Lose = <strong>${i.WinTimes}:${i.Rounds-i.WinTimes}</strong></p> `
            }
        })
    });

    startPage.style.display ='block';
    gamepage.style.display ='none';
    resultbar.style.display ='none'; 
   
}



//-----------------------------------------------------------------------------------------------


//Functions_Game
// Display GameMap by size 
function DisplayGameMap(size){
    let n=2 * size +1;

    var grid_size=[] ;
    //width and height for each column and row
    for  (let i=0; i<n ;i++){
        if(i%2 === 0){
            grid_size.push("30px ")
        }else{
            grid_size.push("100px ")
        }
    }
    //add CSS gridTemplateColumns/Row
    gmap.style.gridTemplateColumns= grid_size.join('') ;
    gmap.style.gridTemplateRows = grid_size.join('') ;
    
    var game_items = [];
    //Create Map by size_small
    for(let i=0; i< (n**2);i++){
        //horizontal_visual
        // if(Math.floor(i/n)%2 ==0){
        //     if(i%2 == 0){
        //         //node 
        //         game_items.push(
        //             `<input type="button" class="node" id="node_${i}">`
        //         )
        //     }else{
        //         //horizontal edge
        //         game_items.push(
        //             `<input type="button" class="hedge" id="h_${i}">`
        //         )
        //     }
        // }else{
        //      //vertical_visual
        //     if(i%2 != 0){
        //         //vertical edge
        //         game_items.push(
        //             `<input type="button" class="vedge" id="v_${i}">`
        //         )
        //     }else{
        //         //land
        //         game_items.push(
        //             `<input disabled type="button" class="item" id="land_${i}">`
        //         )
        //     }
        // }
        //could be simplified
        if(Math.floor(i/n)%2 ==0){
            if(Math.floor(i/n)==0){
                if(i%2 ==0){
                    game_items.push(`<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${i/2}">`)                    
                    //console.log(`node_${Math.floor(i/n)}_${i/2}`)
                  }else{
                    game_items.push(`<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor(i/2)}">`)
                    //console.log(`hedge__${Math.floor(i/n)}_${Math.floor(i/2)}`)
                  }

            }else if(Math.floor(i/n)==2){
              if(i%2 ==0){
                game_items.push(
                                `<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${i-n*2}">`
                            )
              }else{
                game_items.push(
                    `<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor((i-n*2)/2)}">`
                )
                //console.log(`hedge_${Math.floor(i/n)}_${Math.floor((i-n*2)/2)}`)
              }
              
            }else if(Math.floor(i/n) ==4){
                if(i%2 ==0){
                    game_items.push(
                        `<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${(i-n*4)/2}">`
                    )
                    //console.log(`node_${Math.floor(i/n)}_${(i-n*4)/2}`)
                  }else{
                    game_items.push(
                        `<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor((i-n*4)/2)}">`
                    )
                   //console.log(`hedge__${Math.floor(i/n)}_${Math.floor((i-n*4)/2)}`)
                  }
              
            }else if(Math.floor(i/n) ==6){
                if(i%2 ==0){
                    game_items.push(
                        `<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${(i-n*6)/2}">`
                    )
                    //console.log(`node_${Math.floor(i/n)}_${(i-n*6)/2}`)
                  }else{
                    game_items.push(
                        `<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor((i-n*6)/2)}">`
                    )
                  }
              
            }else if(Math.floor(i/n) ==8){
                if(i%2 ==0){
                    game_items.push(
                        `<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${(i-n*8)/2}">`
                    )
                    //console.log(`node_${Math.floor(i/n)}_${(i-n*6)/2}`)
                  }else{
                    game_items.push(
                        `<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor((i-n*8)/2)}">`
                    )
                  }
              
            }else if(Math.floor(i/n) ==10){
                if(i%2 ==0){
                    game_items.push(
                        `<input type="button" class="node" disabled id="node_${Math.floor(i/n)}_${(i-n*10)/2}">`
                    )
                    //console.log(`node_${Math.floor(i/n)}_${(i-n*6)/2}`)
                  }else{
                    game_items.push(
                        `<input type="button" class="hedge" id="h_${Math.floor(i/n)}_${Math.floor((i-n*10)/2)}">`
                    )
                  }
            } 
                        
          }
        else if(Math.floor(i/n)%2!=0){
            if(Math.floor(i/n)==1){
                if(i%2 !=0){
                    game_items.push(`<input type="button" class="vedge" id="v_${Math.floor(i/n)}_${Math.floor((i-n)/2)}">`)
                    //console.log(`land_${Math.floor(i/n)}_${Math.floor((i-n)/2)}`)
                  }else{
                    game_items.push(`<input type="button" class="item" disabled id="land_${Math.floor(i/n)}_${Math.floor((i-n)/2)}">`)
                    //console.log(`vedge_${Math.floor(i/n)}_${(i-n)/2}`)
                  }
              
            }else if(Math.floor(i/n) ==3){
                if(i%2 !=0){
                    game_items.push(
                        `<input type="button" class="vedge" id="v_${Math.floor(i/n)}_${Math.floor((i-n*3)/2)}">`
                    )
                    // console.log(`land_${Math.floor(i/n)}_${Math.floor((i-n*3)/2)}`)
                  }else{
                    game_items.push(
                        `<input type="button" class="item" disabled id="land_${Math.floor(i/n)}_${Math.floor((i-n*3)/2)}">`
                    )
                    //console.log(`vedge_${Math.floor(i/n)}_${(i-n*3)/2}`)
                  }
              
            }else if(Math.floor(i/n) ==5){
                if(i%2 !=0){
                    game_items.push(
                        `<input type="button" class="vedge" id="v_${Math.floor(i/n)}_${Math.floor((i-n*5)/2)}">`
                    )
                    //console.log(`land_${Math.floor(i/n)}_${Math.floor((i-n*5)/2)}`)
                  }else{
                    game_items.push(`<input type="button" class="item" disabled id="land_${Math.floor(i/n)}_${Math.floor((i-n*5)/2)}">`)
                    //console.log(`vedge_${Math.floor(i/n)}_${(i-n*5)/2}`)
                  }
              
            }else if(Math.floor(i/n) ==7){
                if(i%2 !=0){
                    game_items.push(
                        `<input type="button" class="vedge" id="v_${Math.floor(i/n)}_${Math.floor((i-n*7)/2)}">`
                    )
                    //console.log(`land_${Math.floor(i/n)}_${Math.floor((i-n*5)/2)}`)
                  }else{
                    game_items.push(`<input type="button" class="item" disabled id="land_${Math.floor(i/n)}_${Math.floor((i-n*7)/2)}">`)
                    //console.log(`vedge_${Math.floor(i/n)}_${(i-n*5)/2}`)
                  }
            }else if(Math.floor(i/n) ==9){
                if(i%2 !=0){
                    game_items.push(
                        `<input type="button" class="vedge" id="v_${Math.floor(i/n)}_${Math.floor((i-n*9)/2)}">`
                    )
                    //console.log(`land_${Math.floor(i/n)}_${Math.floor((i-n*5)/2)}`)
                  }else{
                    game_items.push(`<input type="button" class="item" disabled id="land_${Math.floor(i/n)}_${Math.floor((i-n*9)/2)}">`)
                    //console.log(`vedge_${Math.floor(i/n)}_${(i-n*5)/2}`)
                  }
            }
          }
            
    }
    //Display the map
    gmap.innerHTML = game_items.join('')
 
}


//Play Game 
function GameInteract(){
    var buttons = document.querySelectorAll('input[type="button"]');
    //Button_listener
    buttons.forEach(i => {
        i.addEventListener('click',function(){
            console.log(`/${user_own_id}/${i.id}`)
            //Once a fence is clicked, it will send its fenceID to the server
            fetch(`/${user_own_id}/${i.id}`,{method:'POST'})
            .then(res => res.text())
            .then(data =>{
              console.log(data);
              let split_data = data.split(';');
              
              let act_uid = split_data[0];
              //different user with different colour 
              user_color =user_colour(user_own_id);
              if(act_uid === user_own_id){
                i.style.backgroundColor = user_color
                i.disabled = "true";
                //Chnage land color
                if(data.includes("land")){
                  for(let j = 1;j < split_data.length; j++){
                    document.getElementById(`${split_data[j]}`).style.background= user_color;
                  }
                }
                
            }
            // else{//error check
            //     i.style.backgroundColor = 'purple'
            //     i.disabled = "true";
            //     //land
            //     if(data.includes("land")){                  
            //         for(let j = 1 ;j <split_data.length;j++){
            //           document.getElementById(`${split_data[j]}`).style.background= 'purple' ;
            //         }
            //       }
            // }


            //   let split_data = data.split('_');
            //   let which_player = split_data[0];
            //   if (which_player == "player1"){
            //       if (data != "player1_yes"){
            //           let data_divide = data.split("_");
            //           let who = data_divide[0];
            //           let x_1 = parseInt(data_divide[1]);
            //           let y_1 = parseInt(data_divide[2]);
            //           let x_2 = parseInt(data_divide[3]);
            //           let y_2 = parseInt(data_divide[4]);
            //           console.log(isNaN(x_2));
            //           console.log(isNaN(y_2));

            //           if (who == 'player1'){
            //               if (isNaN(x_2) == false && isNaN(y_2) == false){
            //                   console.log("Two lands are claimed." + "; " + x_2 + "; " + y_2);

            //                   i.style.backgroundColor = 'pink';
            //                   i.disabled = 'true';
            //                   document.getElementById(`land_${x_1}_${y_1}`).style.backgroundColor = 'pink';
            //                   document.getElementById(`land_${x_2}_${y_2}`).style.backgroundColor = 'pink';
            //               } else if (isNaN(x_2) == true && isNaN(y_2) == true){
            //                   console.log("Only one land is claimed");
            //                   console.log(x_1 + "; " + y_1);
            //                   console.log(x_2 + "; " + y_2);
            //                   i.style.backgroundColor = 'pink';
            //                   i.disabled = 'true';
            //                   document.getElementById(`land_${x_1}_${y_1}`).style.backgroundColor = 'pink';
            //               }
            //           }
            //       } else if (data == "player1_yes") { //Bottom condition
            //           i.style.backgroundColor = 'pink';
            //           i.disabled = "true";
            //       }

            //   }else{
            //       if (data != "player2_yes"){
            //           let data_divide = data.split("_");
            //           let who = data_divide[0];
            //           let x_1 = parseInt(data_divide[1]);
            //           let y_1 = parseInt(data_divide[2]);
            //           //If the location parameters of the 2nd land exist, then do double
            //           let x_2 = parseInt(data_divide[3]);
            //           let y_2 = parseInt(data_divide[4]);
            //           console.log(isNaN(x_2));
            //           console.log(isNaN(y_2));

            //           if (who == 'player2'){
            //               if (isNaN(x_2) == false && isNaN(y_2) == false){
            //                   console.log("Player 2; Two lands are claimed." + "; " + x_2 + "; " + y_2);

            //                   i.style.backgroundColor = 'lightblue';
            //                   i.disabled = 'true';
            //                   document.getElementById(`land_${x_1}_${y_1}`).style.backgroundColor = 'lightblue';
            //                   document.getElementById(`land_${x_2}_${y_2}`).style.backgroundColor = 'lightblue';
            //               } else if (isNaN(x_2) == true && isNaN(y_2) == true){
            //                   console.log("Player 2; Only one land is claimed");
            //                   console.log(x_1 + "; " + y_1);
            //                   console.log(x_2 + "; " + y_2);
            //                   i.style.backgroundColor = 'lightblue';
            //                   i.disabled = 'true';
            //                   document.getElementById(`land_${x_1}_${y_1}`).style.backgroundColor = 'lightblue';
            //               }
            //           }
            //       } else if (data == "player2_yes") { //Bottom condition
            //           i.style.backgroundColor = 'lightblue';
            //           i.disabled = "true";
            //       }

            //   }
            })
        })
    })
}










//Once the game start button is pressed, the client will start polling from the server
//https://javascript.info/long-polling
async function requestLatestInterface(){
    let res = await fetch('/requestnewgamestatus', {method: 'GET'});
    let message = await res.json();
    let objec = message;        
    // console.log(objec.fence_state);
    let fenceArray = objec.fence_state;
    let landArray = objec.land_state;
    let userData = objec.userDB;
    let gampause = objec.gamepause
    let fenceArray_rowCount = fenceArray.length;
    if(gampause === true){
        quitdisplay();
        console.log(`gamepause=${gampause} should stop`)
        //When quitting the game, we intended to display different winning/losing messages that are different on both tabs.
        //However, polling synchronises the same message.
        //Our strategy of solution is: adding a separate function to obtain the user ID which clicks the quit button
        //And insert this ID to the function that determines winning/losing.
    }else if( checkNozero(landArray)== true){
        DisplayResult();
        console.log('gameover');
    }else {    
        if (res.status === 502){
            await requestLatestInterface();
        }else if (res.status != 200) {
            // An error - let's show it
            console.log(res.statusText);
            // Reconnect in one second
        // await new Promise(resolve => setTimeout(resolve, 2000));
            await requestLatestInterface();
        } else {
            // Get and show the message
            await new Promise(resolve => restimeout= setTimeout(resolve, 1000));

            for (let i = 0; i < fenceArray_rowCount; i++){
                for (let j = 0; j < fenceArray[i].length; j++){

                    if (fenceArray[i][j] === 1){
                        if (i%2 == 0){
                            document.getElementById(`h_${i}_${j}`).style.background = 'pink';
                        }
                        if (i%2 != 0){
                            document.getElementById(`v_${i}_${j}`).style.background = 'pink';
                        }
                    }
                    if (fenceArray[i][j] === 2){
                        if (i%2 == 0){
                            document.getElementById(`h_${i}_${j}`).style.background = 'lightblue';
                        }
                        if (i%2 != 0){
                            document.getElementById(`v_${i}_${j}`).style.background = 'lightblue';
                        }
                    }

                }
            }

            let landArray_rowCount = landArray.length;
            console.log("Land Array: " + landArray);

            for (let k = 0; k < landArray_rowCount; k++){
                for (let h = 0; h < landArray[k].length; h++){
                    if (landArray[k][h] === 1){
                        if (k === 0){
                            document.getElementById(`land_${k+1}_${h}`).style.background = 'pink';
                        }
                        if (k !== 0){
                            document.getElementById(`land_${k+k+1}_${h}`).style.background = 'pink';
                        }
                    }
                    if (landArray[k][h] === 2){
                        if (k === 0){
                            document.getElementById(`land_${k+1}_${h}`).style.background = 'lightblue';
                        }
                        if (k !== 0){
                            document.getElementById(`land_${k+k+1}_${h}`).style.background = 'lightblue';
                        }
                    }
                }
            }
        
        await DisplayScore(userData)
        await updateName();
        await getMyturn();

        await requestLatestInterface();
        //Gameover 
        }
    }

}


//utilize function

function checkNozero(arr){
    for(let i =0;i<arr.length ;i++){
        for(let j =0;j<arr.length;j++){
          if(arr[i][j] === 0){
           return false;  
            }
        }
    } 
    return true;  //game over
}


//more-than-two-player main
function user_colour(user_own_id){
  switch (user_own_id) {
  case 'user1' :
      return user_color ='pink'
      break;
  case 'user2':
    return user_color ='lighblue'
      break;
  case 'user3':
    return user_color ='green'
      break;
  case 'user4':
    return user_color ='red'
      break;
  case 'user5':
    return user_color ='blue'
      break;
  }

}