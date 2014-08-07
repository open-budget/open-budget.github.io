# Collection of data helpers
#
class Data

    # Representing ? as one-dimensional array
    #
    # @param  [Object] tree
    # @return [Array]  flat array
    #
    @flatten: (tree) ->
        out = []
        iterate = (tree, level) ->
            out = out.concat
                level: level
                name: tree.name
                size: tree.size

            if tree.children
                tree.children.map (c) ->
                    iterate c, level + 1
        iterate tree, 0
        out

    # Building an tree from list of items
    #
    # @param [Array]   data
    # @param [Number]  limit
    # @param [Boolean] isState
    # @param [Object]
    @hierarchy = (data, limit, isState) ->

        isState ?= data[0].area_id == 0
        limit ?= if isState then 10000 else 1000

        level = data.filter (e) -> +e.code % limit == 0

        level.map (e) ->
            code:  e.code
            name:  e.code_name
            size: e.total

            children: do ->
                filtered = data.filter (nle) ->
                    level.indexOf(nle) == -1 and
                        +nle.code > +e.code and
                        +nle.code < +e.code + limit

                if isState
                    if (next = Data.hierarchy filtered, limit / 10, isState).length == 0
                        Data.hierarchy filtered, limit / 100, isState
                    else
                        next
                else
                    Data.hierarchy filtered, 1, isState

    # Composing specific data type for partition
    #
    # @param  [Object] data
    # @return [Array]
    @preprocess = (data) ->
        name: "budget"
        children: @hierarchy(data).filter (e) ->
            Settings.byDefault[0].indexOf(e.code) != -1