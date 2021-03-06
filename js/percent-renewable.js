
// Convert Year column into date format
var parseYear = d3.timeParse("%Y")

// Convert Date format into year
var formatYear = d3.timeFormat("%Y");

// Format number with decimals into an integer
var formatInteger = d3.format(",.0f")

// Bisect function magic
var bisectDate = d3.bisector(function(d) { return d.Year; }).left;

var color = d3.scaleOrdinal(["#EF4836", "#F62459", "#BF55EC", "#663399",
                         "#446CB3", "#19B5FE", "#00B16A", "#36D7B7",
                         "#F7CA18", "#F9690E", "#F64747"])

d3.csv("data/percentage-renewables.csv", type, function(error, data) {
  if (error) throw error;

  // Setting margin, width, height of plot
  var margin = 130,
      width = 850 - margin,
      height = 550 - margin;

  // Initialise tooltip as hidden
  d3.select('#percent-renewable-tooltip')
    .classed('hidden', true);

  var svg = d3.select('#percent-renewable-chart')
              .append('svg')
              .attr('viewBox', '0 0 ' + (width + margin) + ' ' + (height + margin));

  var g = svg.append('g')
             .attr('transform', 'translate(' + 30 + ',' + 20 + ')');

  var x = d3.scaleTime()
            .rangeRound([0, width]);

  var y = d3.scaleLinear()
            .rangeRound([height, 0]);

  var z = d3.scaleOrdinal(d3.schemeCategory10);

  // Initialise d3 line function
  var line = d3.line()
               .defined(function(d) { return !isNaN(d['Percentage']); })
               .curve(d3.curveLinear)
               .x(function(d) {
                 return x(d['Year']);
               })
               .y(function(d) {
                 return y(d['Percentage']);
               });

  var countries = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {Year: d['Year'], Percentage: d[id]};
      })
    };
  });

  // Set x- and y-axis domains
  x.domain(d3.extent(data, function(d) { return d['Year']; }));

  y.domain([0, 100]);

  color.domain(countries.map(function(c) {
    return c.id;
  }));

  // Set x- and y-axes
  var x_axis = d3.axisBottom(x);

  var y_axis = d3.axisLeft(y);

  x_axis.ticks(6)
        .tickSizeOuter(0)
        .tickSizeInner(5)
        .tickPadding(4);

  y_axis.ticks(5)
        .tickSizeInner(-width)
        .tickSizeOuter(0)
        .tickPadding(8);

  // Add x-axis to plot
  g.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .attr('id', 'percent-renewable-x-axis')
    .attr('class', 'line-chart-x-axis')
    .call(x_axis);

  // Add y-axis to plot
  g.append('g')
    .attr('id', 'percent-renewable-y-axis')
    .attr('class', 'line-chart-y-axis')
    .call(y_axis);

  // Create groups for each country
  var country_percent_renewable = g.selectAll('.country-percent-renewable')
                                    .data(countries)
                                    .enter()
                                    .append('g')
                                    .attr('class', 'country country-percent-renewable')
                                    .attr('id', function(d) { return d.id.replace(/ /g, '') + '-percent-renewable'; });

  // Draw path for each country
  country_percent_renewable.append('path')
                           .attr('id', function(d) { return d.id.replace(/ /g, '') + '-percent-renewable-path'; })
                           .attr('d', function(d) { return line(d.values); })
                           .attr('fill', 'none')
                           .attr('stroke', '#ccc')
                           .attr('stroke-linejoin', 'round')
                           .attr('stroke-linecap', 'round')
                           .attr('stroke-width', 3);

  // Draw circles for each data point on the path
  country_percent_renewable.selectAll('.dot')
                           .data(function(d) { return d.values; })
                           .enter().append('circle')
                           .attr('class', 'dot')
                           .attr('cx', line.x())
                           .attr('cy', line.y())
                           .attr('r', function(d) {
                             return d['Percentage'] == ".." ? 0 : 3;
                           })
                           .attr('opacity', 0);

  // Add a text element at the end of each line path for each country.
  country_percent_renewable.append('text')
                           .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
                           .attr('transform', function(d) { return 'translate(' + x(d.value.Year) + "," + y(d.value.Percentage) + ")"; })
                           .attr('x', 6)
                           .attr('dy', '0.35em')
                           .attr('class', 'tk-atlas')
                           .style('font-size', '10px')
                           .text(function(d) { return d.id; });

  // Colour the paths of select countries. colourLine function definition is in
  // energy-per-capita.js
  colourLine('Canada', LINE_GRAPHS[1], '#f67280');

  country_percent_renewable.on('mouseover', function(d) {
           if (d3.select(this).classed('clicked') != true) {
             colourLine(d.id, LINE_GRAPHS[1], color(d.id), hover=true);

             showCircles(d.id, LINE_GRAPHS[1]);
           }

           d3.select('#percent-renewable-tooltip')
             .classed('hidden', false);
         })
         .on('mouseout', function(d) {
           if (d3.select(this).classed('clicked') != true) {
             colourLine(d.id, LINE_GRAPHS[1], '#ccc');

             hideCircles(d.id, LINE_GRAPHS[1]);
           }

          d3.select('#percent-renewable-tooltip')
            .classed('hidden', true);
         })
         .on('click', function(d) {
           if (d3.select(this).classed('clicked')) {
             colourLine(d.id, LINE_GRAPHS[1], '#ccc');

             d3.select(this)
               .classed('clicked', false);
           } else {
             colourLine(d.id, LINE_GRAPHS[1], color(d.id))

             d3.select(this)
               .classed('clicked', true);
           }
         })
         .on('mousemove', function(d) {
           var coordinates = [0, 0];
           coordinates = d3.mouse(this);

           var xPosition = coordinates[0];
           var yPosition = coordinates[1] + 50;

           d3.select('#percent-renewable-tooltip')
             .style('left', xPosition + 'px')
             .style('top', yPosition + 'px');

           d3.select('#percent-renewable-tooltip-heading')
             .text(d.id);

           var x0 = x.invert(xPosition),
               i = bisectDate(d.values, x0, 1);
               d0 = d.values[i - 1],
               d1 = d.values[i],
               d = x0 - d0.Year > d1.Year - x0 ? d1 : d0;

           d3.select('#percent-renewable-tooltip-y')
             .text("Year: " + formatYear(d.Year));

           d3.select('#percent-renewable-tooltip-x')
             .text("% Renewable: " + formatInteger(y.invert(yPosition - 50)) + "%");

           d3.select('#percent-renewable-tooltip')
             .classed('hidden', false);
         })

})

function type(d, _, columns) {
  d['Year'] = parseYear(d['Year']);
  for (var i = 1, n = columns.length, c; i < n; ++i) {
    d[c = columns[i]] = +d[c];
    return d;
  }
}
