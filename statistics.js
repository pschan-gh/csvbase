const margin = {top: 10, right: 30, bottom: 30, left: 40},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

const svg = d3.select("#bars")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
"translate(" + margin.left + "," + margin.top + ")");

// append the svg object to the body of the page
// https://www.d3-graph-gallery.com/graph/histogram_binSize.html
function bars(data) {
    // A function that builds the graph for a specific value of bin
    function update(nBin, max) {

        d3.selectAll("svg").remove();
        const svg = d3.select("#bars")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


        const x = d3.scaleLinear()
        .domain([0, max])
        .range([0, width]);
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        // Y axis: initialization
        const y = d3.scaleLinear()
        .range([height, 0]);
        const yAxis = svg.append("g");

        const thresholds = [];
        for(let i = 0; i < +nBin; i++) {
            thresholds.push(i*Math.round(100*max/nBin)/100);
        }

        // set the parameters for the histogram
        const histo = d3.histogram()
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(thresholds);

        // And apply this function to data to get the bins
        const bins = histo(data.map(function(d) {return Math.max(+d - 0.5, 0);}));
        // Y axis: update now that we know the domain
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        yAxis
        .call(d3.axisLeft(y));

        // Join the rect with the bins data
        const u = svg.selectAll("rect")
        .data(bins);

        // Manage the existing bars and eventually the new ones:
        u
        .enter()
        .append("rect") // Add a new rect for each new elements
        .merge(u) // get the already existing elements as well
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return Math.round(Math.max(0, x(d.x1) - x(d.x0) -1)) ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "SteelBlue");

        // If less bar in the new histogram, I delete the ones not in use anymore
        u
        .exit()
        .remove();

    }

    // update(+$('#nBin').val(), +$('#max').val());
    update(
        parseInt(document.querySelector('#nBin').value),
        parseInt(document.querySelector('#max').value)
    );

    // Listen to the button -> update if user change it
    // d3.select("#nBin").on('input', function() {
    //     update(+$(this).val(), +$('#max').val());
    // });
    // d3.select("#max").on('input', function() {
    //     update(+$('#nBin').val(), +$(this).val());
    // });
    d3.select("#nBin").on('input', function() {
        update(parseInt(this.value), parseInt(document.querySelector('#max').value));
    });

    d3.select("#max").on('input', function() {
        update(parseInt(document.querySelector('#nBin').value), parseInt(this.value));
    });

}

function statistics(values, field) {
    // $('.modal-title.field').text(field);
    //
    // let array = values.map(value => {return isNaN(value) ? 0 : value;});
    //
    // $('#statistics').find('.modal-body').find('.stats').html('COUNT: ' + array.length + '<br/>MEDIAN: ' + math.median(array) + '<br/>' + 'MEAN: ' + Math.round(100*math.mean(array))/100 +  '<br/>' + 'Standard Deviation: ' + Math.round(100*math.std(array))/100);
    //
    // $('#max').val(math.max(array));
    document.querySelector('.modal-title.field').textContent = field;

    let array = values.map(value => {return isNaN(value) ? 0 : value;});

    document.querySelector('#statistics .modal-body .stats').innerHTML = `COUNT: ${array.length}
        <br/>MEDIAN: ${math.median(array)}
        <br/>MEAN: ${Math.round(100*math.mean(array))/100}
        <br/>Standard Deviation: ${Math.round(100*math.std(array))/100}`;

    document.querySelector('#max').value = math.max(array);

    bars(array);
}
