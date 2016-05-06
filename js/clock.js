var clockRadius = 80,
    clockMargin = 20,
    clockWidth = (clockRadius + clockMargin) * 2,
    clockHeight = clockWidth,
    hourTickStart = clockRadius,
    hourTickLength = -clockRadius * 0.1;

var marking = 0;
var marker = {h0: 0, m0: 0, h1: 0, m1: 0};
var currentClock;

function drawLine(clock, angle, cls) {
  var ln = clock.select('.' + cls);
  if (ln.empty()) {
    ln = clock.append('line').attr("class", cls)
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

  console.log([m0, m1])
  var ln = clock.select('.arc');
  if (ln.empty()) {
    ln = clock.append('path').attr("class", "arc");
  }
  ln.attr("d", arc)
    .attr("fill", "red")
    .attr("stroke-width", 0)
    .attr("opacity", 0.5)
}

function yxToTime(y, x, n) {
  var angle = Math.atan2(x, -y);
  var num = (n + Math.round(angle / (Math.PI * 2) * n)) % n;
  var t = Math.round(angle / (Math.PI * 2) * n);
  // Make sure if cursor is close to 12 from the left side, return n
  if (t == 0 && !Object.is(t, +0)) 
    num = n;
  else 
    num = (n + t) % n;

  var clockAngle = num * (360) / n;
  return [num, clockAngle];
}

function drawClock(id) {
  var svg = d3.select("#clock" + id).append("svg")
    .attr("width", clockWidth)
    .attr("height", clockHeight);

	var clock = svg.append('g')
		.attr('id','clock_' + id)
		.attr('transform','translate(' + (clockRadius + clockMargin) + ',' + (clockRadius + clockMargin) + ')');

  clock.append('text')
  .attr("class", "num")
  .style("text-anchor", "middle")
  .attr("dominant-baseline", "central")
  .text(id)


  var hourScale = d3.scale.linear()
    .range([0,330])
    .domain([0,11]);

	clock.selectAll('.hour-tick')
		.data(d3.range(0,12)).enter()
			.append('line')
      //.attr("stroke-linecap", "round")
			.attr('class', 'hour-tick')
			.attr('x1',0)
			.attr('x2',0)
			.attr('y1',hourTickStart)
			.attr('y2',hourTickStart + hourTickLength)
			.attr('transform',function(d){
				return 'rotate(' + hourScale(d) + ')';
			});

  svg.append("rect")
    .attr({"class": "overlay" , "width": clockWidth , "height": clockHeight})
    .on("mouseout", function(d) {
      if (!marking) {
        clock.select('.startline').style("visibility", "hidden");
        clock.select('.endline').style("visibility", "hidden");
      }
    })
    .on("mousemove", function(d) {
      var m = d3.mouse(this);
      var o = yxToTime(m[1] - clockHeight * 0.5, m[0] - clockWidth * 0.5, 12);

      if (marking) {
        marker.m1 = o[0] * 5;
        marker.h1 = id;

        d3.selectAll(".arc").remove();
        if (marker.h0 < marker.h1) {
          drawArc(d3.select("#clock_" + marker.h0), marker.m0, 60);
          //drawLine(d3.select("#clock_" + marker.h0), marker.m0 * 360 / 60, 'startline');
          for (var i = marker.h0 + 1; i < marker.h1; i++) {
            drawArc(d3.select("#clock_" + i), 0, 60);
          }
          drawArc(d3.select("#clock_" + marker.h1), 0, marker.m1);

        } else if (marker.h0 == marker.h1) {
          if (marker.m1 < marker.m0) 
            marker.m1 = 60;
          drawArc(clock, marker.m0, marker.m1);
          //drawLine(clock, marker.m0 * 360 / 60, 'startline');
          //drawLine(clock, marker.m1 * 360 / 60, 'endline');
        }
      } else {
        marker.m0 = o[0] * 5;
        marker.h0 = id;
        drawLine(clock, marker.m0 * 360 / 60, 'startline');
      }
    })
    .on("click", function(d) {
      marking ^= 1;
      //clock.select('.startline').style("visibility", "hidden");
    });

}


