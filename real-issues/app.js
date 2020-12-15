// load in data
const trump_weeks = d3.csv('data/trump_averages.csv', function(x){
    return {
        network: x.network,
        week: +x.week,
        pct: +x.pct,
        rm: +x.rm,
        n: +x.n,
        t: +x.t,
        date: Date(x.date)
    };
})

// set the dimensions and margins of the graph
var margin = {top: 50, right: 45, bottom: 30, left: 45},
width = window.innerWidth * 0.65 - margin.left - margin.right,
height = window.innerHeight - margin.top - margin.bottom;

function hidePoints(){

    // transition points
    container.selectAll('.point')
        .transition()
        .duration(500)
        .attr('cy', data => yScale(data.pct) + 500)
        .attr('opacity', 0)
        .delay(data => delayScale(data.week));

    container.select('#plot-title')
        .transition()
        .duration(500)
        .attr('fill-opacity', '0')

    container.selectAll('.line')
            .transition()
            .duration(500)
            .attr('stroke-opacity', 0)

};

function deleteSplash(){

    // find splash page texts and split by character into arrays
    var d = d3.select('.maintext').text().split('')
    var e = d3.selectAll('.subtext').text().split('')

    // for each character in array:
    for (i in d3.range(0, d.length)){

        // set delay between function calls
        setTimeout(function(){

            // replace text with text minus last character
            d3.selectAll('.maintext')
            .text(function(){
                var p = d.pop()
                var remain = d.join('')
                return remain;
            })

        // make entire function call last 1 second 
        }, 1000 / d.length * i);
    }

    // repeat for subtext
    for (i in d3.range(0, e.length)){
        setTimeout(function(){
            d3.selectAll('.subtext')
            .text(function(){
                var p = e.pop()
                var remain = e.join('')
                return remain;
            })
        }, 1000 / e.length * i);
    }

    // remove splash element
    setTimeout(function(){
            d3.select('#splash-page')
            .remove()
    }, 1000);
}

var splash = true;
function showContainer(){

    if (splash == true) {
        deleteSplash();
    }

    hidePoints()
    container.selectAll('.yaxis1')
        .transition()
        .duration(0)
        .attr('opacity', 1)
        .delay(1000);

    container.selectAll('.yaxis2')
        .transition()
        .duration(0)
        .attr('opacity', 0)
        .delay(1000);

    container
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .delay(1500)

    splash = false;
};

function showPoints(){

    showContainer()

    // transition points
    container.selectAll('.point')
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .attr('cy', data => yScale(data.pct))
        .delay(data => 0.5 * delayScale(data.week));

    container.select('#plot-title')
        .transition()
        .duration(500)
        .attr('fill-opacity', '0')
        .transition()
        .attr('fill-opacity', '1')
        .text('Percent of CNN and Fox News Titles Containing \'trump\' by week')
};

function toMean(){

    // shift to mean
    container.selectAll('.point')
        .transition()
        .ease(d3.easeBounce)
        .duration(600)
        .attr('opacity', 1)
        .attr('cy', data => yScale(data.rm))
        .delay(data => delayScale(data.week));

    container.select('#plot-title')
        .transition()
        .duration(500)
        .attr('fill-opacity', '0')
        .transition()
        .attr('fill-opacity', '1')
        .text('Percent of CNN and Fox News Titles Containing \'Trump\' by week, 4-Week Rolling Average')
    
    container.selectAll('.line1')
        .transition()
        .duration(500)
        .attr('stroke-opacity', 0)
        .delay(500);
};

function showLines1(){

    container.selectAll('.line1')
        .transition()
        .duration(500)
        .attr('stroke-opacity', 1);

    container.selectAll('.line2')
        .transition()
        .duration(500)
        .attr('opacity', 0);

    container.selectAll('.yaxis2')
        .transition()
        .duration(500)
        .attr('opacity', 0);

    // change y grid
    container.selectAll('.ygrid')
        .transition()
        .duration(500)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
    container.selectAll('.point')
        .transition()
        .duration(500)
        .attr('opacity', 0)
        .delay(data => 500 + delayScale(data.week));

    container.selectAll('.yaxis1')
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .delay(500);
};

function showLines2(){

    showContainer()

    svgbase
        .transition()
        .duration(500)
        .attr('opacity', 1);

    container.selectAll('.line1')
        .transition()
        .duration(500)
        .attr('stroke-opacity', 0);

    container.selectAll('.yaxis1')
        .transition()
        .duration(500)
        .attr('opacity', 0);

    container.selectAll('.totalCircles')
        .transition()
        .duration(500)
        .attr('r', 1)

    container.selectAll('.totals')
        .transition()
        .duration(500)
        .attr('opacity', 0)

    container.select('#plot-title')
        .transition()
        .duration(500)
        .attr('fill-opacity', '0')
        .transition()
        .attr('fill-opacity', '1')
        .text('Total Number of CNN and Fox News Titles Containing \'Trump\' since Sep. 2015')
    
    container.selectAll('.line2')
        .transition()
        .duration(500)
        .attr('opacity', 1)

    container.selectAll('.line2')
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .attr('fill-opacity', 0.5)
        .delay(500);
};

function hideContainer(){
    container
        .transition()
        .duration(500)
        .attr('opacity', 0)

    hidePoints()
};

function showCircles(){
    
    container.select('.totals')
        .transition()
        .duration(500)
        .attr('opacity', 1);

    container.selectAll('.totalCircles')
        .transition()
        .duration(500)
        .attr('r', data => radiusScale(data.value));

    //  hide everything else
    container.selectAll('.line2')
        .transition()
        .duration(500)
        .attr('opacity', 0);
    svgbase
        .transition()
        .duration(500)
        .attr('opacity', 0);
}

function hideCircles(){

    container.select('.totals')
        .transition()
        .duration(500)
        .attr('opacity', 0)
        .delay(250);

    container.selectAll('.totalCircles')
        .transition()
        .duration(500)
        .attr('r', data => 1);
}

function emptyFunction(){};

// set up scroller... many thanks to https://vallandingham.me/scroller.html
// find position of top of sections
const sections = d3.selectAll('.section-contents')
sectionPositions = [];
var startPos;
var lastIndex;

sections.each(function(d, i){
    var top = this.getBoundingClientRect().top;
    
    // set top of first section element as top
    if(i == 0){
        startPos = top;
    }

    // append positions to array
    sectionPositions.push(top - startPos);
});

// new dispatcher with 'active' and 'progress' methods
var dispatch = d3.dispatch('active', 'progress')

// set function to execute when active element updates
dispatch.on('active', function(index){

    transitions = [
        emptyFunction,
        showContainer,
        showPoints,
        emptyFunction,
        toMean,
        showLines1,
        showLines2,
        showCircles,
        hideCircles
    ]

    transitions[index]();
})

// find position of window
function position(){

    // slightly offset position
    var pos = this.scrollTop + window.innerHeight * - 0.5;

    // find index of current section box
    var currentIndex = d3.bisect(sectionPositions, pos);

    // keep index without bounds of array (d3.bisect can return value larger than array)
    currentIndex = Math.min(sections.size() - 1, currentIndex);

    // if current section has changed,
    if(currentIndex !== lastIndex){

        // find which sections have been scrolled past
        var sign = (currentIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, currentIndex + sign, sign);
        
        // call transition function for each section
        scrolledSections.forEach(function(section){
            dispatch.call('active', container, section);
        });
        lastIndex = currentIndex;
    };
};

// execute function when window scrolls
d3.select('#sections')
    .on('scroll.scroller', position);

//  add scales
const xTicks = [2016, 2017, 2018, 2019, 2020, 2021];
const xScale = d3.scaleLinear()
    .domain([2015.7, 2021])
    .range([0, width]);

const yTicks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
const yScale = d3.scaleLinear()
    .domain([0, 0.6])
    .range([height, margin.top]);
const yScale2 = d3.scaleLinear()
    .domain([0, 30000])
    .range([height, margin.top]);

const colorScale = d3.scaleOrdinal()
    .domain(['CNN','Fox News'])
    .range(['#75c0fd','#e41a1c']);

const delayScale = d3.scaleLinear()
    .domain([2015.692, 2020.942])
    .range([0, 1000]);

const radiusScale = d3.scaleSqrt()
        .domain([0, 143425])
        .range([0, 200])

const container = d3.select('svg')
    .attr('opacity', 0)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

const svgbase = container.append('g')
    .classed('svgbase', true)

// add y axis
svgbase.append('g')
    .classed('yaxis1', true)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d * 100 + '%'))
    .attr('transform', 'translate('+ margin.left +',0)');

// add y grid
svgbase.selectAll('.ygrid')
    .data(yTicks)
    .enter()
    .append('line')
    .classed('.ygrid', true)
    .attr('x1', margin.left)
    .attr('x2', window.innerWidth * 0.65)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke-width', '1')
    .attr('stroke', '#444')
        
// add x axis
svgbase.append('g')
    .call(d3.axisBottom(xScale).ticks(5).tickValues(xTicks).tickFormat(d => d))
    .attr('transform', 'translate(' + margin.left + ',' + height +')');

// add x grid
svgbase.selectAll('.xgrid')
    .data(xTicks)
    .enter()
    .append('line')
    .classed('.xgrid', true)
    .attr('y1', height)
    .attr('y2', 0)
    .attr('x1', d => xScale(d) + margin.left)
    .attr('x2', d => xScale(d) + margin.left)
    .attr('stroke-width', '1')
    .attr('stroke', '#444')
    
// add plot title
svgbase.append('text')
    .attr('id', 'plot-title')
    .attr('fill', 'white')
    .attr('x', 0)
    .attr('y', margin.top / 2);

const legend = [
    {network: 'CNN', x: 2016.05, y: 0.58},
    {network: 'Fox News', x: 2016.05, y: 0.56}
]

// add legend
svgbase.selectAll('.legendRect')
    .data(legend)
    .enter()
    .append('rect')
    .classed('legendRect', true)
    .attr('x', data => xScale(data.x) + margin.left)
    .attr('y', data => yScale(data.y) - 10)
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', data => colorScale(data.network))

// add legend
svgbase.selectAll('.legendText')
    .data(legend)
    .enter()
    .append('text')
    .classed('legendText', true)
    .attr('x', data => xScale(data.x) + margin.left + 12)
    .attr('y', data => yScale(data.y))
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', 'white')
    .text(data => data.network)

trump_weeks.then(function(d){

    // add points
    container.selectAll('.point')
        .data(d)
        .enter()
        .append('circle')
        .classed('point', true)
        .attr('r', 3)
        .attr('cy', data => yScale(data.pct) + 500)
        .attr('cx', data => margin.left + xScale(data.week))
        .attr('opacity', 0)
        .attr('fill', data => colorScale(data.network)); 
    
    // nest data
    var nested_d = d3.nest()
        .key(d => d.network)
        .entries(d);
    
    // add first set of lines
    container.selectAll('.line1')
        .data(nested_d)
        .enter()
        .append('path')
        .classed('line1', true)
        .attr('fill', 'none')
        .attr('stroke-opacity', 0)
        .attr('stroke', data => colorScale(data.key))
        .attr('stroke-width', 3)
        .attr('d', function(d){
            return d3.line()
            .x(d => margin.left + xScale(d.week))
            .y(d => yScale(d.rm))
            (d.values)
        });

    // add second set of lines
    container.selectAll('.line2')
        .data(nested_d)
        .enter()
        .append('path')
        .classed('line2', true)
        .attr('fill', data => colorScale(data.key))
        .attr('opacity', 0)
        .attr('stroke', data => colorScale(data.key))
        .attr('stroke-width', 3)
        .attr('d', function(d){
            return d3.area()
            .x(d => margin.left + xScale(d.week))
            .y1(d => yScale2(d.t))
            .y0(yScale2(0))
            (d.values)
        });

    // add second y axis
    svgbase.append('g')
        .classed('yaxis2', true)
        .call(d3.axisLeft(yScale2).ticks(5).tickFormat(d => d/1000 + 'k'))
        .attr('transform', 'translate('+ margin.left +',0)')
        .attr('opacity', 0);
    
    const xBands = d3.scaleBand()
        .domain(['CNN', 'Fox News'])
        .range([margin.left + 100, width - 100])

    // add network totals data
    var networkTotals = [
        {network: 'CNN', value: 143425, f0: 0.5},
        {network: 'CNN', value: 28107, f0: 1},
        {network: 'Fox News', value: 5237, f0: 0.5},
        {network: 'Fox News', value: 1592, f0: 1},
    ]

    var networkLabels = [
        {network: 'CNN', value: 143425},
        {network: 'Fox News', value: 5237}
    ]

    // add network totals circles
    container.append('g')
        .classed('totals', true)
        .selectAll('.totalCircles')
        .data(networkTotals)
        .enter()
        .append('circle')
        .classed('totalCircles', true)
        .attr('r', 1)
        .attr('cy', function(data){
            if (data.value == 1592) {
                return height / 2 + radiusScale(5237) - radiusScale(1592);
            } else if (data.value == 28107) {
                return height / 2 + radiusScale(143425) - radiusScale(28107);
            } else return height / 2;
        })
        .attr('cx', data => width / 4 + xBands(data.network))
        .attr('stroke-width', 3)
        .attr('stroke', data => colorScale(data.network))
        .attr('fill-opacity', data => data.f0)
        .attr('fill', data => colorScale(data.network)); 

    container.select('.totals')
        .selectAll('.totalText')
        .data(networkTotals)
        .enter()
        .append('text')
        .classed('totalText', true)
        .attr('x', data => width / 4 + xBands(data.network))
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bolder')
        .attr('font-family', 'Helvetica')
        .attr('y', function(data){
            if (data.value == 1592) {
                return height / 2 + radiusScale(1592);
            } else if (data.value == 28107) {
                return height / 2 + radiusScale(28107) + margin.bottom;
            } else {return height / 2};
        })
        .text(data => data.value.toString().replace(/(\d{3})$/, ',$1'))
    
    container.select('.totals')
        .selectAll('.totalLabels')
        .data(networkLabels)
        .enter()
        .append('text')
        .classed('totalLabels', true)
        .attr('x', data => width / 4 + xBands(data.network))
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bolder')
        .attr('font-family', 'Helvetica')
        .attr('y', function(data){
            return height / 2 - radiusScale(data.value) - 20;    
        })
        .text(data => data.network)
        
    container.select('.totals')
        .attr('opacity', 0)

})