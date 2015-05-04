var Data = (function () {

    function Data(){};

    Data.prototype = {

        /**
         * Representing tree as one-dimensional array
         * @param   {Object} tree
         * @returns {Array} flatten array
         */
        flatten: function (tree) {
            var out = [];

            var iterate = function (tree, level) {
                out = out.concat({
                    level: level,
                    name: tree.name,
                    size: tree.size
                });

                if (tree.children) {
                    tree.children.map(function (c) {
                        iterate(c, level + 1);
                    });
                }
            };

            iterate(tree, 0);
            return out;
        },

        /**
         * Building an tree from list of items
         * @param {Array} data
         * @param {Number} limit
         * @param {?Boolean} isState
         */
        hierarchy: function (data, limit, isState) {

            isState = isState || +data[0].area_id === 0;
            limit   = limit || isState ? 10000 : 1000;

            var level = data.filter(function (e) {
                    return +e.code % limit === 0;
                });

            level.map(function (e){
                return {
                    code: e.code,
                    name: e.code_name,
                    size: e.total,
                    children: function () {
                        var filtered = data.filter(function (nle){
                            return level.indexOf(nle) === -1 &&
                                +nle.code > +e.code &&
                                +nle.code < +e.code + limit;
                        });

                        var next;
                        if (isState) {
                            if ((next = Data.hierarchy(filtered, limit / 10, isState)).length === 0) {
                                Data.hierarchy(filtered, limit / 100, isState);
                            } else {
                                return next;
                            }
                        } else {
                            Data.hierarchy(filtered, 1, isState);
                        }
                    }()
                };
            });
        },

        /**
         * Composing specific data type for partition
         * @param {Object} data
         * @returns {Array[Object]}
         */
        preprocess: function (data) {
            return {
                name: "budget",
                children: this.hierarchy(data).filter(function (e) {
                    return Settings.byDefault[0].indexOf(e.code) !== -1;
                })
            }
        }
    };

    return Data;
}());

/**
 *
 * @returns {{area_id: number}[]}
 */
function z () {
    return [
        {
            area_id: 12
        }
    ];
}