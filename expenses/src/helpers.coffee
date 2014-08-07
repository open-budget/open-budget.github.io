# Partition helpers
#
class Helpers

    # Constructing key for current node
    #
    # @param  [Object] d node
    # @return [String] resulting key
    #
    @key = (d) ->
        k = []
        p = d
        while p.depth
            k.push p.name
            p = p.parent
        k.reverse().join(".")

    # Getting node nesting level
    #
    # @param  [Object] d node
    # @return [Number] nesting level
    #
    @level = (d) ->
        k = 0
        p = d
        while p.parent
            k++
            p = p.parent
        k

    hue = d3.scale.category10()

    luminance = d3.scale.sqrt()
        .domain([0, 1e11])
        .clamp(true)
        .range([80, 20])

    # Node colorization
    #
    # @param  [Object] d node
    # @return [Object] LAB representation of color fill
    @fill = (d) ->
        p = d
        while p.depth > 1
            p = p.parent
        c = d3.lab hue p.name
        c.l = luminance d.sum
        c

    @arc = d3.svg.arc()
        .startAngle((d) -> d.x)
        .endAngle((d) -> d.x + d.dx - .01 / (d.depth + .5))
        .innerRadius((d) -> Settings.radius / 3 * d.depth)
        .outerRadius((d) -> Settings.radius / 3 * (d.depth + 1) - 1)

    @arcTween = (b) ->
        i = d3.interpolate @._current, b
        @._current = i 0
        (t) -> Helpers.arc i t

    @updateArc = (d) ->
        level: Helpers.level d
        depth: d.depth
        x: d.x
        dx: d.dx