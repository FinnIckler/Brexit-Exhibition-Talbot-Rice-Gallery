function d3Sim(error, data) {
  // get width and height from viz-div
  var divWidth = document.getElementById("viz").clientWidth;
  var divHeight = document.getElementById("viz").clientHeight;

  var height = divHeight;
  var width = divWidth;

  var margin = {top: height*0.1, right: width * 0.08, bottom: height * 0.06, left: width * 0.08};

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  window.width = width;
  window.height = height;

  var svg = d3.select("#viz").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "chart")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  window.svg = svg;

  var background = svg.append("rect")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", "translate(" + (-margin.left) + "," + (-margin.top) + ")")
      .attr("fill", "transparent");

  var radius = 3;

  var defaultColor = "white";

  var highlightColor = "grey";

  var updateDuration = 1500;

  var activeForces = [];

  var barYactive = false;

  if (error) throw error;

  data.forEach(function(d) {
    d.fade = 1;
    d.neutral = d.affiliation == "N";
    d.proBrexit = d.affiliation == "N" ? Math.random() > 0.5 : d.affiliation == "L";
    d.color = d.affiliation == "N" ? "#eeeeee" : d.proBrexit ? "#e40000" : "#094178";
  });


  /* scales */

  var randomX = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width]);

  var randomX_2 = d3.scaleLinear()
      .domain([0, 1])
      .range([0.2 * width , 0.8 * width]);

  var randomY = d3.scaleLinear()
      .domain([0, 1])
      .range([0, height - radius]);

  /* define and init simulation */

  var simulation = d3.forceSimulation();

  simulation
      .nodes(data)
      .on("tick", ticked);

  initSim();

  /* basic simulation functions */

  function initSim() {
    simulation
        .force("x", d3.forceX(function() {
          return randomX(Math.random())
        }))
        .force("y", d3.forceY(function() {
          return randomY(Math.random())
        }))
        .alphaMin(0.5)
        .stop();
    // loop through simulation ticks to land in a stable state with randomly distributed nodes
    for (var i = 0; i < 100; ++i) simulation.tick()

    activeForces.push("x", "y");

    return simulation
  }

  function baseSim(alphaMin) {
    /* creates basic petri dish of nodes */
    removeForces();
    simulation
        .stop()
        .force("charge", d3.forceManyBody().strength(-2))
        .force("x", d3.forceX(width/2).strength(0.12))
        .force("y", d3.forceY(height/2).strength(0.12))
        .force("collide", d3.forceCollide(function(d){return getSize(d)}))
        .alphaMin(alphaMin)
        .alpha(0.5)
        .restart();
    activeForces.push("charge", "x", "y", "collide");

    return simulation

  }


  function breakdown(breakdownObjects,soft) {
    /* breaks down nodes into groups centers of gravity defined by x and y functions */
    removeForces();

    for (var i=0; i<breakdownObjects.length; i++) {
      switch(breakdownObjects[i]["type"]) {

        case "xy":
          var customX = d3.forceX(breakdownObjects[i]["breakX"]).strength(breakdownObjects[i]["strengthX"]);
          var customY = d3.forceY(breakdownObjects[i]["breakY"]).strength(breakdownObjects[i]["strengthY"]);

          simulation.force("x" + i.toString(), customX).force("y" + i.toString(), customY);
          activeForces.push("x" + i.toString());
          activeForces.push("y" + i.toString());

          break;

        case "charge":
          var customCharge = isolate(d3.forceManyBody(), breakdownObjects[i]["filter"]).strength(breakdownObjects[i]["strength"])
          simulation.force("charge" + i.toString(), customCharge);
          activeForces.push("charge" + i.toString());

          break;
      }
    }

    simulation
        .force("collide", d3.forceCollide(function(d){return getSize(d)}))
        .alphaMin(soft ? 0.01 : 0.0001)
        .alpha(0.1)
        .alphaDecay(0.005)
        .restart();

    activeForces.push("collide");


    return simulation
  }

  function breakout_allies(d1) {
    /* breakout a selection of nodes by lifting them out from petri dish to a radial circle */
    var filterOut = function (d) {
      return d.allies.indexOf(d1.screen_name) != -1
    };
    var filterIn = function (d) {
      return d.allies.indexOf(d1.screen_name) == -1
    };
    removeForces();

    var customRadial = isolate(d3.forceRadial(function(d){return getSize(d) + width / 5},width / 2, width / 5), filterOut).strength(0.3);
    simulation.stop()
        .force("radial", customRadial)
        .force("collide", d3.forceCollide(function(d){return getSize(d)}))
        .alpha(1)
        .alphaMin(0.9)
        .restart()
        .on("end", function () {
          var y = function(d){
            if(d.neutral){
              return randomY(Math.random());
            }else{
              return filterIn(d) ? height / 2 : d.y;
            }
          };
          var x = function(d){
            if(d.neutral){
              return randomX(Math.random());
            }else{
              return filterIn(d) ? d.proBrexit ? width / 8 :  width / 8 * 7 : d.x;
            }
          };
          splitMap_variable(x,y,0.2,true);
        });

    activeForces.push("center", "radial", "collide");

    return simulation

  }

  function splitMap(xFunction,yFunction){
    return splitMap_variable(xFunction,yFunction,0.20,false)
  }
  function splitMap_variable(xFunction,yFunction,strength,soft){
    var breakdownObjs = [{"type": "xy", "breakX": xFunction, "strengthX": strength, "breakY": yFunction, "strengthY": strength}, {"type": "charge", "filter": function(d) { return d; },"strength": -1.5}];
    return breakdown(breakdownObjs,soft)
  }

  /* helper functions */

  function highlight(filterFunction) {
    data.forEach(function(d) {
      d.color = filterFunction(d) ? highlightColor : defaultColor
    })
  }
  function fade(filterFunction) {
    data.forEach(function(d) {
      d.fade = filterFunction(d) ? 0 : 1
    })
  }
  function removeForces() {
    if (barYactive) {
      barYaxisDOM.remove();
      barYactive = false;
    }

    for (var i=0; i<activeForces.length; i++) {
      simulation
          .force(activeForces[i], null)
    }
    activeForces = [];
    simulation
        .on("end", null);
  }
  function updateNodes() {
    circles.transition().duration(updateDuration)
  }

  // from https://bl.ocks.org/mbostock/b1f0ee970299756bc12d60aedf53c13b
  function isolate(force, filter) {
    var initialize = force.initialize;
    force.initialize = function() { initialize.call(force, data.filter(filter)); };
    return force;
  }

  function drawCircles() {
    circles = svg.append("g")
        .attr("class", "circles")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", function(d){
          return getSize(d);
        })
        .attr('stroke','black')
        .attr("class","circle")
        .attr("opacity", 1)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("fill", function(d) {
          return d.color
        }).on("click", function(d) {
          var p1 = new Promise(function (resolve,reject) {
            resolve(d);
          }).then(function (val) {
            removeTweet("all");
            switch (window.triggerState){
              case "split":{
                displayTweet(val);
                window.triggerState = "tweet";
                break;
              }
              case "tweet":{
                window.trigger4();
                removeTweet("all");
                displayTweet(val);
                break;
              }
            }
          }).then(function () {
            hideOnClickOutside(document.getElementById("tweet_div"));
          })
        });
  }
  // draw circles
  var circles;
  drawCircles();

  function ticked() {
    circles.attr("cx", function(d) { return d.x; }).attr("cy", function(d) { return d.y; })
  }

  // define trigger functions

  window.triggerState = "";
  var t = undefined;
  var breaking_active = false;
  var voting_active = false;
  var not_clicked_in_30 = true;
  var last_checked = 0;

  // If the user doesn't click in 30 seconds it asks you to reset
  document.addEventListener("click", function(){
    not_clicked_in_30 = false;
  });

  // Base Trigger also starts the timer
  window.trigger = function () {
    document.getElementById("start").style.display = "none";
    document.getElementById("viz").style.filter = "none";
    t = d3.interval(function(elapsed) {
      if (elapsed > 1000 * 30 && !breaking_active){
        //document.getElementById("breaking").style.display = "block";
        //document.getElementById("breaking-header").style.display = "block";
      }
      if (elapsed > last_checked + 1000 * 30){
        last_checked = elapsed;
        if(not_clicked_in_30){
          trigger_end();
        }else{
          not_clicked_in_30 = true;
        }
      }
      if (elapsed > 1000 * 60 * 2 && !voting_active){
          //document.getElementById("vote-button").style.display = "block";
      }
      if (elapsed > 1000 * 60 * 10){
        trigger_end();
      }
      else{
        document.getElementById('timer').innerHTML = updateClock(document.getElementById('timer').innerHTML);
      }
    }, 1000);
    window.triggerState = "base";
    baseSim(0.001).on("end",function (d) {
      window.trigger2()
    });
  };

  // Trigger for the split
  window.trigger2 = function(){
    window.triggerState = "split";
    var y = function(d){
      if(d.neutral){
        return 0;
      }else{
        return height / 2;
      }
    };
    var x = function(d){
      if(d.neutral){
        return randomX_2(Math.random());
      }else{
        return d.proBrexit ? width / 8 :  width / 8 * 7;
      }
    };
    return splitMap_variable(x,y,0.4)
  };
  // Trigger for the Allied circles
  window.trigger3 = function (d1) {
      breakout_allies(d1);
  };
  // Trigger for the split, but soft
  window.trigger4 = function(){
    window.triggerState = "split";
    var y = function(d){
      if(d.neutral){
        return randomY(Math.random());
      }else{
        return height / 2;
      }
    };
    var x = function(d){
      if(d.neutral){
          return randomX(Math.random());
      }else{
        return d.proBrexit ? width / 8 :  width / 8 * 7;
      }
    };
    return splitMap_variable(x,y,0.1)
  };
  var triggers = [window.trigger,window.trigger2,window.trigger3];

  window.trigger_end = function () {
    //document.getElementById("reset").style.display = "block";
    document.getElementById("viz").style.filter = "blur(5px)";
    var t2 = d3.interval(function(elapsed) {
      if (elapsed > 1000 * 10){
        t2.stop();
        if(not_clicked_in_30){
          reset("none");
        }
      }
    }, 1000);
  };

  window.reset = function (decision) {
    removeTweet();
    simulation = d3.forceSimulation();
    simulation
      .nodes(data)
      .on("tick", ticked);
    initSim();
    svg.selectAll("*").remove();
    drawCircles();
    //document.getElementById("reset").style.display = "none";
    //document.getElementById("vote-button").style.display = "none";
    //document.getElementById("voting").style.display = "none";
    t.stop();
    document.getElementById("start").style.display = "block";
    document.getElementById("viz").style.filter = "blur(5px)";
    //document.getElementById("breaking").style.display = "none";
    //document.getElementById("breaking-header").style.display = "none";
    breaking_active = false;
    voting_active = false;
    last_checked = 0;
  }
}
