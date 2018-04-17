// All regions for countries in percent-renewable dataset
const REGIONS = ['East Asia & Pacific', 'Europe & Central Asia',
                 'Latin America & Caribbean', 'Middle East & North Africa',
                 'North America', 'South Asia', 'Sub-Saharan Africa'];

d3.json('data/percent-renewable.json', function(error, data) {
  if (error) throw error;

  const region_controls = d3.select('.region-controls');

  // Rearrange data in descending order of percentage.
  var ordered_data = orderData(data);

  // Number limits for the number of rows shown in the table. Starts at 10, then
  // when the 'Show More' button is clicked, enables an increase to 30, and
  // finally when the 'Show All' button is clicked, enables increase to all data
  const INITIAL_LIMIT = 10;
  const SHOW_MORE = 30;
  const SHOW_ALL = ordered_data.length;

  region_controls.append('a')
                 .classed('region-button', true)
                 .classed('first-button-curve', true)   // Rounded rectangle
                 .classed('active-button', true)
                 .style('width', 100/(REGIONS.length + 1) + '%') // Divide widths for each region equally
                 .text('All Regions')
                 .on('click', function(o) {
                   // Check if element is not the active button
                   if (!d3.select(this).classed('active-button')) {
                     // If not, remove active-button class from all region buttons first
                     d3.selectAll('.region-button').classed('active-button', false);

                     // Add active-button class to clicked element
                     d3.select(this).classed('active-button', true);
                   }

                   var region = d3.select(this).text();
                   // Call sorting function
                   sortByRegion(ordered_data, region, btn_setting);

                   // Trying to remove Show More button if unnecessary. Need to get back to this later.
                   //var num_table_rows = document.getElementById('percent-renewable-table').rows.length - 1;
                 });;

  // Populate region control buttons
  for (i = 0; i < REGIONS.length; i++) {
    var region_button = region_controls.append('a')
                                       .classed('region-button', true)
                                       .style('width', 100/(REGIONS.length + 1) + '%')
                                       .text(REGIONS[i])
                                       .on('click', function(o) {
                                         // Check if element is not the active button
                                         if (!d3.select(this).classed('active-button')) {
                                           // If not, remove active-button class from all region buttons first
                                           d3.selectAll('.region-button').classed('active-button', false);

                                           // Add active-button class to clicked element
                                           d3.select(this).classed('active-button', true);
                                         }

                                         var region = d3.select(this).text();
                                         // Call sorting function
                                         sortByRegion(ordered_data, region, btn_setting);

                                         // Trying to remove Show More button if unnecessary. Need to get back to this later.
                                         //var num_table_rows = document.getElementById('percent-renewable-table').rows.length - 1;
                                       });

    // If it's the last button, add the rounded rectangle curves; otherwise, normal buttons.
    if (i == REGIONS.length - 1) {
      region_button.classed('last-button-curve', true);
    } else {
      region_button;
    }
  }

  // Get width of the table
  var chartWidth = d3.select('#percent-renewable-table').node().offsetWidth,
      barWidth = Math.floor(chartWidth * .5); // CSS: Percent Renewable column is set as 50%.
      //barHeight = d3.select('#percent-renewable-column').node().offsetHeight * 0.9;

  // Create a scale for the bar charts.
  var barScale = d3.scaleLinear()
                   .domain([0, 100])
                   .range([1, barWidth]);

  // Add table rows for each country, adding the name, region, and drawing the bar graph.
  for (i = 0; i < INITIAL_LIMIT; i++) {
    populateTable(ordered_data, i);
  };

  // Save chart element so it can be used later to scroll to the top of, once
  // we've gone too far down and clicked 'Show Less'.
  var percent_graphic = document.getElementById('percent-renewable')

  // Select 'Show More' button element
  var show_more_btn = d3.select('.expander-btn');

  // Dictionary mapping button state options to row limits
  const BTN_OPTIONS = {
    "initial": INITIAL_LIMIT,
    "show more": SHOW_MORE,
    "show all": SHOW_ALL
  }

  // Initial button setting
  var btn_setting = 'initial';

  // Show More button functionality
  show_more_btn.on('click', function() {
    // Get the active region so that when you click any region after clicking
    // Show More button, the countries don't mix up.
    active_region = d3.select('.active-button').text();

    if (btn_setting == 'initial') {
      // Change button state
      btn_setting = 'show more';
      // Populate table with countries
      sortByRegion(ordered_data, active_region, btn_setting);
      // Change button text
      show_more_btn.text('Show All...');
      // Show countries between rank 10 and 30.
    } else if (btn_setting == 'show more') {
      btn_setting = 'show all';
      sortByRegion(ordered_data, active_region, btn_setting);
      show_more_btn.text('Show Less...');
    } else {
      btn_setting = 'initial'
      sortByRegion(ordered_data, active_region, btn_setting);
      // Going back to top 10 means getting rid of a lot of content, which means
      // we have to scroll back up to the beginning of the chart.
      percent_graphic.scrollIntoView();
      show_more_btn.text('Show More...');
    }
  })

  // Rearrange data in descending order of percentage.
  function orderData(data) {
    for (i = 0; i < data.length; i++) {
      data.sort(function(x, y) {
        return d3.descending(x.percent, y.percent);
      })
    }

    return data;
  }

  // Add table rows for each country, adding the name, region, and drawing the bar graph.
  // Also, add formatting for percentage number labels.
  function populateTable(ordered_data, index) {
    var country_info = ordered_data[i],
        country_name = country_info.name,
        region = country_info.region,
        percent_renewable = country_info.percent,
        rank = (index + 1) + '.';

    var table_row = d3.select('#percent-renewable-table tbody')
                      .append('tr');

    table_row.append('td')
             .attr('class', 'rank')
             .text(rank);

    table_row.append('td')
             .attr('class', 'country-name')
             .text(country_name);

    var bar = table_row.append('td')
                .attr('class', 'country-percent-renewable')
                .append('div')
                 .classed('percent-bar', true)
                 .style('width', barScale(percent_renewable) + 'px')

    // There is probably a much better way to do this but it's late so I'm going to commit
    if (percent_renewable <= 1 && percent_renewable > 0) {
      // Make sure doesn't round down to zero (show two decimal places)
      if (percent_renewable < 0.05) {
        bar.append('text')
           .attr('class', 'percent-renewable-label')
            .text(percent_renewable + '%');
      } else {
        // Show to only 1 decimal place
        bar.append('text')
           .attr('class', 'percent-renewable-label')
            .text(percent_renewable.toFixed(1) + '%');
      }
    } else {
      if (Math.floor(percent_renewable) <= 4) {
        // Show in black colour because text is over white background.
        bar.append('text')
           .attr('class', 'percent-renewable-label')
            .text(Math.floor(percent_renewable) + '%');
      } else {
        // Show in white colour because text is over blue bar chart.
        bar.append('text')
           .attr('class', 'percent-renewable-label')
           .style('color', 'white')
            .text(Math.floor(percent_renewable) + '%');
      }
    }
  }

  // Sorts data to show only data for selected regions.
  function sortByRegion(ordered_data, region, btn_state='initial') {
    // Remove all existing rows in table
    d3.selectAll('#percent-renewable-table tbody tr').remove();

    // Link button state to row limits
    var limit = BTN_OPTIONS[btn_state];

    if (region != 'All Regions') {
      // Initialise rank
      var j = 0;
      for (i = 0; i < ordered_data.length; i++) {
        if (region == ordered_data[i].region && j < limit) {
          populateTable(ordered_data, j);
          j += 1;
        }
      }
    } else {
      for (i = 0; i < limit; i++) {
        populateTable(ordered_data, i);
      }
    }
  }

  // Input element
  const input = document.getElementById('percent-renewable-search')

  // When letters are typed into the search field, run searchTable function.
  input.onkeyup = function() {searchTable()};

  // Very simple search algo (https://www.w3schools.com/howto/howto_js_filter_table.asp).
  // (It looks for the letter typed anywhere in the string - for example, if you type 'b',
  // it will show all countries that have a b in it anywhere - which looks weird sometimes.
  // Might need to add to it later).
  function searchTable() {
    var filter = input.value.toLowerCase(),  // letters typed in search field
        table = document.getElementById('percent-renewable-table')
        tr = table.getElementsByTagName('tr');

    for (i = 1; i < tr.length; i++) {
      td = tr[i].getElementsByTagName('td')[1];

      if (td) {
        if (td.innerHTML.toLowerCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }

    }
  }

})
