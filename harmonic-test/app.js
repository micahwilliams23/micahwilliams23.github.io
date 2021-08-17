
// load data from local json
const us_states = d3.json('state_info.json')
const us_cities = d3.json('us_info.json')
const stateShapes = d3.json('states-10m.json')
const tags = d3.json('tags.json')

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

d3.select('.tooltip').style('display', 'none')

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
var xLog = d3.scaleLog()
    .domain([])
    .range([margin.left, width + margin.left - margin.right]);

var x = d3.scaleLinear()
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
    .classed('plotTitles', 'true')
    .attr('y', margin.top / 2 - 10)
    .attr('x', margin.left + 10)
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
                .shapeWidth(width / 15)
                .shapeHeight(20)
                .cells([0,500,1000,2000,3000])
                .labels([0,500,'1,000','2,000','3000+'])
                .orient('horizontal')
            
            // set map projection
            const projection = d3.geoAlbersUsa()
                .fitSize([width, height], featureCollection)
                .translate([width*0.55, height*0.55])

            // add legend to svg
            svg.select('#mapGroup').append('g')
                .classed('legend', 'true')
                .call(colorLegend)
                .attr('transform',`translate(${width/2+80}, 70)`)
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

// overlay city points on map (NOT USED)
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

// add points for scatterplot
function plotPoints(){

    // change titles and axes
    setPlotTitle('Average Headcount vs. Median Funding in Top US Cities')
    setPlotSubtitle('Sixteen of the top fifty American cities are in California.')
    setXAxisTitle('Median Funding ($M)')
    setYAxisTitle('Average Headcount (IQM)')

    us_cities.then(function(d){

        d = d.sort((a, b) => b.companies - a.companies)
             .filter((d, i) => i < 50 && d.median > 0.5)

        var yMin, yMax;

        // scale for sizing
        var r = d3.scaleSqrt()
            .domain([0, 6000])
            .range([3,30]);

        // scale for delaying point
        var delayScale = d3.scaleLinear()
            .domain([0, 99])
            .range([0,500]);
        
        d.forEach((d, i) => {
            d.rank = i+1;
            if(d.headcount_IQM < yMin || yMin === undefined){yMin = d.headcount_IQM}
            if(d.headcount_IQM > yMax || yMax === undefined){yMax = d.headcount_IQM}
        })

        // new y axis
        y.domain([0, yMax]).nice()
        svg.select(".yAxis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
        
        // new x axis
        xLog.domain([0.5, 20])
        svg.select(".xAxis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xLog).tickValues([0.5,1,3,10,30]).tickFormat(d => '$' + d + 'm'));
            
        svg.select('#scatterplot')
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => xLog(d.median))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', 0)
            .style('fill', '#0077b6')
            .on('mouseover', mouseoverPt)
            .on('mousemove', (event) => mousemovePt(event))
            .on('mouseleave', mouseleavePt)
            .on('click', clickPt);

        var titlePos = document.querySelector('#plotTitle').getBoundingClientRect()
        
        // make search bar
        d3.select('#extras')
            .append('input')
            .attr('id', 'searchBar')
            .attr('type', 'search')
            .attr('placeholder', 'Search for a city or state: (ex. "Boston" or "Texas")')
            .style('display', 'block')
            .style('top', titlePos.y + 60 + 'px')
            .style('left', titlePos.x + 'px')
            .on('keyup', filterPts)

        // fade in points
        svg.select('#scatterplot')
            .style('display', 'block')
            .selectAll('.points')
            .transition()
            .duration(350)
            .style('opacity', 0.6)
            .attr('r', d => r(d.companies))
            .delay((d, i) => delayScale(i));
    
        fadeIn('.axis')

    })
}

// add points for scatterplot
function plotTags(){

    setPlotTitle('Average Headcount vs. Median Funding by Technology Type')
    setPlotSubtitle('Industry tags are colored purple, and tech tags are colored green.')
    setXAxisTitle('Median Funding ($M)')
    setYAxisTitle('Average Headcount (IQM)')


    tags.then(function(d){

        d = d.filter(d => d.tag != 'Agriculture')

        var delayScale = d3.scaleLinear()
            .domain([0, d.length])
            .range([0,500]);

        // scale for sizing
        var r = d3.scaleSqrt()
            .domain([0, Math.max(...d.map(d => d.data.length))])
            .range([3,20]);

        var yMin, yMax;

        d.forEach((d, i) => {
            d.rank = i+1;
            if(d.headcount_IQM < yMin || yMin === undefined){yMin = d.headcount_IQM}
            if(d.headcount_IQM > yMax || yMax === undefined){yMax = d.headcount_IQM}
        })

        // new y axis
        y.domain([0, yMax]).nice()
        svg.select(".yAxis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
        
        // new x axis
        var xExtent = d3.extent(d.map(d => d.median))
        xLog.domain(xExtent)
        svg.select(".xAxis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xLog).tickFormat((d, i) => {
                if(d%5==0|i==0|d==1){return '$' + d + 'm'}}));

        var titlePos = document.querySelector('#plotTitle').getBoundingClientRect()

        // make search bar
        d3.select('#tagsMenu')
            .style('display', 'block')
            .style('position', 'absolute')
            .style('top', titlePos.y + 60 + 'px')
            .style('left', titlePos.x + 'px')

        d3.select('#tagsMenu') 
            .append('label')
            .attr('for', 'tagTypes')
            .text('Select tag type: ')

        d3.select('#tagsMenu')
            .append('select')
            .attr('name', 'tagTypes')
            .attr('id', 'tagTypes')
            .on('change', filterTags)

        var types = [
            {'label': 'Technology', 'value' : 'tech'},
            {'label': 'Industry', 'value' : 'industry'}
        ]
        d3.select('#tagTypes')
            .selectAll('.tagOption')
            .data(types).enter()
            .append('option')
            .attr('value', d => d.value)
            .text(d => d.label)
    
        svg.select('#tagPlot')
            .style('opacity', 1)
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => xLog(d.median))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', d => r(d.data.length))
            .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
            .style('opacity', 0)
            .on('mouseover', mouseoverTag)
            .on('mousemove', (event) => mousemovePt(event))
            .on('mouseleave', mouseleaveTag)
            .on('click', clickPt);

        // show only points with selected tag type
        filterTags()
        // setTimeout(() => {
        // }, 350);

    })
}

// hide points before replotting
function hidePoints(){
    fadeOut('.points')
    fadeOut('#searchBar')

    setTimeout(() => {
        svg.select('#scatterplot').selectAll('.points').remove()
        d3.select('#searchBar').remove()
    }, 500);
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

function clickPt(){

    d3.select(this)
        .transition()
        .duration(500)
        .style('r', 10000)

}

function filterPts(){

    var points = d3.selectAll('.points');
    var query = document.querySelector('#searchBar').value.toLowerCase();

    points.style('fill', '#0077b6').style('opacity', 0.1)
    if(query == ''){
        points.style('fill', '#0077b6').style('opacity', 0.6)
    }

    // highlight point
    d3.selectAll('.points')
        .attr('opacity', 0.1)
        .style('fill', 'gray')
    
    points.data().forEach((d, i) => {
        if(d.state.toLowerCase().startsWith(query) || d.city.toLowerCase().startsWith(query)){
            var match = points['_groups'][0][i]
            match.style.fill = '#0077b6'
            match.style.opacity = 0.6
        }
    })
}

function filterTags(){

    svg.select('#tagPlot')
        .selectAll('.points')
        .transition()
        .duration(300)
        .style('opacity', '0')

    svg.select('#tagPlot')
        .selectAll('.points')
        .transition()
        .duration(500)
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? '0.6' : '0')
        .delay((d, i) => 300 + i * 15)

    setTimeout(() => {
        svg.select('#tagPlot')
            .selectAll('.points')
            .style('display', d => d.tag_type == document.querySelector('#tagTypes').value ? 'block' : 'none') 
    }, 500);
}

function hideMap(){
    fadeOut('#mapGroup')
    fadeOut('.legend')

    setTimeout(() => {
        svg.selectAll('.usMap').remove()
        svg.selectAll('.legend').remove()
    }, 500);
}

function hideTags(){

    fadeOut('#tagPlot')
    fadeOut('#tagsMenu')
    setTimeout(() => {
        svg.select('#tagPlot').selectAll('.points').remove()
        d3.select('#tagsMenu').selectAll('label').remove()
        d3.select('#tagsMenu').selectAll('select').remove()
        
    }, 500);


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

    d3.select('.tooltip').select('text').remove()
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

// restore opacity
function mouseleavePt(){

    // remove info
    d3.select('.tooltip').select('table').remove()
    d3.select('.tooltipTagList').remove()
    
    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 0)
        .style('display', 'none')

    if(document.querySelector('#searchBar').value == ''){
        // return points to regular opacity and color
        d3.selectAll('.points')
            .style('fill', '#0077b6')
            .attr('opacity', 0.6);
    }
}

function mousemovePt(event){

    var tooltip = document.querySelector('.tooltip'),
        window = document.querySelector('.row'),
        yPos = Math.min(window.offsetHeight - tooltip.offsetHeight - 30, event.clientY)

    d3.select('.tooltip')
        .style('left', (event.clientX+20) + 'px')
        .style('top', yPos + 'px');

}

// highlight point on mouseover
function mouseoverPt(){

    var data = d3.select(this).data()[0],
    
        // format data
        city = data.city + ', ' + data.state,
        companies = Intl.NumberFormat().format(data.companies),
        funding = '$' + data.median.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2),
        query = document.querySelector('#searchBar').value;

        rownames = ['City:', 'Median Funding:', 'Avg. Headcount:', '# Companies:']
        info = [city, funding, headcount, companies];

        // combine data for table
        info.map((d, i) => {
            return info[i] = [rownames[i], info[i]]
        })
        
    if(query == '' | data.city.toLowerCase().startsWith(query.toLowerCase()) | data.state.toLowerCase().startsWith(query.toLowerCase())){

        d3.select('.tooltip')
            .style('opacity', 1)
            .style('display', 'block')

        // create frequency table of tags
        var top_tags = {}
        data.data.forEach(d => {
            if(d.tech_tags){
                var tags = d.tech_tags.replaceAll(/[^A-Za-z0-9_ /,]/g, '').split(',')
                tags.forEach(tag => {
                    if(tag == ''){
                        return
                    } else if(Object.keys(top_tags).includes(tag)){
                        top_tags[tag].value += 1
                    } else {
                        top_tags[tag] = {
                            'key': tag,
                            'value': 1
                        }
                    }
                })
            }
        })

        // select tag names from top 5 most freq tags
        top_tags = Object.values(top_tags).sort((a,b) => b.value - a.value).slice(0,5).map(d => d.key)

        // add table and info
        d3.select('.tooltip').append('table')
            .style('table-layout', 'fixed')
            .selectAll('tr')
            .data(info)
            .enter()    
            .append('tr')
            .classed('tooltipRownames', 'true')
            .append('td')
            .html(d => d[0] + ' <span style=\'font-weight:bolder\'>' + d[1] + '</span>')

        d3.select('.tooltip').append('g')
            .classed('tooltipTagList', 'true')

        d3.select('.tooltipTagList')
            .append('text')
            .text('Top Industries:')
        
        d3.select('.tooltipTagList')
            .append('ol')
            .style('margin', '5px')
            .selectAll('li')
            .data(top_tags)
            .enter()
            .append('li')
            .text(d => d)
    }
    
    // change color if search bar is empty, else keep colors from filter
    if(query == ''){
        // highlight point
        d3.selectAll('.points')
            .attr('opacity', 0.1)
            .style('fill', 'gray')
        
        d3.select(this)
            .style('fill', '#0077b6')
            .attr('opacity', 0.6)
    }
}

// restore opacity
function mouseleaveTag(){

    // remove info
    d3.select('.tooltip').select('table').remove()
    d3.select('.tooltipTagList').remove()
    
    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 0)
        .style('display', 'none')

    // return points to regular opacity and color
    d3.select('#tagPlot').selectAll('.points')
        .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
        .style('opacity', 0.6);
}

// highlight point on mouseover
function mouseoverTag(){

    var data = d3.select(this).data()[0],
    
        // format data
        tag = data.tag,
        companies = Intl.NumberFormat().format(data.data.length),
        funding = '$' + data.median.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2);

        rownames = ['Tag:', 'Median Funding:', 'Avg. Headcount:', '# Companies:']
        info = [tag, funding, headcount, companies];

        // combine data for table
        info.map((d, i) => {
            return info[i] = [rownames[i], info[i]]
        })
        
        d3.select('.tooltip')
            .style('opacity', 1)
            .style('display', 'block')

        // add table and info
        d3.select('.tooltip').append('table')
            .style('table-layout', 'fixed')
            .selectAll('tr')
            .data(info)
            .enter()    
            .append('tr')
            .classed('tooltipRownames', 'true')
            .append('td')
            .html(d => d[0] + ' <span style=\'font-weight:bolder\'>' + d[1] + '</span>')

        d3.select('.tooltip').append('g')
            .classed('tooltipTagList', 'true')

        d3.select('.tooltipTagList')
            .append('text')
            .text('Top Cities:')
        
        d3.select('.tooltipTagList')
            .append('ol')
            .style('margin', '5px')
            .selectAll('li')
            .data(data.top_cities)
            .enter()
            .append('li')
            .text(d => d)

    // highlight point
    d3.selectAll('.points')
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? '0.1' : '0')
        .style('fill', 'gray')
    
    d3.select(this)
        .style('opacity', 0.6)
        .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
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

function showMap(){

    // hide points if scrolling up
    hidePoints()

    // plot map
    mapStates()
    
    setPlotTitle('Number of Funded Companies by State (n=68,587)')
    setPlotSubtitle('California, New York, Massachusetts, and Texas are the most popular states venture-funded companies.')

    // make elements visible
    // svg.selectAll('.usMap').style('display', 'block')
    fadeIn('.plotTitles')

    // fade out base layer
    fadeOut('#searchBar')
    fadeOut('.axis')
    fadeOut('.axisTitle')

    d3.select('#searchBar').remove()
}

function showPoints(){

    // hide map or founding timelines
    // if founding timeline is showing
    var cityLinesG = svg.select('#cityLines')['_groups'][0]
    if (cityLinesG === undefined || cityLinesG[0] === undefined){
        hideMap()
    } else {
        clickFoundingTimeline('F')
    }

    // hide tags
    hideTags()

    // plot points
    plotPoints()

    // fade in search and axes
    fadeIn('#searchBar')
    fadeIn('.axisTitle')

}

function showTags(){

    fadeIn('#tagsMenu')
    hidePoints()
    plotTags()


}

// set up scroller... many thanks to https://vallandingham.me/scroller.html
// find position of top of sections
const sections = d3.selectAll('.scrollerSection')
sectionPositions = [];
var startPos = 0, lastIndex = -1;

sections.each(function(d, i){
    var bb = this.getBoundingClientRect()
    var top = bb.top; //+ 0.5 * (bb.height);
    // set top of first section element as top
    if(i == 0){
        startPos = top;
        sectionPositions.push(top);
    } else {
        // append positions to array
        sectionPositions.push(top + startPos);
    }

});

// new dispatcher with 'active' and 'progress' methods
var dispatch = d3.dispatch('active', 'progress')

// set function to execute when active element updates
dispatch.on('active', function(index){

    transitions = [
        // function(){},
        function(){},
        showMap,
        showPoints,
        showTags,
        function(){},
        function(){},
    ]

    transitions[index]();
})

// find position of window
function position(){

    // slightly offset position
    var pos = this.scrollTop + window.innerHeight * 0.45;
    
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
            dispatch.call('active', svg, section);
        });
        lastIndex = currentIndex;
    };
};

// execute function when window scrolls
d3.select('.scrollerText')
    .on('wheel', position);