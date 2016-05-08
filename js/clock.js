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
var colorCounter = 0;

var tasks = [new Task()];
var numTasks = 0; // Can be different from tasks.length.

function Task() {
  this.h0 = 0;
  this.m0 = 0;
  this.h1 = 0;
  this.m1 = 0;
  this.name = "t" + colorCounter;
  this.color = colors(colorCounter++);
}

Task.prototype.draw = function() {
  d3.selectAll("." + this.name).remove();
  if (this.h0 < this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, 60, this.name);
    for (var i = this.h0; i < this.h1; i++) {
      var t = d3.select("#clock_" + i);
      drawJoin(t, this.name);
      if (i > this.h0)
        drawArc(t, 0, 60, this.name);
    }
    drawArc(d3.select("#clock_" + this.h1), 0, this.m1, this.name);
  } else if (this.h0 == this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, this.m1, this.name);
  }
  d3.selectAll("." + this.name).attr("fill", this.color);
  d3.selectAll("." + this.name).attr("stroke", this.color);
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
  d3.selectAll(".arc").remove();
  for (var i = 0; i < tasks.length; i++) {
    tasks[i].draw();
  }
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
    .data(d3.range(1, 9))
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
        drawAllTasks();
      } 
      marking ^= 1;
    });
}


