const trump = d3.csv('trump_averages.csv', function(x){
    return {
        network: x.network,
        week: +x.week,
        pct: +x.pct,
        rm: +x.rm
    };
})

// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
width = 0.8 * window.innerWidth - margin.left - margin.right,
height = 0.8 * window.innerHeight - margin.top - margin.bottom;

const xTicks = ['2016', '2017', '2018', '2019', '2020', '2021'];
const xScale = d3.scaleLinear()
    .domain([2015.7, 2021])
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([0, 0.6])
    .range([height, margin.top]);

const colorScale = d3.scaleOrdinal()
    .domain(['Fox News', 'CNN'])
    .range(['#377eb8','#e41a1c']);

// create scale to calculate delay time
const delayScale = d3.scaleLinear()
    .domain([2015.692, 2020.942])
    .range([0, 1000]);

const container = d3.select('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

// y axis title
// container.append('text')
//     .classed('axis-title', true)
//     .attr('text-anchor', 'end')
//     .attr('transform', 'rotate(-90)')
//     .attr('y', margin.left / 2 - 10)
//     .attr('x', -20)
//     .text('Percent of Titles containing \'trump\'');

// x axis title
// container.append('text')
//     .classed('axis-title', true)
//     .attr('text-anchor', 'end')
//     .attr('y', margin.bottom + height)
//     .attr('x', width + margin.left - 20)
//     .text('Year');

// add y axis
container.append('g')
    .call(d3.axisLeft(yScale).ticks(4).tickFormat(d => d * 100 + '%'))
    .attr('transform', 'translate('+ margin.left +',0)');
        
// add x axis
container.append('g')
    .call(d3.axisBottom(xScale).ticks(6).tickValues(xTicks).tickFormat(d => d))
    .attr('transform', 'translate(' + margin.left + ',' + height +')');
    
// add plot title
container.append('text')
    .attr('id', 'plot-title')
    .text('Percent of CNN and Fox News Titles Containing \'Trump\' by week')
    .attr('fill', 'white')
    .attr('x', margin.left + 10)
    .attr('y', 18);


trump.then(function(d){

    // add points
    const points = container
        .selectAll('.point')
        .data(d)
        .enter()
        .append('circle')
        .classed('point', true)
        .attr('r', 3)
        // .attr('cy', data => yScale(data.pct))
        .attr('cy', data => yScale(data.pct) + 100)
        .attr('cx', data => margin.left + xScale(data.week))
        .attr('opacity', 0)
        .attr('fill', data => colorScale(data.network));  

})

function showPoints(){

    // transition points
    container.selectAll('circle')
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .attr('cy', data => yScale(data.pct))
        .delay(data => delayScale(data.week));

    console.log('show')
};

function hidePoints(){

    // transition points
    container.selectAll('circle')
        .transition()
        .duration(500)
        .attr('cy', data => yScale(data.pct) + 100)
        .attr('opacity', 0)
        .delay(data => delayScale(data.week));

    console.log('hide')

};

function toMean(){

    // shift to mean
    container.selectAll('circle')
        .transition()
        .duration(500)
        .attr('cy', data => yScale(data.rm))
        .delay(data => delayScale(data.week));

    console.log('hide')
}