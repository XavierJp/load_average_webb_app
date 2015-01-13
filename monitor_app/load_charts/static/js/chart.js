var threshold = 1.0;

getValues();	

// update automation
$(document).ready(function(){
	setInterval("getValues();", 10000);
	setInterval("getAlerts();", 10000);
});

// AJAX call
function getValues() {
	$.get("/load_charts/charts-get/", function (data){ drawChart(data, threshold); });
};
function getAlerts() {
	$.get("/load_charts/check-alerts/?threshold="+threshold.toFixed(2), function (data){ updateAlert(data) });
};

// Add alert boxes in right container 
function updateAlert(alertMessage) {

	var alertJson = JSON.parse(alertMessage);

	if (alertJson.alert !=-1){
		$(".initialMessage").remove();
		$(".alert").toggleClass("old", true);
		$(".alert").toggleClass("alert", false);

		if (alertJson.alert == 1){
			$('#alert-list').prepend('<li class="alert">High load generated an alert - '+alertJson.value.toFixed(2)+' : <b> load</b>, triggered at '+alertJson.time+'</li>');
		}
		else if (alertJson.alert == 0) {
			$('#alert-list').prepend('<li class="alert recover">Load is back to normal, at '+alertJson.time+'</li>');
		}
	}
};

// D3. Call this function to redraw chart
function drawChart(values, alert) {

	d3.select(".chart").selectAll("*").remove();

	var data = JSON.parse(values);

	var height = 300,
		width = 610,
		margin = {top: 20, right: 10, bottom: 10, left: 50};

	var barWidth = 7;


	var col = d3.scale.linear()
		.domain([Math.min(threshold, d3.min(data, function(d) { return d.value; })), d3.max(data, function(d) { return d.value; })])
		.range([0, 255]);

	var minDate = d3.time.minute.offset(new Date(data[0].date), -10);
		maxDate = new Date(data[0].date);

	var x = d3.time.scale()
        .domain([minDate, maxDate])
		.range([0, width]);

	var y = d3.scale.linear()
		.domain([0, Math.max(alert, d3.max(data, function(d) { return d.value; }))*1.05])
		.range([height, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var drag = d3.behavior.drag()
		.origin(function() { 
  			var t = d3.select(this);
  			return {x: t.attr("x"), y: t.attr("y")};
  		})
        .on("drag", function(d, i) {
				var yPos = d3.event.y;
            d3.select(".thresholdText").attr("y", yPos)
            d3.select(".thresholdText").text("alert threshold: "+y.invert(yPos).toFixed(2));
            d3.select(".thresholdLine").attr("y", yPos)
            threshold = y.invert(yPos);
            });


	var chart = d3.select(".chart")
	    .attr("width", width+margin.left+margin.right)
	    .attr("height", height+margin.top+margin.bottom);

	chart.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate("+margin.left+",0)")
		.call(yAxis)
	   .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", -45)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text("Load Average");

	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate("+margin.left+"," + height + ")")
		.call(xAxis);

	chart.selectAll(".bar")
	    .data(data)
	  .enter().append("rect")
	  	.attr("fill", function(d){ return "rgb("+d3.round(col(d.value))+10+","+(255-d3.round(col(d.value)))+",0)";})
	  	.attr("class", "bar")
		.attr("x", function(d, i) { return x(new Date(d.date))+margin.left - barWidth; })
	  	.attr("width", barWidth)
		.attr("y", function(d) { return y(d.value); })
	    .attr("height", function(d) {return height - y(d.value); })
		.on("mouseover", function(d){ 
			$("#display-area").append('<p class="viewer"> <b>Time:</b> '+d.date.substr(d.date.length - 8)+'  -    <b>Load average over past minute :</b> '+d.value+'</p>'); })
		.on("mouseout", function(){ $(".viewer").remove(); });

	chart.append("rect")
		.attr("class", "thresholdLine")
		.attr("y",function() { return y(alert); })
		.attr("x",function() { return margin.left; })
		.attr("width", function(d) { return width; })
		.attr("fill", "#111111")
		.attr("height", "1")
		.style("cursor", "ns-resize")
		.call(drag);

	chart.append("text")
		.attr("class", "thresholdText")
		.attr("y",function(d) { return y(alert); })
		.attr("dy", "-5")
		.attr("x",function(d,i) { return margin.left+93; })
		.text("alert threshold: "+alert.toFixed(2))
		.attr("fill", "#000")
		.style("cursor", "ns-resize")
		.call(drag);


};