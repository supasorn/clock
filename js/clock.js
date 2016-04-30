var radians = 0.0174532925,
	clockRadius = 200,
	margin = 50,
	width = (clockRadius+margin)*2,
    height = (clockRadius+margin)*2,
    hourHandLength = 2*clockRadius/3,
    minuteHandLength = clockRadius,
    secondHandLength = clockRadius-12,
    secondHandBalance = 30,
    secondTickStart = clockRadius;
    secondTickLength = -10,
    hourTickStart = clockRadius,
    hourTickLength = -18
    secondLabelRadius = clockRadius + 16;
    secondLabelYOffset = 5
    hourLabelRadius = clockRadius - 40
    hourLabelYOffset = 7;


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

var task = {
  "time": [
    {h: 0, m: 10},
    {h: 1, m: 0},
  ]};


function toMinutes(task) {
  return [task.time[0].h * 60 + task.time[0].m, task.time[1].h * 60 + task.time[1].m];
}

function yxToTime(y, x, n) {
  var angle = Math.atan2(x, -y);
  var num = (n + Math.round(angle / (Math.PI * 2) * n)) % n;
  var clockAngle = num * (Math.PI * 2) / n;

  return [num, clockAngle];
}

function drawTask(task) {
  var a = toMinutes(task)
  console.log((a[1] - a[0]) * 6);
}

function drawClock(){ //create all the clock elements
	updateData();	//draw them in the correct starting position
	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	var face = svg.append('g')
		.attr('id','clock-face')
		.attr('transform','translate(' + (clockRadius + margin) + ',' + (clockRadius + margin) + ')');



  var mousecoord = [200, 250];
  poly = [{"x":0.0, "y":0},
        {"x":0,"y":-100},
        {"x":100,"y":0}];


  var endAngle = Math.PI; 
  svg.on("mousemove", function() {
    /*var coords = d3.mouse(this);
    console.log(coords);
    svg.select('#redcircle')
    .attr('cx', coords[0])
    .attr('cy', coords[1])*/
    m = d3.mouse(face.node())
    mousecoord[0] = m[0]
    mousecoord[1] = m[1]
    ret = yxToTime(m[1], m[0], 12)
    arc.endAngle(ret[1])

    //console.log(getAngle(task));
    drawTask(task);
    shade.attr("d", arc)

    //console.log(mousecoord)

  });
  var arc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(200)
    .startAngle(0)
    .endAngle(endAngle);


  var shade = face.append('path')
    .attr("d", arc)
    .attr("fill", "red")
    .attr("stroke-width", 0)
    .attr("opacity", 0.5)

	//add marks for seconds
	face.selectAll('.second-tick')
		.data(d3.range(0,60)).enter()
			.append('line')
			.attr('class', 'second-tick')
			.attr('x1',0)
			.attr('x2',0)
			.attr('y1',secondTickStart)
			.attr('y2',secondTickStart + secondTickLength)
			.attr('transform',function(d){
				return 'rotate(' + secondScale(d) + ')';
			});
	//and labels

	face.selectAll('.second-label')
		.data(d3.range(5,61,5))
			.enter()
			.append('text')
			.attr('class', 'second-label')
			.attr('text-anchor','middle')
			.attr('x',function(d){
				return secondLabelRadius*Math.sin(secondScale(d)*radians);
			})
			.attr('y',function(d){
				return -secondLabelRadius*Math.cos(secondScale(d)*radians) + secondLabelYOffset;
			})
			.text(function(d){
				return d;
			});

	//... and hours
	face.selectAll('.hour-tick')
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

	face.selectAll('.hour-label')
		.data(d3.range(3,13,3))
			.enter()
			.append('text')
			.attr('class', 'hour-label')
			.attr('text-anchor','middle')
			.attr('x',function(d){
				return hourLabelRadius*Math.sin(hourScale(d)*radians);
			})
			.attr('y',function(d){
				return -hourLabelRadius*Math.cos(hourScale(d)*radians) + hourLabelYOffset;
			})
			.text(function(d){
				return d;
			});


	var hands = face.append('g').attr('id','clock-hands');

	face.append('g').attr('id','face-overlay')
		.append('circle').attr('class','hands-cover')
			.attr('x',0)
			.attr('y',0)
			.attr('r',clockRadius/20);

	hands.selectAll('line')
		.data(handData)
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

function moveHands(){
	d3.select('#clock-hands').selectAll('line')
	.data(handData)
		.transition()
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

drawClock();

setInterval(function(){
	updateData();
	moveHands();
}, 1000);

d3.select(self.frameElement).style("height", height + "px");
