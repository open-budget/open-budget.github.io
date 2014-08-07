// Karma configuration
// Generated on Sat Jun 07 2014 21:43:49 GMT+0300 (EEST)

module.exports = function (config) {
    config.set({
        basePath: "",
        frameworks: ["jasmine"],

        files: [
            // deps
            "bower_components/d3/d3.js",

            // app
            "src/partition.coffee",
            "spec/*.coffee",
            "spec/fixtures/*.coffee"
        ],

        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            "**/*.coffee": ["coffee"]
        },

        reporters: ["progress"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ["Chrome"],
        singleRun: false
    });
};
