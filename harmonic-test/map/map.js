// load data from local json
const us_states = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/state_info.json')
const us_cities = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/us_info.json')
const stateShapes = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/states-10m.json')
const tags = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/tags.json')

// set the dimensions and margins of the graph
var bb = document.querySelector('#svgDiv').getBoundingClientRect(),
    width = bb.right - bb.left,
    height = width * 0.65,
    margin_prop = 0.05,
    margin = {
        top: 50, // height * margin_prop, 
        bottom: 25, //height * margin_prop, 
        right: 60, // width * margin_prop * 0.25, 
        left: 30, // width * margin_prop * 0.75
    };

d3.select('.tooltip').style('display', 'none')

// draw SVG, axes, titles
{
// make svg for graphic
var svg = d3.select('#svgDiv')
    .append('svg')
        .attr('id', 'svgContainer')
        .attr('viewBox', '0 0 ' + (width * 1) + ' ' + (height * 1))
        .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
        // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// add x axis
var xLog = d3.scaleLog()
    .domain([])
    .range([margin.left, width + margin.left - margin.right]);

var x = d3.scaleLinear()
    .domain([])
    .range([margin.left * 2, width + margin.left - margin.right]);

svg.append('g')
    .classed('axis xAxis', 'true')
    .attr('transform', `translate(0, ${height - margin.bottom * 2})`);

// add y axis
var y = d3.scaleLinear()
    .domain([])
    .range([height - margin.bottom * 2, margin.top]);

svg.append('g')
    .classed('axis yAxis', 'true')
    .attr('transform', `translate(${margin.left * 2}, 0)`);

// add y axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'yAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', margin.left / 2)
    .attr('x', - height / 2)
    .attr('transform', 'rotate(-90)')

// add x axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'xAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', height - margin.bottom / 2)
    .attr('x', width / 2 + margin.left / 2)

// add plot title
svg.append('text')
    .attr('id', 'plotTitle')
    .classed('plotTitles', 'true')
    .attr('y', margin.top)
    .attr('x', margin.left + 50)
    .text('')

// add plot title
svg.append('text')
    .attr('id', 'plotSubtitle')
    .classed('plotTitles', 'true')
    .attr('y', margin.top / 2 - 10 + 25)
    .attr('x', margin.left + 10)
    .text('')

// add containers
svg.append('g').attr('id', 'scatterplot')
svg.append('g').attr('id', 'tagPlot')
svg.append('g').attr('id', 'mapGroup')
d3.select('#extras').append('g').attr('id', 'tagsMenu')

}

function hideBaseLayer(){
    d3.selectAll('.axisTitle').style('opacity', 0)
    d3.selectAll('.axis').style('opacity', 0)
    d3.select('#dataToggles').style('opacity', 0)
}

function fadeOut(className, duration = 500){
    d3.selectAll(className)
        .transition()
        .duration(duration)
        .style('opacity', 0)
}

function fadeIn(className, duration = 500){
    d3.selectAll(className)
        .transition()
        .duration(duration)
        .style('opacity', 1)
}

function mapStates(){

    setPlotTitle('Number of Funded Companies by State (n=68,587)')
    setPlotSubtitle('California, New York, Massachusetts, and Texas are the most popular states venture-funded companies.')

    // get map data from github
    stateShapes.then(function(data){
        us_states.then(function(data2){
           
            var featureCollection = {type:'FeatureCollection', 'features':[]}
            data = topojson.feature(data, data.objects.states).features
            data.forEach(d => {
                d.properties.data = data2.filter(d2 => d2.state == d.properties.name)
                if(d.properties.data.length == 1){
                    d.properties.companies = d.properties.data[0].n
                    d.properties.median = d.properties.data[0].median
                }
            })
            featureCollection.features.push(...data)

            const delayScale = d3.scaleLinear()
                .domain([0, 500])
                .range([0, 200])

            const color = d3.scaleLinear()
                .domain([1, 3000])
                // .range(['#fafafa', '#03045e'])
                .range(['#fafafa', '#0077b6'])
                .clamp(true)

            const colorLegend = d3.legendColor()
                .scale(color)
                .shapeWidth(width / 5 / 2)
                .shapeHeight(12)
                .cells([0,500,1000,2000,3000])
                .labels([0,500,'1,000','2,000','3000+'])
                .orient('horizontal')
            
            // set map projection
            const projection = d3.geoAlbersUsa()
                .fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], featureCollection)
                .translate([width*0.55, height*0.55])

            // add legend to svg
            svg.select('#mapGroup').append('g')
                .classed('legend', 'true')
                .call(colorLegend)
                .attr('transform',`translate(${width/3}, ${margin.top + 14})`)
                .style('opacity', 0)

            // add map to svg
            svg.select('#mapGroup')
                .style('opacity', 1)
                .selectAll('path')
                .data(data)
                .enter()
                .append('path')
                .classed('usMap', 'true')
                .style('display', 'none')
                .attr('d', d3.geoPath().projection(projection))
                .style('stroke', '#999')
                .style('stroke-width', 0.5)
                .style('fill', d => color(d.properties.companies))
                .style('opacity', 0)
                .on('mouseover', mouseoverMap)
                .on('mousemove', (event) => mousemoveMap(event))
                .on('mouseleave', mouseleaveMap)
                .on('click', clickMap)

            // show map, fade in by state
            svg.selectAll('.usMap')
                .style('display', 'block')
                .transition()
                .ease(d3.easeSin)
                .duration(500)
                .style('opacity', 1)
                .delay((d, i) => i * 15)

            fadeIn('.legend')
        })
    })
}

// hide map and show timeline
function plotFoundingTimeline(data, yMax){
    
    showBaseLayer()
    var yMax = 1;
    data.forEach(d => {
        var row = Object.values(d);
        row.shift() // remove first item
        var rowSum = row.reduce((a,b) => a+b)
        if(rowSum > yMax){yMax = rowSum}
    })

    // set axis titles
    setXAxisTitle('Year')
    setYAxisTitle('Companies Founded')

    // set axes
    // new y axis
    y.domain([0,yMax*1.1]).nice()
    svg.select(".yAxis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y).ticks(5));
    
    // new x axis
    x.domain([2000,2020]).nice()
    svg.select(".xAxis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x)
            .tickValues([2000,2005,2010,2015,2020])
            .tickFormat(d => d.toFixed(0)));

    // show axes
    fadeIn('.axis');
    
    var keys = Object.keys(data[0]);
    keys.shift() // remove first item, qtr variable

    var stacked = d3.stack()
        .keys(keys)
        (data)
    
    var areaGen = d3.area()
        .x(d => x(d.data.qtr))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))

    const color = d3.scaleOrdinal()
        .range(["#03045e","#0077b6","#00b4d8","#90e0ef","#caf0f8"]);

    // add data to svg
    svg.append('g')
        .attr('id', 'cityLines')
        .attr('z-index', 95)
        .style('opacity', 0)
        .selectAll('.cityLines')
        .data(stacked)
        .enter()
        .append('path')
        .classed('.cityLines', 'true')
        .attr('d', d => areaGen(d))
        .attr('fill', d => color(d.key))
        .on('mouseover', (event, d) => mouseoverArea(event, d))
        .on('mousemove', mousemoveArea)
        .on('mouseleave', mouseleaveMap)
        .on('click', clickFoundingTimeline)

    svg.selectAll('#cityLines')
        .transition()
        .duration(500)
        .style('opacity', 1)
        .delay(600)
}

// return to map of states
function clickFoundingTimeline(replot){

    fadeOut('#cityLines')
    fadeOut('.axis')
    fadeOut('.axisTitle')

    setTimeout(() => {
        svg.select('#cityLines').remove()
    }, 1000);

    if(replot != 'F'){
        mapStates()
    }
}

function clickMap(){

    hideMap()
    fadeOut('.tooltip')
    mouseleaveMap()

    var state = d3.select(this).data()[0].properties.name
    us_cities.then(d => {

        // filter data to selected state
        d = d.filter(d => d.state == state)
            .sort((a,b) => b.companies - a.companies)

        // count number of foundings per quarter for each city
        var top_cities = [];
        
        d.forEach((d,i) => {
            if(i == 1 || (i < 4 || d.companies > 1000)){
                top_cities.push(d.city)
            }
        })
        top_cities.push('All Other Cities')

        var qtrs = [], yMax=1, n=0;
        // var qtrs = [{'key': 'All Other Cities', 'values': []}], yMax=1, n=0;
        d.forEach((d, i) => {

            d.data.forEach(x => {

                var newDate = new Date(x.founding_date);
                
                // count foundings by qtr and city
                if(newDate > new Date('Jan 1 2000') && newDate < new Date('Dec 31 2020')){
                    
                    // ex. 02/05/2019 --> 2019Q1
                    qtr = newDate.getFullYear() //+ 'Q' + (1+Math.floor(newDate.getMonth() / 3))
                
                    // add city to row if missing
                    var rowMatch = qtrs.filter(d => d.qtr == qtr)[0]
                    if(rowMatch === undefined){
                        qtrs.push({
                            'qtr': qtr,
                        })
                        top_cities.forEach(d => qtrs[qtrs.length-1][d] = 0)
                    }

                    // else add one to count
                    else{
                        if(top_cities.includes(d.city)){
                            var city = d.city
                        } else {
                            var city = 'All Other Cities'
                        }
                        rowMatch[city] = rowMatch[city] + 1
                    }
                    n += 1
                }
            })
        })
        qtrs.sort((a,b) => a.qtr - b.qtr)
        setPlotTitle(`Founding Year of Companies in ${state}, by city (n=${Intl.NumberFormat().format(n)})`)
        setPlotSubtitle(`Includes ${state}-based companies created from 2000 - 2020`)
        plotFoundingTimeline(qtrs, yMax)
    })
}

function hideMap(){
    fadeOut('#mapGroup')
    fadeOut('.legend')

    setTimeout(() => {
        svg.selectAll('.usMap').remove()
        svg.selectAll('.legend').remove()
    }, 500);
}

function filterPts(){

    var points = d3.selectAll('.points');
    var labels = svg.select('#scatterplot').selectAll('.labels'),
        labelLines = svg.select('#scatterplot').selectAll('.labelLines');
    var query = document.querySelector('#searchBar').value.toLowerCase();

    points.style('fill', '#0077b6').style('opacity', 0.1)
    if(query == ''){
        points.style('fill', '#0077b6').style('opacity', 0.6)
        labels.style('opacity', 1)
        labelLines.style('opacity', 1)
    }

    if(query != ''){
        labels.style('opacity', 0.1)
        labelLines.style('opacity', 0.1)
    }

    // highlight point
    d3.selectAll('.points')
        .attr('opacity', 0.1)
        .style('fill', 'gray')
    
    // recolor points that match search
    points.data().forEach((d, i) => {
        if(d.state.toLowerCase().startsWith(query) || d.city.toLowerCase().startsWith(query)){
            var match = points['_groups'][0][i]
            match.style.fill = '#0077b6'
            match.style.opacity = 0.6
        }
    })
    
    // show labels that match
    labels.data().forEach((d, i) => {
        if(d.city.toLowerCase().startsWith(query) || d.state.toLowerCase().startsWith(query)){
            var match = labels['_groups'][0][i]
            match.style.opacity = 1
        }
    })

    // show label lines that match
    labels.data().forEach((d, i) => {
        if(d.city.toLowerCase().startsWith(query) || d.state.toLowerCase().startsWith(query)){
            var match = labelLines['_groups'][0][i]
            match.style.opacity = 1
        }
    })
}

function mousemoveArea(event){
 
    d3.select('.tooltip')
        .style('left', event.pageX + 20 + 'px')
        .style('top', event.pageY + 'px');

}

function mouseoverArea(event, d){
     
    // show tooltip
    d3.select('.tooltip')
        .style('opacity', 1)
        .style('display', 'block')
    d3.select('.tooltip').append('text').text(d.key)

}

// restore opacity
function mouseleaveMap(){

    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 0)
        .style('display', 'none')

    d3.select('.tooltip').selectAll('text').remove()
}

function mousemoveMap(event){

    d3.select('.tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY) + 'px');

}

// show state name
function mouseoverMap(){

    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 1)
        .style('display', 'block')

    var data = d3.select(this).data()[0];
        // format data
        state = data.properties.name,
        companies = Intl.NumberFormat().format(data.properties.companies);
   
    
    d3.select('.tooltip').select('text').remove()
    d3.select('.tooltip').append('text').text(`${state}: ${companies}`)

}

function setPlotTitle(newTitle){
    d3.select('#plotTitle').text(newTitle)
}
function setPlotSubtitle(newTitle){
    d3.select('#plotSubtitle').text(newTitle)
}
function setXAxisTitle(newTitle){
    d3.select('#xAxisTitle').text(newTitle)
}
function setYAxisTitle(newTitle){
    d3.select('#yAxisTitle').text(newTitle)
}

function showBaseLayer(){
    d3.selectAll('.axisTitle')
        .transition()
        .duration(500)
        .style('opacity', 1)

    d3.selectAll('.axis')
        .transition()
        .duration(500)
        .style('opacity', 1)
    
    d3.selectAll('.xAxis')
        .transition()
        .duration(500)
        .style('opacity', 1)

    d3.select('#dataToggles')
        .transition()
        .duration(500)
        .style('opacity', 1)
}


mapStates()