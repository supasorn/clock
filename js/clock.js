var clockRadius = 60,
    clockMargin = 10,
    clockWidth = (clockRadius + clockMargin) * 2,
    clockHeight = clockWidth,
    hourTickStart = clockRadius,
    hourTickLength = -4;

var arcInner = 0.6;

var joinWidth = 10;
var freq = 12;

var marking = 0;
var currentClock;
var colors = d3.scale.category10();

var tasks;
var numTasks; // Can be different from tasks.length.
var sortIndex;
var idCounter = 0;

var hourHandLength = 2*clockRadius/3,
    minuteHandLength = clockRadius * 0.8,
    secondHandLength = clockRadius-12,
    secondHandBalance = 30;

var hourScale = d3.scale.linear()
	.range([0,330])
	.domain([0,11]);

var minuteScale = secondScale = d3.scale.linear()
	.range([0,354])
	.domain([0,59]);

var handData = [
	{
		type:'hour',
		value:0,
		length:-hourHandLength,
		scale:hourScale
	},
	{
		type:'minute',
		value:0,
		length:-minuteHandLength,
		scale:minuteScale
	},
	{
		type:'second',
		value:0,
		length:-secondHandLength,
		scale:secondScale,
		balance:secondHandBalance
	}
];

function renderTemplate(template, data) {
  var t = document.getElementById(template).innerHTML;
  Mustache.parse(t);
  return Mustache.render(t, data);
}

function Task() {
  this.h0 = 0;
  this.m0 = 0;
  this.h1 = 0;
  this.m1 = 0;
  this.name = "t" + idCounter;
  this.id = "task_" + (idCounter++); 

  var usedColors = new Set();
  for (var i = 0; i < tasks.length; i++) {
    usedColors.add(tasks[i].color);
  }
  
  for (var i = 0; i < 20; i++) {
    if (!usedColors.has(colors(i))) {
      this.color = colors(i);
      break;
    }
  }
}

Task.prototype.init = function(obj) {
  this.h0 = obj.h0;
  this.h1 = obj.h1;
  this.m0 = obj.m0;
  this.m1 = obj.m1;
  this.name = obj.name;
  this.id = obj.id;
  this.color = obj.color;
  return this;
}

Task.prototype.draw = function() {
  d3.selectAll("." + this.id).remove();
  if (this.h0 < this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, 60, this.id);
    for (var i = this.h0; i < this.h1; i++) {
      var t = d3.select("#clock_" + i);
      drawJoin(t, this.id);
      if (i > this.h0)
        drawArc(t, 0, 60, this.id);
    }
    drawArc(d3.select("#clock_" + this.h1), 0, this.m1, this.id);
  } else if (this.h0 == this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, this.m1, this.id);
  }
  d3.selectAll("." + this.id).attr("fill", this.color);
  d3.selectAll("." + this.id).attr("stroke", this.color);
}

function drawJoin(clock, extraclass) {
  var ln = clock.insert('line', ':first-child')
    .attr("class", "join");
  if (extraclass != "")
    ln.classed(extraclass, true);

  ln.attr('x1', 0)
    .attr('y1', -clockRadius - joinWidth / 2)
    .attr('x2', clockWidth)
    .attr('y2', -clockRadius - joinWidth / 2)
    .attr('stroke-width', joinWidth)
}

function updateSortIndex() {
  sortIndex = d3.range(numTasks + 1);
  sortIndex.sort(function(a, b) {
    return tasks[a].h0 * 60 + tasks[a].m0 - tasks[b].h0 * 60 - tasks[b].m0;
  });

}
function drawLine(clock, angle, cls) {
  var ln = clock.select('.' + cls);
  if (ln.empty()) {
    ln = clock.insert('line', ':first-child').attr("class", cls)
  }
  ln.attr('x1', 0)
    .attr('y1', -clockRadius * 0.5)
    .attr('x2', 0)
    .attr('y2', -clockRadius)
    .attr('transform', 'rotate(' + angle +')')
  ln.style("visibility", "visible")
}

function drawArc(clock, m0, m1, extraclass="") {
  var arc = d3.svg.arc()
    .innerRadius(clockRadius * arcInner)
    .outerRadius(clockRadius)
    .startAngle(m0 * Math.PI * 2 / 60)
    .endAngle(m1 * Math.PI * 2 / 60)
    .cornerRadius(5);

  var ln = clock.insert('path', ':first-child').attr("class", "arc");
  if (extraclass != "")
    ln.classed(extraclass, true);

  ln.attr("d", arc)
    .attr("fill", "red")
    .attr("stroke-width", 0)
    .attr("opacity", 0.6)
}

function formatTime(h, m) {
  if (m == 60) {
    m = 0;
    h++;
  }
  var out = h + ":";
  if (h < 10) out = "0" + out;
  if (m < 10) out += "0";
  out += m;
  return out;
}

function yxToTime(y, x, n, usenoon = false) {
  var angle = Math.atan2(x, -y);
  var num = (n + Math.round(angle / (Math.PI * 2) * n)) % n;
  var t = Math.round(angle / (Math.PI * 2) * n);
  // Make sure if cursor is close to 12 from the left side, return n
  if (usenoon && t == 0 && !Object.is(t, +0)) 
    num = n;
  else 
    num = (n + t) % n;

  var clockAngle = num * (360) / n;
  return [num, clockAngle];
}


function drawAllTasks() {
  d3.selectAll(".arc,.join").remove();
  for (var i = 0; i < tasks.length; i++) {
    tasks[i].draw();
  }
}

function updateTaskInfo() {
  d3.selectAll(".task")
    .data(sortIndex)
    .enter()
    .append("div")
    .attr("class", "task")

  d3.selectAll(".task").data(sortIndex).exit().remove();
  var ts = d3.selectAll(".task");

  ts.html(function(d, i) {
      var marker = tasks[d];
      var view = {
        from: formatTime(marker.h0, marker.m0),
        to: formatTime(marker.h1, marker.m1),
        task_text: marker.name,
        duration: marker.h1 * 60 + marker.m1 - marker.h0 * 60 - marker.m0
      };
      return renderTemplate("template_task", view);
    })
    //.style("background-color", function(d) { return tasks[d].color; })
    .classed("task_active", function(d) { return d == numTasks })
    .classed("hide", function(d) { return d == numTasks && !marking; })

  ts.select(".time_wrapper")
  .style("background-color", function(d) { return tasks[d].color; });

  ts.select(".task_text").on("keyup", function(d) {
    tasks[d].name = this.value;
    saveTasksToFile();
  });

  ts.select(".remove_button").on("click", function(d, i) {
    tasks.splice(d, 1);
    numTasks --;
    console.log(numTasks);
    console.log(tasks);

    updateSortIndex();
    updateTaskInfo();
    drawAllTasks();
    saveTasksToFile();
  });

}

function saveTasksToFile() {
  d3.json("save")
    .header("Content-Type", "application/json")
    .post(JSON.stringify(
          {"tasks": tasks.slice(0, -1),
            "idCounter": idCounter
      }));
}

function drawClocks() {
  d3.select("body").on("keydown", function() {
    if (d3.event.shiftKey) 
      freq = 60;
  }).on ("keyup", function() {
    if (!d3.event.shiftKey) 
      freq = 12;
  });
  var svg = d3.select("#allclock").append('svg')
    .attr("width", clockWidth * 8)
    .attr("height", clockHeight);

  var hourScale = d3.scale.linear()
    .range([0,330])
    .domain([0,11]);

  var clocks = svg.selectAll(".clock")
    .data([8, 9, 10, 11, 12, 1, 2, 3])
    .enter()
    .append('g')
    .attr("class", "clock")
    .attr("id", function(d) {return "clock_" + d;})
    .attr('transform', function(d, i) {return 'translate(' + (clockWidth * i + clockRadius + clockMargin) + ',' + (clockRadius + clockMargin) + ')'});

  clocks.append('text')
    .attr("class", "num")
    .style("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .text(function(d) { return d; });

  clocks.selectAll('.hour-tick')
		.data(d3.range(0,12)).enter()
			.append('line')
			.attr('class', 'hour-tick')
			.attr('x1',0)
			.attr('x2',0)
			.attr('y1',hourTickStart)
			.attr('y2',hourTickStart + hourTickLength)
			.attr('transform',function(d){
				return 'rotate(' + hourScale(d) + ')';
			});

  clocks.append("rect")
    .attr("class", "overlay")
    .attr("width", clockWidth)
    .attr("height", clockHeight)
    .attr("x", -clockWidth / 2)
    .attr("y", -clockHeight / 2)
    .on("mouseout", function(d) {
      if (!marking) {
        d3.selectAll('.startline').style("visibility", "hidden");
        d3.selectAll('.endline').style("visibility", "hidden");
      }
    })
    .on("mousemove", function(d) {
      var clock = d3.select(this.parentNode);
      var m = d3.mouse(this);
      var r = m[1] * m[1] + m[0] * m[0];
      if (r < (arcInner * arcInner * clockRadius * clockRadius)) return;
      var o = yxToTime(m[1], m[0], freq, marking);

      var marker = tasks[numTasks];
      if (marking) {
        marker.m1 = o[0] * 60 / freq;
        marker.h1 = d;
        if (marker.h0 == marker.h1 && marker.m1 < marker.m0) 
          marker.m1 = 60;

        if (marker.m1 == 60) { // Add dangling join edge
          marker.m1 = 0;
          marker.h1++;
        }
        marker.draw();
        updateTaskInfo();
        d3.select("#marker").text(formatTime(marker.h0, marker.m0) + " - " + formatTime(marker.h1, marker.m1));
        d3.select("#duration").text(marker.h1 * 60 + marker.m1 - marker.h0 * 60 - marker.m0 + " Mins");

      } else {
        marker.m0 = o[0] * 60 / freq;
        marker.h0 = d;
        //console.log(marker.m0);
        drawLine(clock, marker.m0 * 360 / 60, 'startline');
        d3.select("#marker").text(formatTime(marker.h0, marker.m0));
        d3.select("#duration").text(" ");
      }
      //tasks.sort(function(a, b) {
        //return a.h0 * 60 + a.m0 - b.h0 * 60 - b.m0;
      //});

    })
    .on("click", function(d) {
      if (marking == 1) {
        if (tasks[numTasks].m1 == 0) { // To remove dangling join edge
          tasks[numTasks].m1 = 60;
          tasks[numTasks].h1--;
        }
        numTasks ++;
        tasks.push(new Task());

        d3.selectAll('.startline').style("visibility", "hidden");
        d3.selectAll('.endline').style("visibility", "hidden");

        saveTasksToFile();

      } else {
        updateSortIndex();
      }
      drawAllTasks();
      updateTaskInfo();
      marking ^= 1;
    });




  setInterval(function(){
    updateData();
    moveHands();
  }, 1000);

  updateData();
	var hands = d3.select("#clock_" + (new Date()).getHours() % 12).append('g').attr('id','clock-hands');

	hands.selectAll('line')
		.data([handData[1], handData[2]])
			.enter()
			.append('line')
			.attr('class', function(d){
				return d.type + '-hand';
			})
			.attr('x1',0)
			.attr('y1',function(d){
				return d.balance ? d.balance : 0;
			})
			.attr('x2',0)
			.attr('y2',function(d){
				return d.length;
			})
			.attr('transform',function(d){
				return 'rotate('+ d.scale(d.value) +')';
			});
}

function updateData(){
	var t = new Date();
	handData[0].value = (t.getHours() % 12) + t.getMinutes()/60 ;
	handData[1].value = t.getMinutes();
	handData[2].value = t.getSeconds();
}

function moveHands(){
	d3.select('#clock-hands').selectAll('line')
	.data([handData[1], handData[2]])
		.transition()
		.attr('transform',function(d){
			return 'rotate('+ d.scale(d.value) +')';
		});
}

function initialize() {
  d3.json("load", function (error, data) {
    if (error != null) {
      console.log(error.status);

      tasks = [new Task()];
      numTasks = 0; // Can be different from tasks.length.
      sortIndex = [0];
    } else {
      idCounter = data.idCounter;
      tasks = data.tasks;
      console.log(tasks);
      numTasks = tasks.length;

      for (var i = 0; i < numTasks; i++) {
        tasks[i] = new Task().init(tasks[i]);
      }

      tasks.push(new Task());
      updateSortIndex();

      drawAllTasks();
      updateTaskInfo();
    }
  });

}
