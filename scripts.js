  
async function displayPopulationPyramid(data_csv) {

  var margin = {top: 100, right: 50, bottom: 50, left: 50},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      bar_width = Math.floor(width / 50);

  var x = d3.scale.linear()
      .range([bar_width, width - bar_width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("right")
      .tickSize(-width)
      .tickFormat(function(d) { return Math.round(d / 1e6) + "M"; });

  // An SVG element with a bottom-right origin.
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right + bar_width)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // A sliding container to hold the bars by birthyear.
  var birthyears = svg.append("g")
      .attr("class", "birthyears");

  // A label for the current year.
  var title = svg.append("text")
      .attr("class", "title")
      .attr("dy", ".71em")
      .text(2050);

  d3.csv(data_csv, function(error, data) {

    // Convert strings to numbers.
    data.forEach(function(d) {
      d.year = +d.year;
      d.age = +d.age;
      d.pop = +d.pop;
    });

    // Compute the extent of the data set in age and years.
    var age_max = d3.max(data, function(d) { return d.age; }),
        year_min = d3.min(data, function(d) { return d.year; }),
        year_max = d3.max(data, function(d) { return d.year; }),
        year = year_max;

    // Update the scale domains.
    x.domain([year_max - age_max, year_max]);
    y.domain([0, d3.max(data, function(d) { return d.pop; })]);

    // Produce a map from year and birthyear to [male, female].
    data = d3.nest()
        .key(function(d) { return d.year; })
        .key(function(d) { return d.year - d.age; })
        .rollup(function(v) { return v.map(function(d) { return d.pop; }); })
        .map(data);

    // Add an axis to show the population values.
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis)
      .selectAll("g")
      .filter(function(value) { return !value; })
        .classed("zero", true);

    // Add labeled rects for each birthyear (so that no enter or exit is required).
    var birthyear = birthyears.selectAll(".birthyear")
        .data(d3.range(year_min - age_max, year_max + 1, 5))
      .enter().append("g")
        .attr("class", "birthyear")
        .attr("transform", function(birthyear) { return "translate(" + x(birthyear) + ",0)"; });

    birthyear.selectAll("rect")
        .data(function(birthyear) { return data[year][birthyear] || [0, 0]; })
      .enter().append("rect")
        .attr("x", function(d,i) {return i*bar_width - bar_width;})
        .attr("width", bar_width)
        .attr("y", y)
        .attr("height", function(d) { return height - y(d); });

    // Add labels to show age (separate; not animated).
    svg.selectAll(".age")
        .data(d3.range(0, age_max + 1, 5))
      .enter().append("text")
        .attr("class", "age")
        .attr("x", function(age) { return x(year - age) - 5; })
        .attr("y", height + 4)
        .attr("dy", ".71em")
        .text(function(age) { return age; });

    // Allow the arrow keys to change the displayed year.
    //window.focus();
    d3.select(window).on("keydown", function() {
      switch (d3.event.keyCode) {
        case 37: year = Math.max(year_min, year - 10); break;
        case 39: year = Math.min(year_max, year + 10); break;
      }
      update();
    });


    function update() {
      if (!(year in data)) return;
      title.text(year);

      birthyears.transition()
          .duration(750)
          .attr("transform", "translate(" + (x(year_max) - x(year)) + ",0)");

      birthyear.selectAll("rect")
          .data(function(birthyear) { return data[year][birthyear] || [0, 0]; })
        .transition()
          .duration(750)
          .attr("y", y)
          .attr("height", function(d) { return height - y(d); });
    }

    year = 1950
    update()

  });

}