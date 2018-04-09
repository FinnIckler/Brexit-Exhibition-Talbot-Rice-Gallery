Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
    if(this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i]);
    }
  }
};

function getHashtags(name) {
  switch (name){
    case "Vote Leave":{
      return "#VoteLeave"
    }
    case "LEAVE.EU":{
      return "#VoteLeave"
    }
    case "TheOrdinaryMan":{
      return "#Dictatorship"
    }
    case "Russ":{
      return "#Remain"
    }
    case "Louise Mensch":{
      return "#VoteLeave"
    }
    case "BBC News (UK)":{
      return "#EURef"
    }
    case "Vote Leave Media":{
      return "#VoteLeave"
    }
    case "Richard Branson":{
      return "#VoteRemain"
    }
    case "J.K. Rowling":{
      return "#Remain"
    }
    case "Emma Watson":{
      return "#Remain"
    }
    case "Nick Reeves - 48%":{
      return "#StopBrexit"
    }
    case "#Brexit Bin":{
      return "#StopBrexit"
    }
    case "Craig Whitington":{
      return "#Brexit (Leave)"
    }
    case "Richard Corbett":{
      return "#LeaveLies"
    }
    case "UKIP Nonsense ❄":{
      return "#StopBrexit"
    }
    case "James Melville":{
      return "#FlorenceSpeech (Remain)"
    }
    case "Ebrahim Hemmatnia":{
      return "#Iran"
    }
    case "Jeremy Cliffe": {
      return "#FlorenceSpeech"
    }
    case "Mireia": {
      return "#Catalunya+#Referèndum"
    }
    case "Graham Simpson":{
      return "#StopBrexit"
    }
    case "Stronger In":{
      return "#Remain"
    }
    case "graham norton":{
      return "#remain"
    }
    case "Mis Standen":{
      return "#EUisTheProblem"
    }
    case "Andrea Leadsom MP‏":{
      return "#IndependenceDay"
    }
    case "Bloomberg":{
      return "#Brexit"
    }
    case "Bonnie Greer":{
      return "#Remain"
    }
    case "David Peterson":{
      return "#VoteLeave"
    }
    case "RT":{
      return "#Brexit (Leave)"
    }
    default:{
      return "#IndependenceDay"
    }
  }
}
function getSize(d){
  if(!(Math.sqrt(d.retweeted_count) / Math.sqrt(26000)) * 75){
    console.log(d);
  }
  return (Math.sqrt(d.retweeted_count) / Math.sqrt(26000)) * 75
}

var line,circle = undefined;

function isVisible(elem) {
  return !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length )
}

function hideOnClickOutside(element) {
  const outsideClickListener = function (event) {
    if (!element){
      removeClickListener();
    }
    else if (!element.contains(event.target) && !event.target.closest(".circle")) { // or use: event.target.closest(selector) === null
      if (isVisible(element)) {
        removeTweet("circles");
        removeClickListener();
        window.triggerState = "split";
      }
    }
  };

  const removeClickListener = function() {
    document.removeEventListener('click', outsideClickListener)
  };

  document.addEventListener('click', outsideClickListener)
}

function displayTweet(d){
  //globals
  var svg = window.svg;
  var width = window.width;
  var centre = width / 2;
  // Steps of Displaying a Tweet:
  // 1. Draw line from ball to tweet
  function draw_line () {
    line = svg.append("line")
       .attr("x1", centre)
       .attr("y1", width / 20)
       .attr("x2", function () {
         return d.x;
       })
       .attr("y2", d.y)
       .attr("stroke-width", 2)
       .attr("stroke", d.color);
  }
  // 2. Draw circle to display tweet
  function draw_circle () {
    circle = svg.append("circle")
      .attr("class","circle")
      .attr("cx", centre)
      .attr("cy", width / 5)
      .attr("r", width / 5)
      .attr("fill", d.color)
  }

  // 3. Draw Tweet in circle
  function draw_tweet () {
    //Getting an on click on an iframe is a pain in the ass
    window.iframeclick = function() {
      document.getElementById('frame').contentDocument.onclick = function () {
        accountHistory(d);
      }
    };

    var tweet_div = document.createElement('div');
    var url = "tweet_fragment.html?username="+encodeURIComponent(d.name)+
                                 "&screenName="+encodeURIComponent("@"+d.screen_name)+
                                 "&retweets="+encodeURIComponent(d.retweeted_count)+
                                 "&text="+encodeURIComponent(d.text)+
                                 "&verified="+encodeURIComponent(d.verified)+
                                 "&image="+encodeURIComponent(d.profile_image_url)+
                                 "&new_retweets="+encodeURIComponent(d.new_retweet_count)+
                                 "&new_time="+encodeURIComponent(d.new_created_at)+
                                 "&new_text="+encodeURIComponent(d.new_text);
    tweet_div.innerHTML = '<iframe id="frame" src='+url+' height="180" width="500" ></iframe>';
    tweet_div.id = "tweet_div";
    tweet_div.style.left = centre - (width / 10) /* Circle */ + (width / 50) /* margin */ + "px";
    tweet_div.style.top = width / 5 + "px";
    document.getElementById("background").appendChild(tweet_div);
  }
  //draw_line();
  draw_circle();
  draw_tweet();
  accountHistory(d);
}
// There are three removing states:
// all: remove the tweet_div + circle + line (this is the default)
// tweet: remove only the tweet:
// geometry: remove only the geometry
function removeTweet(state) {
  if(state == "circles"){
    trigger2();
  }
  if (circle) {
    circle.remove();
    circle = undefined;
    document.getElementById("tweet_div").remove();
  }
}

function accountHistory(d) {
  window.trigger3(d)
}

var updateClock = function (currentTime) {
  var time = currentTime.split(':');
  var minute = time[0];
  var seconds = time[1];

  if(seconds == 0) {
    minute--;
    seconds = 59;
  }else{
    seconds--;
  }
  return minute + ":" + (seconds < 10 ? "0" + seconds : seconds);
};
