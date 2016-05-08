var clockRadius = 60,
    clockMargin = 10,
    clockWidth = (clockRadius + clockMargin) * 2,
    clockHeight = clockWidth,
    hourTickStart = clockRadius,
    hourTickLength = -4;

var marking = 0;
var marker = {h0: 0, m0: 0, h1: 0, m1: 0};
var currentClock;

var tasks = [];

function Task(marker) {
  this.h0 = marker.h0;
  this.m0 = marker.m0;
  this.h1 = marker.h1;
  this.m1 = marker.m1;
}

Task.prototype.draw = function() {
  if (this.h0 < this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, 60);
    for (var i = this.h0 + 1; i < this.h1; i++) {
      drawArc(d3.select("#clock_" + i), 0, 60);
    }
    drawArc(d3.select("#clock_" + this.h1), 0, this.m1);
  } else if (this.h0 == this.h1) {
    drawArc(d3.select("#clock_" + this.h0), this.m0, this.m1);
  }
}

function drawLine(clock, angle, cls) {
  var ln = clock.select('.' + cls);
  if (ln.empty()) {
    ln = clock.insert('line', ":first-child").attr("class", cls)
  }
  ln.attr('x1', 0)
    .attr('y1', -clockRadius * 0.5)
    .attr('x2', 0)
    .attr('y2', -clockRadius)
    .attr('transform', 'rotate(' + angle +')')
  ln.style("visibility", "visible")
}

function drawArc(clock, m0, m1) {
  var arc = d3.svg.arc()
    .innerRadius(clockRadius * 0.6)
    .outerRadius(clockRadius)
    .startAngle(m0 * Math.PI * 2 / 60)
    .endAngle(m1 * Math.PI * 2 / 60);

  var ln = clock.select('.arc');
  if (ln.empty()) {
    ln = clock.insert('path', ':first-child').attr("class", "arc");
  }
  ln.attr("d", arc)
    .attr("fill", "red")
    .attr("stroke-width", 0)
    .attr("opacity", 0.5)
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
  for (var i = 0; i < tasks.length; i++) {
    tasks[i].draw();
  }
}

function drawClocks() {
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
      var o = yxToTime(m[1], m[0], 12, marking);

      if (marking) {
        marker.m1 = o[0] * 5;
        marker.h1 = d;

        d3.selectAll(".arc").remove();
        if (marker.h0 < marker.h1) {
          drawArc(d3.select("#clock_" + marker.h0), marker.m0, 60);
          for (var i = marker.h0 + 1; i < marker.h1; i++) {
            drawArc(d3.select("#clock_" + i), 0, 60);
          }
          drawArc(d3.select("#clock_" + marker.h1), 0, marker.m1);

        } else if (marker.h0 == marker.h1) {
          if (marker.m1 < marker.m0) 
            marker.m1 = 60;
          drawArc(clock, marker.m0, marker.m1);
          //drawLine(clock, marker.m0 * 360 / 60, 'startline');
          //drawLine(d3.select("#clock_" + marker.h1), marker.m1 * 360 / 60, 'endline');
        }
      } else {
        marker.m0 = o[0] * 5;
        marker.h0 = d;
        //console.log(marker.m0);
        drawLine(clock, marker.m0 * 360 / 60, 'startline');
      }
    })
    .on("click", function(d) {
      if (marking == 1) {
        tasks.push(new Task(marker));
        d3.selectAll('.startline').style("visibility", "hidden");
        d3.selectAll('.endline').style("visibility", "hidden");
        //drawAllTasks();
      }
      marking ^= 1;
    });


}


