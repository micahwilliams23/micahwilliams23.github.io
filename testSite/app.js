
// load data from local json
const us_states = d3.json('state_info.json')
const us_cities = d3.json('us_info.json')
const stateShapes = d3.json('states-10m.json')

// set the dimensions and margins of the graph
var bb = document.querySelector('#svgDiv').getBoundingClientRect(),
    width = bb.right - bb.left,
    height = width * 0.65,
    margin_prop = 0.05,
    margin = {
        top: height * margin_prop, 
        bottom: height * margin_prop, 
        right: width * margin_prop * 0.25, 
        left: width * margin_prop * 0.75};

d3.select('.cityInfo').style('display', 'none')

// draw SVG, axes, titles
{
// make svg for graphic
var svg = d3.select('#svgDiv')
    .append('svg')
        .attr('id', 'svgContainer')
        .attr('viewBox', '0 0 ' + (width * 1.1) + ' ' + (height * 1.1))
        .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// add x axis
var x = d3.scaleLog()
    .domain([])
    .range([margin.left, width + margin.left - margin.right]);

svg.append('g')
    .classed('axis xAxis', 'true')
    .attr('transform', 'translate(0,' + (height - margin.bottom) + ')');

// add y axis
var y = d3.scaleLinear()
    .domain([])
    .range([height - margin.bottom, margin.top]);

svg.append('g')
    .classed('axis yAxis', 'true')
    .attr('transform', 'translate(' + margin.left + ',0)');

// add y axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'yAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', - margin.left * 0.2)
    .attr('x', - height / 2)
    .attr('transform', 'rotate(-90)')

// add x axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'xAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', height + margin.bottom / 2)
    .attr('x', width / 2 + margin.left / 2)

// add plot title
svg.append('text')
    .attr('id', 'plotTitle')
    .attr('y', margin.top / 2 - 10)
    .attr('x', margin.left + 10)
    .text('Funding vs. Headcount in Top 100 Cities by Company Count')

// add plot title
svg.append('text')
    .attr('id', 'plotSubtitle')
    .attr('y', margin.top / 2 - 10 + 25)
    .attr('x', margin.left + 10)
    .text('')
}

function hideBaseLayer(){
    d3.selectAll('.axisTitle').style('opacity', 0)
    d3.selectAll('.axis').style('opacity', 0)
    d3.select('#dataToggles').style('opacity', 0)
}

function fadeOut(className){
    d3.selectAll(className, duration = 1000)
        .transition()
        .duration(duration)
        .style('opacity', 0)
}

function fadeIn(className){
    d3.selectAll(className, duration = 1000)
        .transition()
        .duration(duration)
        .style('opacity', 1)
}

function mapStates(){

    hideBaseLayer()
    setPlotTitle('Number of Funded Companies by State (n=68,587)')
    setPlotSubtitle('Long-time heavyweights like California, New York, Massachusetts, and Texas are the most popular states for startups and venture capital.')

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
                .range(['#fafafa', '#0c06aa'])
                .clamp(true)

            const colorLegend = d3.legendColor()
                .scale(color)
                .shapeWidth(60)
                .shapeHeight(20)
                .cells([0,500,1000,2000,3000])
                .labels([0,500,'1,000','2,000','3000+'])
                .orient('horizontal')
            
            // set map projection
            const projection = d3.geoAlbersUsa()
                .fitSize([width, height], featureCollection)
                .translate([width*0.55, height*0.55])

            // add legend to svg
            svg.append('g')
                .classed('legend', 'true')
                .call(colorLegend)
                .attr('transform',`translate(${width/2}, 70)`)

            // add map to svg
            svg.append('g')
                .selectAll('path')
                .data(data)
                .enter()
                .append('path')
                .classed('usMap', 'true')
                .attr('d', d3.geoPath().projection(projection))
                .style('stroke', '#999')
                .style('stroke-width', 0.5)
                .style('fill', d => color(d.properties.companies))
                .style('opacity', 0)
                .on('mouseover', mouseoverMap)
                .on('mousemove', (event) => mousemoveMap(event))
                .on('mouseleave', mouseleaveMap)
                .on('click', clickMap)

            svg.selectAll('.usMap')
                .transition()
                .ease(d3.easeSin)
                .duration(500)
                .style('opacity', 1)
                .delay((d, i) => i * 15)
    
        })
    })
}

// overlay city points on map
function mapPoints(cities = []){

    us_cities.then(function(d){

        if(cities.length > 0){
            d = d.filter(d => cities.includes(d.city))
        }

        const delayScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0,1000]);
        
        // scale for sizing
        const r = d3.scaleSqrt()
            .domain([0, 6000])
            .range([5,15]);

        const projection = d3.geoAlbersUsa()
            .translate([width / 2 + 50, height / 2 + 30])
    
        svg.append('g')
            .attr('id', 'scatterplot')
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => projection([d.lng, d.lat])[0])
            .attr('cy', d => projection([d.lng, d.lat])[1])
            .attr('r', d => r(d.companies))
            .style('fill', 'blue')
            .attr('opacity', '0')
            .on('mouseover', mouseover)
            .on('mousemove', (event) => mousemove(event))
            .on('mouseleave', mouseleave);
    
        svg.selectAll('.points')
            .transition()
            .duration(350)
            .attr('opacity', 0.6)
            .delay((d, i) => delayScale(i));
    })
}

// add points for scatterplot
function plotPoints(){

    setPlotSubtitle('Includes cities with more than 300 companies')
    setXAxisTitle('Median Funding ($M, log scale)')
    setYAxisTitle('Average Headcount (IQM)')

    // show continents checkboxes
    d3.select('#dataToggles').style('opacity', 1)

    // scale for sizing
    var r = d3.scaleSqrt()
        .domain([0, 6000])
        .range([3,15]);

    us_cities.then(function(d){

        console.log(d)

        var delayScale = d3.scaleLinear()
            .domain([0, 60])
            .range([0,1000]);

        d = d.sort((a, b) => b.companies - a.companies)
             .filter((d, i) => i < 50 | (d.companies > 20 & d.median > 20))

        var yMin = 1000, yMax = 0;

        d.forEach(d => {
            if(d.headcount_IQM < yMin){yMin = d.headcount_IQM}
            if(d.headcount_IQM > yMax){yMax = d.headcount_IQM}
        })

        console.log(yMin, yMax)
        console.log(d.filter(d => d.headcount_IQM == yMax)[0])

        // new y axis
        y.domain([yMin, yMax]).nice()
        svg.select(".yAxis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
        
        // new x axis
        x.domain([0.5, 20])
        svg.select(".xAxis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x).tickValues([0.5,1,3,10,30]).tickFormat(d => '$' + d + 'm'));
    
        svg.append('g')
            .attr('id', 'scatterplot')
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => x(d.median))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', 0)
            .style('fill', 'blue')
            .attr('opacity', '0.6')
            .on('mouseover', mouseoverPt)
            .on('mousemove', (event) => mousemovePt(event))
            .on('mouseleave', mouseleavePt);
    
        svg.selectAll('.points')
            .transition()
            .duration(350)
            .attr('opacity', 0.6)
            .attr('r', d => r(d.companies))
            .delay((d, i) => delayScale(i));
    })
}

// hide points before replotting
function hidePoints(){
    svg.selectAll('.points')
        .transition()
        .duration(150)
        .attr('opacity', 0)

    setTimeout(() => {
        svg.selectAll('.points')
            .data([])
            .exit()
            .remove();
    }, 150);
}

function clickMap(){

    hideMap()

    var state = d3.select(this).data()[0].properties.name
    us_cities.then(d => {
        d = d.filter(d => d.state == state)
        console.log(d)
    })
}

function hideMap(){
    d3.selectAll('.usMap')
        .transition()
        .duration(1000)
        .style('opacity', 0)
    
    d3.selectAll('.legend')
        .transition()
        .duration(1000)
        .style('opacity', 0)
}

// restore opacity
function mouseleaveMap(){

    // hide tooltip
    d3.select('.cityInfo')
        .style('opacity', 0)
        .style('display', 'none')
}

function mousemoveMap(event){

    var pos = d3.pointer(event);

    d3.select('.cityInfo')
        .style('left', (pos[0]+20) + 'px')
        .style('top', (pos[1]+20) + 'px');

}

// highlight point on mouseover
function mouseoverMap(){

    // hide tooltip
    d3.select('.cityInfo')
        .style('opacity', 1)
        .style('display', 'block')

    var data = d3.select(this).data()[0];
        // format data
        state = data.properties.name,
        companies = Intl.NumberFormat().format(data.properties.companies);
   
    d3.select('#entry1').text(`${state}: ${companies}`)

}

// restore opacity
function mouseleavePt(){

    // hide tooltip
    d3.select('.cityInfo')
        .style('opacity', 0)
        .style('display', 'none')

    // return points to regular opacity and color
    d3.selectAll('.points')
        .style('fill', 'blue')
        .attr('opacity', 0.6);
}

function mousemovePt(event){

    var pos = d3.pointer(event);

    d3.select('.cityInfo')
        .style('left', (pos[0]+20) + 'px')
        .style('top', (pos[1]+0) + 'px');

}

// highlight point on mouseover
function mouseoverPt(){

    var data = d3.select(this).data()[0],
    
        // format data
        city = data.city + ', ' + data.state,
        companies = Intl.NumberFormat().format(data.companies),
        funding = '$' + data.median.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2);

    d3.select('.cityInfo')
        .style('opacity', 1)
        .style('display', 'block')

    d3.select('#entry1').text(city)
    d3.select('#entry2').text(companies)
    d3.select('#entry3').text(funding)
    d3.select('#entry4').text(headcount)

    // highlight point
    d3.selectAll('.points')
        .attr('opacity', 0.1)
        .style('fill', 'gray')
    
    d3.select(this)
        .style('fill', 'blue')
        .attr('opacity', 0.6)

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

    d3.select('#dataToggles')
        .transition()
        .duration(500)
        .style('opacity', 1)
}

// plot points
// plotPoints()
// hidePoints()
mapStates()
// mapPoints([])