var clockRadius = 60,
    clockMargin = 20,
    clockWidth = (clockRadius + clockMargin) * 2,
    clockHeight = clockWidth,
    hourTickStart = clockRadius,
    hourTickLength = -clockRadius * 0.1;

function drawStartLine(clock, angle) {
  clock.selectAll('.startline')
    .append('line')
    .enter()
    .attr("class", "startline")
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 100 * Math.cos(angle))
    .attr('y2', 100 * Math.sin(angle))
}

function yxToTime(y, x, n) {
  var angle = Math.atan2(x, -y);
  var num = (n + Math.round(angle / (Math.PI * 2) * n)) % n;
  var clockAngle = num * (Math.PI * 2) / n;

  return [num, clockAngle];
}

function drawClock(id) {
  var svg = d3.select("#" + id).append("svg")
    .attr("width", clockWidth)
    .attr("height", clockHeight);

	var clock = svg.append('g')
		.attr('id','clock_' + id)
		.attr('transform','translate(' + (clockRadius + clockMargin) + ',' + (clockRadius + clockMargin) + ')');


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
    .on("click", function(d) {
      var m = d3.mouse(this);
      var o = yxToTime(m[1], m[0], 60);

      drawStartLine(clock, o[1]);
    });

}


