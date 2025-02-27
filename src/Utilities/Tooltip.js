import * as d3 from 'd3';

class Tooltip {
    constructor(opts) {
        this.svg = opts.svg;
        this.colors = opts.colors;
        this.draw();
    }

    draw() {
        this.toolTipBase = d3.select(this.svg + '> svg').append('g');
        this.toolTipBase.attr('id', 'svg-chart-Tooltip.base-' + this.svg.slice(1));
        this.toolTipBase.attr('overflow', 'visible');
        this.toolTipBase.style('opacity', 0);
        this.toolTipBase.style('pointer-events', 'none');
        this.toolTipBase.attr('transform', 'translate(100, 100)');

        this.toolTipPoint = this.toolTipBase
        .append('rect')
        .attr('transform', 'translate(10, -10) rotate(45)')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 20)
        .attr('width', 20)
        .attr('fill', '#393f44');
        this.boundingBOx = this.toolTipBase
        .append('rect')
        .attr('x', 10)
        .attr('y', -41)
        .attr('rx', 2)
        .attr('height', 82)
        .attr('width', 155)
        .attr('fill', '#393f44');
        this.circleGreen = this.toolTipBase
        .append('circle')
        .attr('cx', 26)
        .attr('cy', 0)
        .attr('r', 7)
        .attr('stroke', 'white')
        .attr('fill', this.colors(1));
        this.circleRed = this.toolTipBase
        .append('circle')
        .attr('cx', 26)
        .attr('cy', 26)
        .attr('r', 7)
        .attr('stroke', 'white')
        .attr('fill', this.colors(0));
        this.successText = this.toolTipBase
        .append('text')
        .attr('x', 43)
        .attr('y', 4)
        .attr('font-size', 12)
        .attr('fill', 'white')
        .text('Successful');
        this.failText = this.toolTipBase
        .append('text')
        .attr('x', 43)
        .attr('y', 28)
        .attr('font-size', 12)
        .attr('fill', 'white')
        .text('Failed');
        this.icon = this.toolTipBase
        .append('text')
        .attr('fill', 'white')
        .attr('stroke', 'white')
        .attr('x', 24)
        .attr('y', 30)
        .attr('font-size', 12)
        .text('!');
        this.jobs = this.toolTipBase
        .append('text')
        .attr('fill', 'white')
        .attr('x', 137)
        .attr('y', -21)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .text('No Jobs');
        this.successful = this.toolTipBase
        .append('text')
        .attr('fill', 'white')
        .attr('font-size', 12)
        .attr('x', 122)
        .attr('y', 4)
        .text('0');
        this.failed = this.toolTipBase
        .append('text')
        .attr('fill', 'white')
        .attr('font-size', 12)
        .attr('x', 122)
        .attr('y', 28)
        .text('0');
        this.date = this.toolTipBase
        .append('text')
        .attr('fill', 'white')
        .attr('stroke', 'white')
        .attr('x', 20)
        .attr('y', -21)
        .attr('font-size', 12)
        .text('Never');
    }

    handleMouseOver = (d) => {
        let success = 0;
        let fail = 0;
        let total = 0;
        const x =
            d3.event.pageX -
            d3
            .select(this.svg)
            .node()
            .getBoundingClientRect().x +
            10;
        const y =
            d3.event.pageY -
            d3
            .select(this.svg)
            .node()
            .getBoundingClientRect().y -
            10;
        const formatTooltipDate = d3.timeFormat('%m/%d');
        if (!d) {
            return;
        }

        const toolTipWidth = this.toolTipBase.node().getBoundingClientRect().width;
        const chartWidth = d3
        .select(this.svg + '> svg')
        .node()
        .getBoundingClientRect().width;
        const overflow = 100 - (toolTipWidth / chartWidth) * 100;
        const flipped = overflow < (x / chartWidth) * 100;
        if (d) {
            success = d.RAN || 0;
            fail = d.FAIL || 0;
            total = d.TOTAL || 0;
            this.date.text(formatTooltipDate(d.DATE || null));
        }

        if (d && d.data) {
            success = d.data.RAN || 0;
            fail = d.data.FAIL || 0;
            total = d.data.TOTAL || 0;
            this.date.text(formatTooltipDate(d.data.DATE || null));
        }

        this.jobs.text('' + total + ' Jobs');
        this.failed.text('' + fail);
        this.successful.text('' + success);

        this.toolTipBase.attr('transform', 'translate(' + x + ',' + y + ')');
        if (flipped) {
            this.toolTipPoint.attr('transform', 'translate(-20, -10) rotate(45)');
            this.boundingBOx.attr('x', -175);
            this.circleGreen.attr('cx', -155);
            this.circleRed.attr('cx', -155);
            this.icon.attr('x', -157);
            this.successText.attr('x', -138);
            this.failText.attr('x', -138);
            this.successful.attr('x', -55);
            this.failed.attr('x', -55);
            this.date.attr('x', -160);
            this.jobs.attr('x', -40);
        } else {
            this.toolTipPoint.attr('transform', 'translate(10, -10) rotate(45)');
            this.boundingBOx.attr('x', 10);
            this.circleGreen.attr('cx', 26);
            this.circleRed.attr('cx', 26);
            this.icon.attr('x', 24);
            this.successText.attr('x', 43);
            this.failText.attr('x', 43);
            this.successful.attr('x', 122);
            this.failed.attr('x', 122);
            this.date.attr('x', 20);
            this.jobs.attr('x', 137);
        }

        this.toolTipBase.style('opacity', 1);
        this.toolTipBase.interrupt();
    }

    handleMouseOut = () => {
        this.toolTipBase
        .transition()
        .delay(15)
        .style('opacity', 0)
        .style('pointer-events', 'none');
    }
}

export default Tooltip;
